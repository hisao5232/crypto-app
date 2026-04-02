import Header from './components/Header';
import Footer from './components/Footer';
import RealtimePrice from './components/RealtimePrice';
import ChartCard from './components/ChartCard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow max-w-[1800px] w-full mx-auto px-6 py-8">
        {/* ダッシュボードグリッド */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 左側：価格と概要 (1カラム) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <RealtimePrice />
            
            {/* おすすめグラフ：ポートフォリオ配分（プレースホルダー） */}
            <div className="p-6 bg-card border border-border rounded-2xl shadow-xl">
              <h3 className="text-sm font-medium text-neutral-500 mb-4 tracking-widest uppercase">Portfolio Allocation</h3>
              <div className="h-40 rounded-full border-4 border-dashed border-border flex items-center justify-center text-neutral-700">
                Donut Chart
              </div>
            </div>
          </div>
          
          {/* 右側：チャートエリア (2カラム) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* 今日のローソク足 */}
            <ChartCard 
              title="BTCUSDT - 1m Interval" 
              description="Today's Realtime Candlestick Chart" 
              height="h-96"
            />
            
            {/* 今週のチャート（折れ線グラフなどを想定） */}
            <ChartCard 
              title="Weekly Performance" 
              description="Bitcoin Price Trend (Last 7 Days)" 
              height="h-60"
            />
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
