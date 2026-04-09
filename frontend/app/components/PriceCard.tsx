'use client';

import { useEffect, useState } from 'react';

interface CryptoData {
  s: string; // Symbol (Binance)
  p: string; // Price (Binance)
}

// Propsの型定義を追加
interface PriceCardProps {
  symbol: string;     // "BTCUSDT" など
  displayName: string; // "Bitcoin" など
}

export default function PriceCard({ symbol, displayName }: PriceCardProps) {
  const [data, setData] = useState<CryptoData | null>(null);
  const [gmoPrice, setGmoPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // 通貨記号だけを抽出 (BTCUSDT -> BTC)
  const coinSymbol = symbol.replace('USDT', '');

  // --- Binance WebSocket ---
  useEffect(() => {
    const API_DOMAIN = "crypto-api.go-pro-world.net";
    const wsUrl = `wss://${API_DOMAIN}/ws/crypto?symbol=${symbol}`;
    let socket: WebSocket;

    function connect() {
      socket = new WebSocket(wsUrl);
      socket.onopen = () => setStatus('connected');
      socket.onmessage = (event) => {
        const newData: CryptoData = JSON.parse(event.data);
        if (newData.s === symbol) {
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
  }, [symbol]);

  // --- GMO Coin API ---
  useEffect(() => {
    const fetchGmo = async () => {
      try {
        const res = await fetch(`https://crypto-api.go-pro-world.net/api/gmo_ticker?symbol=${coinSymbol}`);
        const json = await res.json();
        if (json.last) setGmoPrice(json.last);
      } catch (e) {
        console.error("GMO Fetch Error:", e);
      }
    };

    fetchGmo();
    const timer = setInterval(fetchGmo, 5000);
    return () => clearInterval(timer);
  }, [coinSymbol]);

  const currentPrice = data ? parseFloat(data.p) : 0;
  const priceColor = currentPrice >= prevPrice ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="p-6 bg-neutral-900 border border-white/5 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="text-left">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{displayName}</p>
          <h2 className="text-sm font-black text-white">{symbol}</h2>
        </div>
        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'}`} />
      </div>

      <div className="mb-4 text-left">
        <div className={`text-3xl font-black tracking-tighter ${priceColor}`}>
          ${currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---.--'}
        </div>
      </div>

      {/* GMO価格セクション（ここが表示されるはず！） */}
      <div className="pt-4 border-t border-white/5 text-left">
        <p className="text-[9px] text-blue-400 font-black uppercase mb-1 tracking-tighter">GMO Coin JPY</p>
        <div className="text-xl font-bold text-neutral-100 font-mono">
          <span className="text-sm mr-1 text-neutral-500">¥</span>
          {gmoPrice ? gmoPrice.toLocaleString() : '---,---'}
        </div>
      </div>
    </div>
  );
}
