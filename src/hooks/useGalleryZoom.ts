import { useCallback, useEffect, useRef, useState } from 'react'

export const GALLERY_MIN_ZOOM = 1
export const GALLERY_MAX_ZOOM = 4

export function useGalleryZoom(resetKey: string | number) {
  const stageRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  )
  const movedRef = useRef(0)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const commit = useCallback((next: { scale: number; x: number; y: number }) => {
    const nextScale = Math.min(GALLERY_MAX_ZOOM, Math.max(GALLERY_MIN_ZOOM, next.scale))
    const x = nextScale <= GALLERY_MIN_ZOOM ? 0 : next.x
    const y = nextScale <= GALLERY_MIN_ZOOM ? 0 : next.y
    transformRef.current = { scale: nextScale, x, y }
    setScale(nextScale)
    setPan({ x, y })
  }, [])

  const zoomToward = useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const stage = stageRef.current
      const current = transformRef.current
      const target = Math.min(GALLERY_MAX_ZOOM, Math.max(GALLERY_MIN_ZOOM, nextScale))
      if (!stage) {
        commit({ scale: target, x: 0, y: 0 })
        return
      }
      const rect = stage.getBoundingClientRect()
      const px = clientX - rect.left - rect.width / 2
      const py = clientY - rect.top - rect.height / 2
      const k = target / current.scale
      commit({
        scale: target,
        x: px - k * (px - current.x),
        y: py - k * (py - current.y),
      })
    },
    [commit],
  )

  const zoomBy = useCallback(
    (factor: number) => {
      const stage = stageRef.current
      if (!stage) {
        commit({ scale: transformRef.current.scale * factor, x: 0, y: 0 })
        return
      }
      const rect = stage.getBoundingClientRect()
      zoomToward(
        transformRef.current.scale * factor,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      )
    },
    [commit, zoomToward],
  )

  useEffect(() => {
    commit({ scale: 1, x: 0, y: 0 })
  }, [commit, resetKey])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (event: WheelEvent) => {
      if (transformRef.current.scale <= GALLERY_MIN_ZOOM) return
      event.preventDefault()
      event.stopPropagation()
      const factor = event.deltaY > 0 ? 0.8 : 1.35
      zoomToward(transformRef.current.scale * factor, event.clientX, event.clientY)
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [resetKey, zoomToward])

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    movedRef.current = 0
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const points = [...pointersRef.current.values()]
    if (points.length === 2) {
      dragRef.current = null
      pinchRef.current = {
        dist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
        scale: transformRef.current.scale,
      }
      return
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: transformRef.current.x,
      panY: transformRef.current.y,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    const points = [...pointersRef.current.values()]
    if (points.length >= 2 && pinchRef.current) {
      if (pinchRef.current.scale <= GALLERY_MIN_ZOOM) return
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const midX = (points[0].x + points[1].x) / 2
      const midY = (points[0].y + points[1].y) / 2
      const next = pinchRef.current.scale * (dist / Math.max(pinchRef.current.dist, 1))
      zoomToward(next, midX, midY)
      return
    }
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    movedRef.current = Math.max(movedRef.current, Math.hypot(dx, dy))
    if (transformRef.current.scale <= 1 || movedRef.current < 8) return
    commit({
      scale: transformRef.current.scale,
      x: drag.panX + dx,
      y: drag.panY + dy,
    })
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) dragRef.current = null
  }

  return {
    stageRef,
    scale,
    pan,
    zoomed: scale > 1.02,
    zoomBy,
    transformRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
