import { addDays, differenceInDays, format } from 'date-fns'
import _, { last, mean, zip } from 'lodash'
import Link from 'next/link'
import { Button, Col, Container, Row } from 'react-bootstrap'

import { Period } from '../lib/types'

const median = (nums: number[]) => {
  if (nums.length === 0) return 0
  if (nums.length === 1) return nums[0] as number

  const midpoint = Math.floor(nums.length / 2)
  const median =
    nums.length % 2 === 1
      ? (nums[midpoint] as number)
      : ((nums[midpoint - 1] as number) + (nums[midpoint] as number)) / 2
  return median
}

const crunchPeriods = (periodHistory: Period[]) => {
  if (periodHistory.length === 0) return undefined

  const cycleLengths = _(zip(periodHistory.slice(0, -1), periodHistory.slice(1)))
    .map(([a, b]) => differenceInDays(b!.date, a!.date))
    .sort()
    .value()

  const medianCycleLength = median(cycleLengths)

  return {
    averageCycleLength: mean(cycleLengths),
    medianCycleLength,
    nextCycleStart: addDays(last(periodHistory)!.date, medianCycleLength),
  }
}

const App = ({ periodHistory }: { periodHistory: Period[] }) => {
  const statistics = crunchPeriods(periodHistory)

  return (
    <>
      {statistics && (
        <Row>
          <Col>
            <p>
              Your average cycle length is
              <br />
              <span className="fw-bold">{statistics.averageCycleLength} days</span>
            </p>
            <p>
              Your median cycle length is
              <br />
              <span className="fw-bold">{statistics.medianCycleLength} days</span>
            </p>
            <p>
              Your next period may start on
              <br />
              <span className="fw-bold">{format(statistics.nextCycleStart, 'MMMM do, yyyy')}</span>
            </p>
          </Col>
        </Row>
      )}
    </>
  )
}

export default App
