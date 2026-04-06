'use client';

import { useEffect, useState } from 'react';

interface StatItem {
  label: string;
  value: string;
  change: string;
  type: 'up' | 'down' | 'neutral';
}

// 親から symbol (例: "BTCUSDT") を受け取る
export default function MarketStats({ symbol }: { symbol: string }) {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Binanceの24h Ticker API。symbol引数によってURLが変わる
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const data = await res.json();
        
        if (data && data.highPrice) {
          const newStats: StatItem[] = [
            { 
              label: '24h High', 
              value: `$${parseFloat(data.highPrice).toLocaleString()}`, 
              change: `▲ ${parseFloat(data.priceChangePercent).toFixed(2)}%`, 
              type: parseFloat(data.priceChangePercent) >= 0 ? 'up' : 'down' 
            },
            { 
              label: '24h Low', 
              value: `$${parseFloat(data.lowPrice).toLocaleString()}`, 
              change: '24h Range', 
              type: 'neutral' 
            },
            { 
              label: 'Trading Vol', 
              value: `$${(parseFloat(data.quoteVolume) / 1000000).toFixed(2)}M`, 
              change: 'USDT', 
              type: 'neutral' 
            },
            { 
              label: 'Last Price', 
              value: `$${parseFloat(data.lastPrice).toLocaleString()}`, 
              change: `${data.count} trades`, 
              type: 'neutral' 
            },
          ];
          setStats(newStats);
        }
      } catch (e) {
        console.error("Stats Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // 通貨を切り替えた直後だけでなく、15秒ごとに自動更新する
    const intervalId = setInterval(fetchStats, 15000); 
    
    return () => clearInterval(intervalId);
  }, [symbol]); // ★ symbol が変わるたびに useEffect が再実行される

  if (loading && stats.length === 0) {
    return <div className="text-xs text-neutral-500 animate-pulse p-4">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="flex flex-col justify-center p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-all duration-300"
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
