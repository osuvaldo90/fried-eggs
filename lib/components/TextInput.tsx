import { useFormikContext } from 'formik'
import React from 'react'
import { Form } from 'react-bootstrap'

type Props<TName extends string> = {
  className?: string
  name: TName
  type: string
  label: string
}

export const TextInput = <TName extends string>({ className, name, type, label }: Props<TName>) => {
  const { handleChange, errors } = useFormikContext<{ [k in TName]: unknown }>()
  const error = name in errors ? String(errors[name]) : undefined
  return (
    <Form.Group className={className}>
      <Form.Label>{label}</Form.Label>
      <Form.Control name={name} type={type} onChange={handleChange} />
      {error && <Form.Text>{error}</Form.Text>}
    </Form.Group>
  )
}
