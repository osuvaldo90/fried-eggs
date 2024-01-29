import { sortBy } from 'lodash'
import { concat, of, scan } from 'rxjs'

import { assertUnreachable } from '../util'

import { CycleLogAction$ } from './actions'
import { CycleLogEntry } from './types'

export const makeCycleLog = (
  initialCycleLog: readonly CycleLogEntry[],
  cycleLogAction$: CycleLogAction$,
) =>
  concat(
    of(initialCycleLog),
    cycleLogAction$.pipe(
      scan((cycleLog, { type, payload }) => {
        if (type === 'add') {
          return sortBy([...cycleLog, payload], (entry) => entry.date)
        }

        if (type === 'delete') {
          return cycleLog.filter((entry) => entry.id !== payload)
        }

        if (type === 'overwrite') {
          return payload
        }

        return assertUnreachable(type)
      }, initialCycleLog),
    ),
  )
