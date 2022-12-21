import '@fortawesome/fontawesome-svg-core/styles.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { config } from '@fortawesome/fontawesome-svg-core'
import { addDays, subDays } from 'date-fns'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Nav } from 'react-bootstrap'
import * as uuid from 'uuid'

import { usePeriodHistory } from '../lib/use-period-history'

config.autoAddCss = false

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

const isDevelopment = () => process.env.NODE_ENV === 'development'

export default function App({ Component, pageProps }: AppProps) {
  const [periodHistory, updatePeriodHistory] = usePeriodHistory()
  const { pathname } = useRouter()

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
    <>
      <Head>
        <title>Fried Eggs</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <div className="pt-1">
        <Nav
          fill
          className="justify-content-center"
          variant="tabs"
          defaultActiveKey="/"
          activeKey={pathname}
        >
          <Nav.Item>
            <Nav.Link as={Link} href="/">
              Home
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={Link} href="/periods">
              Periods
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      <div className="p-3">
        <Component
          {...pageProps}
          periodHistory={periodHistory}
          updatePeriodHistory={updatePeriodHistory}
        />

        {isDevelopment() && (
          <div className="mt-4 d-grid gap-1">
            <Button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
            >
              CLEAR
            </Button>
            <Button onClick={generatePeriodData}>GENERATE DATA</Button>
          </div>
        )}
      </div>
    </>
  )
}
