/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
let AUDIO_CONTEXT: AudioContext | undefined
let _listenerAttached = false

function ensureAudioContextListener(): void {
  if (_listenerAttached) return
  _listenerAttached = true

  const event =
    typeof document.ontouchstart === 'undefined'
      ? 'mousedown'
      : 'touchstart'
  const initAudioContext = () => {
    document.removeEventListener(event, initAudioContext)
    AUDIO_CONTEXT = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  document.addEventListener(event, initAudioContext)
}

export default function (): AudioContext | undefined {
  ensureAudioContextListener()
  return AUDIO_CONTEXT
}
