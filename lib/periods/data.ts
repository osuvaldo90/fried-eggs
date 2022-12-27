import { format, parse } from 'date-fns'
import _, { isNil } from 'lodash'

import { Period } from './types'

export const serializeHistory = (history: Period[]) =>
  JSON.stringify(
    history.map((period) => ({
      ...period,
      date: format(period.date, 'yyyy-MM-dd'),
    })),
  )

type JsonPeriod = {
  id: string
  date: string
}

const isJsonPeriod = (x: unknown): x is JsonPeriod =>
  typeof x === 'object' &&
  !isNil(x) &&
  'id' in x &&
  typeof x.id === 'string' &&
  'date' in x &&
  typeof x.date === 'string'

export const deserializeHistory = (data: string) => {
  if (!data) return []
  const parsed = JSON.parse(data)
  if (!Array.isArray(parsed)) {
    throw new Error('data is not an array')
  }

  return parsed.map((period) => {
    if (!isJsonPeriod(period)) {
      throw new Error('invalid history')
    }

    return {
      ...period,
      date: parse(period.date, 'yyyy-MM-dd', new Date()),
    }
  })
}
