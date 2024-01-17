import { Form, useFormikContext } from 'formik'
import React from 'react'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'

import { makeInput } from './Input'

export type AddLogEntryFormValues = {
  logEntryType: 'period' | 'ovulation'
  logEntryDate: string
  logEntryNotes: string
}

const Input = makeInput<AddLogEntryFormValues>()

export const AddLogEntryForm = () => {
  const formik = useFormikContext<AddLogEntryFormValues>()

  console.log('form', formik.values, formik.errors)

  const dateLabel =
    formik.values.logEntryType === 'ovulation'
      ? 'When did you start ovulating?'
      : 'When did your period start?'

  const submitLabel = formik.values.logEntryType === 'ovulation' ? 'Save ovulation' : 'Save period'

  return (
    <Form noValidate>
      <ToggleButtonGroup
        className="d-flex my-2"
        type="radio"
        name="logEntryType"
        defaultValue="period"
      >
        <ToggleButton
          id="log-entry-type-period"
          variant="outline-primary"
          value="period"
          onChange={formik.handleChange}
        >
          Period
        </ToggleButton>
        <ToggleButton
          id="log-entry-type-ovulation"
          variant="outline-primary"
          value="ovulation"
          onChange={formik.handleChange}
        >
          Ovulation
        </ToggleButton>
      </ToggleButtonGroup>

      <Input className="mb-1" name="logEntryDate" type="date" label={dateLabel} />
      <Input className="mb-1" name="logEntryNotes" type="textarea" label="Notes" />
      <div className="d-grid">
        <Button type="submit" disabled={formik.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </Form>
  )
}
