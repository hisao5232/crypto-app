interface ChartCardProps {
  title: string;
  description: string;
  height?: string;
}

export default function ChartCard({ title, description, height = "h-80" }: ChartCardProps) {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-200">{title}</h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
        <div className="flex gap-2">
          {/* 期間切り替えボタン（見た目だけ） */}
          {['1D', '1W', '1M', 'ALL'].map(time => (
            <button key={time} className="px-3 py-1 text-xs rounded bg-neutral-800 border border-border text-neutral-400 hover:bg-neutral-700 hover:text-white transition">
              {time}
            </button>
          ))}
        </div>
      </div>
      
      {/* チャート描画エリア（プレースホルダー） */}
      <div className={`${height} w-full rounded-xl bg-neutral-900/50 border border-dashed border-border flex items-center justify-center`}>
        <div className="text-center text-neutral-700">
          {/* 修正後のSVG */}
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-sm font-medium">Chart Loading...</p>
          <p className="text-xs">Next step: Integrate Lightweight Charts</p>
        </div>
      </div>
    </div>
  );
}
