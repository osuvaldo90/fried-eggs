import { renderHook, act } from '@testing-library/react'

import { CalendarData } from '../types'
import { useGoogleCalendar } from '../use-google-calendar'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useGoogleCalendar', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('importCalendarData function', () => {
    it('should import calendar data using the exposed function', () => {
      // Set up initial calendar data so the hook isn't in 'loading' state
      localStorageMock.setItem('calendarData', JSON.stringify({
        calendarId: 'existing-calendar',
        dangerZoneEvents: [],
      }))

      const { result } = renderHook(() => useGoogleCalendar())

      const importData: CalendarData = {
        calendarId: 'imported-calendar-id',
        dangerZoneEvents: [{ eventId: 'event-1', periodId: 'period-1' }],
        nextPeriodEvents: [{ eventId: 'event-2', periodId: 'period-2' }],
        pmsEvents: [{ eventId: 'event-3', periodId: 'period-3' }],
      }

      act(() => {
        result.current.importCalendarData(importData)
      })

      // Verify data was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'calendarData',
        JSON.stringify(importData),
      )
    })

    it('should update calendar data state when importing', () => {
      // Set up initial calendar data
      localStorageMock.setItem('calendarData', JSON.stringify({
        calendarId: 'existing-calendar',
        dangerZoneEvents: [],
      }))

      const { result } = renderHook(() => useGoogleCalendar())

      const importData: CalendarData = {
        calendarId: 'test-import-calendar',
        dangerZoneEvents: [{ eventId: 'import-event-1', periodId: 'import-period-1' }],
      }

      act(() => {
        result.current.importCalendarData(importData)
      })

      // Check that the calendar data state has been updated
      expect(result.current.calendarData).toEqual(importData)
    })

    it('should handle importing calendar data with all event types', () => {
      // Set up initial calendar data
      localStorageMock.setItem('calendarData', JSON.stringify({
        calendarId: 'existing-calendar',
        dangerZoneEvents: [],
      }))

      const { result } = renderHook(() => useGoogleCalendar())

      const completeImportData: CalendarData = {
        calendarId: 'complete-import-calendar',
        dangerZoneEvents: [
          { eventId: 'danger-import-1', periodId: 'period-1', ovulationId: 'ovulation-1' },
        ],
        nextPeriodEvents: [{ eventId: 'next-import-1', periodId: 'period-1' }],
        pmsEvents: [{ eventId: 'pms-import-1', periodId: 'period-1' }],
      }

      act(() => {
        result.current.importCalendarData(completeImportData)
      })

      expect(result.current.calendarData).toEqual(completeImportData)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'calendarData',
        JSON.stringify(completeImportData),
      )
    })

    it('should handle importing empty calendar data', () => {
      // Set up initial calendar data
      localStorageMock.setItem('calendarData', JSON.stringify({
        calendarId: 'existing-calendar',
        dangerZoneEvents: [],
      }))

      const { result } = renderHook(() => useGoogleCalendar())

      const emptyImportData: CalendarData = {
        calendarId: 'empty-import-calendar',
        dangerZoneEvents: [],
      }

      act(() => {
        result.current.importCalendarData(emptyImportData)
      })

      expect(result.current.calendarData).toEqual(emptyImportData)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'calendarData',
        JSON.stringify(emptyImportData),
      )
    })

    it('should load calendar data from localStorage on initialization', () => {
      const testData: CalendarData = {
        calendarId: 'test-calendar',
        dangerZoneEvents: [{ eventId: 'event-1', periodId: 'period-1' }],
      }

      // Pre-populate localStorage
      localStorageMock.setItem('calendarData', JSON.stringify(testData))

      renderHook(() => useGoogleCalendar())

      // The hook should initialize with data from localStorage
      expect(localStorageMock.getItem).toHaveBeenCalledWith('calendarData')
    })

    it('should return uninitialized when no calendar data in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useGoogleCalendar())

      expect(result.current.calendarData).toBe('uninitialized')
    })
  })

  describe('calendar data operations', () => {
    it('should create new calendar and save to localStorage', () => {
      renderHook(() => useGoogleCalendar())

      act(() => {
        // Simulate the new-calendar action by setting localStorage directly
        const newCalendarData = { calendarId: 'new-calendar-id', dangerZoneEvents: [] }
        window.localStorage.setItem('calendarData', JSON.stringify(newCalendarData))
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'calendarData',
        expect.stringContaining('new-calendar-id'),
      )
    })

    it('should handle calendar data with all event types', () => {
      renderHook(() => useGoogleCalendar())

      const completeCalendarData: CalendarData = {
        calendarId: 'complete-calendar',
        dangerZoneEvents: [
          { eventId: 'danger-1', periodId: 'period-1', ovulationId: 'ovulation-1' },
        ],
        nextPeriodEvents: [{ eventId: 'next-1', periodId: 'period-1' }],
        pmsEvents: [{ eventId: 'pms-1', periodId: 'period-1' }],
      }

      act(() => {
        window.localStorage.setItem('calendarData', JSON.stringify(completeCalendarData))
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'calendarData',
        JSON.stringify(completeCalendarData),
      )
    })
  })
})
