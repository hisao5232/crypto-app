import requests
import json
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Binance Combined Stream URL (複数銘柄をまとめて取得)
# 形式: wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker
BASE_WS_URL = "wss://stream.binance.com:9443/stream?streams="

@app.websocket("/ws/crypto")
async def websocket_endpoint(websocket: WebSocket, symbols: str = Query("BTCUSDT")):
    """
    クエリパラメータ symbols に基づいて複数の銘柄を購読する
    例: /ws/crypto?symbols=BTCUSDT,ETHUSDT,SOLUSDT
    """
    await websocket.accept()
    
    # 購読する銘柄リストを作成 (小文字にして binance の形式に合わせる)
    symbol_list = [s.strip().lower() for s in symbols.split(",")]
    streams = "/".join([f"{s}@ticker" for s in symbol_list])
    full_ws_url = BASE_WS_URL + streams
    
    print(f"DEBUG: Connecting to Binance: {full_ws_url}")
    
    try:
        async with websockets.connect(full_ws_url) as binance_ws:
            while True:
                # Binanceから受信
                raw_data = await binance_ws.recv()
                data = json.loads(raw_data)
                
                # Combined Streamの場合、データは 'data' キーの中に入っている
                msg = data.get('data', {})
                
                # フロントエンドに送るデータを整形
                # s: シンボル, p: 現在価格, dc: 24時間騰落率
                payload = {
                    "s": msg.get('s'),      # 例: BTCUSDT
                    "p": msg.get('c'),      # Latest Price
                    "dc": msg.get('P')      # 24h Price Change Percent
                }
                
                # フロントエンドへ送信
                await websocket.send_json(payload)
                
    except WebSocketDisconnect:
        print(f"INFO: Browser disconnected ({symbols})")
    except Exception as e:
        print(f"ERROR: Unexpected error in WS: {e}")

@app.get("/api/klines")
def get_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 500):
    """
    Klines (ローソク足) データを取得
    """
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol.upper()}&interval={interval}&limit={limit}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        formatted_data = []
        for item in data:
            formatted_data.append({
                "time": int(item[0] / 1000),
                "open": float(item[1]),
                "high": float(item[2]),
                "low": float(item[3]),
                "close": float(item[4]),
            })
        return formatted_data
    except Exception as e:
        print(f"ERROR: Klines API error: {e}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    