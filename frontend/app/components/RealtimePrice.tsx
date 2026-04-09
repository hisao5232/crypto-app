'use client';

import { useEffect, useState } from 'react';

// 監視する銘柄の定義
const TRACKING_SYMBOLS = [
  { id: 'BTCUSDT', label: 'Bitcoin', symbol: 'BTC', color: 'text-[#F7931A]' },
  { id: 'ETHUSDT', label: 'Ethereum', symbol: 'ETH', color: 'text-[#627EEA]' },
  { id: 'SOLUSDT', label: 'Solana', symbol: 'SOL', color: 'text-[#14F195]' },
];

export default function RealtimePrice() {
  // Binanceの価格データ
  const [prices, setPrices] = useState<Record<string, { price: string; change: string }>>({
    BTCUSDT: { price: '0.00', change: '0.00' },
    ETHUSDT: { price: '0.00', change: '0.00' },
    SOLUSDT: { price: '0.00', change: '0.00' },
  });

  // GMOコインの日本円価格
  const [jpyPrices, setJpyPrices] = useState<Record<string, number | null>>({
    BTC: null,
    ETH: null,
    SOL: null,
  });

  // --- Binance WebSocket (Realtime) ---
  useEffect(() => {
    const symbolsQuery = TRACKING_SYMBOLS.map(s => s.id).join(',');
    const socket = new WebSocket(`wss://crypto-api.go-pro-world.net/ws/crypto?symbols=${symbolsQuery}`);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.s && msg.p) {
        setPrices((prev) => ({
          ...prev,
          [msg.s]: {
            price: parseFloat(msg.p).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            change: msg.dc || '0.00'
          }
        }));
      }
    };

    return () => socket.close();
  }, []);

  // --- GMO Coin API (Polling 5s) ---
  useEffect(() => {
    const fetchAllGmoPrices = async () => {
      for (const coin of TRACKING_SYMBOLS) {
        try {
          const res = await fetch(`https://crypto-api.go-pro-world.net/api/gmo_ticker?symbol=${coin.symbol}`);
          const data = await res.json();
          if (data.last) {
            setJpyPrices(prev => ({ ...prev, [coin.symbol]: data.last }));
          }
        } catch (e) {
          console.error(`GMO Fetch Error (${coin.symbol}):`, e);
        }
      }
    };

    fetchAllGmoPrices();
    const interval = setInterval(fetchAllGmoPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-6 bg-neutral-900/40 border border-white/5 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex justify-between items-center px-1 mb-2">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
          Market Watch
        </h3>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] text-neutral-600 font-bold">LIVE</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {TRACKING_SYMBOLS.map((coin) => (
          <div key={coin.id} className="flex flex-col gap-2 group transition-all duration-300">
            {/* 上段: 通貨情報とBinance価格 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-10 rounded-full ${coin.color.replace('text', 'bg')}`} />
                <div>
                  <p className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">{coin.label}</p>
                  <p className="text-[10px] font-mono text-neutral-600 uppercase">{coin.symbol} / USDT</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-black text-white font-mono tracking-tighter">
                  ${prices[coin.id].price}
                </p>
                <p className={`text-[10px] font-bold ${prices[coin.id].change.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {prices[coin.id].change}%
                </p>
              </div>
            </div>

            {/* 下段: GMOコイン日本円価格 (ここを追加) */}
            <div className="flex items-center justify-between ml-4 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-1 rounded">GMO</span>
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider text-nowrap">Price JPY</span>
              </div>
              <p className="text-sm font-bold text-neutral-200 font-mono">
                <span className="text-[10px] mr-1 text-neutral-500 font-sans">¥</span>
                {jpyPrices[coin.symbol] ? jpyPrices[coin.symbol]?.toLocaleString() : '---,---'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
