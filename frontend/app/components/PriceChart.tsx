'use client';

import { useEffect, useRef } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickData, 
  Time,
  SeriesMarker,
  // v4/v5系では CandlestickSeries を使って型指定します
  CandlestickSeries
} from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. チャートの初期化
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
    });

    // 2. ローソク足シリーズの追加 (最新の推奨される書き方)
    // エラーが出る場合は 'as any' を一時的に使って回避することも可能ですが、
    // 基本的に以下のメソッドで CandlestickSeries 型として取得できます。
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // 3. サンプルデータ
    const data: CandlestickData<Time>[] = [
      { time: '2026-04-01' as Time, open: 66000, high: 67500, low: 65800, close: 67200 },
      { time: '2026-04-02' as Time, open: 67200, high: 68000, low: 66900, close: 66900 },
      { time: '2026-04-03' as Time, open: 66900, high: 68500, low: 66500, close: 68200 },
    ];

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    // 4. リサイズ処理
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
