import { addSeconds } from 'date-fns'
import { isNil } from 'lodash'
import { useCallback, useEffect, useState } from 'react'

type TokenClientCallbackData = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

export type TokenClient = {
  requestAccessToken: (config?: { prompt: string }) => void
  callback: (token: TokenClientCallbackData) => void
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: { client_id: string; scope: string }) => TokenClient
        }
      }
    }
  }
}

export const useGoogleAccessToken = () => {
  const [tokenClient, setTokenClient] = useState<TokenClient>()
  const [tokenData, setTokenData] = useState<{ token: string; expiresAt: Date }>()

  useEffect(() => {
    const element = document.getElementsByTagName('script')[0]!
    const gsi = document.createElement('script')
    gsi.src = '//accounts.google.com/gsi/client'
    gsi.async = true
    gsi.defer = true
    element?.parentNode?.insertBefore(gsi, element)
    gsi.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) return

      const newTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar',
      })
      setTokenClient(newTokenClient)
    }
  }, [])

  const getAccessToken = useCallback(
    () =>
      new Promise<string>((resolve, reject) => {
        if (!isNil(tokenData) && new Date() < tokenData.expiresAt) {
          resolve(tokenData.token)
          return
        }

        if (!tokenClient) {
          reject(new Error('Token client unavailable'))
          return
        }

        tokenClient.callback = (data) => {
          setTokenData({
            token: data.access_token,
            expiresAt: addSeconds(new Date(), data.expires_in),
          })
          resolve(data.access_token)
        }
        tokenClient.requestAccessToken()
      }),
    [tokenClient, tokenData],
  )

  return { getAccessToken }
}
