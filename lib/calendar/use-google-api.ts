/// <reference types="gapi"/>

export type TokenClient = {
  requestAccessToken: (config: { prompt: string }) => void
  callback: () => void
}

import { isNil } from 'lodash'
import { useEffect, useState } from 'react'

export const useGapiClient = () => {
  const [gapiClient, setGapiClient] = useState<typeof gapi.client | undefined>()

  useEffect(() => {
    if (!isNil(window.gapi?.client?.calendar)) {
      setGapiClient(window.gapi.client)
      return
    }

    const element = document.getElementsByTagName('script')[0]!
    const gapiJs = document.createElement('script')
    gapiJs.src = '//apis.google.com/js/api.js'
    gapiJs.async = true
    gapiJs.defer = true
    element.parentNode!.insertBefore(gapiJs, element)
    gapiJs.onload = () => {
      gapi.load('client', async () => {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        const newClient = window.gapi.client

        await newClient.init({
          apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })

        await newClient.load('https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest')

        setGapiClient(newClient)
      })
    }
  }, [])

  return gapiClient
}
