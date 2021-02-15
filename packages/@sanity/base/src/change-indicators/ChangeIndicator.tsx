import {useLayer} from '@sanity/ui'
import React from 'react'
import deepCompare from 'react-fast-compare'
import * as PathUtils from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {useReporter} from './tracker'
import {ChangeIndicatorContext} from './ChangeIndicatorContext'
import {ChangeBar} from './ChangeBar'
import {EMPTY_ARRAY} from './constants'

const isPrimitive = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  typeof value === 'undefined' ||
  typeof value === 'number'

const canCompareShallow = (valueA: unknown, valueB: unknown): boolean => {
  if (
    typeof valueA === 'undefined' ||
    typeof valueB === 'undefined' ||
    typeof valueA === null ||
    typeof valueB === null
  ) {
    return true
  }

  return isPrimitive(valueA) && isPrimitive(valueB)
}

const ChangeBarWrapper = (
  props: React.ComponentProps<'div'> & {
    isChanged: boolean
    hasFocus: boolean
    fullPath: Path
    children: React.ReactNode
  }
) => {
  const layer = useLayer()
  const [hasHover, setHover] = React.useState(false)
  const onMouseEnter = React.useCallback(() => setHover(true), [])
  const onMouseLeave = React.useCallback(() => setHover(false), [])
  const ref = React.useRef<HTMLDivElement | null>(null)

  useReporter(
    `field-${PathUtils.toString(props.fullPath)}`,
    () => ({
      element: ref.current!,
      path: PathUtils.pathFor(props.fullPath),
      isChanged: props.isChanged,
      hasFocus: props.hasFocus,
      hasHover: hasHover,
      zIndex: layer.zIndex,
    }),
    // note: deepCompare should be ok here since we're not comparing deep values
    deepCompare
  )

  return (
    <div
      ref={ref}
      className={props.className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ChangeBar hasFocus={props.hasFocus} isChanged={props.isChanged}>
        {props.children}
      </ChangeBar>
    </div>
  )
}

export function ChangeIndicatorScope(props: {path: Path; children?: React.ReactNode}) {
  const parentContext = React.useContext(ChangeIndicatorContext)

  return (
    <ChangeIndicatorProvider
      path={PathUtils.pathFor(props.path)}
      focusPath={parentContext.focusPath}
      value={PathUtils.get(parentContext.value, PathUtils.pathFor(props.path))}
      compareValue={PathUtils.get(parentContext.compareValue, PathUtils.pathFor(props.path))}
    >
      {props.children}
    </ChangeIndicatorProvider>
  )
}

export const ChangeIndicatorProvider = React.memo(function ChangeIndicatorProvider(props: {
  path: Path
  focusPath: Path
  value: any
  compareValue: any
  children: React.ReactNode
}) {
  const parentContext = React.useContext(ChangeIndicatorContext)

  const path = PathUtils.pathFor(props.path)
  const focusPath = PathUtils.pathFor(props.focusPath || [])
  const fullPath = React.useMemo(() => PathUtils.pathFor(parentContext.fullPath.concat(path)), [
    parentContext.fullPath,
    path,
  ])

  React.useEffect(() => {
    console.log(`path changed`, path)
  }, [path])
  React.useEffect(() => {
    console.log(`focusPath changed`, focusPath)
  }, [focusPath])

  React.useEffect(() => {
    console.log(`fullPath changed`, fullPath)
  }, [fullPath])

  React.useEffect(() => {
    console.log(`value changed`, props.value)
  }, [props.value])

  React.useEffect(() => {
    console.log(`compareValue changed`, props.compareValue)
  }, [props.compareValue])

  const contextValue = React.useMemo(() => {
    console.log('context change!', fullPath)
    return {
      value: props.value,
      compareValue: props.compareValue,
      focusPath,
      path,
      fullPath,
    }
  }, [fullPath, props.value, props.compareValue, focusPath, path])
  return (
    <ChangeIndicatorContext.Provider value={contextValue}>
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
})

interface CoreProps {
  className?: string
  hidden?: boolean
  fullPath: Path
  compareDeep: boolean
  value: unknown
  hasFocus: boolean
  compareValue: unknown
  children?: React.ReactNode
}

export const CoreChangeIndicator = ({
  className,
  hidden,
  fullPath,
  value,
  compareValue,
  hasFocus,
  compareDeep,
  children,
}: CoreProps) => {
  // todo: lazy compare debounced (possibly with intersection observer)
  const isChanged =
    (canCompareShallow(value, compareValue) && value !== compareValue) ||
    (compareDeep && !deepCompare(value, compareValue))

  if (hidden) {
    return <>{children}</>
  }

  return (
    <ChangeBarWrapper
      className={className}
      isChanged={isChanged}
      fullPath={PathUtils.pathFor(fullPath)}
      hasFocus={hasFocus}
    >
      {children}
    </ChangeBarWrapper>
  )
}

export const ChangeIndicatorWithProvidedFullPath = ({
  className,
  hidden,
  path,
  value,
  hasFocus,
  compareDeep,
  children,
}: any) => {
  const parentContext = React.useContext(ChangeIndicatorContext)

  const canonicalPath = PathUtils.pathFor(path)

  const fullPath = React.useMemo(
    () => PathUtils.pathFor(parentContext.fullPath.concat(canonicalPath)),
    [parentContext.fullPath, canonicalPath]
  )
  return (
    <CoreChangeIndicator
      hidden={hidden}
      className={className}
      value={value}
      compareValue={PathUtils.get(parentContext.compareValue, canonicalPath)}
      hasFocus={hasFocus}
      fullPath={fullPath}
      compareDeep={compareDeep}
    >
      {children}
    </CoreChangeIndicator>
  )
}

export interface ChangeIndicatorContextProvidedProps {
  className?: string
  compareDeep?: boolean
  children?: React.ReactNode
  disabled?: boolean
}

export const ChangeIndicatorCompareValueProvider = (props: {
  value: any
  compareValue: any
  children: React.ReactNode
}) => {
  const parentContext = React.useContext(ChangeIndicatorContext)

  const contextValue = React.useMemo(() => {
    return {
      value: props.value,
      compareValue: props.compareValue,
      focusPath: PathUtils.pathFor(parentContext.focusPath || EMPTY_ARRAY),
      path: parentContext.path,
      fullPath: parentContext.fullPath,
    }
  }, [
    parentContext.focusPath,
    parentContext.path,
    parentContext.fullPath,
    props.value,
    props.compareValue,
  ])
  return (
    <ChangeIndicatorContext.Provider value={contextValue}>
      {props.children}
    </ChangeIndicatorContext.Provider>
  )
}

export const ContextProvidedChangeIndicator = (props: ChangeIndicatorContextProvidedProps) => {
  const context = React.useContext(ChangeIndicatorContext)
  const {value, compareValue, path, focusPath, fullPath} = context
  React.useEffect(() => {
    console.log('fullpath changed!', fullPath)
  }, [fullPath])
  return props.disabled ? (
    <>{props.children}</>
  ) : (
    <CoreChangeIndicator
      fullPath={PathUtils.pathFor(fullPath)}
      value={value}
      compareValue={compareValue}
      hasFocus={PathUtils.hasFocus(focusPath, path)}
      compareDeep={props.compareDeep || false}
      className={props.className}
    >
      {props.children}
    </CoreChangeIndicator>
  )
}

export const ChangeIndicator = ContextProvidedChangeIndicator
