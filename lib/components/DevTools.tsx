import { addDays, subDays } from 'date-fns'
import { Button } from 'react-bootstrap'
import * as uuid from 'uuid'

import { useDataContext } from '../data-context'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

export const DevTools = ({ className }: { className: string }) => {
  const { updatePeriodHistory } = useDataContext()

  const generatePeriodData = () => {
    const first = subDays(new Date(), 12 * 28)
    for (let i = 0; i < 14; i++) {
      updatePeriodHistory({
        type: 'add-period',
        period: { id: uuid.v4(), date: addDays(first, i * (28 - offset())) },
      })
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
