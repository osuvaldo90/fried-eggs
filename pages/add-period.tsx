import { parse } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import { Col, Row } from 'react-bootstrap'
import * as yup from 'yup'

import { RecordPeriodForm, RecordPeriodFormValues } from '../lib/components/RecordPeriodForm'
import { PushPeriod } from '../lib/use-period-history'

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

const AddPeriod = ({ pushPeriod }: { pushPeriod: PushPeriod }) => {
  const handleSubmit = (
    { periodDate }: RecordPeriodFormValues,
    { setSubmitting, resetForm }: FormikHelpers<RecordPeriodFormValues>,
  ) => {
    console.log(typeof periodDate, periodDate)
    pushPeriod({ date: parse(periodDate, 'yyyy-MM-dd', new Date()) })
    resetForm()
    setSubmitting(false)
  }

  return (
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
      </Col>
    </Row>
  )
}

export default AddPeriod
