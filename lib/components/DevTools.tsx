import { addDays, subDays } from 'date-fns'
import { Button } from 'react-bootstrap'
import * as uuid from 'uuid'

import { useAppContext } from '../app-context'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

export const DevTools = ({ className }: { className: string }) => {
  const { updateCycleLog } = useAppContext()

  const generatePeriodData = () => {
    let date = addDays(new Date(), offset())
    for (let i = 0; i < 14; i++) {
      updateCycleLog({
        type: 'add-log-entry',
        logEntry: {
          id: uuid.v4(),
          type: 'period',
          date,
          notes: `notes for period ${i}`,
        },
      })
      date = subDays(date, 28 + offset())
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
      >
        CLEAR
      </Button>
      <Button onClick={generatePeriodData}>GENERATE DATA</Button>
    </div>
  )
}
