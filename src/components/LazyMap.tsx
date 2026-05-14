import { lazy, Suspense, type ComponentProps } from 'react'

const RideMap = lazy(() => import('./booking/RideMap').then((module) => ({ default: module.RideMap })))

export function LazyMap(props: ComponentProps<typeof RideMap>) {
  return (
    <Suspense fallback={
      <div style={{ height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#666', fontSize: 13 }}>Loading map...</span>
      </div>
    }>
      <RideMap {...props} />
    </Suspense>
  )
}
