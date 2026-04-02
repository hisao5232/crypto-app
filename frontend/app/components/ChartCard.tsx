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
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1s0 01-1 1H5a1s0 01-1-1V4z" /></svg>
          <p className="text-sm font-medium">Chart Loading...</p>
          <p className="text-xs">Next step: Integrate Lightweight Charts</p>
        </div>
      </div>
    </div>
  );
}
