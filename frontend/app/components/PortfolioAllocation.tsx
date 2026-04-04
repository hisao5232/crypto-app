'use client';

import React from 'react'; // 明示的にReactをインポート

const portfolio = [
  { name: 'Bitcoin', symbol: 'BTC', value: 60, color: '#F7931A' },
  { name: 'Ethereum', symbol: 'ETH', value: 25, color: '#627EEA' },
  { name: 'Solana', symbol: 'SOL', value: 15, color: '#14F195' },
];

export default function PortfolioAllocation() {
  // accumulatorの型を明示的に定義
  interface Acc {
    total: number;
    elements: React.ReactNode[];
  }

  const chartData = portfolio.reduce<Acc>((acc, item) => {
    const offset = acc.total;
    acc.total += item.value;
    acc.elements.push(
      <circle
        key={item.symbol}
        cx="18" cy="18" r="15.9"
        fill="transparent"
        stroke={item.color}
        strokeWidth="3.8"
        strokeDasharray={`${item.value} ${100 - item.value}`}
        strokeDashoffset={-offset}
        className="transition-all duration-1000 ease-out"
      />
    );
    return acc;
  }, { total: 0, elements: [] });

  return (
    <div className="flex flex-col items-center justify-center h-full py-2">
      <div className="relative w-40 h-40 mb-6">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {chartData.elements}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Total Assets</span>
          <span className="text-xl font-black text-white">$12,450</span>
        </div>
      </div>

      <div className="w-full space-y-3 px-4">
        {portfolio.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-sm font-bold text-neutral-200">{item.name}</p>
                <p className="text-[10px] text-neutral-500 font-mono">{item.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-neutral-100">{item.value}%</p>
              <p className="text-[10px] text-emerald-500 font-bold">+$42.10</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
