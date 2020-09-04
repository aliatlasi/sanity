/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'
import {InspectDialog} from './inspectDialog'

interface Props {
  document: {isLoading: boolean; snapshot: any}
  onClose: () => void
}

export class InspectHistoryDialog extends React.PureComponent<Props> {
  render() {
    const {onClose, document} = this.props
    const {isLoading, snapshot} = document
    return isLoading ? <Spinner /> : <InspectDialog value={snapshot} onClose={onClose} />
  }
}