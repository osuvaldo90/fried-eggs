import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { differenceInDays, format, parse } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import _ from 'lodash'
import { useState } from 'react'
import { Button, Col, Fade, ListGroup, Row } from 'react-bootstrap'
import * as yup from 'yup'

import { AddPeriodForm, AddPeriodFormValues } from '../lib/components/AddPeriodForm'
import { Period } from '../lib/types'
import { AddPeriod, DeletePeriod } from '../lib/use-period-history'

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

const History = ({
  periodHistory,
  addPeriod,
  deletePeriod,
}: {
  periodHistory: Period[]
  addPeriod: AddPeriod
  deletePeriod: DeletePeriod
}) => {
  const [showSavedToast, setShowSavedToast] = useState(false)

  const handleSubmit = (
    { periodDate }: AddPeriodFormValues,
    { setSubmitting, resetForm }: FormikHelpers<AddPeriodFormValues>,
  ) => {
    addPeriod({ date: parse(periodDate, 'yyyy-MM-dd', new Date()) })
    resetForm()
    setSubmitting(false)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const reversedAndAugmentedHistory = [...periodHistory].reverse().map((period, index, array) => ({
    ...period,
    ...(index < array.length - 1
      ? { daysSinceLastPeriod: differenceInDays(period.date, array[index + 1]!.date) }
      : {}),
  }))

  return (
    <>
      <Row>
        <Col>
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
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <ListGroup>
            {reversedAndAugmentedHistory.map(({ id, date, daysSinceLastPeriod }) => (
              <ListGroup.Item key={id} className="d-flex flex-row">
                <div>
                  <div className="fw-bold">{format(date, 'MMMM do, yyyy')}</div>
                  {daysSinceLastPeriod && <div>{daysSinceLastPeriod} days since last period</div>}
                </div>
                <div className="ms-auto my-auto">
                  <Button variant="outline-danger" onClick={() => deletePeriod(id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </>
  )
}

export default History
