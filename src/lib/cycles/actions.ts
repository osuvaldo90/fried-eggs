import { Subject, map, merge } from 'rxjs'

import { CycleLogEntry } from './types'

export const makeCycleLogActions = () => {
  const addCycleLogEntry$ = new Subject<CycleLogEntry>()
  const deleteCycleLogEntry$ = new Subject<CycleLogEntry['id']>()
  const overwriteCycleLog$ = new Subject<readonly CycleLogEntry[]>()

  const cycleLogAction$ = merge(
    addCycleLogEntry$.pipe(map((payload) => ({ type: 'add' as const, payload }))),
    deleteCycleLogEntry$.pipe(map((payload) => ({ type: 'delete' as const, payload }))),
    overwriteCycleLog$.pipe(map((payload) => ({ type: 'overwrite' as const, payload }))),
  )

  return {
    addCycleLogEntry: addCycleLogEntry$.next.bind(addCycleLogEntry$),
    deleteCycleLogEntry: deleteCycleLogEntry$.next.bind(deleteCycleLogEntry$),
    overwriteCycleLog: overwriteCycleLog$.next.bind(overwriteCycleLog$),
    cycleLogAction$,
  }
}

export type CycleLogAction$ = ReturnType<typeof makeCycleLogActions>['cycleLogAction$']
