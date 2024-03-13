'use client'

import '@fortawesome/fontawesome-svg-core/styles.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import { config } from '@fortawesome/fontawesome-svg-core'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Col, Container, Nav, Row } from 'react-bootstrap'

import { AppProvider } from '../lib/app-context'
import { DevTools } from '../lib/components/DevTools'

config.autoAddCss = false

const isDevelopment = () => process.env.NODE_ENV === 'development'

const Layout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  return (
    <html>
      <head>
        <title>Fried Eggs</title>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body>
        <Container fluid>
          <Row>
            <Col className="mx-auto" xs="12" sm="10" md="8" lg="6" xl="4">
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
                    <Nav.Link as={Link} href="/cycles">
                      Cycles
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              <AppProvider>
                {children}

                {isDevelopment() && <DevTools className="mt-4 d-grid gap-1" />}
              </AppProvider>
            </Col>
          </Row>
        </Container>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

export default Layout
