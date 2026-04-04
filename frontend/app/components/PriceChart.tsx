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
        shiftVisibleRangeOnNewBar: true, // 新しい足が追加されたら自動スクロール
        rightOffset: 12, // 右端に余白を作って最新の足を見やすくする
      },
      // マウス操作の感度設定
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    // インターバル切り替え時にRefをリセット
    lastBarRef.current = null;

    // --- 2. 過去データの取得 ---
    const fetchData = async () => {
      // 1dなら365日分、1mなら300分分を取得
      const limit = interval === '1d' ? 365 : 300;
      const url = `https://crypto-api.go-pro-world.net/api/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}&t=${Date.now()}`;
      
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          candlestickSeries.setData(data);
          
          // 1分足（Live）の時は全体を表示、日足の時は直近が見やすいように調整
          if (interval === '1m') {
            chart.timeScale().fitContent();
          }
          
          // 過去データの最後の一本を初期値として保持
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
            open: price,
            high: price,
            low: price,
            close: price,
          };
        } else {
          lastBarRef.current.high = Math.max(lastBarRef.current.high, price);
          lastBarRef.current.low = Math.min(lastBarRef.current.low, price);
          lastBarRef.current.close = price;
        }

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
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${interval === '1m' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <h3 className="text-sm font-bold text-neutral-200 tracking-wider">BTC / USDT</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setInterval('1d')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-all ${
              interval === '1d' 
              ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            Past 1 Year (1D)
          </button>
          <button 
            onClick={() => setInterval('1m')}
            className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-all ${
              interval === '1m' 
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
              : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            Live (1M)
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[384px]" />
    </div>
  );
}
