import { createContext, ReactNode, useContext, Dispatch, useCallback } from 'react'

import { useGoogleAccessToken } from './calendar/use-google-access-token'
import { useGapiClient } from './calendar/use-google-api'
import {
  CalendarDataReducerState,
  CreateFriedEggsCalendarParams,
  NewPeriodEventsParams,
  useGoogleCalendar,
} from './calendar/use-google-calendar'
import { CycleLogEntry, LogEntryType } from './cycles/types'
import { CycleLogAction, useCycleLog } from './cycles/use-cycle-log'

type AppContext = {
  cycleLog: CycleLogEntry[]
  updateCycleLog: Dispatch<CycleLogAction>
  getAccessToken: () => Promise<string>
  calendarData: CalendarDataReducerState
  createFriedEggsCalendar: (params: CreateFriedEggsCalendarParams) => Promise<void>
  createPeriodEvents: (periodEventsParams: NewPeriodEventsParams) => Promise<void>
  deleteLogEntryEvents: (logEntryId: string, logEntryType: LogEntryType) => Promise<void>
  updateDangerZoneEvent: ({
    periodLogEntryId,
    ovulationLogEntryId,
    dangerZone,
  }: {
    periodLogEntryId?: string
    ovulationLogEntryId: string
    dangerZone: { start: Date; end: Date }
  }) => Promise<void>
}

const AppContext = createContext<AppContext>({
  cycleLog: [],
  updateCycleLog: () => {},
  getAccessToken: async () => '',
  calendarData: 'loading',
  createFriedEggsCalendar: async () => {},
  createPeriodEvents: async () => {},
  deleteLogEntryEvents: async () => {},
  updateDangerZoneEvent: async () => {},
})

export const useAppContext = () => useContext(AppContext)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cycleLog, updateCycleLog] = useCycleLog()
  const { getAccessToken } = useGoogleAccessToken()
  const gapiClient = useGapiClient()
  const {
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    deleteLogEntryEvents,
    updateDangerZoneEvent,
  } = useGoogleCalendar()

  const createFriedEggsCalendarWrapper = useCallback(
    async (createFriedEggsCalendarParams: CreateFriedEggsCalendarParams) => {
      if (!gapiClient) return
      await getAccessToken()
      await createFriedEggsCalendar(gapiClient, createFriedEggsCalendarParams)
    },
    [gapiClient, getAccessToken, createFriedEggsCalendar],
  )

  const createPeriodEventsWrapper = useCallback(
    async (periodEventsParams: NewPeriodEventsParams) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await createPeriodEvents(gapiClient, calendarData.calendarId, periodEventsParams)
    },
    [gapiClient, calendarData, getAccessToken, createPeriodEvents],
  )

  const deleteLogEntryEventsWrapper = useCallback(
    async (logEntryId: string, logEntryType: LogEntryType) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await deleteLogEntryEvents(gapiClient, { logEntryId, logEntryType })
    },
    [gapiClient, calendarData, getAccessToken, deleteLogEntryEvents],
  )

  const updateDangerZoneEventWrapper = useCallback(
    async ({
      periodLogEntryId,
      ovulationLogEntryId,
      dangerZone,
    }: {
      periodLogEntryId?: string
      ovulationLogEntryId: string
      dangerZone: { start: Date; end: Date }
    }) => {
      if (!gapiClient) return
      if (typeof calendarData !== 'object') return
      await getAccessToken()
      await updateDangerZoneEvent(gapiClient, {
        dangerZone,
        periodLogEntryId,
        ovulationLogEntryId,
      })
    },
    [gapiClient, calendarData, getAccessToken, updateDangerZoneEvent],
  )

  return (
    <AppContext.Provider
      value={{
        cycleLog,
        updateCycleLog,
        getAccessToken,
        calendarData,
        createFriedEggsCalendar: createFriedEggsCalendarWrapper,
        createPeriodEvents: createPeriodEventsWrapper,
        deleteLogEntryEvents: deleteLogEntryEventsWrapper,
        updateDangerZoneEvent: updateDangerZoneEventWrapper,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
