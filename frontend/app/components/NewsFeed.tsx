'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  time: string;
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
        <a 
          key={i} 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block group p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{item.source}</span>
            <span className="text-[10px] text-neutral-500">{item.time}</span>
          </div>
          <p className="text-xs font-medium text-neutral-200 group-hover:text-white leading-relaxed line-clamp-2">
            {item.title}
          </p>
        </a>
      ))}
    </div>
  );
}
