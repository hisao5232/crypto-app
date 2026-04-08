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

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Binance WebSocket Base URL
BASE_WS_URL = "wss://stream.binance.com:9443/stream?streams="

# --- ニュース取得ロジックの強化版 ---
def fetch_relevant_news(symbol: str):
    # 取得したいRSSソースのリスト
    SOURCES = [
        {"name": "CoinPost", "url": "https://coinpost.jp/?feed=rss2"},
        {"name": "CoinDesk Japan", "url": "https://www.coindeskjapan.com/feed/"},
        {"name": "PR TIMES (Crypto)", "url": "https://prtimes.jp/index.rdf"}
    ]
    
    coin_name = symbol.replace('USDT', '').upper()
    keywords = {
        "BTC": ["ビットコイン", "Bitcoin", "BTC"],
        "ETH": ["イーサリアム", "Ethereum", "ETH", "Web3"],
        "SOL": ["ソラナ", "Solana", "SOL"]
    }
    target_kws = keywords.get(coin_name, ["暗号資産", "仮想通貨"])
    
    all_news = []
    
    for source in SOURCES:
        try:
            feed = feedparser.parse(source["url"])
            for entry in feed.entries:
                title = entry.get('title', '')
                summary = entry.get('summary', '') or entry.get('description', '')
                
                # キーワードマッチング
                if any(kw.lower() in title.lower() or kw.lower() in summary.lower() for kw in target_kws):
                    all_news.append({
                        "title": title,
                        "link": entry.get('link', '#'),
                        "source": source["name"],
                        "time": entry.get('published', 'Just now')
                    })
        except Exception as e:
            print(f"Error fetching {source['name']}: {e}")

    # 重複排除（同じタイトルの記事が複数ソースにある場合）
    unique_news = []
    seen_titles = set()
    for n in all_news:
        if n["title"] not in seen_titles:
            unique_news.append(n)
            seen_titles.add(n["title"])

    # 最新の5〜10件に絞る
    final_news = unique_news[:8]

    if not final_news:
        final_news = [{"title": f"{coin_name} に関する最新ニュースはありません", "link": "#", "source": "System", "time": ""}]
    
    return final_news

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
                    payload = {
                        "s": current_symbol,
                        "p": msg.get('c'),
                        "dc": msg.get('P')
                    }
                    await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass 
    except Exception as e:
        print(f"WS Error: {e}")

# --- エンドポイント：Klines (チャート用) ---
@app.get("/api/klines")
def get_klines(symbol: str = "BTCUSDT", interval: str = "1d", limit: int = 500):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval={interval}&limit={limit}"
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        
        # DataFrameに変換して計算
        df = pd.DataFrame(data, columns=['time', 'open', 'high', 'low', 'close', 'vol', 'close_time', 'q_vol', 'trades', 'taker_base', 'taker_quote', 'ignore'])
        df['close'] = df['close'].astype(float)
        
        # 移動平均の計算
        df['ma25'] = df['close'].rolling(window=25).mean()
        df['ma75'] = df['close'].rolling(window=75).mean()

        formatted_data = []
        for i in range(len(df)):
            formatted_data.append({
                "time": int(df.iloc[i]['time'] / 1000),
                "open": float(df.iloc[i]['open']),
                "high": float(df.iloc[i]['high']),
                "low": float(df.iloc[i]['low']),
                "close": float(df.iloc[i]['close']),
                "ma25": float(df.iloc[i]['ma25']) if not pd.isna(df.iloc[i]['ma25']) else None,
                "ma75": float(df.iloc[i]['ma75']) if not pd.isna(df.iloc[i]['ma75']) else None,
            })
        return formatted_data
    except Exception as e:
        return []

# --- エンドポイント：マーケット統計データ (RSI等) ---
@app.get("/api/market_data")
def get_market_data(symbol: str = "BTCUSDT"):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval=1h&limit=100"
    try:
        res = requests.get(url).json()
        close_prices = [float(item[4]) for item in res]
        current_rsi = calculate_rsi(close_prices)
        # ここでも本物のニュースを返す
        news = fetch_relevant_news(symbol)
        return {"symbol": symbol, "rsi": round(current_rsi, 2), "news": news}
    except:
        return {"symbol": symbol, "rsi": 50.0, "news": []}

# --- エンドポイント：本物のニュース
@app.get("/api/news")
def get_news_api(symbol: str = "BTC"):
    """フロントエンドのNewsFeedから呼ばれるエンドポイント"""
    return fetch_relevant_news(symbol)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    