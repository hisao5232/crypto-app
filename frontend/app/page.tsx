'use client';

import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import RealtimePrice from './components/RealtimePrice';
import ChartCard from './components/ChartCard';
import PriceChart from './components/PriceChart';
import PortfolioAllocation from './components/PortfolioAllocation';
import MarketStats from './components/MarketStats'; 
import NewsFeed from './components/NewsFeed';

export default function Home() {
  // 選択されているメインの銘柄
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState<'1d' | '1m'>('1d');

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans">
      <Header />
      
      <main className="flex-grow max-w-[1800px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 左カラム：市場監視とポートフォリオ */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            {/* リアルタイム価格カード群 */}
            <RealtimePrice />
            
            <ChartCard title="Portfolio Allocation">
              <PortfolioAllocation />
            </ChartCard>
          </div>
          
          {/* 右カラム：メインチャート、統計、ニュース */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <ChartCard>
              <PriceChart 
                symbol={symbol} 
                setSymbol={setSymbol} 
                interval={interval} 
                setInterval={setInterval} 
              />
            </ChartCard>
            
            {/* 統計とニュースのグリッド */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Market Statistics" description={`${symbol} 24h Performance`}>
                <MarketStats symbol={symbol} />
              </ChartCard>

              <ChartCard title="Latest News" description={`${symbol} Related News`}>
                <NewsFeed symbol={symbol} />
              </ChartCard>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
