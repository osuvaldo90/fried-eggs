import { format, parse } from 'date-fns'
import { sortBy, update } from 'lodash'
import { Reducer, useEffect, useReducer } from 'react'
import * as uuid from 'uuid'

import { Period } from './types'

type Action =
  | {
      type: 'load'
    }
  | {
      type: 'add-period'
      period: Period
    }

export type PushPeriod = (newPeriod: Omit<Period, 'id'>) => void

export const usePeriodHistory = (): readonly [Period[], PushPeriod] => {
  const [periodHistory, updatePeriodHistory] = useReducer<Reducer<Period[], Action>, undefined>(
    (current, action) => {
      if (action.type === 'load') {
        try {
          const item = window.localStorage.getItem('periods')
          return (item ? JSON.parse(item) : []).map((period: { date: string }) => ({
            ...period,
            date: parse(period.date, 'yyyy-MM-dd', new Date()),
          }))
        } catch (error) {
          console.log(error)
          return []
        }
      }

      if (action.type === 'add-period') {
        const newPeriodHistory = sortBy([...current, action.period], (period) => period.date)

        window.localStorage.setItem(
          'periods',
          JSON.stringify(
            newPeriodHistory.map((period) => ({
              ...period,
              date: format(period.date, 'yyyy-MM-dd'),
            })),
          ),
        )

        return newPeriodHistory
      }

      return []
    },
    undefined,
    () => [],
  )

  useEffect(() => {
    updatePeriodHistory({ type: 'load' })
  }, [])

  return [
    periodHistory,
    (newPeriod: Omit<Period, 'id'>) =>
      updatePeriodHistory({
        type: 'add-period',
        period: { ...newPeriod, id: uuid.v4() },
      }),
  ] as const
}
