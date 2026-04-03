'use client';

import { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickData, 
  Time,
  CandlestickSeries
} from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a3a3a3',
      },
      grid: {
        vertLines: { color: '#262626' },
        horzLines: { color: '#262626' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 384,
      timeScale: {
        borderColor: '#333',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // --- 過去30日分のダミーデータを生成 ---
    const generateItems = () => {
      const items: CandlestickData<Time>[] = [];
      let currentPrice = 65000;
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // yyyy-mm-dd 形式の文字列を作成
        const timeStr = date.toISOString().split('T')[0] as Time;
        
        const open = currentPrice;
        const high = open + Math.random() * 1000;
        const low = open - Math.random() * 1000;
        const close = low + Math.random() * (high - low);
        
        items.push({
          time: timeStr,
          open,
          high,
          low,
          close,
        });
        
        currentPrice = close; // 次の日の始値を前の日の終値にする
      }
      return items;
    };

    const data = generateItems();
    candlestickSeries.setData(data);
    
    // 全データが収まるように表示を調整
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
