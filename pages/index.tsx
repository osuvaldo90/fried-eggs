import { format } from 'date-fns'
import { last } from 'lodash'
import Link from 'next/link'
import { useCallback } from 'react'
import { Button } from 'react-bootstrap'

import { useAppContext } from '../lib/app-context'
import { calculateDangerZone, crunchPeriods, makePeriodEventsParams } from '../lib/cycles/lib'

const formatDate = (date: Date) => format(date, 'MMMM do')

const App = () => {
  const { cycleLog, calendarData, createFriedEggsCalendar, createPeriodEvents } = useAppContext()

  const statistics = crunchPeriods(cycleLog)
  const lastPeriod = last(cycleLog)
  const dangerZone = lastPeriod ? calculateDangerZone(lastPeriod) : undefined

  const hasNextPeriodEvent =
    typeof calendarData === 'object' &&
    lastPeriod &&
    !!calendarData.nextPeriodEvents?.find((e) => e.periodId === lastPeriod.id)

  const hasDangerZoneEvent =
    typeof calendarData === 'object' &&
    lastPeriod &&
    !!calendarData.dangerZoneEvents?.find((e) => e.periodId === lastPeriod.id)

  const showAddNextPeriodEvent =
    lastPeriod && typeof calendarData === 'object' && (!hasNextPeriodEvent || !hasDangerZoneEvent)

  const addEvents = useCallback(async () => {
    if (!lastPeriod) return
    const params = {
      periodId: lastPeriod?.id,
      ...(hasNextPeriodEvent || !statistics ? {} : { nextPeriodStart: statistics.nextPeriodStart }),
      ...(hasDangerZoneEvent || !dangerZone
        ? {}
        : { dangerZone: { start: dangerZone.start, end: dangerZone.end } }),
    }
    await createPeriodEvents(params)
  }, [
    lastPeriod,
    statistics,
    dangerZone,
    createPeriodEvents,
    hasNextPeriodEvent,
    hasDangerZoneEvent,
  ])

  return (
    <>
      {lastPeriod && dangerZone ? (
        <>
          <p>
            Your last period was on <span className="fw-bold">{formatDate(lastPeriod.date)}</span>.
          </p>
          <p className="text-danger">
            Your danger zone is
            <br />
            <span className="fw-bold">
              {formatDate(dangerZone.start)} – {formatDate(dangerZone.end)}
            </span>
            .
          </p>
        </>
      ) : (
        <div>
          <p>No period data available.</p>
          <p>
            <Link href="/periods">Add your last period</Link> to get started.
          </p>
        </div>
      )}

      {statistics?.nextPeriodStart && (
        <p>
          Your next period may start on
          <br />
          <span className="fw-bold">{formatDate(statistics.nextPeriodStart)}</span>
        </p>
      )}

      {calendarData === 'uninitialized' && (
        <Button
          className="p-0 mb-3"
          variant="link"
          onClick={() => createFriedEggsCalendar(makePeriodEventsParams(cycleLog))}
        >
          Add to Google calendar
        </Button>
      )}

      {showAddNextPeriodEvent && (
        <Button className="p-0 mb-3" variant="link" onClick={addEvents}>
          Add to Google calendar
        </Button>
      )}

      {statistics?.averageCycleLength && (
        <p>
          Your average cycle length is
          <br />
          <span className="fw-bold">{Math.round(statistics.averageCycleLength)} days</span>
        </p>
      )}

      {statistics?.medianCycleLength && (
        <p>
          Your median cycle length is
          <br />
          <span className="fw-bold">{Math.round(statistics.medianCycleLength)} days</span>
        </p>
      )}
    </>
  )
}

export default App
