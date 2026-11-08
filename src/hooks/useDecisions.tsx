import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Decision, DecisionDraft } from '../types/decision'
import { clearDecisions, loadDecisions, saveDecisions } from '../lib/storage'
import { createId } from '../lib/id'
import { mergeById } from '../lib/import'

interface DecisionsContextValue {
  decisions: Decision[]
  /** 读取本地数据时的提示（损坏 / 版本兼容等） */
  storageError: string | null
  /** 最近一次写入是否成功 */
  lastWriteOk: boolean
  addDecision: (draft: DecisionDraft) => Decision
  updateDecision: (id: string, patch: Partial<Decision>) => void
  removeDecision: (id: string) => void
  replaceAll: (next: Decision[]) => void
  mergeAll: (incoming: Decision[]) => number
  clearAll: () => void
}

const DecisionsContext = createContext<DecisionsContextValue | null>(null)

interface State {
  decisions: Decision[]
  storageError: string | null
  lastWriteOk: boolean
}

export function DecisionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    const { decisions, error } = loadDecisions()
    return { decisions, storageError: error ?? null, lastWriteOk: true }
  })

  const commit = useCallback((next: Decision[]) => {
    const ok = saveDecisions(next)
    setState((prev) => ({ ...prev, decisions: next, lastWriteOk: ok }))
  }, [])

  const addDecision = useCallback(
    (draft: DecisionDraft): Decision => {
      const decision: Decision = {
        ...draft,
        id: createId(),
        decidedAt: new Date().toISOString(),
        status: 'open',
      }
      // 先同步落盘，再返回给调用方播放封存动画
      commit([...state.decisions, decision])
      return decision
    },
    [commit, state.decisions],
  )

  const updateDecision = useCallback(
    (id: string, patch: Partial<Decision>) => {
      commit(state.decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    },
    [commit, state.decisions],
  )

  const removeDecision = useCallback(
    (id: string) => commit(state.decisions.filter((d) => d.id !== id)),
    [commit, state.decisions],
  )

  const replaceAll = useCallback((next: Decision[]) => commit(next), [commit])

  const mergeAll = useCallback(
    (incoming: Decision[]): number => {
      const { result, added } = mergeById(state.decisions, incoming)
      commit(result)
      return added
    },
    [commit, state.decisions],
  )

  const clearAll = useCallback(() => {
    clearDecisions()
    setState({ decisions: [], storageError: null, lastWriteOk: true })
  }, [])

  const value = useMemo<DecisionsContextValue>(
    () => ({
      decisions: state.decisions,
      storageError: state.storageError,
      lastWriteOk: state.lastWriteOk,
      addDecision,
      updateDecision,
      removeDecision,
      replaceAll,
      mergeAll,
      clearAll,
    }),
    [state, addDecision, updateDecision, removeDecision, replaceAll, mergeAll, clearAll],
  )

  return <DecisionsContext.Provider value={value}>{children}</DecisionsContext.Provider>
}

export function useDecisions(): DecisionsContextValue {
  const ctx = useContext(DecisionsContext)
  if (!ctx) throw new Error('useDecisions 必须在 DecisionsProvider 内使用')
  return ctx
}
