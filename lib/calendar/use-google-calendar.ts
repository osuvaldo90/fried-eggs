import { addDays, format } from 'date-fns'
import { isNil } from 'lodash'
import { Reducer, useCallback, useEffect, useReducer } from 'react'

import { Period } from '../periods/types'

import { deserializeCalendarData, serializeCalendarData } from './data'
import { CalendarData } from './types'

export type CalendarDataReducerState = CalendarData | 'uninitialized' | 'loading'

type CalendarDataAction =
  | { type: 'load' }
  | {
      type: 'new-calendar'
      calendarId: string
    }
  | {
      type: 'new-danger-zone-event'
      dangerZoneEvent: {
        periodId: string
        eventId: string
      }
    }
  | { type: 'delete-danger-zone-event'; eventId: string }

export type CreateFriedEggsCalendar = (
  client: typeof gapi.client,
  lastPeriod?: Period,
) => Promise<void>

export type CreateDangerZoneEvent = (
  client: typeof gapi.client,
  calendarId: string,
  period: Period,
) => Promise<void>

export type DeleteDangerZoneEvent = (client: typeof gapi.client, eventId: string) => Promise<void>

const calendarDataReducer = (current: CalendarDataReducerState, action: CalendarDataAction) => {
  if (action.type === 'load') {
    const serializedCalendarData = window.localStorage.getItem('calendarData')
    if (isNil(serializedCalendarData)) return 'uninitialized'
    return deserializeCalendarData(serializedCalendarData) ?? 'uninitialized'
  }

  if (action.type === 'new-calendar') {
    const newCalendarData = { calendarId: action.calendarId, dangerZoneEvents: [] }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  if (action.type === 'new-danger-zone-event' && typeof current === 'object') {
    const newCalendarData = {
      ...current,
      dangerZoneEvents: [...current.dangerZoneEvents, action.dangerZoneEvent],
    }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  if (action.type === 'delete-danger-zone-event' && typeof current === 'object') {
    const newCalendarData = {
      ...current,
      dangerZoneEvents: current.dangerZoneEvents.filter(
        (event) => event.eventId !== action.eventId,
      ),
    }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  throw new Error(`unknown action or bad state`)
}

export const useGoogleCalendar = (): {
  calendarData: CalendarDataReducerState
  createFriedEggsCalendar: CreateFriedEggsCalendar
  createDangerZoneEvent: CreateDangerZoneEvent
  deleteDangerZoneEvent: DeleteDangerZoneEvent
} => {
  const [calendarData, updateCalendarData] = useReducer<
    Reducer<CalendarDataReducerState, CalendarDataAction>
  >(calendarDataReducer, 'loading')

  const createDangerZoneEvent = useCallback(
    async (gapiClient: typeof gapi.client, calendarId: string, period: Period) => {
      const request = {
        calendarId,
        resource: {
          summary: '🚨🍳🚨',
          start: {
            date: format(addDays(period.date, 7), 'yyyy-MM-dd'),
          },
          end: {
            date: format(addDays(period.date, 14), 'yyyy-MM-dd'),
          },
        },
      }
      const createDangerZoneEventResponse = await gapiClient.calendar.events.insert(request)

      updateCalendarData({
        type: 'new-danger-zone-event',
        dangerZoneEvent: {
          eventId: createDangerZoneEventResponse.result.id as string,
          periodId: period.id,
        },
      })
    },
    [],
  )

  const deleteDangerZoneEvent = useCallback(
    async (gapiClient: typeof gapi.client, eventId: string) => {
      if (typeof calendarData !== 'object') return
      // @ts-expect-error
      await gapiClient.calendar.events.delete({ calendarId: calendarData.calendarId, eventId })
      updateCalendarData({ type: 'delete-danger-zone-event', eventId })
    },
    [calendarData],
  )

  const createFriedEggsCalendar = useCallback(
    async (gapiClient: typeof gapi.client, lastPeriod: Period | undefined) => {
      const createCalendarResponse = await gapiClient.calendar.calendars.insert({
        summary: 'Fried Eggs',
      })
      const calendarId = createCalendarResponse.result.id
      updateCalendarData({ type: 'new-calendar', calendarId })

      if (lastPeriod) {
        await createDangerZoneEvent(gapiClient, calendarId, lastPeriod)
      }
    },
    [createDangerZoneEvent],
  )

  useEffect(() => {
    updateCalendarData({ type: 'load' })
  }, [])

  return { calendarData, createFriedEggsCalendar, createDangerZoneEvent, deleteDangerZoneEvent }
}
