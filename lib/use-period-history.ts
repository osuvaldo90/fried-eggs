import { format, parse } from 'date-fns'
import { sortBy } from 'lodash'
import { Reducer, useReducer } from 'react'
import * as uuid from 'uuid'

import { Period } from './types'

export const usePeriodHistory = () => {
  const [periodHistory, pushPeriod] = useReducer<Reducer<Period[], Period>, undefined>(
    (current, newPeriod) => {
      const newPeriodHistory = sortBy([...(current ?? []), newPeriod], (period) => period.date)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'periods',
          JSON.stringify(
            newPeriodHistory.map((period) => ({
              ...period,
              date: format(period.date, 'yyyy-MM-dd'),
            })),
          ),
        )
      }
      return newPeriodHistory
    },
    undefined,
    () => {
      if (typeof window === 'undefined') {
        return []
      }

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
    },
  )

  return [
    periodHistory,
    (newPeriod: Omit<Period, 'id'>) => pushPeriod({ ...newPeriod, id: uuid.v4() }),
  ] as const
}
