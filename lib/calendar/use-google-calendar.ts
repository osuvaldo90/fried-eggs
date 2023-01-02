import { format } from 'date-fns'
import { isNil } from 'lodash'
import { Reducer, useCallback, useEffect, useReducer } from 'react'

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
      periodId: string
      eventId: string
    }
  | {
      type: 'new-next-period-event'
      periodId: string
      eventId: string
    }
  | {
      type: 'delete-period-events'
      periodId: string
    }

export type PeriodEventsParams = {
  periodId: string
  dangerZone?: {
    start: Date
    end: Date
  }
  nextPeriodStart?: Date
}

export type CreateFriedEggsCalendar = (
  client: typeof gapi.client,
  periodEventsParams?: PeriodEventsParams,
) => Promise<void>

export type CreatePeriodEvents = (
  client: typeof gapi.client,
  calendarId: string,
  periodEventsParams: PeriodEventsParams,
) => Promise<void>

export type DeletePeriodEvents = (
  client: typeof gapi.client,
  params: { periodId: string },
) => Promise<void>

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

  if (typeof current !== 'object') throw new Error('calendar data not ready')

  if (action.type === 'new-danger-zone-event') {
    const newCalendarData: CalendarData = {
      ...current,
      dangerZoneEvents: [
        ...current.dangerZoneEvents,
        { periodId: action.periodId, eventId: action.eventId },
      ],
    }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  if (action.type === 'new-next-period-event') {
    const newCalendarData: CalendarData = {
      ...current,
      nextPeriodEvents: [
        ...(current.nextPeriodEvents ?? []),
        { periodId: action.periodId, eventId: action.eventId },
      ],
    }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  if (action.type === 'delete-period-events') {
    const newCalendarData: CalendarData = {
      ...current,
      dangerZoneEvents: current.dangerZoneEvents.filter(
        (event) => event.periodId !== action.periodId,
      ),
      nextPeriodEvents: current.nextPeriodEvents?.filter(
        (event) => event.periodId !== action.periodId,
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
  createPeriodEvents: CreatePeriodEvents
  deletePeriodEvents: DeletePeriodEvents
} => {
  const [calendarData, updateCalendarData] = useReducer<
    Reducer<CalendarDataReducerState, CalendarDataAction>
  >(calendarDataReducer, 'loading')

  const createPeriodEvents = useCallback(
    async (
      gapiClient: typeof gapi.client,
      calendarId: string,
      { periodId, dangerZone, nextPeriodStart }: PeriodEventsParams,
    ) => {
      if (dangerZone) {
        const dangerZoneEventRequest = {
          calendarId,
          resource: {
            summary: '🚨🍳🚨',
            start: {
              date: format(dangerZone.start, 'yyyy-MM-dd'),
            },
            end: {
              date: format(dangerZone.end, 'yyyy-MM-dd'),
            },
          },
        }
        const dangerZoneEventResponse = await gapiClient.calendar.events.insert(
          dangerZoneEventRequest,
        )
        updateCalendarData({
          type: 'new-danger-zone-event',
          periodId,
          eventId: dangerZoneEventResponse.result.id as string,
        })
      }

      if (nextPeriodStart) {
        const nextPeriodEventRequest = {
          calendarId,
          resource: {
            summary: '🩸🍳🩸',
            start: {
              date: format(nextPeriodStart, 'yyyy-MM-dd'),
            },
            end: {
              date: format(nextPeriodStart, 'yyyy-MM-dd'),
            },
          },
        }
        const nextPeriodEventResponse = await gapiClient.calendar.events.insert(
          nextPeriodEventRequest,
        )

        updateCalendarData({
          type: 'new-next-period-event',
          periodId,
          eventId: nextPeriodEventResponse.result.id as string,
        })
      }
    },
    [],
  )

  const deletePeriodEvents = useCallback(
    async (gapiClient: typeof gapi.client, { periodId }: { periodId: string }) => {
      if (typeof calendarData !== 'object') return

      const dangerZoneEventId = calendarData.dangerZoneEvents.find(
        (e) => e.periodId === periodId,
      )?.eventId
      if (dangerZoneEventId) {
        // @ts-expect-error
        await gapiClient.calendar.events.delete({
          calendarId: calendarData.calendarId,
          eventId: dangerZoneEventId,
        })
      }

      const nextPeriodEventId = calendarData.nextPeriodEvents?.find(
        (e) => e.periodId === periodId,
      )?.eventId
      if (nextPeriodEventId) {
        // @ts-expect-error
        await gapiClient.calendar.events.delete({
          calendarId: calendarData.calendarId,
          eventId: nextPeriodEventId,
        })
      }

      updateCalendarData({ type: 'delete-period-events', periodId })
    },
    [calendarData],
  )

  const createFriedEggsCalendar = useCallback(
    async (gapiClient: typeof gapi.client, periodEventsParams: PeriodEventsParams | undefined) => {
      const createCalendarResponse = await gapiClient.calendar.calendars.insert({
        summary: 'Fried Eggs',
      })
      const calendarId = createCalendarResponse.result.id
      updateCalendarData({ type: 'new-calendar', calendarId })

      if (periodEventsParams) {
        await createPeriodEvents(gapiClient, calendarId, periodEventsParams)
      }
    },
    [createPeriodEvents],
  )

  useEffect(() => {
    updateCalendarData({ type: 'load' })
  }, [])

  return {
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    deletePeriodEvents,
  }
}
