import { CalendarData } from './types'

export const deserializeCalendarData = (data: string) => {
  try {
    return JSON.parse(data) as CalendarData
  } catch (error) {
    console.error(error)
    return undefined
  }
}

export const serializeCalendarData = (data: CalendarData) => JSON.stringify(data)
