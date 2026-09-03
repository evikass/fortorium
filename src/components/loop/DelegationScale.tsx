'use client';

// ============================================================
// Шкала делегирования (итоговый вывод видео, 00:31:56)
// Человек — "Дирижёр оркестра": чем выше уровень,
// тем больше отдано машинам и тем важнее контроль.
// ============================================================

const LEVELS = [
  {
    n: 1,
    name: 'Промт',
    icon: '✍️',
    given: 'Написание текста, перевод, подбор синонимов.',
    human: 'Структура, факты, логика.',
    current: false,
  },
  {
    n: 2,
    name: 'Контекст',
    icon: '📚',
    given: 'Поиск информации по базе, рерайт документов.',
    human: 'Выбор источников, формулировка ТЗ.',
    current: false,
  },
  {
    n: 3,
    name: 'Харнес',
    icon: '🧰',
    given: 'Вызов функций, рутинные действия (парсинг, простые расчёты).',
    human: 'Проектирование архитектуры связей «инструмент-задача».',
    current: false,
  },
  {
    n: 4,
    name: 'Луп',
    icon: '♾️',
    given: 'Самостоятельное решение многошаговых проблем, самокоррекция ошибок.',
    human: 'Установка границ цикла, контроль финальной точки выхода, безопасность.',
    current: true,
  },
  {
    n: 5,
    name: 'Граф (будущее)',
    icon: '🕸️',
    given: 'Маршрутизация задач по ветвящимся графам специализированных агентов.',
    human: 'Проектирование самого графа: узлы, рёбра, условия ветвления.',
    current: false,
  },
];

export default function DelegationScale() {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-white font-semibold mb-1">Шкала делегирования</h4>
        <p className="text-white/50 text-sm mb-3">
          Мы движемся не к замене человека, а к тому, чтобы человек становился «Дирижёром оркестра».
          Чем выше уровень — тем больше отведено машинам и тем важнее проектировать правила остановки
          и следить за тремя долгами.
        </p>
      </div>
      {LEVELS.map((lvl) => (
        <div
          key={lvl.n}
          className={`rounded-xl p-3 border transition ${
            lvl.current
              ? 'border-green-500/60 bg-green-500/10 ring-1 ring-green-500/40'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              lvl.current ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70'
            }`}>
              {lvl.n}
            </div>
            <div className="text-white font-medium text-sm">{lvl.icon} {lvl.name}</div>
            {lvl.current && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/30 text-green-300 border border-green-500/40">
                вы здесь
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex gap-2">
              <span className="text-blue-300 flex-shrink-0">🤖</span>
              <span className="text-white/60">{lvl.given}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-amber-300 flex-shrink-0">👤</span>
              <span className="text-white/60">{lvl.human}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
