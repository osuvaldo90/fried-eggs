import { useFormikContext } from 'formik'
import React from 'react'
import { Form } from 'react-bootstrap'

type Props<TValues, TName extends keyof TValues> = {
  className?: string
  name: TName & string
  type: string
  label: string
}

export const makeInput = <TValues extends Record<string, string>>() => {
  const Input = <TName extends keyof TValues>({
    className,
    name,
    type,
    label,
  }: Props<TValues, TName>) => {
    const { handleChange, errors, values } = useFormikContext<TValues>()
    const error = name in errors ? String(errors[name]) : undefined
    return (
      <Form.Group className={className}>
        <Form.Label>{label}</Form.Label>
        <Form.Control name={name} type={type} onChange={handleChange} value={values[name]} />
        <Form.Text>{error ?? <>&nbsp;</>}</Form.Text>
      </Form.Group>
    )
  }
  return Input
}
