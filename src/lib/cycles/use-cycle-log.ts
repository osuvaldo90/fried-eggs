import { useEffect, useState } from 'react'

import { makeCycleLogActions } from './actions'
import { makeCycleLog } from './cycle-log'
import { loadCycleLog, saveCycleLog } from './data'
import { CycleLogEntry } from './types'

export const useCycleLog = () => {
  const [cycleLog, setCycleLog] = useState<readonly CycleLogEntry[]>([])
  const [{ addCycleLogEntry, deleteCycleLogEntry, overwriteCycleLog, cycleLogAction$ }] = useState(
    () => makeCycleLogActions(),
  )
  const [cycleLog$] = useState(() => makeCycleLog(loadCycleLog(), cycleLogAction$))

  useEffect(() => {
    const subscription = cycleLog$.subscribe((nextCycleLog) => {
      setCycleLog(nextCycleLog)
      saveCycleLog(nextCycleLog)
    })
    return () => subscription.unsubscribe()
  }, [cycleLog$])

  return { cycleLog, addCycleLogEntry, deleteCycleLogEntry, overwriteCycleLog }
}
