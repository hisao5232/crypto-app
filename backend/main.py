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

# --- 共通ロジック：ニュース取得 ---
def fetch_relevant_news(symbol: str):
    """PR TIMESから銘柄に関連するニュースをフィルタリングして取得"""
    RSS_URL = "https://prtimes.jp/index.rdf"
    feed = feedparser.parse(RSS_URL)
    
    # symbolから純粋な通貨名を取得 (BTCUSDT -> BTC)
    coin_name = symbol.replace('USDT', '').upper()
    
    keywords = {
        "BTC": ["ビットコイン", "Bitcoin", "暗号資産", "仮想通貨"],
        "ETH": ["イーサリアム", "Ethereum", "Web3", "NFT"],
        "SOL": ["ソラナ", "Solana", "ブロックチェーン"]
    }
    
    target_kws = keywords.get(coin_name, ["暗号資産", "仮想通貨"])
    
    relevant_news = []
    for entry in feed.entries:
        title = entry.get('title', '')
        summary = entry.get('summary', '')
        
        if any(kw in title or kw in summary for kw in target_kws):
            relevant_news.append({
                "title": title,
                "link": entry.get('link', '#'),
                "source": "PR TIMES",
                "time": entry.get('published', 'Just now')
            })
            if len(relevant_news) >= 5: break

    if not relevant_news:
        relevant_news = [{"title": f"{coin_name} に関する最新ニュースは現在ありません", "link": "#", "source": "System", "time": ""}]
    
    return relevant_news

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
def get_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 500):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval={interval}&limit={limit}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        return [{"time": int(item[0] / 1000), "open": float(item[1]), "high": float(item[2]), "low": float(item[3]), "close": float(item[4])} for item in data]
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

# --- エンドポイント：本物のニュース (ここが足りなかった！) ---
@app.get("/api/news")
def get_news_api(symbol: str = "BTC"):
    """フロントエンドのNewsFeedから呼ばれるエンドポイント"""
    return fetch_relevant_news(symbol)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    