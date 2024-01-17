import { format } from 'date-fns'
import { isNil } from 'lodash'
import { Reducer, useCallback, useEffect, useReducer } from 'react'

import { LogEntryType } from '../cycles/types'
import { isNotNil } from '../util'

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
      periodId?: string
      eventId: string
      ovulationId?: string
    }
  | {
      type: 'new-next-period-event'
      periodId: string
      eventId: string
    }
  | {
      type: 'update-danger-zone-event'
      eventId: string
      ovulationId?: string
      periodId?: string
    }
  | {
      type: 'delete-events'
      eventIds: string[]
    }

export type CreateFriedEggsCalendarParams = {
  periodEventsParams?: NewPeriodEventsParams
  ovulationEventParams?: NewOvulationEventParams
}

export type NewPeriodEventsParams = {
  periodId: string
  dangerZone?: {
    start: Date
    end: Date
  }
  nextPeriodStart?: Date
}

export type NewOvulationEventParams = {
  ovulationLogEntryId: string
  periodLogEntryId?: string
  dangerZone: {
    start: Date
    end: Date
  }
}

export type CreateFriedEggsCalendar = (
  client: typeof gapi.client,
  params: CreateFriedEggsCalendarParams,
) => Promise<void>

export type CreatePeriodEvents = (
  client: typeof gapi.client,
  calendarId: string,
  periodEventsParams: NewPeriodEventsParams,
) => Promise<void>

export type DeleteLogEntryEvents = (
  client: typeof gapi.client,
  params: { logEntryId: string; logEntryType: LogEntryType },
) => Promise<void>

export type UpdateDangerZoneEvent = (
  client: typeof gapi.client,
  params: NewOvulationEventParams,
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
        { periodId: action.periodId, eventId: action.eventId, ovulationId: action.ovulationId },
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

  if (action.type === 'delete-events') {
    const newCalendarData: CalendarData = {
      ...current,
      dangerZoneEvents: current.dangerZoneEvents.filter(
        (event) => !action.eventIds.includes(event.eventId),
      ),
      nextPeriodEvents: current.nextPeriodEvents?.filter(
        (event) => !action.eventIds.includes(event.eventId),
      ),
    }
    window.localStorage.setItem('calendarData', serializeCalendarData(newCalendarData))
    return newCalendarData
  }

  if (action.type === 'update-danger-zone-event') {
    const newCalendarData: CalendarData = {
      ...current,
      dangerZoneEvents: current.dangerZoneEvents.map((event) => {
        if (event.eventId === action.eventId) {
          return {
            ...event,
            ovulationId: action.ovulationId ?? event.ovulationId,
            periodId: action.periodId ?? event.periodId,
          }
        }
        return event
      }),
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
  deleteLogEntryEvents: DeleteLogEntryEvents
  updateDangerZoneEvent: UpdateDangerZoneEvent
} => {
  const [calendarData, updateCalendarData] = useReducer<
    Reducer<CalendarDataReducerState, CalendarDataAction>
  >(calendarDataReducer, 'loading')

  const createDangerZoneEvent = useCallback(
    async (
      gapiClient: typeof gapi.client,
      calendarId: string,
      {
        periodLogEntryId,
        ovulationLogEntryId,
        dangerZone,
      }: {
        periodLogEntryId?: string
        ovulationLogEntryId?: string
        dangerZone: { start: Date; end: Date }
      },
    ) => {
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
      const event = await gapiClient.calendar.events.insert(dangerZoneEventRequest)

      updateCalendarData({
        type: 'new-danger-zone-event',
        periodId: periodLogEntryId,
        ovulationId: ovulationLogEntryId,
        eventId: event.result.id as string,
      })

      return event
    },
    [],
  )

  const createPeriodEvents = useCallback(
    async (
      gapiClient: typeof gapi.client,
      calendarId: string,
      { periodId, dangerZone, nextPeriodStart }: NewPeriodEventsParams,
    ) => {
      if (dangerZone) {
        await createDangerZoneEvent(gapiClient, calendarId, {
          dangerZone,
          periodLogEntryId: periodId,
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
        const nextPeriodEventResponse =
          await gapiClient.calendar.events.insert(nextPeriodEventRequest)

        updateCalendarData({
          type: 'new-next-period-event',
          periodId,
          eventId: nextPeriodEventResponse.result.id as string,
        })
      }
    },
    [createDangerZoneEvent],
  )

  const deleteLogEntryEvents = useCallback(
    async (
      gapiClient: typeof gapi.client,
      { logEntryId, logEntryType }: { logEntryId: string; logEntryType: LogEntryType },
    ) => {
      if (typeof calendarData !== 'object') return

      const dangerZoneEventId = calendarData.dangerZoneEvents.find((e) => {
        if (logEntryType === 'period') {
          return e.periodId === logEntryId && e.ovulationId === undefined
        }
        return e.ovulationId === logEntryId
      })?.eventId

      if (dangerZoneEventId) {
        // @ts-expect-error
        await gapiClient.calendar.events.delete({
          calendarId: calendarData.calendarId,
          eventId: dangerZoneEventId,
        })
      }

      const nextPeriodEventId = calendarData.nextPeriodEvents?.find(
        (e) => logEntryType === 'period' && e.periodId === logEntryId,
      )?.eventId

      if (nextPeriodEventId) {
        // @ts-expect-error
        await gapiClient.calendar.events.delete({
          calendarId: calendarData.calendarId,
          eventId: nextPeriodEventId,
        })
      }

      updateCalendarData({
        type: 'delete-events',
        eventIds: [dangerZoneEventId, nextPeriodEventId].filter(isNotNil),
      })
    },
    [calendarData],
  )

  const createFriedEggsCalendar = useCallback(
    async (
      gapiClient: typeof gapi.client,
      { periodEventsParams, ovulationEventParams }: CreateFriedEggsCalendarParams,
    ) => {
      const createCalendarResponse = await gapiClient.calendar.calendars.insert({
        summary: 'Fried Eggs',
      })
      const calendarId = createCalendarResponse.result.id
      updateCalendarData({ type: 'new-calendar', calendarId })

      if (periodEventsParams) {
        await createPeriodEvents(gapiClient, calendarId, periodEventsParams)
      }

      if (ovulationEventParams) {
        await createDangerZoneEvent(gapiClient, calendarId, {
          periodLogEntryId: ovulationEventParams.periodLogEntryId,
          ovulationLogEntryId: ovulationEventParams.ovulationLogEntryId,
          dangerZone: ovulationEventParams.dangerZone,
        })
      }
    },
    [createPeriodEvents, createDangerZoneEvent],
  )

  const updateDangerZoneEvent = useCallback(
    async (
      gapiClient: typeof gapi.client,
      { periodLogEntryId, ovulationLogEntryId, dangerZone }: NewOvulationEventParams,
    ) => {
      if (typeof calendarData !== 'object') return

      console.log('searching for danger zone event id')
      const dangerZoneEventId = calendarData.dangerZoneEvents.find(
        (event) => event.periodId === periodLogEntryId,
      )?.eventId
      console.log('found', dangerZoneEventId)

      if (dangerZoneEventId) {
        const eventResponse = await gapiClient.calendar.events.get({
          calendarId: calendarData.calendarId,
          eventId: dangerZoneEventId,
        })
        const event = eventResponse.result
        await gapiClient.calendar.events.update({
          calendarId: calendarData.calendarId,
          eventId: dangerZoneEventId,
          resource: {
            ...event,
            start: {
              date: format(dangerZone.start, 'yyyy-MM-dd'),
            },
            end: {
              date: format(dangerZone.end, 'yyyy-MM-dd'),
            },
          },
        })
        updateCalendarData({
          type: 'update-danger-zone-event',
          eventId: dangerZoneEventId,
          ovulationId: ovulationLogEntryId,
        })
      } else {
        await createDangerZoneEvent(gapiClient, calendarData.calendarId, {
          periodLogEntryId,
          ovulationLogEntryId: ovulationLogEntryId,
          dangerZone,
        })
      }
    },
    [calendarData, createDangerZoneEvent],
  )

  useEffect(() => {
    updateCalendarData({ type: 'load' })
  }, [])

  return {
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    deleteLogEntryEvents,
    updateDangerZoneEvent,
  }
}
