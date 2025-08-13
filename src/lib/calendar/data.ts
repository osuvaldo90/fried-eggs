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

// Validation function for calendar data objects
const isCalendarEventArray = (events: unknown): events is Array<{ eventId: string; periodId: string }> => {
  if (!Array.isArray(events)) return false
  return events.every(
    (event) =>
      typeof event === 'object' &&
      event !== null &&
      'eventId' in event &&
      typeof event.eventId === 'string' &&
      'periodId' in event &&
      typeof event.periodId === 'string'
  )
}

const isDangerZoneEventArray = (events: unknown): events is Array<{ eventId: string; periodId?: string; ovulationId?: string }> => {
  if (!Array.isArray(events)) return false
  return events.every(
    (event) =>
      typeof event === 'object' &&
      event !== null &&
      'eventId' in event &&
      typeof event.eventId === 'string' &&
      (!('periodId' in event) || typeof event.periodId === 'string') &&
      (!('ovulationId' in event) || typeof event.ovulationId === 'string')
  )
}

export const validateCalendarData = (data: unknown): CalendarData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Calendar data must be an object')
  }

  const obj = data as Record<string, unknown>

  if (!('calendarId' in obj) || typeof obj.calendarId !== 'string') {
    throw new Error('Calendar data must have a calendarId string')
  }

  if (!('dangerZoneEvents' in obj) || !isDangerZoneEventArray(obj.dangerZoneEvents)) {
    throw new Error('Calendar data must have valid dangerZoneEvents array')
  }

  const calendarData: CalendarData = {
    calendarId: obj.calendarId,
    dangerZoneEvents: obj.dangerZoneEvents,
  }

  // Optional fields
  if ('nextPeriodEvents' in obj) {
    if (!isCalendarEventArray(obj.nextPeriodEvents)) {
      throw new Error('nextPeriodEvents must be a valid array')
    }
    calendarData.nextPeriodEvents = obj.nextPeriodEvents
  }

  if ('pmsEvents' in obj) {
    if (!isCalendarEventArray(obj.pmsEvents)) {
      throw new Error('pmsEvents must be a valid array')
    }
    calendarData.pmsEvents = obj.pmsEvents
  }

  return calendarData
}
