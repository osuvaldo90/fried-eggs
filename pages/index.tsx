import { addDays, differenceInDays, format } from 'date-fns'
import _, { last, mean, zip } from 'lodash'
import Link from 'next/link'
import { Col, Row } from 'react-bootstrap'

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
  if (periodHistory.length <= 1) return undefined

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

const calculateDangerZone = (periodHistory: Period[]) => {
  const lastPeriod = last(periodHistory)
  if (!lastPeriod) return undefined

  const start = addDays(lastPeriod.date, 7)
  const end = addDays(start, 7)
  return { start, end }
}

const formatDate = (date: Date) => format(date, 'MMMM do')

const App = ({ periodHistory }: { periodHistory: Period[] }) => {
  const statistics = crunchPeriods(periodHistory)
  const dangerZone = calculateDangerZone(periodHistory)
  const lastPeriod = last(periodHistory)

  return (
    <>
      <Row>
        <Col>
          {lastPeriod && dangerZone ? (
            <>
              <p>
                Your last period was on{' '}
                <span className="fw-bold">{formatDate(lastPeriod.date)}</span>.
              </p>
              <p className="text-danger">
                Your danger zone is{' '}
                <span className="fw-bold">
                  {formatDate(dangerZone.start)} – {formatDate(dangerZone.end)}
                </span>
                .
              </p>
            </>
          ) : (
            <>
              <p>No period data available.</p>
              <p>
                <Link href="/add-period">Add your last period</Link> to get started.
              </p>
            </>
          )}
        </Col>
      </Row>

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
              <span className="fw-bold">{formatDate(statistics.nextCycleStart)}</span>
            </p>
          </Col>
        </Row>
      )}
    </>
  )
}

export default App
