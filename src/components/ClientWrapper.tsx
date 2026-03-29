'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Глобальный обработчик ошибок
    const handleError = (event: ErrorEvent) => {
      console.error('[ClientWrapper] Uncaught error:', event.error);
      setError(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 max-w-2xl">
          <h1 className="text-red-400 text-xl font-bold mb-4">⚠️ Ошибка загрузки</h1>
          <p className="text-white/70 mb-4">{error.message}</p>
          <details className="text-white/50 text-xs">
            <summary className="cursor-pointer mb-2">Детали ошибки</summary>
            <pre className="bg-black/30 p-2 rounded overflow-auto max-h-60">
              {error.stack}
            </pre>
          </details>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded"
            >
              🔄 Перезагрузить
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              🗑️ Очистить и перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Загрузка ФОРТОРИУМ...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
