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
import { serializeHistory } from '../lib/periods/data'
import { Period } from '../lib/periods/types'

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
    periodHistory,
    updatePeriodHistory,
    calendarData,
    createFriedEggsCalendar,
    createDangerZoneEvent,
    deleteDangerZoneEvent,
  } = useAppContext()
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>()
  const importDataFileRef = useRef<HTMLInputElement | null>(null)
  const downloadDataRef = useRef<HTMLAnchorElement>(null)
  const [lastPeriod, setLastPeriod] = useState<Period>()
  const [showConnectGoogleModal, setShowConnectGoogleModal] = useState(false)
  const [creatingCalendar, setCreatingCalendar] = useState(false)

  useEffect(() => {
    const blob = new Blob([serializeHistory(periodHistory)], { type: 'application/octet-stream' })
    setDownloadUrl(URL.createObjectURL(blob))
  }, [periodHistory])

  const handleSubmit = useCallback(
    async (
      { periodDate }: AddPeriodFormValues,
      { setSubmitting, resetForm }: FormikHelpers<AddPeriodFormValues>,
    ) => {
      const period = { id: uuid.v4(), date: parse(periodDate, 'yyyy-MM-dd', new Date()) }
      updatePeriodHistory({ type: 'add-period', period })
      setLastPeriod(period)
      resetForm()
      setSubmitting(false)
      setShowSavedToast(true)
      setTimeout(() => setShowSavedToast(false), 3000)

      if (calendarData === 'uninitialized') {
        setShowConnectGoogleModal(true)
      } else if (typeof calendarData === 'object') {
        await createDangerZoneEvent(period)
      }
    },
    [calendarData, createDangerZoneEvent, updatePeriodHistory],
  )

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
        updatePeriodHistory({ type: 'import', data })
        importDataFileRef.current!.value = ''
      }
    },
    [updatePeriodHistory],
  )

  const handleDeletePeriod = useCallback(
    async (periodId: string) => {
      const period = periodHistory.find(({ id }) => id === periodId)
      if (period) {
        await deleteDangerZoneEvent(period)
      }
      updatePeriodHistory({ type: 'delete-period', id: periodId })
    },
    [periodHistory, updatePeriodHistory, deleteDangerZoneEvent],
  )

  const reversedAndAugmentedHistory = [...periodHistory].reverse().map((period, index, array) => ({
    ...period,
    ...(index < array.length - 1
      ? { daysSinceLastPeriod: differenceInDays(period.date, array[index + 1]!.date) }
      : {}),
  }))

  return (
    <>
      <Formik
        initialValues={{
          periodDate: '',
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
          {reversedAndAugmentedHistory.map(({ id, date, daysSinceLastPeriod }) => (
            <ListGroup.Item key={id} className="d-flex flex-row">
              <div>
                <div className="fw-bold">{format(date, 'MMMM do, yyyy')}</div>
                {daysSinceLastPeriod && <div>{daysSinceLastPeriod} days since last period</div>}
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
              await createFriedEggsCalendar(lastPeriod)
              setCreatingCalendar(false)
              setShowConnectGoogleModal(false)
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
