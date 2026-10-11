import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function store(apiFetch: (...args: unknown[]) => Promise<unknown>) {
  const compiled = ts.transpileModule(readFileSync(new URL('../src/features/practice/store/practice-store.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const module = { exports: {} as { usePracticeStore: { getState: () => Record<string, Function>; setState: (value: unknown) => void } } }
  new Function('require', 'module', 'exports', compiled)((id: string) => id === '@/lib/api-client' ? { apiFetch, ApiError: class extends Error {} } : require(id), module, module.exports)
  return module.exports.usePracticeStore
}

test('failed round ending, ending practice and deleting cannot report success', async () => {
  const state = store(async () => { throw new Error('offline') }).getState()
  for (const operation of ['endRound', 'endPractice', 'deletePractice']) {
    assert.ok((await state[operation]('id')).error)
  }
})
test('created practice returns persisted id for reading navigation', async () => {
  const state = store(async () => ({ id: 'created-id' })).getState()
  const result = await state.createPractice({ title: 'try', assumption: 'do', periodDays: 7, topicId: null })
  assert.equal(result.error, null)
  assert.equal(result.practiceId, 'created-id')
})
test('late detail response cannot overwrite a newer opened practice', async () => {
  let finishOld: (value: unknown) => void = () => {}
  const old = new Promise((resolve) => { finishOld = resolve })
  const instance = store(async (url) => String(url).endsWith('/old') ? old : { practice: { id: 'new' }, rounds: [] })
  const first = instance.getState().loadDetail('old')
  await instance.getState().loadDetail('new')
  finishOld({ practice: { id: 'old' }, rounds: [] })
  await first
  assert.equal((instance.getState().detailPractice as unknown as { id: string }).id, 'new')
})
