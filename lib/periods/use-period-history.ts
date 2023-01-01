import { sortBy } from 'lodash'
import { Reducer, useEffect, useReducer } from 'react'

import { deserializeHistory, serializeHistory } from './data'
import { Period } from './types'

export type PeriodHistoryAction =
  | {
      type: 'load'
    }
  | {
      type: 'add-period'
      period: Period
    }
  | {
      type: 'delete-period'
      id: string
    }
  | {
      type: 'import'
      data: string
    }

export const usePeriodHistory = () => {
  const [periodHistory, updatePeriodHistory] = useReducer<
    Reducer<Period[], PeriodHistoryAction>,
    undefined
  >(
    (current, action) => {
      if (action.type === 'load') {
        try {
          const item = window.localStorage.getItem('periods')
          if (item === null) return []
          return deserializeHistory(item)
        } catch (error) {
          console.error(error)
          return []
        }
      }

      if (action.type === 'add-period') {
        const newPeriodHistory = sortBy([...current, action.period], (period) => period.date)
        window.localStorage.setItem('periods', serializeHistory(newPeriodHistory))
        return newPeriodHistory
      }

      if (action.type === 'delete-period') {
        const newPeriodHistory = current.filter((period) => period.id !== action.id)
        window.localStorage.setItem('periods', serializeHistory(newPeriodHistory))
        return newPeriodHistory
      }

      if (action.type === 'import') {
        const deserialized = sortBy(deserializeHistory(action.data), (period) => period.date)
        window.localStorage.setItem('periods', serializeHistory(deserialized))
        return deserialized
      }

      return []
    },
    undefined,
    () => [],
  )

  useEffect(() => {
    updatePeriodHistory({ type: 'load' })
  }, [])

  const getRawData = () => window.localStorage.getItem('periods')

  return [periodHistory, updatePeriodHistory, getRawData] as const
}
