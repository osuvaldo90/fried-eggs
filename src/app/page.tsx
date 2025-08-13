'use client'

import { format } from 'date-fns'
import { last } from 'lodash'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'

import { useAppContext } from '../lib/app-context'
import { calculateDangerZone, crunchPeriods, makePeriodEventsParams } from '../lib/cycles/lib'
import { isPeriod } from '../lib/cycles/types'

const formatDate = (date: Date) => format(date, 'MMMM do')

const Home = () => {
  const {
    cycleLog,
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    exportData,
    importData,
  } = useAppContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

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

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setImportStatus(null)
      try {
        await importData(file)
        setImportStatus({ type: 'success', message: 'Data imported successfully!' })
      } catch (error) {
        console.error('Import error:', error)
        setImportStatus({
          type: 'error',
          message: error instanceof Error ? error.message : 'Import failed',
        })
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [importData],
  )

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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

      {importStatus && (
        <Alert
          variant={importStatus.type === 'success' ? 'success' : 'danger'}
          dismissible
          onClose={() => setImportStatus(null)}
          className="mt-3"
        >
          {importStatus.message}
        </Alert>
      )}

      <div className="mt-4 d-grid gap-1">
        <Button variant="outline-primary" onClick={exportData}>
          Export Data
        </Button>
        <Button variant="outline-primary" onClick={handleImportClick}>
          Import Data
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default Home
