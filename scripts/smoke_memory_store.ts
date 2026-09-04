// ============================================================
// Смоук-тест хранилища памяти (src/lib/loop/memory-store.ts)
// Запуск: bun scripts/smoke_memory_store.ts
//
// Проверяет на фоллбэке local-fs (без BLOB_READ_WRITE_TOKEN):
//   1. sanitizeRunId — path traversal отклоняется
//   2. initRun → run.json
//   3. запись/чтение/перезапись файлов памяти (state.json дважды — как в лупе)
//   4. listMemoryFiles — сортировка и состав
//   5. чтение отсутствующего файла → null
//   6. deleteMemoryFile / deleteRun
//   7. resilience: с фиктивным токеном put/get падают в фоллбэк,
//      данные остаются читаемыми (fallback: true)
// Реальный приватный Blob-путь верифицируется на проде после подключения
// стора (prod_smoke).
// ============================================================

import {
  sanitizeRunId,
  memoryBackend,
  initRun,
  writeMemoryFile,
  readMemoryFile,
  listMemoryFiles,
  deleteMemoryFile,
  deleteRun,
} from '../src/lib/loop/memory-store';

let failures = 0;
const ok = (cond: boolean, label: string) => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${label}`);
  if (!cond) failures++;
};

const throwsFor = (id: string): boolean => {
  try {
    sanitizeRunId(id);
    return false;
  } catch {
    return true;
  }
};

const RUN = 'smoke-ms-1';
const TASK = { title: 'Смоук memory-store', goal: 'проверить ФС-фоллбэк' };

// --- 1. sanitizeRunId ---
console.log('\n[1] sanitizeRunId');
ok(throwsFor('../../etc'), 'path traversal "../.." отклонён');
ok(throwsFor('run/../secret'), 'path traversal "run/../secret" отклонён');
ok(throwsFor(''), 'пустой runId отклонён');
ok(throwsFor('A'.repeat(101)), 'runId длиной 101 отклонён');
ok(sanitizeRunId('loop-01_a') === 'loop-01_a', 'валидный runId проходит');

// --- 2-3. Базовый цикл на ФС ---
console.log('\n[2] initRun + запись/перезапись (backend должен быть local-fs)');
process.env.BLOB_READ_WRITE_TOKEN = ''; // гарантируем фоллбэк
ok(memoryBackend() === 'local-fs', `memoryBackend() === local-fs (${memoryBackend()})`);

await initRun(RUN, TASK);
const runJson = await readMemoryFile<Record<string, unknown>>(RUN, 'run.json');
ok(!!runJson && runJson['runId'] === RUN, 'run.json прочитан, runId совпадает');

await writeMemoryFile(RUN, 'state.json', { step: 1, note: 'первый виток' });
await writeMemoryFile(RUN, 'iteration-1.json', { score: 7 });
await writeMemoryFile(RUN, 'state.json', { step: 2, note: 'второй виток' }); // перезапись — ключевой сценарий лупа
const state = await readMemoryFile<{ step: number }>(RUN, 'state.json');
ok(state?.step === 2, 'перезапись state.json прошла (второе значение читается)');

// --- 4. listMemoryFiles ---
console.log('\n[3] список файлов');
const files = await listMemoryFiles(RUN);
const names = files.map((f) => f.name);
ok(names.includes('run.json') && names.includes('state.json') && names.includes('iteration-1.json'), `состав списка верен: [${names.join(', ')}]`);
ok(names.indexOf('run.json') < names.indexOf('state.json'), 'run.json сортируется первым');

// --- 5. отсутствующий файл ---
console.log('\n[4] отсутствующий файл');
ok((await readMemoryFile(RUN, 'no-such-file.json')) === null, 'чтение отсутствующего → null');

// --- 6. удаление ---
console.log('\n[5] удаление');
await deleteMemoryFile(RUN, 'state.json');
ok(!(await listMemoryFiles(RUN)).some((f) => f.name === 'state.json'), 'deleteMemoryFile удалил state.json');
await deleteRun(RUN);
ok((await listMemoryFiles(RUN)).length === 0, 'deleteRun очистил run целиком');

// --- 7. resilience с фиктивным токеном ---
console.log('\n[6] фиктивный токен → graceful фоллбэк');
process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_fake_token_for_smoke';
ok(memoryBackend() === 'vercel-blob', 'memoryBackend() видит токен');
const wr = await writeMemoryFile(RUN, 'state.json', { step: 3, note: 'через фоллбэк' });
ok(wr.fallback === true, `запись упала в фоллбэк (fallback=${wr.fallback})`);
const rb = await readMemoryFile<{ step: number }>(RUN, 'state.json');
ok(rb?.step === 3, 'чтение после фоллбэк-записи работает');
await deleteRun(RUN);
process.env.BLOB_READ_WRITE_TOKEN = '';

console.log(`\n${failures === 0 ? '✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ' : `❌ ПРОВАЛОВ: ${failures}`}`);
process.exit(failures === 0 ? 0 : 1);
