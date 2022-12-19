import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { format } from 'date-fns'
import _ from 'lodash'
import { Button, Col, ListGroup, Row } from 'react-bootstrap'

import { Period } from '../lib/types'
import { DeletePeriod } from '../lib/use-period-history'

const History = ({
  periodHistory,
  deletePeriod,
}: {
  periodHistory: Period[]
  deletePeriod: DeletePeriod
}) => {
  return (
    <Row>
      <Col>
        <ListGroup>
          {[...periodHistory].reverse().map(({ id, date }) => (
            <ListGroup.Item key={id}>
              {format(date, 'MMMM do, yyyy')}
              <Button
                className="float-end"
                variant="outline-danger"
                onClick={() => deletePeriod(id)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
    </Row>
  )
}

export default History
