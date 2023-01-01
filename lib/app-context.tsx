import { createContext, ReactNode, useContext, Dispatch, useCallback } from 'react'

import { useGoogleAccessToken } from './calendar/use-google-access-token'
import { useGapiClient } from './calendar/use-google-api'
import { CalendarDataReducerState, useGoogleCalendar } from './calendar/use-google-calendar'
import { Period } from './periods/types'
import { PeriodHistoryAction, usePeriodHistory } from './periods/use-period-history'

type AppContext = {
  periodHistory: Period[]
  updatePeriodHistory: Dispatch<PeriodHistoryAction>
  getAccessToken: () => Promise<string>
  calendarData: CalendarDataReducerState
  createFriedEggsCalendar: (lastPeriod?: Period) => Promise<void>
  createDangerZoneEvent: (period: Period) => Promise<void>
  deleteDangerZoneEvent: (period: Period) => Promise<void>
}

const AppContext = createContext<AppContext>({
  periodHistory: [],
  updatePeriodHistory: () => {},
  getAccessToken: async () => '',
  calendarData: 'loading',
  createFriedEggsCalendar: async () => {},
  createDangerZoneEvent: async () => {},
  deleteDangerZoneEvent: async () => {},
})

export const useAppContext = () => useContext(AppContext)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [periodHistory, updatePeriodHistory] = usePeriodHistory()
  const { getAccessToken } = useGoogleAccessToken()
  const gapiClient = useGapiClient()
  const { calendarData, createFriedEggsCalendar, createDangerZoneEvent, deleteDangerZoneEvent } =
    useGoogleCalendar()

  const createFriedEggsCalendarWrapper = useCallback(
    async (lastPeriod?: Period) => {
      if (!gapiClient) return
      await getAccessToken()
      await createFriedEggsCalendar(gapiClient, lastPeriod)
    },
    [gapiClient, getAccessToken, createFriedEggsCalendar],
  )

  const createDangerZoneEventWrapper = useCallback(
    async (period: Period) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await createDangerZoneEvent(gapiClient, calendarData.calendarId, period)
    },
    [gapiClient, calendarData, getAccessToken, createDangerZoneEvent],
  )

  const deleteDangerZoneEventWrapper = useCallback(
    async (period: Period) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      const eventId = calendarData.dangerZoneEvents.find(
        ({ periodId }) => periodId === period.id,
      )?.eventId
      if (!eventId) return
      await deleteDangerZoneEvent(gapiClient, eventId)
    },
    [gapiClient, calendarData, getAccessToken, deleteDangerZoneEvent],
  )

  return (
    <AppContext.Provider
      value={{
        periodHistory,
        updatePeriodHistory,
        getAccessToken,
        calendarData,
        createFriedEggsCalendar: createFriedEggsCalendarWrapper,
        createDangerZoneEvent: createDangerZoneEventWrapper,
        deleteDangerZoneEvent: deleteDangerZoneEventWrapper,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
