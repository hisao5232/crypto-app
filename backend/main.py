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
async def websocket_endpoint(websocket: WebSocket, symbol: str = "BTCUSDT", symbols: str = None):
    await websocket.accept()
    
    # 1. 複数銘柄リクエスト（RealtimePrice用）か、単一銘柄（PriceChart用）かを判定
    if symbols:
        # symbols=BTCUSDT,ETHUSDT... の形式（RealtimePrice用）
        target_symbols = [s.strip().lower() for s in symbols.split(",")]
    else:
        # symbol=BTCUSDT の形式（PriceChart用）
        target_symbols = [symbol.strip().lower()]

    streams = "/".join([f"{s}@ticker" for s in target_symbols])
    full_ws_url = BASE_WS_URL + streams
    
    try:
        async with websockets.connect(full_ws_url) as binance_ws:
            while True:
                raw_data = await binance_ws.recv()
                data = json.loads(raw_data)
                msg = data.get('data', {})
                
                # 受信したデータのシンボルを確認
                current_symbol = msg.get('s')
                
                # 指定された銘柄リストに含まれる場合のみ送信
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
    