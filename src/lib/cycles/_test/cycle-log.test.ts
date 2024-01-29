import { addDays, subDays } from 'date-fns'
import { nanoid } from 'nanoid'

import { withTestScheduler } from '../../_test/with-test-scheduler'
import { makeCycleLog } from '../cycle-log'

describe(makeCycleLog, () => {
  it(
    'should add cycle log entries and maintain chronological order',
    withTestScheduler(({ expectObservable, hot }) => {
      const entry1 = { type: 'period' as const, date: new Date(), id: nanoid() }
      const entry2 = { type: 'period' as const, date: subDays(new Date(), 1), id: nanoid() }
      const cycleLogAction$ = hot('-ab', {
        a: {
          type: 'add',
          payload: entry1,
        },
        b: {
          type: 'add',
          payload: entry2,
        },
      } as const)
      const cycleLog$ = makeCycleLog([], cycleLogAction$)

      expectObservable(cycleLog$).toBe('0 1 2', [[], [entry1], [entry2, entry1]])
    }),
  )

  it('should emit data from initialCycleLog', () => {
    withTestScheduler(({ expectObservable, hot }) => {
      const initialCycleLog = [
        { type: 'period' as const, date: subDays(new Date(), 1), id: nanoid() },
        { type: 'period' as const, date: new Date(), id: nanoid() },
      ]
      const entry = { type: 'period' as const, date: addDays(new Date(), 1), id: nanoid() }
      const cycleLogAction$ = hot('-a', {
        a: {
          type: 'add',
          payload: entry,
        },
      } as const)
      const cycleLog$ = makeCycleLog(initialCycleLog, cycleLogAction$)

      expectObservable(cycleLog$).toBe('0 1', [initialCycleLog, [...initialCycleLog, entry]])
    })
  })

  it(
    'should delete cycle log entries',
    withTestScheduler(({ expectObservable, hot }) => {
      const entry1 = { type: 'period', date: new Date(), id: nanoid() } as const
      const entry2 = { type: 'period', date: subDays(new Date(), 1), id: nanoid() } as const
      const cycleLogAction$ = hot('-abc', {
        a: {
          type: 'add',
          payload: entry1,
        },
        b: {
          type: 'add',
          payload: entry2,
        },
        c: {
          type: 'delete',
          payload: entry1.id,
        },
      } as const)
      const cycleLog$ = makeCycleLog([], cycleLogAction$)

      expectObservable(cycleLog$).toBe('0 1 2 3', [[], [entry1], [entry2, entry1], [entry2]])
    }),
  )

  it(
    'should overwrite cycle log entries',
    withTestScheduler(({ expectObservable, hot }) => {
      const entry1 = { type: 'period', date: new Date(), id: nanoid() } as const
      const entry2 = { type: 'period', date: subDays(new Date(), 1), id: nanoid() } as const
      const cycleLogAction$ = hot('-a', {
        a: {
          type: 'overwrite',
          payload: [entry1, entry2],
        },
      } as const)
      const cycleLog$ = makeCycleLog([], cycleLogAction$)

      expectObservable(cycleLog$).toBe('0 1', [[], [entry1, entry2]])
    }),
  )
})
