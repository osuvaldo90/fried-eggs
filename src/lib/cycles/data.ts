import { format, parse } from 'date-fns'
import { isNil } from 'lodash'

import { CycleLogEntry, LogEntryType, logEntryTypes } from './types'

export const serializeCycleLog = (history: CycleLogEntry[]) =>
  JSON.stringify(
    history.map((entry) => ({
      ...entry,
      date: format(entry.date, 'yyyy-MM-dd'),
    })),
  )

type OldJsonEntry = {
  id: string
  date: string
  notes?: string
}

type NewJsonEntry = {
  type: LogEntryType
  id: string
  date: string
  notes?: string
}

type JsonEntry = OldJsonEntry | NewJsonEntry

const isJsonEntry = (x: unknown): x is JsonEntry =>
  typeof x === 'object' &&
  !isNil(x) &&
  'id' in x &&
  typeof x.id === 'string' &&
  'date' in x &&
  typeof x.date === 'string' &&
  (!('type' in x) ||
    (typeof x.type === 'string' && !!logEntryTypes.find((type) => type === x.type)))

export const deserializeCycleLog = (data: string) => {
  if (!data) {
    return []
  }

  const parsed = JSON.parse(data)
  return validateAndConvertCycleLog(parsed)
}

// New function to validate and convert parsed cycle log objects
export const validateAndConvertCycleLog = (data: unknown): CycleLogEntry[] => {
  if (!Array.isArray(data)) {
    throw new Error('Cycle log must be an array')
  }

  return data.filter(isJsonEntry).map((entry) => ({
    ...entry,
    type: 'type' in entry ? entry.type : ('period' as const),
    date: parse(entry.date, 'yyyy-MM-dd', new Date()),
  }))
}
