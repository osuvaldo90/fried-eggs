import { parse } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import { useState } from 'react'
import { Col, Fade, Row, Toast } from 'react-bootstrap'
import * as yup from 'yup'

import { RecordPeriodForm, RecordPeriodFormValues } from '../lib/components/RecordPeriodForm'
import { AddPeriod } from '../lib/use-period-history'

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

const AddPeriod = ({ addPeriod }: { addPeriod: AddPeriod }) => {
  const [showSavedToast, setShowSavedToast] = useState(false)

  const handleSubmit = (
    { periodDate }: RecordPeriodFormValues,
    { setSubmitting, resetForm }: FormikHelpers<RecordPeriodFormValues>,
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
            <RecordPeriodForm />
          </Formik>
          <Fade in={showSavedToast}>
            <div className="pe-2 text-success text-end">Saved</div>
          </Fade>
        </Col>
      </Row>
    </>
  )
}

export default AddPeriod
