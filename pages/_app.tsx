import '@fortawesome/fontawesome-svg-core/styles.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { config } from '@fortawesome/fontawesome-svg-core'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Col, Container, Nav, Row } from 'react-bootstrap'

import { DevTools } from '../lib/components/DevTools'
import { usePeriodHistory } from '../lib/periods/use-period-history'

config.autoAddCss = false

const isDevelopment = () => process.env.NODE_ENV === 'development'

export default function App({ Component, pageProps }: AppProps) {
  const [periodHistory, updatePeriodHistory] = usePeriodHistory()
  const { pathname } = useRouter()

  return (
    <Container fluid>
      <Row>
        <Col className="mx-auto" xs="12" sm="10" md="8" lg="6" xl="4">
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

          <Component
            {...pageProps}
            periodHistory={periodHistory}
            updatePeriodHistory={updatePeriodHistory}
          />

          {isDevelopment() && (
            <DevTools className="mt-4 d-grid gap-1" updatePeriodHistory={updatePeriodHistory} />
          )}
        </Col>
      </Row>
    </Container>
  )
}
