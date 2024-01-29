import { addDays, subDays } from 'date-fns'
import { Button } from 'react-bootstrap'
import * as uuid from 'uuid'

import { CycleLogEntry } from '../cycles/types'
import { useCycleLog } from '../cycles/use-cycle-log'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

export const DevTools = ({ className }: { className: string }) => {
  const { overwriteCycleLog } = useCycleLog()
  const generatePeriodData = () => {
    const newLog: CycleLogEntry[] = []
    let date = addDays(new Date(), offset())
    for (let i = 0; i < 14; i++) {
      newLog.push({
        id: uuid.v4(),
        type: 'period',
        date,
        notes: `notes for period ${i}`,
      })
      date = subDays(date, 28 + offset())
    }
    overwriteCycleLog(newLog.reverse())
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
