import { addDays, differenceInDays, format, parse, subDays } from 'date-fns'
import { Formik, FormikHelpers } from 'formik'
import _, { last, mean, zip } from 'lodash'
import React from 'react'
import { Accordion, Button, Col, Container, ListGroup, Row } from 'react-bootstrap'
import * as yup from 'yup'

import { RecordPeriodForm, RecordPeriodFormValues } from '../lib/components/RecordPeriodForm'
import { Period } from '../lib/types'
import { usePeriodHistory } from '../lib/use-period-history'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

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

const median = (nums: number[]) => {
  if (nums.length === 0) return 0
  if (nums.length === 1) return nums[0] as number

  const midpoint = Math.floor(nums.length / 2)
  const median =
    nums.length % 2 === 1
      ? (nums[midpoint] as number)
      : ((nums[midpoint - 1] as number) + (nums[midpoint] as number)) / 2
  return median
}

const crunchPeriods = (periodHistory: Period[]) => {
  if (periodHistory.length === 0) return undefined

  const cycleLengths = _(zip(periodHistory.slice(0, -1), periodHistory.slice(1)))
    .map(([a, b]) => differenceInDays(b!.date, a!.date))
    .sort()
    .value()

  const medianCycleLength = median(cycleLengths)

  return {
    averageCycleLength: mean(cycleLengths),
    medianCycleLength,
    nextCycleStart: addDays(last(periodHistory)!.date, medianCycleLength),
  }
}

const App = () => {
  const [periodHistory, pushPeriod] = usePeriodHistory()

  const handleSubmit = (
    { periodDate }: RecordPeriodFormValues,
    { setSubmitting, resetForm }: FormikHelpers<RecordPeriodFormValues>,
  ) => {
    console.log(typeof periodDate, periodDate)
    pushPeriod({ date: parse(periodDate, 'yyyy-MM-dd', new Date()) })
    resetForm()
    setSubmitting(false)
  }

  const generatePeriodData = () => {
    const first = subDays(new Date(), 12 * 28)
    for (let i = 0; i < 14; i++) {
      pushPeriod({ date: addDays(first, i * (28 - offset())) })
    }
  }

  const statistics = crunchPeriods(periodHistory)

  return (
    <Container>
      <Row className="mt-4">
        <Col>
          <Accordion defaultActiveKey={statistics ? 'statistics' : 'recordPeriod'}>
            {statistics && (
              <Accordion.Item eventKey="statistics">
                <Accordion.Header>Statistics</Accordion.Header>
                <Accordion.Body>
                  <p>
                    Your average cycle length is
                    <br />
                    <span className="fw-bold">{statistics.averageCycleLength} days</span>
                  </p>
                  <p>
                    Your median cycle length is
                    <br />
                    <span className="fw-bold">{statistics.medianCycleLength} days</span>
                  </p>
                  <p>
                    Your next period may start on
                    <br />
                    <span className="fw-bold">
                      {format(statistics.nextCycleStart, 'MMMM do, yyyy')}
                    </span>
                  </p>
                </Accordion.Body>
              </Accordion.Item>
            )}

            <Accordion.Item eventKey="recordPeriod">
              <Accordion.Header>Record Period</Accordion.Header>
              <Accordion.Body>
                <Formik
                  initialValues={{
                    periodDate: '',
                  }}
                  onSubmit={handleSubmit}
                  validationSchema={validationSchema}
                >
                  <RecordPeriodForm />
                </Formik>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="periodHistory">
              <Accordion.Header>Period History</Accordion.Header>
              <Accordion.Body>
                <ListGroup>
                  {_(periodHistory ?? [])
                    .reverse()
                    .map(({ id, date }) => (
                      <ListGroup.Item key={id}>{format(date, 'MMMM do, yyyy')}</ListGroup.Item>
                    ))
                    .value()}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col className="d-grid gap-1">
          <Button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
          >
            CLEAR
          </Button>
          <Button onClick={generatePeriodData}>GENERATE DATA</Button>
        </Col>
      </Row>
    </Container>
  )
}

export default App
