export const entryTypes = ['period', 'ovulation'] as const

export type CycleLogEntry = {
  type: typeof entryTypes[number]
  id: string
  date: Date
  notes?: string
}

export type Period = CycleLogEntry & { type: 'period' }
export const isPeriod = (entry: CycleLogEntry): entry is Period => entry.type === 'period'

export type Ovulation = CycleLogEntry & { type: 'ovulation' }
export const isOvulation = (entry: CycleLogEntry): entry is Ovulation => entry.type === 'ovulation'
