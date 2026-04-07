'use client';

export default function NewsFeed({ symbol }: { symbol: string }) {
  // 実際には上の /api/market_data から取得
  const news = [
    { title: 'Bitcoin ETFへの資金流入が過去最高を記録', source: 'CoinDesk', time: '5m ago' },
    { title: 'イーサリアム、次期アップデート「Pectra」の詳細公開', source: 'TheBlock', time: '1h ago' },
  ];

  return (
    <div className="space-y-4">
      {news.map((item, i) => (
        <div key={i} className="group p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase">{item.source}</span>
            <span className="text-[10px] text-neutral-500">{item.time}</span>
          </div>
          <p className="text-xs font-medium text-neutral-200 group-hover:text-white leading-relaxed">
            {item.title}
          </p>
        </div>
      ))}
    </div>
  );
}
