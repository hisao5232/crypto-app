'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickData,
  Time,
  CandlestickSeries,
  IChartApi,
  ISeriesApi
} from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 2. バックエンドから本物のデータを取得する関数
    const fetchHistoricalData = async () => {
      try {
        // バックエンドのエンドポイントを叩く
        const response = await fetch("https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=1d&limit=30");
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data: CandlestickData<Time>[] = await response.json();
        
        // 取得したデータをチャートにセット
        candlestickSeries.setData(data);
        
        // 全データが収まるように表示を調整
        chart.timeScale().fitContent();
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
      }
    };

    fetchHistoricalData();

    // 3. リサイズ対応
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
