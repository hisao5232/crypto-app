import PriceCard from './components/PriceCard';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#121212]">
      <h1 className="mb-8 text-2xl font-light tracking-tighter text-neutral-300">
        CRYPTO <span className="font-bold text-white">DASHBOARD</span>
      </h1>
      
      <div className="grid gap-6">
        <PriceCard />
        {/* 今後、ここに CryptoChart コンポーネントを追加予定 */}
      </div>

      <p className="mt-8 text-xs text-neutral-600">
        Backend: FastAPI / Proxy: Traefik / Hosting: Cloudflare Pages
      </p>
    </main>
  );
}
