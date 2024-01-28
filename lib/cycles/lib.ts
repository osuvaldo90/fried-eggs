import { addDays, differenceInDays, subDays } from 'date-fns'
import _, { last, mean, zip } from 'lodash'

import { Period } from './types'

const calculateMedian = (nums: number[]) => {
  if (nums.length === 0) return 0
  if (nums.length === 1) return nums[0] as number

  const midpoint = Math.floor(nums.length / 2)
  const median =
    nums.length % 2 === 1
      ? (nums[midpoint] as number)
      : ((nums[midpoint - 1] as number) + (nums[midpoint] as number)) / 2
  return median
}

export const crunchPeriods = (periodHistory: Period[]) => {
  if (periodHistory.length === 0) return undefined
  if (periodHistory.length === 1) return { nextPeriodStart: addDays(periodHistory[0]!.date, 28) }

  const cycleLengths = _(zip(periodHistory.slice(0, -1), periodHistory.slice(1)))
    .map(([a, b]) => differenceInDays(b!.date, a!.date))
    .sort()
    .value()

  const medianCycleLength = calculateMedian(cycleLengths)

  return {
    averageCycleLength: mean(cycleLengths),
    medianCycleLength,
    nextPeriodStart: addDays(last(periodHistory)!.date, medianCycleLength),
  }
}

export const calculateDangerZoneFromOvulationDate = (ovulationDate: Date) => {
  const start = subDays(ovulationDate, 2)
  const end = addDays(ovulationDate, 5)
  return { start, end }
}

export const calculateDangerZone = (period: Period) => {
  const start = addDays(period.date, 7)
  const end = addDays(start, 7)
  return { start, end }
}

export const makePeriodEventsParams = (periodHistory: Period[]) => {
  const lastPeriod = last(periodHistory)

  if (!lastPeriod) return undefined

  const dangerZone = calculateDangerZone(lastPeriod)
  const { nextPeriodStart } = crunchPeriods(periodHistory)!

  return {
    periodId: lastPeriod.id,
    dangerZone: {
      start: dangerZone.start,
      end: dangerZone.end,
    },
    nextPeriodStart,
  }
}
