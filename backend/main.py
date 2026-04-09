import requests
import json
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import numpy as np
import feedparser
import os
from groq import Groq

# Groqクライアントの初期化
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_WS_URL = "wss://stream.binance.com:9443/stream?streams="

# --- 通知用関数 ---
def send_discord_notification(message: str):
    """
    Discordにメッセージを送信する
    """
    if not DISCORD_WEBHOOK_URL or "..." in DISCORD_WEBHOOK_URL:
        print("Discord Webhook URLが設定されていません。")
        return

    payload = {"content": message}
    try:
        response = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=5)
        if response.status_code == 204:
            print("Successfully sent to Discord.")
        else:
            print(f"Failed to send: {response.status_code}")
    except Exception as e:
        print(f"Discord Notification Error: {e}")

# --- 1. 判定ロジック ---
def check_signals(df: pd.DataFrame):
    """
    ゴールデンクロス(MA25 > MA75) かつ RSIが低水準からの回復を判定
    """
    if len(df) < 75:
        return None

    # 最新と1つ前のデータを取得
    last = df.iloc[-1]
    prev = df.iloc[-2]

    # 移動平均のクロス判定
    is_golden_cross = (prev['ma25'] <= prev['ma75']) and (last['ma25'] > last['ma75'])
    is_dead_cross = (prev['ma25'] >= prev['ma75']) and (last['ma25'] < last['ma75'])

    # RSIの計算（直近14本など。dfにrsi列がない場合はここで計算）
    # ※今回のコードでは、簡易的に直近の終値から計算
    close_prices = df['close'].tolist()
    rsi = calculate_rsi(close_prices)

    if is_golden_cross:
        # RSIが40以下から回復しているか（売られすぎ圏内でのクロスか）
        if rsi < 45:
            return f"🚀 【買いサイン】ゴールデンクロス発生！ RSI: {rsi:.2f}"
        else:
            return f"📈 【参考】ゴールデンクロス発生（ただしRSI高め） RSI: {rsi:.2f}"
            
    if is_dead_cross:
        return f"⚠️ 【売りサイン】デッドクロス発生！ RSI: {rsi:.2f}"

    return None

# --- 監視ループの修正（通知を呼び出す） ---
async def market_monitor_loop():
    print("Market Monitor with Discord Started...")
    last_notified_time = { "BTCUSDT": None, "ETHUSDT": None, "SOLUSDT": None }
    
    while True:
        try:
            for symbol in ["BTCUSDT", "ETHUSDT", "SOLUSDT"]:
                # klinesの取得 (既存の get_klines を呼び出す)
                klines = get_klines(symbol=symbol, interval="1h", limit=100)
                if not klines: continue
                
                df = pd.DataFrame(klines)
                signal = check_signals(df) # 先ほど作った判定ロジック
                
                # 最新の足の時間を取得
                current_bar_time = klines[-1]["time"]

                # サインがあり、かつ同じ足でまだ通知していない場合のみ送信
                if signal and last_notified_time[symbol] != current_bar_time:
                    full_message = f"【{symbol} 監視アラート】\n{signal}"
                    print(full_message) # コンソールにも表示
                    
                    # --- ここでDiscordへ送信 ---
                    send_discord_notification(full_message)
                    
                    last_notified_time[symbol] = current_bar_time
            
            await asyncio.sleep(60) # 1分ごとにチェック
        except Exception as e:
            print(f"Monitor Error: {e}")
            await asyncio.sleep(60)

# --- 3. FastAPI起動時にループを開始させる設定 ---
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(market_monitor_loop())

# --- AI解析ロジック (非同期化) ---
async def analyze_news_with_ai(title: str, summary: str):
    """
    重いAI解析を非同期のスレッドで実行し、全体をブロックしないようにする
    """
    loop = asyncio.get_event_loop()
    
    def call_groq():
        prompt = f"""
        分析しJSON形式で回答:
        1. summary: 15文字以内で要約
        2. sentiment: 'positive', 'negative', 'neutral' のいずれか

        ニュースタイトル: {title}
        概要: {summary[:150]}
        """
        try:
            return client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                timeout=5.0  # 5秒でタイムアウト設定
            )
        except Exception as e:
            print(f"Groq API Error: {e}")
            return None

    try:
        chat_completion = await loop.run_in_executor(None, call_groq)
        if chat_completion:
            return json.loads(chat_completion.choices[0].message.content)
        return {"summary": title[:15], "sentiment": "neutral"}
    except:
        return {"summary": title[:15], "sentiment": "neutral"}

# --- ニュース取得ロジック (並列実行版) ---
async def fetch_relevant_news(symbol: str):
    SOURCES = [
        {"name": "CoinPost", "url": "https://coinpost.jp/?feed=rss2"},
        {"name": "CoinDesk Japan", "url": "https://www.coindeskjapan.com/feed/"},
        {"name": "PR TIMES", "url": "https://prtimes.jp/index.rdf"}
    ]
    
    coin_name = symbol.replace('USDT', '').upper()
    keywords = {
        "BTC": ["ビットコイン", "Bitcoin", "BTC"],
        "ETH": ["イーサリアム", "Ethereum", "ETH", "Web3"],
        "SOL": ["ソラナ", "Solana", "SOL"]
    }
    target_kws = keywords.get(coin_name, ["暗号資産", "仮想通貨"])
    
    raw_news = []
    seen_titles = set()

    # 1. RSSからデータを収集
    for source in SOURCES:
        try:
            feed = feedparser.parse(source["url"])
            for entry in feed.entries:
                title = entry.get('title', '')
                summary = entry.get('summary', '') or entry.get('description', '')
                
                if any(kw.lower() in title.lower() or kw.lower() in summary.lower() for kw in target_kws):
                    if title not in seen_titles:
                        raw_news.append({
                            "title": title,
                            "summary": summary,
                            "link": entry.get('link', '#'),
                            "source": source["name"],
                            "time": entry.get('published', 'Just now')
                        })
                        seen_titles.add(title)
                if len(raw_news) >= 15: break # 収集しすぎ防止
        except Exception as e:
            print(f"Error fetching {source['name']}: {e}")

    # 2. 上位5件に対してAI解析を一斉に実行（並列処理）
    final_items = raw_news[:5]
    if not final_items:
        return [{"title": f"{coin_name} に関する最新ニュースはありません", "link": "#", "source": "System", "time": "", "ai_summary": "記事なし", "sentiment": "neutral"}]

    tasks = [analyze_news_with_ai(n["title"], n["summary"]) for n in final_items]
    ai_results = await asyncio.gather(*tasks)

    # 3. 解析結果を統合
    for i, res in enumerate(ai_results):
        final_items[i]["ai_summary"] = res.get("summary", final_items[i]["title"][:15])
        final_items[i]["sentiment"] = res.get("sentiment", "neutral")
        # 元の重いsummaryは通信量削減のため削除
        if "summary" in final_items[i]: del final_items[i]["summary"]
    
    return final_items

# --- 共通ロジック：RSI計算 ---
def calculate_rsi(prices, period=14):
    if len(prices) < period:
        return 50.0
    delta = pd.Series(prices).diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return float(rsi.iloc[-1])

# --- エンドポイント：WebSocket ---
@app.websocket("/ws/crypto")
async def websocket_endpoint(websocket: WebSocket, symbol: str = "BTCUSDT", symbols: str = None):
    await websocket.accept()
    if symbols:
        target_symbols = [s.strip().lower() for s in symbols.split(",")]
    else:
        target_symbols = [symbol.strip().lower()]
    streams = "/".join([f"{s}@ticker" for s in target_symbols])
    full_ws_url = BASE_WS_URL + streams
    try:
        async with websockets.connect(full_ws_url) as binance_ws:
            while True:
                raw_data = await binance_ws.recv()
                data = json.loads(raw_data)
                msg = data.get('data', {})
                current_symbol = msg.get('s')
                if current_symbol and current_symbol.lower() in target_symbols:
                    await websocket.send_json({"s": current_symbol, "p": msg.get('c'), "dc": msg.get('P')})
    except: pass

# --- エンドポイント：Klines ---
@app.get("/api/klines")
def get_klines(symbol: str = "BTCUSDT", interval: str = "1d", limit: int = 500):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval={interval}&limit={limit}"
    try:
        response = requests.get(url, timeout=5)
        df = pd.DataFrame(response.json(), columns=['time', 'open', 'high', 'low', 'close', 'vol', 'ct', 'qv', 'tr', 'tb', 'tq', 'ig'])
        df['close'] = df['close'].astype(float)
        df['ma25'] = df['close'].rolling(window=25).mean()
        df['ma75'] = df['close'].rolling(window=75).mean()
        return [{
            "time": int(row['time'] / 1000), "open": float(row['open']), "high": float(row['high']), 
            "low": float(row['low']), "close": float(row['close']),
            "ma25": float(row['ma25']) if not pd.isna(row['ma25']) else None,
            "ma75": float(row['ma75']) if not pd.isna(row['ma75']) else None,
        } for _, row in df.iterrows()]
    except: return []

# --- エンドポイント：ニュース ---
@app.get("/api/news")
async def get_news_api(symbol: str = "BTC"):
    return await fetch_relevant_news(symbol)

# --- エンドポイント：マーケットデータ統合 ---
@app.get("/api/market_data")
async def get_market_data(symbol: str = "BTCUSDT"):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval=1h&limit=100"
    try:
        res = requests.get(url).json()
        rsi = calculate_rsi([float(item[4]) for item in res])
        news = await fetch_relevant_news(symbol)
        return {"symbol": symbol, "rsi": round(rsi, 2), "news": news}
    except:
        return {"symbol": symbol, "rsi": 50.0, "news": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    