import asyncio
import json
import websockets
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Cloudflare PagesのURL（または "*"）を指定
    allow_origins=["https://crypto-app.pages.dev", "https://crypto-app.go-pro-world.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@ticker"

@app.websocket("/ws/crypto")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # BinanceのWebSocketに接続
    async with websockets.connect(BINANCE_WS_URL) as binance_ws:
        try:
            while True:
                # Binanceからデータを受信
                data = await binance_ws.recv()
                msg = json.loads(data)
                
                # 必要なデータ（現在の価格）だけを抽出してフロントへ送信
                price_data = {
                    "symbol": msg['s'],
                    "price": msg['c']  # 'c' は Last Price
                }
                await websocket.send_json(price_data)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await websocket.close()
