import { Form, useFormikContext } from 'formik'
import React from 'react'
import { Button } from 'react-bootstrap'

import { makeInput } from './Input'

export type AddPeriodFormValues = {
  periodDate: string
  periodNotes: string
}

const Input = makeInput<AddPeriodFormValues>()

export const AddPeriodForm = () => {
  const formik = useFormikContext()
  return (
    <Form noValidate>
      <Input className="mb-1" name="periodDate" type="date" label="When did your period start?" />
      <Input className="mb-1" name="periodNotes" type="textarea" label="Notes" />
      <div className="d-grid">
        <Button type="submit" disabled={formik.isSubmitting}>
          Save
        </Button>
      </div>
    </Form>
  )
}
