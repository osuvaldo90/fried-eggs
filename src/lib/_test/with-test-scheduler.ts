import { RunHelpers, TestScheduler } from 'rxjs/testing'

export const withTestScheduler = (fn: (testScheduler: RunHelpers) => void) => {
  const testScheduler = new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })

  return () => testScheduler.run(fn)
}
