'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, Time, CandlestickData } from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');
  
  // 現在更新中のローソク足を保持するためのRef
  const lastBarRef = useRef<CandlestickData<Time> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // --- 1. チャート初期化 ---
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#a3a3a3' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      width: chartContainerRef.current.clientWidth,
      height: 384,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        borderColor: '#333',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    // インターバル切り替え時にRefをリセット
    lastBarRef.current = null;

    // --- 2. 過去データの取得 ---
    const fetchData = async () => {
      const limit = interval === '1d' ? 30 : 300;
      const url = `https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}&t=${Date.now()}`;
      
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          candlestickSeries.setData(data);
          chart.timeScale().fitContent();
          
          // 過去データの最後の一本を「最新の足」の初期値として保持
          const lastData = data[data.length - 1];
          lastBarRef.current = { ...lastData };
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      }
    };

    fetchData();

    // --- 3. WebSocket (1mの時のみリアルタイム更新) ---
    let socket: WebSocket | null = null;
    if (interval === '1m') {
      socket = new WebSocket('wss://crypto-api.go-pro-world.net/ws/crypto');
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const price = parseFloat(msg.p);
        // 現在の「分」の開始時刻（秒単位）
        const currentTime = (Math.floor(Date.now() / 1000 / 60) * 60) as Time;

        if (!lastBarRef.current || currentTime > lastBarRef.current.time) {
          // 新しい分に入った、または最初のデータの場合：新しい足を作る
          lastBarRef.current = {
            time: currentTime,
            open: price,
            high: price,
            low: price,
            close: price,
          };
        } else {
          // 同じ分の中での更新：高値・安値を判定して更新
          lastBarRef.current.high = Math.max(lastBarRef.current.high, price);
          lastBarRef.current.low = Math.min(lastBarRef.current.low, price);
          lastBarRef.current.close = price;
        }

        // グラフの最後の一本を更新（これで箱とヒゲが動く）
        candlestickSeries.update(lastBarRef.current);
      };
    }

    // --- 4. リサイズ処理とクリーンアップ ---
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket?.close();
      chart.remove();
    };
  }, [interval]);

  return (
    <div className="flex flex-col w-full p-4 bg-neutral-900/50 rounded-xl border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-bold text-neutral-200 tracking-wider">BTC / USDT</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setInterval('1d')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-all ${
              interval === '1d' 
              ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            1 Day
          </button>
          <button 
            onClick={() => setInterval('1m')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-all ${
              interval === '1m' 
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            1 Min Live
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[384px]" />
    </div>
  );
}
