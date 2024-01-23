import { format } from 'date-fns'
import { last } from 'lodash'
import Link from 'next/link'
import { useCallback } from 'react'
import { Button } from 'react-bootstrap'

import { useAppContext } from '../lib/app-context'
import { calculateDangerZone, crunchPeriods, makePeriodEventsParams } from '../lib/cycles/lib'
import { isPeriod } from '../lib/cycles/types'

const formatDate = (date: Date) => format(date, 'MMMM do')

const Home = () => {
  const { cycleLog, calendarData, createFriedEggsCalendar, createPeriodEvents } = useAppContext()

  const periodHistory = cycleLog.filter(isPeriod)
  const statistics = crunchPeriods(periodHistory)
  const lastPeriod = last(periodHistory)
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
    <div data-testid="stats">
      {lastPeriod && dangerZone ? (
        <>
          <p>
            Your last period was on <span className="fw-bold">{formatDate(lastPeriod.date)}</span>.
          </p>
          <p className="text-danger">
            Your danger zone is&nbsp;
            <br />
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
            <Link href="/cycles">Add your last period</Link> to get started.
          </p>
        </>
      )}

      {statistics?.nextPeriodStart && (
        <p>
          Your next period may start on&nbsp;
          <br />
          <span className="fw-bold">{formatDate(statistics.nextPeriodStart)}</span>
        </p>
      )}

      {calendarData === 'uninitialized' && (
        <Button
          className="p-0 mb-3"
          variant="link"
          onClick={() =>
            createFriedEggsCalendar({ periodEventsParams: makePeriodEventsParams(periodHistory) })
          }
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
    </div>
  )
}

export default Home
