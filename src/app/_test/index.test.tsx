import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { asMock } from '../../_test/util'
import { AppProvider } from '../../lib/app-context'
import { useCycleLog } from '../../lib/cycles/use-cycle-log'
import Home from '../page'

jest.mock('../../lib/cycles/use-cycle-log', () => ({
  useCycleLog: jest.fn(() => ({
    cycleLog: [],
    addCycleLogEntry: jest.fn(),
    deleteCycleLogEntry: jest.fn(),
    overwriteCycleLog: jest.fn(),
  })),
}))

describe(Home, () => {
  it('should display the default message', () => {
    asMock(useCycleLog).mockReturnValue({
      cycleLog: [],
      addCycleLogEntry: jest.fn(),
      deleteCycleLogEntry: jest.fn(),
      overwriteCycleLog: jest.fn(),
    })
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )
    const statsPane = screen.getByTestId('stats')
    expect(statsPane).toHaveTextContent('No period data available.')
  })

  it('should display stats if there is period data', () => {
    asMock(useCycleLog).mockReturnValue({
      cycleLog: [
        {
          id: '1',
          date: new Date(2024, 0, 1, 0),
          type: 'period',
        },
      ],
      addCycleLogEntry: jest.fn(),
      deleteCycleLogEntry: jest.fn(),
      overwriteCycleLog: jest.fn(),
    })
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )
    const statsPane = screen.getByTestId('stats')
    expect(statsPane).toHaveTextContent('Your last period was on January 1st')
    expect(statsPane).toHaveTextContent('Your danger zone is January 8th – January 15th')
    expect(statsPane).toHaveTextContent('Your next period may start on January 29th')
  })
})
