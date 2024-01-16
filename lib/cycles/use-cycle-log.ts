import { sortBy } from 'lodash'
import { Reducer, useEffect, useReducer } from 'react'

import { deserializeCycleLog, serializeCycleLog } from './data'
import { CycleLogEntry, Period } from './types'

export type CycleLogAction =
  | {
      type: 'load'
    }
  | {
      type: 'add-period'
      period: Period
    }
  | {
      type: 'delete-event'
      id: string
    }
  | {
      type: 'import'
      data: string
    }

export const useCycleLog = () => {
  const [cycleLog, updateCycleLog] = useReducer<
    Reducer<CycleLogEntry[], CycleLogAction>,
    undefined
  >(
    (current, action) => {
      if (action.type === 'load') {
        try {
          const oldItem = window.localStorage.getItem('periods')
          if (oldItem !== null) {
            const deserialized = deserializeCycleLog(oldItem)
            const upgraded = deserialized.map((entry) => ({
              ...entry,
              type: 'period' as const,
            }))
            window.localStorage.setItem('cycleLog', serializeCycleLog(upgraded))
            window.localStorage.removeItem('periods')
            return upgraded
          }

          const item = window.localStorage.getItem('cycleLog')
          if (item === null) return []
          return deserializeCycleLog(item)
        } catch (error) {
          console.error(error)
          return []
        }
      }

      if (action.type === 'add-period') {
        const newCycleLog = sortBy([...current, action.period], (entry) => entry.date)
        window.localStorage.setItem('cycleLog', serializeCycleLog(newCycleLog))
        return newCycleLog
      }

      if (action.type === 'delete-event') {
        const newCycleLog = current.filter((entry) => entry.id !== action.id)
        window.localStorage.setItem('cycleLog', serializeCycleLog(newCycleLog))
        return newCycleLog
      }

      if (action.type === 'import') {
        const deserialized = sortBy(deserializeCycleLog(action.data), (entry) => entry.date)
        window.localStorage.setItem('cycleLog', serializeCycleLog(deserialized))
        return deserialized
      }

      return []
    },
    undefined,
    () => [],
  )

  useEffect(() => {
    updateCycleLog({ type: 'load' })
  }, [])

  const getRawData = () => window.localStorage.getItem('periods')

  return [cycleLog, updateCycleLog, getRawData] as const
}
