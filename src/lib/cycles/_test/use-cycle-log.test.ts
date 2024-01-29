import { act, renderHook } from '@testing-library/react'
import { addDays } from 'date-fns'

import { asMock } from '../../../_test/util'
import { loadCycleLog } from '../data'
import { useCycleLog } from '../use-cycle-log'

jest.mock('../data', () => ({
  loadCycleLog: jest.fn(() => []),
  saveCycleLog: jest.fn(),
}))

describe(useCycleLog, () => {
  it('should load iniital cycle log', () => {
    const entry = {
      id: '1',
      type: 'period',
      date: new Date(),
    } as const

    asMock(loadCycleLog).mockReturnValueOnce([entry])
    const { result } = renderHook(() => useCycleLog())

    expect(result.current.cycleLog).toEqual([entry])
  })

  it('should add cycle log entries', () => {
    const entry1 = {
      id: '1',
      type: 'period',
      date: new Date(),
    } as const
    const entry2 = {
      id: '2',
      type: 'period',
      date: addDays(new Date(), 1),
    } as const

    const { result } = renderHook(() => useCycleLog())
    act(() => {
      result.current.addCycleLogEntry(entry1)
    })
    expect(result.current.cycleLog).toEqual([entry1])

    act(() => {
      result.current.addCycleLogEntry(entry2)
    })
    expect(result.current.cycleLog).toEqual([entry1, entry2])
  })

  it('should delete cycle log entries', () => {
    const entry1 = {
      id: '1',
      type: 'period',
      date: new Date(),
    } as const

    const entry2 = {
      id: '2',
      type: 'period',
      date: addDays(new Date(), 1),
    } as const

    const { result } = renderHook(() => useCycleLog())
    act(() => {
      result.current.addCycleLogEntry(entry1)
      result.current.addCycleLogEntry(entry2)
    })
    expect(result.current.cycleLog).toEqual([entry1, entry2])

    act(() => {
      result.current.deleteCycleLogEntry(entry1.id)
    })
    expect(result.current.cycleLog).toEqual([entry2])
  })
})
