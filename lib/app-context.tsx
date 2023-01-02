import { createContext, ReactNode, useContext, Dispatch, useCallback } from 'react'

import { useGoogleAccessToken } from './calendar/use-google-access-token'
import { useGapiClient } from './calendar/use-google-api'
import {
  CalendarDataReducerState,
  PeriodEventsParams,
  useGoogleCalendar,
} from './calendar/use-google-calendar'
import { Period } from './periods/types'
import { PeriodHistoryAction, usePeriodHistory } from './periods/use-period-history'

type AppContext = {
  periodHistory: Period[]
  updatePeriodHistory: Dispatch<PeriodHistoryAction>
  getAccessToken: () => Promise<string>
  calendarData: CalendarDataReducerState
  createFriedEggsCalendar: (periodEventsParams?: PeriodEventsParams) => Promise<void>
  createPeriodEvents: (periodEventsParams: PeriodEventsParams) => Promise<void>
  deletePeriodEvents: (periodId: string) => Promise<void>
}

const AppContext = createContext<AppContext>({
  periodHistory: [],
  updatePeriodHistory: () => {},
  getAccessToken: async () => '',
  calendarData: 'loading',
  createFriedEggsCalendar: async () => {},
  createPeriodEvents: async () => {},
  deletePeriodEvents: async () => {},
})

export const useAppContext = () => useContext(AppContext)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [periodHistory, updatePeriodHistory] = usePeriodHistory()
  const { getAccessToken } = useGoogleAccessToken()
  const gapiClient = useGapiClient()
  const { calendarData, createFriedEggsCalendar, createPeriodEvents, deletePeriodEvents } =
    useGoogleCalendar()

  const createFriedEggsCalendarWrapper = useCallback(
    async (periodEventsParams?: PeriodEventsParams) => {
      if (!gapiClient) return
      await getAccessToken()
      await createFriedEggsCalendar(gapiClient, periodEventsParams)
    },
    [gapiClient, getAccessToken, createFriedEggsCalendar],
  )

  const createPeriodEventsWrapper = useCallback(
    async (periodEventsParams: PeriodEventsParams) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await createPeriodEvents(gapiClient, calendarData.calendarId, periodEventsParams)
    },
    [gapiClient, calendarData, getAccessToken, createPeriodEvents],
  )

  const deletePeriodEventsWrapper = useCallback(
    async (periodId: string) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await deletePeriodEvents(gapiClient, { periodId })
    },
    [gapiClient, calendarData, getAccessToken, deletePeriodEvents],
  )

  return (
    <AppContext.Provider
      value={{
        periodHistory,
        updatePeriodHistory,
        getAccessToken,
        calendarData,
        createFriedEggsCalendar: createFriedEggsCalendarWrapper,
        createPeriodEvents: createPeriodEventsWrapper,
        deletePeriodEvents: deletePeriodEventsWrapper,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
