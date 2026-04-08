'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  time: string;
  ai_summary?: string; 
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export default function NewsFeed({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        // バックエンドのURLを指定
        const coin = symbol.replace('USDT', '');
        const res = await fetch(`https://crypto-api.go-pro-world.net/api/news?symbol=${coin}`);
        const data = await res.json();
        setNews(data);
      } catch (e) {
        console.error("News fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]); // symbolが変わるたびにニュースを再取得

  if (loading) return <div className="p-4 text-neutral-500 animate-pulse">Fetching news...</div>;

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
      {news.map((item, i) => (
        <div key={i} className="relative p-3 bg-white/5 rounded-lg border-l-4 border-l-transparent">
          {/* センチメントに応じて色を変える */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
            item.sentiment === 'positive' ? 'bg-emerald-500' : 
            item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-neutral-500'
          }`} />
          
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-blue-400">{item.source}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              item.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
              item.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-500/20 text-neutral-400'
            }`}>
              {item.sentiment}
            </span>
          </div>
          
          <p className="text-[11px] font-semibold text-white mb-1">{item.ai_summary}</p>
          <a href={item.link} target="_blank" className="text-[10px] text-neutral-400 hover:text-white line-clamp-1">
            {item.title}
          </a>
        </div>
      ))}
    </div>
  );
}
