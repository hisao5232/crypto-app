'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, Time, CandlestickData } from 'lightweight-charts';

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');
  
  // 現在更新中のローソク足を保持するためのRef（再レンダリングさせずに値を保持）
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
        shiftVisibleRangeOnNewBar: true, // 新しい足が追加されたら自動スクロール
        rightOffset: 15, // 右端に余白を作って最新の足を見やすくする
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    lastBarRef.current = null;

    // --- 2. 過去データの取得 ---
    const fetchData = async () => {
      const limit = interval === '1d' ? 365 : 300;
      const url = `https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}&t=${Date.now()}`;
      
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          candlestickSeries.setData(data);
          
          if (interval === '1m') {
            chart.timeScale().fitContent();
          }
          
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
        const currentTime = (Math.floor(Date.now() / 1000 / 60) * 60) as Time;

        if (!lastBarRef.current || currentTime > lastBarRef.current.time) {
          lastBarRef.current = {
            time: currentTime,
            open: price, high: price, low: price, close: price,
          };
        } else {
          lastBarRef.current.high = Math.max(lastBarRef.current.high, price);
          lastBarRef.current.low = Math.min(lastBarRef.current.low, price);
          lastBarRef.current.close = price;
        }

        candlestickSeries.update(lastBarRef.current);
      };
    }

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
    <div className="flex flex-col w-full p-6 bg-neutral-900/60 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          {/* 状態インジケーター */}
          <div className={`w-2.5 h-2.5 rounded-full ${interval === '1m' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <div>
            <h3 className="text-lg font-bold text-neutral-100 tracking-tight">BTC / USDT</h3>
            <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
              {interval === '1m' ? 'Realtime Market' : 'Historical Data'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setInterval('1d')}
            className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 ${
              interval === '1d' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
              : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Past 1 Year (1D)
          </button>
          <button 
            onClick={() => setInterval('1m')}
            className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 ${
              interval === '1m' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
              : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Live (1M)
          </button>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
}
