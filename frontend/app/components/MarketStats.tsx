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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. 24h Tickerデータの取得
        const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        const tickerData = await tickerRes.json();
        
        // 2. RSI計算用のデータ取得（直近100件の1時間足）
        const klineRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`);
        const klineData = await klineRes.json();
        
        // 簡単なRSI計算ロジック（フロントエンド版）
        const closes = klineData.map((d: any) => parseFloat(d[4]));
        const rsiValue = calculateRSI(closes);

        const newStats: StatItem[] = [
          { 
            label: '24h High', 
            value: `$${parseFloat(tickerData.highPrice).toLocaleString()}`, 
            change: `▲ ${parseFloat(tickerData.priceChangePercent).toFixed(2)}%`, 
            type: 'up' 
          },
          { 
            label: 'RSI (14)', 
            value: rsiValue.toFixed(2), 
            change: rsiValue > 70 ? 'Overbought' : rsiValue < 30 ? 'Oversold' : 'Neutral', 
            type: rsiValue > 70 ? 'down' : rsiValue < 30 ? 'up' : 'neutral' 
          },
          { 
            label: '24h Volume', 
            value: `$${(parseFloat(tickerData.quoteVolume) / 1000000).toFixed(2)}M`, 
            change: 'USDT', 
            type: 'neutral' 
          },
          { 
            label: 'Market Range', 
            value: `$${parseFloat(tickerData.lowPrice).toLocaleString()}`, 
            change: '24h Low', 
            type: 'down' 
          },
        ];
        setStats(newStats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading && stats.length === 0) return <div className="p-4 text-neutral-500 animate-pulse">Loading stats...</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col justify-center p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-all">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">{stat.label}</p>
          <p className="text-sm font-black text-neutral-100 font-mono mb-1">{stat.value}</p>
          <p className={`text-[10px] font-bold ${
            stat.type === 'up' ? 'text-emerald-500' : stat.type === 'down' ? 'text-red-500' : 'text-neutral-400'
          }`}>
            {stat.change}
          </p>
        </div>
      ))}
    </div>
  );
}

// --- RSI計算ヘルパー関数 ---
function calculateRSI(prices: number[], period = 14) {
  if (prices.length < period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 0; i < period; i++) {
    const diff = prices[prices.length - 1 - i] - prices[prices.length - 2 - i];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}
