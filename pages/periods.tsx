import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { format, parse } from 'date-fns'
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
            {[...periodHistory].reverse().map(({ id, date }) => (
              <ListGroup.Item key={id}>
                {format(date, 'MMMM do, yyyy')}
                <Button
                  className="float-end"
                  variant="outline-danger"
                  onClick={() => deletePeriod(id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </>
  )
}

export default History
