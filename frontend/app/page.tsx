'use client'; // Client Componentにする

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RealtimePrice from './components/RealtimePrice';
import ChartCard from './components/ChartCard';
import PriceChart from './components/PriceChart';
import PortfolioAllocation from './components/PortfolioAllocation';
import MarketStats from './components/MarketStats'; // 忘れずにインポート！

export default function Home() {
  // 親で共通のsymbolを管理する
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      <main className="flex-grow max-w-[1800px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 左カラム */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <RealtimePrice />
            <ChartCard title="Portfolio Allocation">
              <PortfolioAllocation />
            </ChartCard>
          </div>
          
          {/* 右カラム */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <ChartCard>
              {/* 3. すべての Props を渡す */}
              <PriceChart 
                symbol={symbol} 
                setSymbol={setSymbol} 
                interval={interval} 
                setInterval={setInterval} 
              />
            </ChartCard>
            
            <ChartCard title="Market Statistics" description={`${symbol} 24h Performance`}>
              <MarketStats symbol={symbol} />
            </ChartCard>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
