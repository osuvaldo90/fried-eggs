import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { differenceInDays, format, parse } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import _, { capitalize, last } from 'lodash'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Button, Fade, ListGroup, Modal } from 'react-bootstrap'
import * as uuid from 'uuid'
import * as yup from 'yup'

import { useAppContext } from '../lib/app-context'
import { AddLogEntryForm, AddLogEntryFormValues } from '../lib/components/AddLogEntryForm'
import { serializeCycleLog } from '../lib/cycles/data'
import { calculateDangerZoneFromOvulationDate, makePeriodEventsParams } from '../lib/cycles/lib'
import { CycleLogEntry, isPeriod, logEntryTypes } from '../lib/cycles/types'

const validationSchema = yup.object({
  logEntryType: yup
    .string()
    .required()
    .oneOf([...logEntryTypes]),
  logEntryDate: yup
    .date()
    .required('Enter a date')
    .test((val, context) => {
      if ((val?.getFullYear() ?? 10000) >= 10000) {
        return context.createError({ message: 'Enter a valid date' })
      }
      return true
    }),
})

const Cycles = () => {
  const {
    cycleLog,
    updateCycleLog,
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    deleteLogEntryEvents,
    updateDangerZoneEvent,
  } = useAppContext()
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>()
  const importDataFileRef = useRef<HTMLInputElement | null>(null)
  const downloadDataRef = useRef<HTMLAnchorElement>(null)
  const [lastEntry, setLastEntry] = useState<CycleLogEntry>()
  const [showConnectGoogleModal, setShowConnectGoogleModal] = useState(false)
  const [creatingCalendar, setCreatingCalendar] = useState(false)
  const [nextAction, setNextAction] = useState<
    'create-calendar' | 'create-period-events' | 'update-danger-zone-event'
  >()

  useEffect(() => {
    const blob = new Blob([serializeCycleLog(cycleLog)], { type: 'application/octet-stream' })
    setDownloadUrl(URL.createObjectURL(blob))
  }, [cycleLog])

  const handleSubmit = useCallback(
    async (
      { logEntryDate, logEntryNotes, logEntryType }: AddLogEntryFormValues,
      { setSubmitting, resetForm }: FormikHelpers<AddLogEntryFormValues>,
    ) => {
      const logEntry = {
        id: uuid.v4(),
        type: logEntryType,
        date: parse(logEntryDate, 'yyyy-MM-dd', new Date()),
        notes: logEntryNotes,
      }

      updateCycleLog({ type: 'add-log-entry', logEntry })
      setLastEntry(logEntry)
      resetForm({ values: { logEntryType, logEntryDate: '', logEntryNotes: '' } })
      setSubmitting(false)
      setShowSavedToast(true)
      setTimeout(() => setShowSavedToast(false), 3000)

      if (calendarData === 'uninitialized') {
        setShowConnectGoogleModal(true)
      } else if (typeof calendarData === 'object') {
        if (logEntry.type === 'period') {
          setNextAction('create-period-events')
        } else if (logEntry.type === 'ovulation') {
          setNextAction('update-danger-zone-event')
        }
      }
    },
    [calendarData, updateCycleLog, setNextAction],
  )

  // wait until period history contains lastEntry so we get accurate next period start date
  useEffect(() => {
    const createCalendarEvents = async () => {
      if (!lastEntry) return
      if (!cycleLog.find((period) => period.id === lastEntry.id)) return

      const periodHistory = cycleLog.filter(isPeriod)
      const lastPeriod = last(periodHistory)
      const periodEventsParams = makePeriodEventsParams(periodHistory)
      const ovulationEventParams =
        lastEntry.type === 'ovulation'
          ? {
              ovulationLogEntryId: lastEntry.id,
              periodLogEntryId: lastPeriod?.id,
              dangerZone: calculateDangerZoneFromOvulationDate(lastEntry.date),
            }
          : undefined

      if (nextAction === 'create-calendar') {
        setNextAction(undefined)
        setLastEntry(undefined)

        await createFriedEggsCalendar({
          periodEventsParams,
          ovulationEventParams,
        })
        setCreatingCalendar(false)
        setShowConnectGoogleModal(false)
      }

      if (
        lastPeriod?.id === lastEntry.id &&
        periodEventsParams &&
        nextAction === 'create-period-events'
      ) {
        setNextAction(undefined)
        setLastEntry(undefined)
        await createPeriodEvents(periodEventsParams)
      }

      if (lastEntry.type === 'ovulation' && nextAction === 'update-danger-zone-event') {
        setNextAction(undefined)
        setLastEntry(undefined)

        const lastPeriodEntry = _(cycleLog)
          .takeWhile((entry) => entry.id !== lastEntry.id)
          .reverse()
          .find((entry) => entry.type === 'period')

        if (lastPeriodEntry) {
          await updateDangerZoneEvent({
            periodLogEntryId: lastPeriodEntry.id,
            ovulationLogEntryId: lastEntry.id,
            dangerZone: calculateDangerZoneFromOvulationDate(lastEntry.date),
          })
        }
      }
    }
    createCalendarEvents()
  }, [
    cycleLog,
    lastEntry,
    nextAction,
    createFriedEggsCalendar,
    createPeriodEvents,
    updateDangerZoneEvent,
  ])

  const promptImportDataFile = () => {
    if (importDataFileRef.current) {
      importDataFileRef.current.click()
    }
  }

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        const data = await file.text()
        updateCycleLog({ type: 'import', data })
        importDataFileRef.current!.value = ''
      }
    },
    [updateCycleLog],
  )

  const handleDeleteLogEntry = useCallback(
    async (logEntryId: string) => {
      const entry = cycleLog.find(({ id }) => id === logEntryId)

      if (entry) {
        await deleteLogEntryEvents(entry.id, entry.type)
      }
      updateCycleLog({ type: 'delete-event', id: logEntryId })
    },
    [cycleLog, updateCycleLog, deleteLogEntryEvents],
  )

  let lastPeriodDate: Date | undefined = undefined
  const reversedAndAugmentedHistory = [...cycleLog]
    .map((entry, index, array) => {
      if (entry.type === 'period') {
        const daysSinceLastPeriod = lastPeriodDate
          ? differenceInDays(entry.date, lastPeriodDate)
          : undefined
        lastPeriodDate = entry.date
        return {
          ...entry,
          daysSinceLastPeriod,
        }
      }
      return entry
    })
    .reverse()

  return (
    <>
      <Formik
        initialValues={{
          logEntryType: 'period',
          logEntryDate: '',
          logEntryNotes: '',
        }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        <AddLogEntryForm />
      </Formik>
      <Fade in={showSavedToast}>
        <div className="pe-2 text-success text-end">Saved</div>
      </Fade>

      {reversedAndAugmentedHistory.length > 0 && (
        <ListGroup className="mb-3" data-testid="cycle-log">
          {reversedAndAugmentedHistory.map((entry) => (
            <ListGroup.Item key={entry.id} className="d-flex flex-row">
              <div className="me-2">{entry.type === 'ovulation' ? '🍳' : '🩸'}</div>
              <div>
                <div className="h6">
                  {capitalize(entry.type)} on {format(entry.date, 'MMMM do, yyyy')}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{entry.notes}</div>
                {'daysSinceLastPeriod' in entry && entry.daysSinceLastPeriod && (
                  <div className="text-secondary fs-6">
                    {entry.daysSinceLastPeriod} days since last period
                  </div>
                )}
              </div>
              <div className="ms-auto my-auto">
                <Button variant="outline-danger" onClick={() => handleDeleteLogEntry(entry.id)}>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <div className="d-grid">
        {reversedAndAugmentedHistory.length > 0 && downloadUrl ? (
          <>
            <a
              ref={downloadDataRef}
              style={{ display: 'none' }}
              download={`fried-eggs-${new Date().valueOf()}.json`}
              href={downloadUrl}
            />
            <Button
              onClick={() => {
                downloadDataRef.current?.click()
              }}
            >
              Download your data
            </Button>
          </>
        ) : (
          <>
            <input
              ref={importDataFileRef}
              style={{ display: 'none' }}
              type="file"
              onChange={handleFileUpload}
            />
            <Button onClick={promptImportDataFile}>Import data</Button>
          </>
        )}
      </div>

      <Modal show={showConnectGoogleModal} onHide={() => setShowConnectGoogleModal(false)}>
        <Modal.Body>
          Would you like to connect your Google calendar to automatically create danger zone events?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={creatingCalendar}
            onClick={() => setShowConnectGoogleModal(false)}
          >
            No
          </Button>
          <Button
            disabled={creatingCalendar}
            onClick={async () => {
              setCreatingCalendar(true)
              setNextAction('create-calendar')
            }}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Cycles
