import 'bootstrap/dist/css/bootstrap.min.css'
import { addDays, subDays } from 'date-fns'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Col, Container, Nav, Row } from 'react-bootstrap'

import { usePeriodHistory } from '../lib/use-period-history'

const offset = () => {
  const x = Math.random()
  return x <= 0.33 ? 0 : x <= 0.67 ? 1 : 2
}

export default function App({ Component, pageProps }: AppProps) {
  const [periodHistory, addPeriod] = usePeriodHistory()
  const { pathname } = useRouter()

  const generatePeriodData = () => {
    const first = subDays(new Date(), 12 * 28)
    for (let i = 0; i < 14; i++) {
      addPeriod({ date: addDays(first, i * (28 - offset())) })
    }
  }

  return (
    <>
      <Head>
        <title>Fried Eggs</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Container fluid className="pt-1">
        <Row className="mb-4">
          <Col className="p-0">
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
                <Nav.Link as={Link} href="/add-period">
                  Add Period
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link as={Link} href="/history">
                  History
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        <Component {...pageProps} periodHistory={periodHistory} addPeriod={addPeriod} />

        <Row className="mt-4">
          <Col className="d-grid gap-1">
            <Button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
            >
              CLEAR
            </Button>
            <Button onClick={generatePeriodData}>GENERATE DATA</Button>
          </Col>
        </Row>
      </Container>
    </>
  )
}
