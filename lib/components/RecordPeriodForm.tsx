import { Form, useFormikContext } from 'formik'
import React from 'react'
import { Button } from 'react-bootstrap'

import { TextInput } from './TextInput'

export type RecordPeriodFormValues = {
  periodDate: string
}

export const RecordPeriodForm = () => {
  const formik = useFormikContext()
  return (
    <Form noValidate>
      <TextInput
        className="mb-4"
        name="periodDate"
        type="date"
        label="When did your period start?"
      />
      <div className="d-grid">
        <Button type="submit" disabled={formik.isSubmitting}>
          Save
        </Button>
      </div>
    </Form>
  )
}
