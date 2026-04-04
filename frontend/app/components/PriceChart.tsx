'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, Time, CandlestickData } from 'lightweight-charts';

// 対応する銘柄の定義
const SYMBOLS = [
  { id: 'BTCUSDT', label: 'BTC', color: 'bg-[#F7931A]' },
  { id: 'ETHUSDT', label: 'ETH', color: 'bg-[#627EEA]' },
  { id: 'SOLUSDT', label: 'SOL', color: 'bg-[#14F195]' },
];

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');
  const [symbol, setSymbol] = useState('BTCUSDT'); // 選択中の銘柄
  
  const lastBarRef = useRef<CandlestickData<Time> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#a3a3a3' },
      grid: { vertLines: { color: '#262626' }, horzLines: { color: '#262626' } },
      width: chartContainerRef.current.clientWidth,
      height: 384,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        borderColor: '#333',
        shiftVisibleRangeOnNewBar: true,
        rightOffset: 15,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    lastBarRef.current = null;

    const fetchData = async () => {
      const limit = interval === '1d' ? 365 : 300;
      // symbolを動的に埋め込み
      const url = `https://crypto-api.go-pro-world.net/api/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&t=${Date.now()}`;
      
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          candlestickSeries.setData(data);
          if (interval === '1m') chart.timeScale().fitContent();
          const lastData = data[data.length - 1];
          lastBarRef.current = { ...lastData };
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      }
    };

    fetchData();

    let socket: WebSocket | null = null;
    if (interval === '1m') {
      // WebSocketのURLにsymbolパラメータを渡す（バックエンドが対応している前提）
      socket = new WebSocket(`wss://crypto-api.go-pro-world.net/ws/crypto?symbol=${symbol}`);
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
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket?.close();
      chart.remove();
    };
  }, [interval, symbol]); // symbolが変わった時も再実行

  return (
    <div className="flex flex-col w-full p-6 bg-neutral-900/60 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
        
        {/* 左側：銘柄選択とステータス */}
        <div className="flex items-center gap-4">
          <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
            {SYMBOLS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSymbol(s.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  symbol === s.id ? 'bg-neutral-700 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${interval === '1m' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <h3 className="text-lg font-bold text-neutral-100 tracking-tight">
                {SYMBOLS.find(s => s.id === symbol)?.label} / USDT
              </h3>
            </div>
          </div>
        </div>

        {/* 右側：時間軸選択 */}
        <div className="flex gap-3 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setInterval('1d')}
            className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 ${
              interval === '1d' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500'
            }`}
          >
            Past 1 Year (1D)
          </button>
          <button 
            onClick={() => setInterval('1m')}
            className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 ${
              interval === '1m' ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-500'
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
