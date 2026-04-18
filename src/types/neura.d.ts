export {}

declare global {
  interface Window {
    _tfLoaded?: boolean
    cocoSsd?: any
    poseDetection?: any
    _poseDetReady?: boolean
  }
}
