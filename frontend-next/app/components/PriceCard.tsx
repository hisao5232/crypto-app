'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
  s: string; // Symbol
  p: string; // Price
}

export default function PriceCard() {
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
        setTimeout(connect, 3000); // 3秒後に再接続
      };
    }

    connect();
    return () => socket.close();
  }, []);

  const currentPrice = data ? parseFloat(data.p) : 0;
  const priceColor = currentPrice >= prevPrice ? 'text-green-400' : 'text-red-400';

  return (
    <div className="p-8 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl text-center w-80">
      <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-widest">
        {data?.s || 'Loading...'}
      </h2>
      
      <div className={`text-4xl font-black my-4 transition-colors duration-300 ${priceColor}`}>
        {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---.--'}
        <span className="text-lg ml-2 text-neutral-500">USDT</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs text-neutral-500 uppercase">{status}</span>
      </div>
    </div>
  );
}
