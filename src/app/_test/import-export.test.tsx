import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AppProvider } from '../../lib/app-context'
import { useGoogleCalendar } from '../../lib/calendar/use-google-calendar'
import { CycleLogEntry } from '../../lib/cycles/types'
import { useCycleLog } from '../../lib/cycles/use-cycle-log'
import Home from '../page'

import { asMock } from './util'

// Mock the hooks
jest.mock('../../lib/cycles/use-cycle-log', () => ({
  useCycleLog: jest.fn(),
}))

jest.mock('../../lib/calendar/use-google-calendar', () => ({
  useGoogleCalendar: jest.fn(),
}))

jest.mock('../../lib/calendar/use-google-access-token', () => ({
  useGoogleAccessToken: jest.fn(() => ({ getAccessToken: jest.fn() })),
}))

jest.mock('../../lib/calendar/use-google-api', () => ({
  useGapiClient: jest.fn(() => null),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Import/Export UI', () => {
  const mockUpdateCycleLog = jest.fn()
  const mockImportCalendarData = jest.fn()
  const sampleCycleLog: CycleLogEntry[] = [
    {
      id: '1',
      date: new Date(2024, 0, 1),
      type: 'period',
      notes: 'Test period',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    asMock(useCycleLog).mockReturnValue([sampleCycleLog, mockUpdateCycleLog, () => null])

    asMock(useGoogleCalendar).mockReturnValue({
      calendarData: { calendarId: 'test', dangerZoneEvents: [] },
      createFriedEggsCalendar: jest.fn(),
      createPeriodEvents: jest.fn(),
      deleteLogEntryEvents: jest.fn(),
      updateDangerZoneEvent: jest.fn(),
      importCalendarData: mockImportCalendarData,
    })
  })

  it('should display import and export buttons', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )

    expect(screen.getByText('Export Data')).toBeInTheDocument()
    expect(screen.getByText('Import Data')).toBeInTheDocument()
  })

  it('should have hidden file input with correct attributes', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', '.json')
    expect(fileInput).toHaveStyle('display: none')
  })

  it('should trigger file input when import button is clicked', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = jest.spyOn(fileInput, 'click')

    const importButton = screen.getByText('Import Data')
    fireEvent.click(importButton)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('should successfully import valid data', async () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    const validImportData = {
      cycleLog: [
        { id: '2', date: '2024-02-01', type: 'period', notes: 'Imported period' },
      ],
      calendarData: {
        calendarId: 'imported-calendar',
        dangerZoneEvents: [],
      },
    }

    // Create a mock file with valid content
    Object.defineProperty(fileInput, 'files', {
      value: [
        {
          text: () => Promise.resolve(JSON.stringify(validImportData)),
          name: 'test.json',
        },
      ],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(mockUpdateCycleLog).toHaveBeenCalledWith({
        type: 'merge-import',
        data: [
          { id: '2', date: expect.any(Date), type: 'period', notes: 'Imported period' },
        ],
      })
      expect(mockImportCalendarData).toHaveBeenCalledWith({
        calendarId: 'imported-calendar',
        dangerZoneEvents: [],
      })
    })

    expect(screen.getByText('Data imported successfully!')).toBeInTheDocument()
  })

  it('should show error message for invalid import', async () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )

    // Simulate import error by making updateCycleLog throw
    mockUpdateCycleLog.mockImplementation(() => {
      throw new Error('Import data contains conflicting IDs')
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    // Create a mock file with invalid content
    Object.defineProperty(fileInput, 'files', {
      value: [
        {
          text: () => Promise.resolve('{"invalid": "data"}'),
          name: 'test.json',
        },
      ],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/Import failed/)).toBeInTheDocument()
    })
  })
})
