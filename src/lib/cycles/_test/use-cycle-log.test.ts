import { renderHook, act } from '@testing-library/react'

import { CycleLogEntry } from '../types'
import { useCycleLog } from '../use-cycle-log'

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

describe('useCycleLog', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('merge-import action', () => {
    it('should merge imported data with existing data', () => {
      // Setup localStorage with existing data
      localStorageMock.setItem(
        'cycleLog',
        JSON.stringify([{ id: '1', date: '2024-01-01', type: 'period', notes: 'Existing period' }]),
      )

      const { result } = renderHook(() => useCycleLog())

      // Wait for initial load
      act(() => {
        result.current[1]({ type: 'load' })
      })

      const importData = [
        { id: '2', date: new Date(2024, 1, 1), type: 'period' as const, notes: 'Imported period' },
        { id: '3', date: new Date(2024, 0, 15), type: 'ovulation' as const },
      ]

      act(() => {
        result.current[1]({ type: 'merge-import', data: importData })
      })

      const [cycleLog] = result.current

      expect(cycleLog).toHaveLength(3)
      expect(cycleLog.find((entry) => entry.id === '1')).toBeTruthy()
      expect(cycleLog.find((entry) => entry.id === '2')).toBeTruthy()
      expect(cycleLog.find((entry) => entry.id === '3')).toBeTruthy()

      // Verify data is sorted by date
      expect(cycleLog[0]?.id).toBe('1') // 2024-01-01
      expect(cycleLog[1]?.id).toBe('3') // 2024-01-15
      expect(cycleLog[2]?.id).toBe('2') // 2024-02-01
    })

    it('should throw error when import data has conflicting IDs', () => {
      // Setup localStorage with existing data
      localStorageMock.setItem(
        'cycleLog',
        JSON.stringify([{ id: '1', date: '2024-01-01', type: 'period', notes: 'Existing period' }]),
      )

      const { result } = renderHook(() => useCycleLog())

      // Wait for initial load
      act(() => {
        result.current[1]({ type: 'load' })
      })

      const conflictingImportData = [
        { id: '1', date: new Date(2024, 1, 1), type: 'period' as const, notes: 'Conflicting period' },
      ]

      // The error is thrown inside the reducer, we need to handle it differently
      const originalConsoleError = console.error
      console.error = jest.fn()

      try {
        act(() => {
          result.current[1]({ type: 'merge-import', data: conflictingImportData })
        })
      } catch (error) {
        expect(error).toEqual(
          expect.objectContaining({
            message: expect.stringContaining('Import data contains conflicting IDs'),
          }),
        )
      }

      console.error = originalConsoleError

      // Verify original data is unchanged
      const [cycleLog] = result.current
      expect(cycleLog).toHaveLength(1)
      expect(cycleLog[0]?.notes).toBe('Existing period')
    })

    it('should handle empty import data', () => {
      // Setup localStorage with existing data
      localStorageMock.setItem(
        'cycleLog',
        JSON.stringify([{ id: '1', date: '2024-01-01', type: 'period', notes: 'Existing period' }]),
      )

      const { result } = renderHook(() => useCycleLog())

      // Wait for initial load
      act(() => {
        result.current[1]({ type: 'load' })
      })

      const emptyImportData: CycleLogEntry[] = []

      act(() => {
        result.current[1]({ type: 'merge-import', data: emptyImportData })
      })

      const [cycleLog] = result.current
      expect(cycleLog).toHaveLength(1)
      expect(cycleLog[0]?.notes).toBe('Existing period')
    })

    it('should save merged data to localStorage', () => {
      const { result } = renderHook(() => useCycleLog())

      const importData = [
        { id: '1', date: new Date(2024, 0, 1), type: 'period' as const, notes: 'Imported period' },
      ]

      act(() => {
        result.current[1]({ type: 'merge-import', data: importData })
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cycleLog',
        expect.stringContaining('Imported period'),
      )
    })
  })

  describe('import action (replace)', () => {
    it('should replace all data with imported data', () => {
      // Setup localStorage with existing data
      localStorageMock.setItem(
        'cycleLog',
        JSON.stringify([{ id: '1', date: '2024-01-01', type: 'period', notes: 'Existing period' }]),
      )

      const { result } = renderHook(() => useCycleLog())

      // Wait for initial load
      act(() => {
        result.current[1]({ type: 'load' })
      })

      const replaceImportData = JSON.stringify([
        { id: '2', date: '2024-02-01', type: 'period', notes: 'Replacement period' },
      ])

      act(() => {
        result.current[1]({ type: 'import', data: replaceImportData })
      })

      const [cycleLog] = result.current
      expect(cycleLog).toHaveLength(1)
      expect(cycleLog[0]?.id).toBe('2')
      expect(cycleLog[0]?.notes).toBe('Replacement period')
    })
  })
})
