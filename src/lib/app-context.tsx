'use client'

import { createContext, ReactNode, useContext, Dispatch, useCallback } from 'react'

import { validateCalendarData } from './calendar/data'
import { CalendarData } from './calendar/types'
import { useGoogleAccessToken } from './calendar/use-google-access-token'
import { useGapiClient } from './calendar/use-google-api'
import {
  CalendarDataReducerState,
  CreateFriedEggsCalendarParams,
  NewPeriodEventsParams,
  useGoogleCalendar,
} from './calendar/use-google-calendar'
import { validateAndConvertCycleLog } from './cycles/data'
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
  exportData: () => void
  importData: (file: File) => Promise<void>
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
  exportData: () => {},
  importData: async () => {},
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
    importCalendarData,
  } = useGoogleCalendar()

  const exportData = useCallback(() => {
    const cycleLogData = window.localStorage.getItem('cycleLog')
    const calendarDataItem = window.localStorage.getItem('calendarData')

    // Parse the data from localStorage to get actual objects
    let parsedCycleLog = []
    if (cycleLogData) {
      try {
        parsedCycleLog = JSON.parse(cycleLogData)
      } catch (error) {
        console.error('Failed to parse cycle log data:', error)
      }
    }

    let parsedCalendarData = null
    if (calendarDataItem) {
      try {
        parsedCalendarData = JSON.parse(calendarDataItem)
      } catch (error) {
        console.error('Failed to parse calendar data:', error)
      }
    }

    const exportObject = {
      cycleLog: parsedCycleLog,
      calendarData: parsedCalendarData,
    }

    const dataStr = JSON.stringify(exportObject, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `fried-eggs-backup-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [])

  const importData = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const importedData = JSON.parse(text)

        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid file format')
        }

        if (!('cycleLog' in importedData) || !('calendarData' in importedData)) {
          throw new Error('Missing required data fields')
        }

        // Validate cycle log data
        const importedCycleLog = validateAndConvertCycleLog(importedData.cycleLog)

        // Validate calendar data if present
        let importedCalendarData: CalendarData | null = null
        if (importedData.calendarData) {
          importedCalendarData = validateCalendarData(importedData.calendarData)
        }

        // All validations passed, perform the import
        updateCycleLog({ type: 'merge-import', data: importedCycleLog })

        if (importedCalendarData) {
          importCalendarData(importedCalendarData)
        }
      } catch (error) {
        throw new Error(
          `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { cause: error },
        )
      }
    },
    [updateCycleLog, importCalendarData],
  )

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
        exportData,
        importData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
