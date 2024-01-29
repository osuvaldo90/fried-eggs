import '@testing-library/jest-dom'
import { getByRole, getByText, render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { AppProvider } from '../../lib/app-context'
import Cycles from '../cycles/page'

import { asMock } from './util'

const logEntry = async (type: 'period' | 'ovulation', date: string) => {
  const typeSwitchButton = screen.getByLabelText(type === 'period' ? 'Period' : 'Ovulation')
  await userEvent.click(typeSwitchButton)

  const dateInputLabel =
    type === 'period' ? 'When did your period start?' : 'When did you start ovulating?'
  const dateInput = screen.getByLabelText(dateInputLabel)
  await userEvent.type(dateInput, date)

  const submitButton = screen.getByText(type === 'period' ? 'Save period' : 'Save ovulation')
  await userEvent.click(submitButton)

  const noCalendarButton = screen.getByText('No')
  await waitFor(() => userEvent.click(noCalendarButton))
}

describe(Cycles, () => {
  window.URL.createObjectURL = jest.fn()

  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    asMock(window.URL.createObjectURL).mockReset()
  })

  it('should let the user add period and ovulation events', async () => {
    render(
      <AppProvider>
        <Cycles />
      </AppProvider>,
    )

    await logEntry('ovulation', '2024-01-08')
    const cycleLog = screen.getByTestId('cycle-log')
    await waitFor(() => {
      expect(cycleLog.children).toHaveLength(1)
      expect(cycleLog.children[0]).toHaveTextContent('Ovulation on January 8th, 2024')
    })

    await logEntry('period', '2024-01-01')
    await waitFor(() => {
      expect(cycleLog.children).toHaveLength(2)
      expect(cycleLog.children[0]).toHaveTextContent('Ovulation on January 8th, 2024')
      expect(cycleLog.children[1]).toHaveTextContent('Period on January 1st, 2024')
    })

    await logEntry('period', '2024-01-29')
    await waitFor(() => {
      expect(cycleLog.children).toHaveLength(3)
      expect(cycleLog.children[0]).toHaveTextContent('Period on January 29th, 2024')
      expect(cycleLog.children[0]).toHaveTextContent('28 days since last period')
      expect(cycleLog.children[1]).toHaveTextContent('Ovulation on January 8th, 2024')
      expect(cycleLog.children[2]).toHaveTextContent('Period on January 1st, 2024')
    })
  })

  it('should let the user delete period and ovulation events', async () => {
    render(
      <AppProvider>
        <Cycles />
      </AppProvider>,
    )
    await logEntry('period', '2024-01-01')
    await logEntry('ovulation', '2024-01-08')
    await logEntry('period', '2024-01-29')

    const cycleLog = screen.getByTestId('cycle-log')
    const ovulationEntry = getByText(cycleLog, 'Ovulation on January 8th, 2024')
    const deleteOvulationButton = getByRole(ovulationEntry.parentElement!.parentElement!, 'button')
    await userEvent.click(deleteOvulationButton)

    await waitFor(async () => {
      expect(cycleLog.children).toHaveLength(2)
      expect(cycleLog.children[0]).toHaveTextContent('Period on January 29th, 2024')
      expect(cycleLog.children[1]).toHaveTextContent('Period on January 1st, 2024')
    })
  })
})
