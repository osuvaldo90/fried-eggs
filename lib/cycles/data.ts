import { format, parse } from 'date-fns'
import { isNil } from 'lodash'

import { CycleLogEntry } from './types'

export const serializeCycleLog = (history: CycleLogEntry[]) =>
  JSON.stringify(
    history.map((entry) => ({
      ...entry,
      date: format(entry.date, 'yyyy-MM-dd'),
    })),
  )

type JsonEntry = {
  id: string
  date: string
  notes?: string
}

const isJsonEntry = (x: unknown): x is JsonEntry =>
  typeof x === 'object' &&
  !isNil(x) &&
  'id' in x &&
  typeof x.id === 'string' &&
  'date' in x &&
  typeof x.date === 'string'

export const deserializeCycleLog = (data: string) => {
  if (!data) {
    return []
  }

  const parsed = JSON.parse(data)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter(isJsonEntry).map((entry) => ({
    ...entry,
    date: parse(entry.date, 'yyyy-MM-dd', new Date()),
  }))
}
