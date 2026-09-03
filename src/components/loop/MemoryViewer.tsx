'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

// ============================================================
// Просмотрщик файловой памяти цикла (суть Луп-инженеринга из видео):
// память передаётся НЕ внутри диалога, а через файлы на диске.
// Каждый виток — чистый агент с нулевым контекстом,
// который загружает только последний сохранённый файл.
// ============================================================

interface MemoryFileMeta {
  name: string;
  size: number;
  mtime: number;
}

export default function MemoryViewer({ runId }: { runId: string | null }) {
  const [files, setFiles] = useState<MemoryFileMeta[]>([]);
  const [backend, setBackend] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(`/api/loop/memory?runId=${runId}`);
      const json = await res.json();
      if (json.ok) {
        setFiles(json.files || []);
        setBackend(json.backend || null);
        return json.files as MemoryFileMeta[];
      }
    } catch (e) {
      console.error('MemoryViewer refresh error:', e);
    }
    return [];
  }, [runId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  const openFile = async (name: string) => {
    setSelected(name);
    setLoading(true);
    try {
      const res = await fetch(`/api/loop/memory?runId=${runId}&file=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (json.ok) {
        setContent(typeof json.content === 'string' ? json.content : JSON.stringify(json.content, null, 2));
      } else {
        setContent(`Ошибка: ${json.error}`);
      }
    } catch (e) {
      setContent(`Ошибка загрузки: ${e}`);
    }
    setLoading(false);
  };

  if (!runId) {
    return (
      <div className="text-white/40 text-sm p-4 border border-dashed border-white/10 rounded-xl text-center">
        📁 Создайте цикл — и здесь появятся файлы памяти витков
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">📁 Память на диске (файлы, не диалог)</h4>
        <Button variant="ghost" size="sm" onClick={refresh} className="text-white/50 hover:text-white h-7 text-xs">
          ⟳ Обновить
        </Button>
      </div>

      {/* v6.0: бейдж активного хранилища */}
      {backend && (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${
            backend === 'vercel-blob'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {backend === 'vercel-blob' ? (
            <>
              🟢 <b>Vercel Blob</b> — персистентная: переживает деплои и рестарты
            </>
          ) : (
            <>
              🟠 <b>Локальная ФС</b> — на Vercel эфемерна; подключите Blob Store в дашборде Vercel
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {files.map((f) => (
          <button
            key={f.name}
            onClick={() => openFile(f.name)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
              selected === f.name
                ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
            title={`${f.name} · ${f.size} байт`}
          >
            {f.name === 'state.json' && '🧠 '}
            {f.name === 'run.json' && '🚀 '}
            {f.name === 'final.json' && '🏁 '}
            {f.name.startsWith('iteration') && '🔄 '}
            {f.name}
          </button>
        ))}
        {files.length === 0 && (
          <span className="text-white/40 text-xs py-2">Файлов пока нет — запустите первый виток</span>
        )}
      </div>

      {selected && (
        <div className="relative">
          <pre className="bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-green-200/90 overflow-auto max-h-72 whitespace-pre-wrap">
            {loading ? 'Загрузка…' : content}
          </pre>
          <div className="absolute top-2 right-2 text-[10px] text-white/30 bg-black/60 px-2 py-0.5 rounded">
            {runId}/{selected}
          </div>
        </div>
      )}

      <p className="text-[11px] text-white/40 leading-relaxed">
        🧠 <b className="text-white/60">state.json</b> — единственный файл, который читает следующий «чистый» агент:
        нулевой контекст диалога, только сохранённое состояние. Это экономит токены и предотвращает
        галлюцинации от переполненного контекста.
      </p>
    </div>
  );
}
