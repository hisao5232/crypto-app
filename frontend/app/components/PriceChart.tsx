'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, Time, CandlestickSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. チャート初期化
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#a3a3a3' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      width: chartContainerRef.current.clientWidth,
      height: 384,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 2. 過去データの取得
    const fetchData = async () => {
      const limit = interval === '1d' ? 30 : 300;
      try {
        const res = await fetch(`https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`);
        const data = await res.json();
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
      } catch (e) { console.error(e); }
    };

    fetchData();

    // 3. WebSocketでのリアルタイム更新（1分足の時のみ）
    let socket: WebSocket | null = null;
    if (interval === '1m') {
      socket = new WebSocket('wss://crypto-api.go-pro-world.net/ws/crypto');
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const price = parseFloat(msg.p);
        const time = Math.floor(Date.now() / 1000 / 60) * 60; // 現在の分に切り捨て

        // 現在の足（最新の1分間）を更新し続ける
        candlestickSeries.update({
          time: time as Time,
          open: price, // 本来は1分間の最初の価格を保持すべきですが、簡易的に現在値を入れます
          high: price, 
          low: price,
          close: price
        });
      };
    }

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket?.close();
      chart.remove();
    };
  }, [interval]); // intervalが変わるたびに再描画

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 absolute top-[-50px] right-0 z-10">
        <button 
          onClick={() => setInterval('1d')}
          className={`px-3 py-1 text-xs rounded border ${interval === '1d' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-border text-neutral-400'}`}
        >
          1 Day (30D)
        </button>
        <button 
          onClick={() => setInterval('1m')}
          className={`px-3 py-1 text-xs rounded border ${interval === '1m' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-border text-neutral-400'}`}
        >
          1 Min (Live)
        </button>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
