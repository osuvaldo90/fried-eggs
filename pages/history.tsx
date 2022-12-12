import { format } from 'date-fns'
import _ from 'lodash'
import { Col, Container, ListGroup, Row } from 'react-bootstrap'

import { Period } from '../lib/types'

const History = ({ periodHistory }: { periodHistory: Period[] }) => {
  return (
    <Row>
      <Col>
        <ListGroup>
          {_(periodHistory ?? [])
            .reverse()
            .map(({ id, date }) => (
              <ListGroup.Item key={id}>{format(date, 'MMMM do, yyyy')}</ListGroup.Item>
            ))
            .value()}
        </ListGroup>
      </Col>
    </Row>
  )
}

export default History
