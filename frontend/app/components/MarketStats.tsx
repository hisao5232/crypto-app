'use client';

import { useEffect, useState } from 'react';

interface StatItem {
  label: string;
  value: string;
  change: string;
  type: 'up' | 'down' | 'neutral';
}

export default function MarketStats({ symbol }: { symbol: string }) {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    // 実際には Binance の 24hr Ticker API 等から取得
    // 例: https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}
    const fetchStats = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const data = await res.json();
        
        const newStats: StatItem[] = [
          { 
            label: '24h High', 
            value: `$${parseFloat(data.highPrice).toLocaleString()}`, 
            change: `▲ ${parseFloat(data.priceChangePercent).toFixed(2)}%`, 
            type: 'up' 
          },
          { 
            label: '24h Low', 
            value: `$${parseFloat(data.lowPrice).toLocaleString()}`, 
            change: `▼ --%`, // Lowの比較対象はロジックに応じて
            type: 'down' 
          },
          { 
            label: 'RSI (14)', 
            value: '62.5', 
            change: 'Neutral', 
            type: 'neutral' 
          },
          { 
            label: '24h Volume', 
            value: `$${(parseFloat(data.quoteVolume) / 1000000).toFixed(2)}M`, 
            change: '▲ 0.5%', 
            type: 'up' 
          },
        ];
        setStats(newStats);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10秒ごとに更新
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="flex flex-col justify-center p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
        >
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <p className="text-sm font-black text-neutral-100 font-mono mb-1">
            {stat.value}
          </p>
          <p className={`text-[10px] font-bold ${
            stat.type === 'up' ? 'text-emerald-500' : 
            stat.type === 'down' ? 'text-red-500' : 'text-neutral-400'
          }`}>
            {stat.change}
          </p>
        </div>
      ))}
    </div>
  );
}
