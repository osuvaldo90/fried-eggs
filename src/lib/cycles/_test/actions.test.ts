import { addDays } from 'date-fns'
import { nanoid } from 'nanoid'

import { withTestScheduler } from '../../_test/with-test-scheduler'
import { makeCycleLogActions } from '../actions'

describe(makeCycleLogActions, () => {
  it(
    'should emit actions in a single observable',
    withTestScheduler(({ expectObservable, hot }) => {
      const entry1 = { type: 'period' as const, date: new Date(), id: nanoid() }
      const entry2 = { type: 'ovulation' as const, date: addDays(new Date(), 1), id: nanoid() }

      const actions = makeCycleLogActions()

      hot('abc', {
        a: () => actions.addCycleLogEntry(entry1),
        b: () => actions.deleteCycleLogEntry(entry1.id),
        c: () => actions.overwriteCycleLog([entry2]),
      }).subscribe((fn) => fn())

      expectObservable(actions.cycleLogAction$).toBe('0 1 2', [
        { type: 'add', payload: entry1 },
        { type: 'delete', payload: entry1.id },
        { type: 'overwrite', payload: [entry2] },
      ])
    }),
  )
})
