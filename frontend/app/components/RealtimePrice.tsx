'use client';

import { useEffect, useState } from 'react';

// 監視する銘柄の定義
const TRACKING_SYMBOLS = [
  { id: 'BTCUSDT', label: 'Bitcoin', symbol: 'BTC', color: 'text-[#F7931A]' },
  { id: 'ETHUSDT', label: 'Ethereum', symbol: 'ETH', color: 'text-[#627EEA]' },
  { id: 'SOLUSDT', label: 'Solana', symbol: 'SOL', color: 'text-[#14F195]' },
];

export default function RealtimePrice() {
  // 銘柄ごとの価格を管理するState
  const [prices, setPrices] = useState<Record<string, { price: string; change: string }>>({
    BTCUSDT: { price: '0.00', change: '0.00' },
    ETHUSDT: { price: '0.00', change: '0.00' },
    SOLUSDT: { price: '0.00', change: '0.00' },
  });

  useEffect(() => {
    // 全銘柄を購読するためのクエリパラメータを作成
    const symbolsQuery = TRACKING_SYMBOLS.map(s => s.id).join(',');
    const socket = new WebSocket(`wss://crypto-api.go-pro-world.net/ws/crypto?symbols=${symbolsQuery}`);

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // バックエンドから { "s": "BTCUSDT", "p": "65000.12", "dc": "+1.2" } のような形式で来ると想定
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

  return (
    <div className="flex flex-col gap-4 p-6 bg-neutral-900/40 border border-white/5 rounded-2xl shadow-xl backdrop-blur-sm">
      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-2 px-1">
        Market Watch
      </h3>
      
      <div className="space-y-4">
        {TRACKING_SYMBOLS.map((coin) => (
          <div key={coin.id} className="flex items-center justify-between group transition-all duration-300 hover:translate-x-1">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${coin.color.replace('text', 'bg')}`} />
              <div>
                <p className="text-xs font-bold text-neutral-400">{coin.label}</p>
                <p className="text-[10px] font-mono text-neutral-600">{coin.symbol} / USDT</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-black text-white font-mono tracking-tighter">
                ${prices[coin.id].price}
              </p>
              <p className={`text-[10px] font-bold ${prices[coin.id].change.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                {prices[coin.id].change}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
