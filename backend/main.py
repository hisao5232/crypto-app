import asyncio
import json
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ストリームのURLを確認（ここが原因の可能性もあります）
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@ticker"

@app.websocket("/ws/crypto")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("DEBUG: ブラウザからのWebSocket接続を承諾しました")
    
    try:
        # BinanceのWebSocketに接続
        async with websockets.connect(BINANCE_WS_URL) as binance_ws:
            print(f"DEBUG: Binanceに接続しました: {BINANCE_WS_URL}")
            
            while True:
                # Binanceから受信
                binance_data = await binance_ws.recv()
                msg = json.loads(binance_data)
                
                # ログに生データを出す（確認できたら後で消す）
                # print(f"DEBUG: 受信データ: {msg}") 
                
                # フロントエンドに送るデータを整形
                payload = {
                    "s": msg.get('s', 'BTCUSDT'),
                    "p": msg.get('c', '0') # 'c' は最新価格
                }
                
                # ブラウザへ送信
                await websocket.send_json(payload)
                
    except WebSocketDisconnect:
        print("INFO: ブラウザ側から切断されました")
    except Exception as e:
        print(f"ERROR: 予期せぬエラーが発生しました: {e}")
    # ★ ここが修正ポイント：finallyで無理にclose()を呼ばない
