import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { AppProvider } from '../lib/app-context'
import { CycleLogEntry } from '../lib/cycles/types'
import { useCycleLog } from '../lib/cycles/use-cycle-log'
import Home from '../pages'

import { asMock } from './util'

jest.mock('../lib/cycles/use-cycle-log', () => ({
  useCycleLog: jest.fn(() => [[] as CycleLogEntry[], jest.fn(), () => null] as const),
}))

describe(Home, () => {
  it('should display the default message', () => {
    asMock(useCycleLog).mockReturnValue([[], jest.fn(), () => null])
    render(
      <AppProvider>
        <Home />
      </AppProvider>,
    )
    const statsPane = screen.getByTestId('stats')
    expect(statsPane).toHaveTextContent('No period data available.')
  })

  it('should display stats if there is period data', () => {
    const x = asMock(useCycleLog)
    asMock(useCycleLog).mockReturnValue([
      [
        {
          id: '1',
          date: new Date(2024, 0, 1, 0),
          type: 'period',
        },
      ],
      jest.fn(),
      () => null,
    ])
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
