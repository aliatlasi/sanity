import {FormFieldPresence} from '@sanity/base/presence'
import {ArraySchemaType, Marker, Path} from '@sanity/types'
import React from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import PatchEvent from '../../../PatchEvent'
import {ItemValue} from '../typedefs'
import {ArrayInputGridItem} from './ArrayInputGridItem'
import {ArrayInputListItem} from './ArrayInputListItem'

interface ArrayInputItemProps {
  compareValue?: any[]
  layout?: 'media' | 'default'
  level: number
  index: number
  markers: Marker[]
  type: ArraySchemaType
  value: ItemValue
  onRemove: (value: ItemValue) => void
  onChange: (event: PatchEvent, value: ItemValue) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  filterField: () => any
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

export function ArrayInputItem(props: ArrayInputItemProps) {
  const elementRef = React.useRef<HTMLDivElement>()
  const hadChildFocus = React.useRef(false)
  const hasChildFocus = props.focusPath.length > 1

  React.useEffect(() => {
    // console.log(elementRef.current)
    if (elementRef.current && hadChildFocus.current === false && hasChildFocus) {
      scrollIntoView(elementRef.current, {scrollMode: 'if-needed'})
    }
    hadChildFocus.current = hasChildFocus
  }, [hasChildFocus])

  const options = props.type.options || {}

  if (options.layout === 'grid') {
    return (
      <div ref={elementRef}>
        <ArrayInputGridItem {...props} />
      </div>
    )
  }

  return (
    <div ref={elementRef}>
      <ArrayInputListItem {...props} />
    </div>
  )
}
