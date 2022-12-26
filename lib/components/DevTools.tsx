import { addDays, subDays } from 'date-fns'
import { Dispatch, useCallback, useEffect } from 'react'
import { Button } from 'react-bootstrap'
import * as uuid from 'uuid'

// import { useGoogleAccessToken } from '../use-google-access-token'
import { useGoogleApi } from '../use-google-api'
import { PeriodHistoryAction } from '../use-period-history'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

export const DevTools = ({
  className,
  updatePeriodHistory,
}: {
  className: string
  updatePeriodHistory: Dispatch<PeriodHistoryAction>
}) => {
  const { gapiClient } = useGoogleApi()
  // const { accessToken, requestAccessToken } = useGoogleAccessToken()

  // useEffect(() => {
  //   if (!tokenClient || !gapiClient) return
  //   tokenClient.callback = (...args: unknown[]) => {
  //     console.log('CALLBACK', args)
  //     console.log('TOKEN', gapiClient?.getToken())
  //   }
  //   tokenClient.requestAccessToken({ prompt: 'consent' })
  // }, [tokenClient, gapiClient])

  // const handleConnectGoogleClick = useCallback(() => {
  //   if (!tokenClient || !gapiClient) return
  //   console.log('TOKEN', gapiClient?.getToken())

  //   console.log(gapiClient, tokenClient)

  //   if (!gapiToken) {
  //     tokenClient.callback = (...args: unknown[]) => {
  //       console.log('CALLBACK', args)
  //       console.log('TOKEN', gapiClient?.getToken())
  //     }

  //     tokenClient.requestAccessToken({ prompt: '' })
  //   }
  // }, [tokenClient, gapiToken, gapiClient])

  // const handleConnectGoogleClick = useCallback(() => {
  //   if (!gsiInitialized) return
  //   console.log('prompt!')
  //   window.google.accounts.id.prompt((...args: unknown[]) => {
  //     console.log('PROMPT CALLBACK', args)
  //   })
  // }, [gsiInitialized])

  const generatePeriodData = () => {
    const first = subDays(new Date(), 12 * 28)
    for (let i = 0; i < 14; i++) {
      updatePeriodHistory({
        type: 'add-period',
        period: { id: uuid.v4(), date: addDays(first, i * (28 - offset())) },
      })
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={() => {
          localStorage.clear()
          window.location.reload()
        }}
      >
        CLEAR
      </Button>
      <Button onClick={generatePeriodData}>GENERATE DATA</Button>
      {/* {gapiClient && (
        <Button
          onClick={async () => {
            await requestAccessToken()
          }}
        >
          CONNECT GOOGLE
        </Button>
      )} */}
    </div>
  )
}
