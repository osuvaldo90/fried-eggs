export const isNotNil = <T>(x: T | null | undefined): x is T => x !== null && x !== undefined

export const assertUnreachable = (x: never): never => {
  throw new Error(`Didn't expect to get here ${x}`)
}
