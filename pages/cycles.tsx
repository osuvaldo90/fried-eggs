import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { differenceInDays, format, parse } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Button, Fade, ListGroup, Modal } from 'react-bootstrap'
import * as uuid from 'uuid'
import * as yup from 'yup'

import { useAppContext } from '../lib/app-context'
import { AddPeriodForm, AddPeriodFormValues } from '../lib/components/AddPeriodForm'
import { serializeCycleLog } from '../lib/cycles/data'
import { makePeriodEventsParams } from '../lib/cycles/lib'
import { CycleLogEntry } from '../lib/cycles/types'

const validationSchema = yup.object({
  periodDate: yup
    .date()
    .required('Enter a date')
    .test((val, context) => {
      if ((val?.getFullYear() ?? 10000) >= 10000) {
        return context.createError({ message: 'Enter a valid date' })
      }
      return true
    }),
})

const History = () => {
  const {
    cycleLog,
    updateCycleLog,
    calendarData,
    createFriedEggsCalendar,
    createPeriodEvents,
    deletePeriodEvents,
  } = useAppContext()
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>()
  const importDataFileRef = useRef<HTMLInputElement | null>(null)
  const downloadDataRef = useRef<HTMLAnchorElement>(null)
  const [lastEntry, setLastEntry] = useState<CycleLogEntry>()
  const [showConnectGoogleModal, setShowConnectGoogleModal] = useState(false)
  const [creatingCalendar, setCreatingCalendar] = useState(false)
  const [nextAction, setNextAction] = useState<'create-calendar' | 'create-events'>()

  useEffect(() => {
    const blob = new Blob([serializeCycleLog(cycleLog)], { type: 'application/octet-stream' })
    setDownloadUrl(URL.createObjectURL(blob))
  }, [cycleLog])

  const handleSubmit = useCallback(
    async (
      { periodDate, periodNotes }: AddPeriodFormValues,
      { setSubmitting, resetForm }: FormikHelpers<AddPeriodFormValues>,
    ) => {
      const period = {
        id: uuid.v4(),
        date: parse(periodDate, 'yyyy-MM-dd', new Date()),
        notes: periodNotes,
      }
      updateCycleLog({ type: 'add-period', period })
      setLastEntry(period)
      resetForm()
      setSubmitting(false)
      setShowSavedToast(true)
      setTimeout(() => setShowSavedToast(false), 3000)

      if (calendarData === 'uninitialized') {
        setShowConnectGoogleModal(true)
      } else if (typeof calendarData === 'object') {
        setNextAction('create-events')
      }
    },
    [calendarData, updateCycleLog, setNextAction],
  )

  // wait until period history contains lastPeriod so we get accurate next period start date
  useEffect(() => {
    const createCalendarEvents = async () => {
      if (!lastEntry) return
      if (!cycleLog.find((period) => period.id === lastEntry.id)) return

      const params = makePeriodEventsParams(cycleLog)

      if (nextAction === 'create-calendar') {
        setNextAction(undefined)
        setLastEntry(undefined)
        await createFriedEggsCalendar(params)
        setCreatingCalendar(false)
        setShowConnectGoogleModal(false)
      }

      if (params && nextAction === 'create-events') {
        setNextAction(undefined)
        setLastEntry(undefined)
        await createPeriodEvents(params)
      }
    }
    createCalendarEvents()
  }, [cycleLog, lastEntry, nextAction, createFriedEggsCalendar, createPeriodEvents])

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

  const handleDeletePeriod = useCallback(
    async (periodId: string) => {
      const period = cycleLog.find(({ id }) => id === periodId)
      if (period) {
        await deletePeriodEvents(period.id)
      }
      updateCycleLog({ type: 'delete-event', id: periodId })
    },
    [cycleLog, updateCycleLog, deletePeriodEvents],
  )

  const reversedAndAugmentedHistory = [...cycleLog].reverse().map((entry, index, array) => ({
    ...entry,
    ...(index < array.length - 1
      ? { daysSinceLastPeriod: differenceInDays(entry.date, array[index + 1]!.date) }
      : {}),
  }))

  return (
    <>
      <Formik
        initialValues={{
          periodDate: '',
          periodNotes: '',
        }}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        <AddPeriodForm />
      </Formik>
      <Fade in={showSavedToast}>
        <div className="pe-2 text-success text-end">Saved</div>
      </Fade>

      {reversedAndAugmentedHistory.length > 0 && (
        <ListGroup className="mb-3">
          {reversedAndAugmentedHistory.map(({ id, date, daysSinceLastPeriod, notes }) => (
            <ListGroup.Item key={id} className="d-flex flex-row">
              <div>
                <div className="h6">{format(date, 'MMMM do, yyyy')}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{notes}</div>
                {daysSinceLastPeriod && (
                  <div className="text-secondary fs-6">
                    {daysSinceLastPeriod} days since last period
                  </div>
                )}
              </div>
              <div className="ms-auto my-auto">
                <Button variant="outline-danger" onClick={() => handleDeletePeriod(id)}>
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

export default History
