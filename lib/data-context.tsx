import { createContext, ReactNode, useContext, Dispatch } from 'react'

import { Period } from './periods/types'
import { PeriodHistoryAction, usePeriodHistory } from './periods/use-period-history'

type DataContext = {
  periodHistory: Period[]
  updatePeriodHistory: Dispatch<PeriodHistoryAction>
}

const DataContext = createContext<DataContext>({
  periodHistory: [],
  updatePeriodHistory: () => {},
})

export const useDataContext = () => useContext(DataContext)

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [periodHistory, updatePeriodHistory] = usePeriodHistory()

  return (
    <DataContext.Provider value={{ periodHistory, updatePeriodHistory }}>
      {children}
    </DataContext.Provider>
  )
}
