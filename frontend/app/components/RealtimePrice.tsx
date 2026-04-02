'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
  s: string; // Symbol
  p: string; // Price
}

export default function RealtimePrice() {
  const [data, setData] = useState<CryptoData | null>(null);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const API_DOMAIN = "crypto-api.go-pro-world.net";
    const wsUrl = `wss://${API_DOMAIN}/ws/crypto`;
    let socket: WebSocket;

    function connect() {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setStatus('connected');
      socket.onmessage = (event) => {
        const newData: CryptoData = JSON.parse(event.data);
        setData((prev) => {
          if (prev) setPrevPrice(parseFloat(prev.p));
          return newData;
        });
      };
      socket.onclose = () => {
        setStatus('disconnected');
        setTimeout(connect, 3000);
      };
    }
    connect();
    return () => socket.close();
  }, []);

  const currentPrice = data ? parseFloat(data.p) : 0;
  // 価格変更時のフラッシュ演出用のクラス
  const priceFlashClass = currentPrice > prevPrice ? 'animate-flash-green' : currentPrice < prevPrice ? 'animate-flash-red' : '';
  const priceColor = currentPrice >= prevPrice ? 'text-success' : 'text-warning';

  return (
    <div className="p-6 bg-card border border-border rounded-2xl shadow-xl flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032" alt="BTC" className="w-6 h-6" />
          <h2 className="text-lg font-bold tracking-tight">{data?.s || 'BTCUSDT'}</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-500">Live</span>
        </div>
        <p className="text-sm text-neutral-500">Bitcoin / Tether US</p>
      </div>
      
      <div className="text-right">
        <div className={`text-3xl font-black tabular-nums ${priceColor} ${priceFlashClass}`}>
          {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---.--'}
        </div>
        <div className="text-sm text-neutral-600 flex items-center justify-end gap-1.5">
          <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
          {status === 'connected' ? 'Streaming' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
}
