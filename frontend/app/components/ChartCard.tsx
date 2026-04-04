'use client';

import React from 'react';

interface ChartCardProps {
  title?: string;        // ? を付けてオプショナル（必須ではない）にする
  description?: string;  // ? を付けてオプショナルにする
  height?: string;
  children?: React.ReactNode;
}

export default function ChartCard({ 
  title, 
  description, 
  height = "h-auto", // PriceChartを入れる場合は中身に合わせるため auto 推奨
  children 
}: ChartCardProps) {
  return (
    <div className="p-6 bg-neutral-900/40 border border-white/5 rounded-2xl shadow-xl flex flex-col backdrop-blur-sm">
      
      {/* 1. title または description がある場合のみヘッダーを表示 */}
      {(title || description) && (
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            {title && (
              <h3 className="text-lg font-bold tracking-tight text-neutral-200">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-neutral-500 font-medium">
                {description}
              </p>
            )}
          </div>
          
          {/* 古い 1D, 1W ボタンはここからは削除しました（PriceChart側にあるため） */}
        </div>
      )}
      
      {/* 2. チャート表示エリア */}
      <div className={`${height} w-full rounded-xl overflow-hidden relative`}>
        {children ? (
          /* PriceChart などの中身がある場合 */
          children
        ) : (
          /* 中身が空の場合のプレースホルダー */
          <div className="flex items-center justify-center h-64 bg-black/20 border border-dashed border-neutral-800 rounded-xl">
            <div className="text-center text-neutral-700">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-tighter opacity-30">Data Pending</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
