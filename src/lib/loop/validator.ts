// ============================================================
// ФОРТОРИУМ v5.0 — Гибридный валидатор цикла (условие №3 из видео)
// Барьер 1: скрипт-проверки — детерминированные, мгновенные, бесплатные
// Барьер 2: LLM-критик (отдельный агент) — оценка качества 0-10
// Цикл не имеет права отдать результат наружу без прохождения барьеров.
// ============================================================

import { ArtifactType, ScriptCheck, ARTIFACT_INSTRUCTIONS } from './types';

// Минимальные/максимальные размеры текста по типу артефакта (символы)
const SIZE_LIMITS: Record<ArtifactType, { min: number; max: number }> = {
  logline: { min: 60, max: 600 },
  scene: { min: 150, max: 1500 },
  synopsis: { min: 250, max: 2500 },
};

// Детерминированные скрипт-проверки черновика
export function runScriptChecks(
  draft: string,
  artifactType: ArtifactType,
  previousDraft: string | null
): ScriptCheck[] {
  const checks: ScriptCheck[] = [];
  const limits = SIZE_LIMITS[artifactType];
  const text = (draft || '').trim();

  // 1. Непустой результат
  checks.push({
    name: 'Непустой результат',
    passed: text.length > 0,
    message: text.length > 0 ? 'Черновик содержит текст' : 'Исполнитель вернул пустой результат',
  });

  // 2. Соблюдение размерных лимитов
  const sizeOk = text.length >= limits.min && text.length <= limits.max;
  checks.push({
    name: 'Размерные лимиты',
    passed: sizeOk,
    message: sizeOk
      ? `Объём ${text.length} симв. в норме (${limits.min}-${limits.max})`
      : `Объём ${text.length} симв. вне диапазона ${limits.min}-${limits.max}`,
  });

  // 3. Структура соответствует типу артефакта
  const structureOk = checkStructure(text, artifactType);
  checks.push({
    name: 'Структура артефакта',
    passed: structureOk,
    message: structureOk
      ? 'Структура соответствует типу «' + artifactType + '»'
      : 'Не хватает структурных элементов для типа «' + artifactType + '»: ' + ARTIFACT_INSTRUCTIONS[artifactType],
  });

  // 4. Виток должен менять черновик (иначе цикл крутится впустую)
  const changed = !previousDraft || normalize(previousDraft) !== normalize(text);
  checks.push({
    name: 'Прогресс витка',
    passed: changed,
    message: changed
      ? 'Черновик изменён относительно предыдущего витка'
      : 'Деградация: черновик не изменился — цикл зациклился',
  });

  // 5. Отсутствие служебного мусора от модели
  const noLeaks = !/(как (ии|ai)[, ]|языковая модель|я не могу|assistant:|system:)/i.test(text);
  checks.push({
    name: 'Чистота вывода',
    passed: noLeaks,
    message: noLeaks ? 'Нет служебных артефактов модели' : 'В тексте просочились служебные фразы модели',
  });

  return checks;
}

function checkStructure(text: string, artifactType: ArtifactType): boolean {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  switch (artifactType) {
    case 'logline':
      return sentences.length >= 1 && sentences.length <= 6 && text.length >= 60;
    case 'scene':
      return sentences.length >= 3 && /\n/.test(text) === true || sentences.length >= 4;
    case 'synopsis':
      return sentences.length >= 5;
    default:
      return sentences.length >= 1;
  }
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Сколько проверок провалено
export function countFailed(checks: ScriptCheck[]): number {
  return checks.filter(c => !c.passed).length;
}

// Все ли проверки пройдены
export function allPassed(checks: ScriptCheck[]): boolean {
  return checks.every(c => c.passed);
}
