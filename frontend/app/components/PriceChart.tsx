'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, Time } from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // --- 1. 初期化 ---
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

    // --- 2. データ取得関数 ---
    const fetchData = async () => {
      const limit = interval === '1d' ? 30 : 300;
      // キャッシュを避け、確実に最新を取得するためのクエリパラメータ
      const url = `https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}&t=${Date.now()}`;
      
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data && Array.isArray(data)) {
          candlestickSeries.setData(data);
          chart.timeScale().fitContent();
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      }
    };

    fetchData();

    // --- 3. WebSocket (1mの時のみ) ---
    let socket: WebSocket | null = null;
    if (interval === '1m') {
      socket = new WebSocket('wss://crypto-api.go-pro-world.net/ws/crypto');
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const price = parseFloat(msg.p);
        const time = Math.floor(Date.now() / 1000 / 60) * 60;

        candlestickSeries.update({
          time: time as Time,
          open: price, high: price, low: price, close: price
        });
      };
    }

    // --- 4. リサイズとクリーンアップ ---
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket?.close();
      chart.remove(); // ここで古いチャートを確実に破棄
    };
  }, [interval]); // interval が変わるたびに useEffect が走り、チャートが作り直される

  return (
    <div className="flex flex-col w-full p-4 bg-neutral-900/50 rounded-xl border border-white/5">
      <div className="flex justify-end gap-2 mb-4">
        <button 
          onClick={() => setInterval('1d')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            interval === '1d' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          1 Day (30D)
        </button>
        <button 
          onClick={() => setInterval('1m')}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            interval === '1m' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          1 Min (Live)
        </button>
      </div>
      <div ref={chartContainerRef} className="w-full h-[384px]" />
    </div>
  );
}
