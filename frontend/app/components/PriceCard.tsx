'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
  s: string; // Symbol (Binance)
  p: string; // Price (Binance)
}

interface GmoData {
  last: number;
  symbol: string;
}

export default function PriceCard() {
  const [data, setData] = useState<CryptoData | null>(null);
  const [gmoPrice, setGmoPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // --- Binance WebSocket (Realtime USD) ---
  useEffect(() => {
    const API_DOMAIN = "crypto-api.go-pro-world.net";
    const wsUrl = `wss://${API_DOMAIN}/ws/crypto?symbol=BTCUSDT`;
    let socket: WebSocket;

    function connect() {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setStatus('connected');
      socket.onmessage = (event) => {
        const newData: CryptoData = JSON.parse(event.data);
        if (newData.s === 'BTCUSDT') {
          setData((prev) => {
            if (prev) setPrevPrice(parseFloat(prev.p));
            return newData;
          });
        }
      };
      socket.onclose = () => {
        setStatus('disconnected');
        setTimeout(connect, 3000);
      };
    }

    connect();
    return () => socket.close();
  }, []);

  // --- GMO Coin API (Polling JPY) ---
  useEffect(() => {
    const fetchGmo = async () => {
      try {
        const res = await fetch(`https://crypto-api.go-pro-world.net/api/gmo_ticker?symbol=BTC`);
        const json: GmoData = await res.json();
        if (json.last) setGmoPrice(json.last);
      } catch (e) {
        console.error("GMO Fetch Error:", e);
      }
    };

    fetchGmo();
    const timer = setInterval(fetchGmo, 5000); // 5秒ごとに更新
    return () => clearInterval(timer);
  }, []);

  const currentPrice = data ? parseFloat(data.p) : 0;
  const priceColor = currentPrice >= prevPrice ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="relative overflow-hidden p-6 bg-neutral-900/80 border border-white/5 rounded-2xl shadow-2xl w-80 backdrop-blur-md">
      {/* 背景の装飾（薄いグラデーション） */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em]">
          {data?.s || 'BTC / USDT'}
        </h2>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{status}</span>
        </div>
      </div>

      {/* Binance Price (USD) */}
      <div className="mb-4">
        <div className={`text-4xl font-black tracking-tighter transition-colors duration-500 ${priceColor}`}>
          {currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '---.-'}
          <span className="text-sm ml-2 text-neutral-600 font-medium tracking-normal">USDT</span>
        </div>
      </div>

      {/* GMO Price (JPY) */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">GMO Coin JPY</p>
            <div className="text-2xl font-bold text-neutral-100 font-mono">
              <span className="text-lg mr-1 text-neutral-500 font-sans">¥</span>
              {gmoPrice ? gmoPrice.toLocaleString() : '---,---'}
            </div>
          </div>
          <div className="text-[10px] text-neutral-600 font-bold mb-1">
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}
