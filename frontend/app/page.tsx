import Header from './components/Header';
import Footer from './components/Footer';
import RealtimePrice from './components/RealtimePrice';
import ChartCard from './components/ChartCard';
import PriceChart from './components/PriceChart';
import PortfolioAllocation from './components/PortfolioAllocation';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-grow max-w-[1800px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 左側：価格と概要 */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <RealtimePrice />
            
            <ChartCard title="Portfolio Allocation" description="Current Asset Distribution">
              <PortfolioAllocation />
            </ChartCard>
          </div>
          
          {/* 右側：チャートエリア */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* 修正ポイント：titleとdescriptionを空、または削除して、PriceChart内部の表示を活かす */}
            <ChartCard>
              <PriceChart />
            </ChartCard>
            
            {/* 下段のカード（今後用） */}
            <ChartCard 
              title="Market Statistics" 
              description="Historical analysis and volume trends" 
              height="h-60"
            />
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
