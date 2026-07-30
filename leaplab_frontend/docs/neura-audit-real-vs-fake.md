# Neura Module Audit: Real vs Fake Implementation

> Generated: 2026-07-30
> **Status: All listed fixes have been applied ✅**

## Legend

| Status | Meaning |
|--------|---------|
| **REAL** | Uses actual TF.js models + real training/prediction |
| **MIXED** | Has real ML core but fake/simulated display parts |
| **FAKE** | Fabricated metrics, no real computation |
| **FAKE (rule-based)** | Deterministic heuristics — intentionally not ML |
| **UI SHELL** | Purely presentational; logic lives in parent |

---

## ML Engine (src/neura/ml/)

| # | File | Status | What's Real | What's Fake | Fix Recommendation |
|---|------|--------|-------------|-------------|-------------------|
| 1 | `ml/classifiers/ImageClassifier.ts` | **REAL** | MobileNetV2 feature extractor (CDN) + real KNN with LOO cross-validation | — | ✅ None needed |
| 2 | `ml/classifiers/PoseClassifier.ts` | **REAL** | MoveNet (SINGLEPOSE_LIGHTNING) pose detection + KNN | — | ✅ None needed |
| 3 | `ml/classifiers/HandPoseClassifier.ts` | **REAL** | MediaPipe Hands landmark detection + 78-d feature engineering + KNN | — | ✅ None needed |
| 4 | `ml/classifiers/TextClassifier.ts` | **REAL** | Universal Sentence Encoder (CDN) + KNN | — | ✅ None needed |
| 5 | `ml/classifiers/NumberClassifier.ts` | **REAL** | TF.js canvas-to-tensor + digit isolation + KNN on 784-d pixel features | — | ✅ None needed |
| 6 | `ml/classifiers/AudioClassifier.ts` | **FIXED ✅** | KNN (real), Web Audio API capture, proper Cooley-Tukey FFT + Hann windowing + `@tensorflow-models/speech-commands` loader | Previously: naive O(n²) DFT | ✅ Replaced with proper FFT + speech-commands recognizer |
| 7 | `ml/classifiers/ObjectDetector.ts` | **REAL** | COCO-SSD (CDN) real object detection | — | ✅ None needed |
| 8 | `ml/classifiers/CustomObjectDetector.ts` | **REAL** | MobileNetV2 + multi-scale sliding window + NMS + KNN | — | ✅ None needed |
| 9 | `ml/KNNClassifier.ts` | **REAL** | Real TF.js cosine-similarity KNN with adaptive k, distance-weighted voting, LOO CV support | — | ✅ None needed |
| 10 | `ml/ObjectDetectionTrainer.ts` | **FIXED ✅** | Real `CustomObjectDetector.trainFromAnnotations()` with honest progress tracking | Previously: fake epoch simulation with fabricated loss/mAP/precision/recall curves | ✅ Removed fake Phase 2; shows real annotation processing progress only |
| 11 | `ml/ModelExporter.ts` | **FIXED ✅** | Honest JSON metadata export with real training data | Previously: fake TFJS/ONNX/TFLite scaffold exports | ✅ Removed all fake export formats; keeps only JSON |
| 12 | `ml/KaggleDatasetProvider.ts` | **REAL** | Real HTTP API calls to Kaggle API + JSZip extraction | — | ✅ None needed |
| 13 | `ml/loadScript.ts` | **REAL** | Real CDN script loader with retry + dedup + backend init | — | ✅ None needed |
| 14 | `ml/utils/geometry.ts` | **REAL** | Pure math (angle, distance, midpoint) | — | ✅ None needed |
| 15 | `ml/utils/ruleBasedClassifiers.ts` | **REAL (by design)** | Deterministic rule-based heuristics (finger counting, posture, rep state, etc.) | — | ✅ Not fake — explicitly intended as rule-based alternative to ML |

---

## UI Panels (src/neura/ui/panels/)

| # | File | Status | What's Real | What's Fake | Fix Recommendation |
|---|------|--------|-------------|-------------|-------------------|
| 16 | `ui/panels/EvaluatePanel.tsx` | **FIXED ✅** | Deterministic metrics from real sample counts + `mode.accuracy`; accepts trainer for real `getSampleCounts()` | Previously: `Math.random()` based fabricated metrics | ✅ Removed all randomness; metrics are now deterministic estimates from real training data |
| 17 | `ui/panels/TrainPanel.tsx` | **FIXED ✅** | Shows real progress from `ObjectDetectionTrainer` with honest progress bar and sample/class counts | Previously: fake epoch simulation with fabricated loss/mAP charts | ✅ Stripped to honest progress display |
| 18 | `ui/panels/AnnotatePanel.tsx` | **REAL** | Real COCO-SSD auto-detection + bounding box tools + undo/redo | — | ✅ None needed |

---

## UI Components (src/neura/ui/components/)

| # | File | Status | What's Real | What's Fake | Fix Recommendation |
|---|------|--------|-------------|-------------|-------------------|
| 19 | `ui/components/TestPanel.tsx` | **UI SHELL** | Displays prediction results passed as props | No inference — purely presentational | ✅ Correct by design (parent panels do real inference) |
| 20 | `ui/components/TrainPanel.tsx` | **UI SHELL** | Calls `onTrain` callback from parent | No training logic — purely presentational | ✅ Correct by design (parent panels do real training) |

---

## M1 Projects (src/neura/projects/M1-*/)

| # | File | Status | Detection | Classification | Fix Recommendation |
|---|------|--------|-----------|---------------|-------------------|
| 21 | `M1-FingerCounter/FingerCounterPanel.tsx` | **FAKE (rule-based)** | REAL MediaPipe Hands | `classifyFingerCount()` — counts extended finger flags | ✅ Correct by design — deterministic counting is more reliable than ML |
| 22 | `M1-VirtualPiano/VirtualPianoPanel.tsx` | **FAKE (rule-based)** | REAL MediaPipe Hands | `classifyPianoKey()` — maps X coordinate to 7 key zones | ✅ Correct by design |
| 23 | `M1-VolumeController/VolumeControllerPanel.tsx` | **FAKE (rule-based)** | REAL MediaPipe Hands | `classifyVolumeLevel()` — measures thumb-index pinch distance | ✅ Correct by design |
| 24 | `M1-DrawingCanvas/DrawingCanvasPanel.tsx` | **FAKE (rule-based)** | REAL MediaPipe Hands | `classifyDrawErase()` — finger-count thresholds for draw/erase/move | ✅ Correct by design |

---

## M2 Projects (src/neura/projects/M2-*/)

| # | File | Status | Detection | Classification | Fix Recommendation |
|---|------|--------|-----------|---------------|-------------------|
| 25 | `M2-DancePose/DancePosePanel.tsx` | **REAL** | REAL MoveNet | Real KNN `predictFromImage()` | ✅ None needed |
| 26 | `M2-YogaChecker/YogaCheckerPanel.tsx` | **REAL** | REAL MoveNet | Real KNN `predict(features, 5)` | ✅ None needed |
| 27 | `M2-PostureMonitor/PostureMonitorPanel.tsx` | **FIXED ✅** | REAL MoveNet + rule-based `classifyPosture()` | Previously: KNN rebuilt but never queried | ✅ Removed wasted KNN-rebuild effect and `addSampleFromKeypoints` calls |
| 28 | `M2-RepCounter/RepCounterPanel.tsx` | **FIXED ✅** | REAL MoveNet + rule-based `classifyRepState()` | Previously: KNN rebuilt but never queried | ✅ Removed wasted KNN-rebuild effect and `addSampleFromKeypoints` calls |

---

## Summary Statistics

| Category | Count | Files |
|----------|-------|-------|
| **Fully Real ML** | 10 | ImageClassifier, PoseClassifier, HandPoseClassifier, TextClassifier, NumberClassifier, ObjectDetector, CustomObjectDetector, KNNClassifier, DancePose, YogaChecker |
| **Rule-based (intentionally not ML)** | 5 | FingerCounter, VirtualPiano, VolumeController, DrawingCanvas, `ruleBasedClassifiers.ts` |
| **Fixed (previously fake/simulated)** | 5 | AudioClassifier, ObjectDetectionTrainer, ModelExporter, EvaluatePanel, `panels/TrainPanel` |
| **Rule-based (previously had wasted KNN facade)** | 2 | PostureMonitor, RepCounter (removed unused KNN rebuild) |
| **UI Shell (correct by design)** | 2 | `components/TrainPanel`, `components/TestPanel` |

---

## Platform Support Matrix (Web vs .exe)

> All Neura models and projects use browser-native Web APIs + CDN-loaded TF.js models.
> The .exe (Electron) version runs the identical code in its Chromium renderer.
> No Node.js or Electron-specific APIs are used in the Neura module — everything is pure browser JS.

| # | Feature / Project | Web Browser | .exe (Electron) | Notes |
|---|-------------------|-------------|-----------------|-------|
| | **Runtime Requirements** | | | |
| R1 | Camera (getUserMedia) | ✅ Works | ✅ Works | Requires HTTPS in web (or localhost); Electron uses file:///localhost — always allowed |
| R2 | Microphone (getUserMedia) | ✅ Works | ✅ Works | Same HTTPS requirement as camera |
| R3 | Audio playback (Web Audio API) | ✅ Works | ✅ Works | Identical in both |
| R4 | TF.js CDN model loading | ✅ Works | ✅ Works | Both need internet on first load; Electron could bundle models offline — not implemented |
| R5 | Canvas 2D rendering | ✅ Works | ✅ Works | Identical in both |
| R6 | Browser Blob file download | ✅ Works | ✅ Works | Both use `a.download` — same behavior |
| R7 | localStorage persistence | ✅ Works | ✅ Works | Identical in both (Electron uses same Chromium storage) |
| R8 | HTTP fetch (Kaggle API) | ✅ Works | ✅ Works | Subject to CORS in both |
| R9 | Media key system control | ❌ Fails | ❌ Fails | `document.dispatchEvent(KeyboardEvent)` creates untrusted events — both browsers/Electron ignore programmatic media keys |
| | | | | |
| | **ML Engine** | | | |
| 1 | Image Classifier (MobileNet + KNN) | ✅ Real | ✅ Real | CDN MobileNetV2 feature extractor + TF.js KNN — identical in both |
| 2 | Pose Classifier (MoveNet + KNN) | ✅ Real | ✅ Real | CDN MoveNet SINGLEPOSE_LIGHTNING + KNN |
| 3 | HandPose Classifier (MediaPipe + KNN) | ✅ Real | ✅ Real | CDN hand-pose-detection + KNN |
| 4 | Audio Classifier (FFT + speech-commands + KNN) | ✅ Real | ✅ Real | Web Audio API capture + FFT + CDN speech-commands + KNN |
| 5 | Text Classifier (USE + KNN) | ✅ Real | ✅ Real | CDN Universal Sentence Encoder + KNN |
| 6 | Number Classifier (TF.js pixel features + KNN) | ✅ Real | ✅ Real | Canvas-to-tensor digit isolation + KNN |
| 7 | Object Detector (COCO-SSD) | ✅ Real | ✅ Real | CDN @tensorflow-models/coco-ssd — real 90-class detection |
| 8 | Custom Object Detector (MobileNet + sliding window + NMS + KNN) | ✅ Real | ✅ Real | Multi-scale sliding window proposals → MobileNet embeddings → KNN cosine-similarity → IoU NMS |
| 9 | KNN Classifier | ✅ Real | ✅ Real | TF.js cosine-similarity with adaptive k, distance-weighted voting, softmax |
| 10 | Object Detection Trainer (annotation → KNN) | ✅ Real | ✅ Real | Real annotation processing + MobileNet embedding extraction + KN N addExample |
| | | | | |
| | **UI Panels** | | | |
| 11 | Annotate Panel (bounding boxes + COCO-SSD auto-detect) | ✅ Real | ✅ Real | Canvas mouse/touch handlers + real COCO-SSD inference |
| 12 | Train Panel (progress display) | ✅ Real | ✅ Real | Honest progress bar from event-driven trainer callbacks |
| 13 | Evaluate Panel (metric estimates) | ⚠️ Estimate | ⚠️ Estimate | Deterministic formula from real sample counts + `mode.accuracy`; subtitle says "estimates" |
| | | | | |
| | **M1 Projects (MediaPipe Hands + rule-based)** | | | |
| 14 | Finger Counter | ✅ Real | ✅ Real | Real HandPose detection + deterministic finger counting + Web Audio oscillator tones |
| 15 | Virtual Piano | ✅ Real | ✅ Real | Real HandPose detection + zone-based key mapping + real oscillator synthesis |
| 16 | Volume Controller | ⚠️ Partial | ⚠️ Partial | Real HandPose detection works; media key dispatch (item R9) fails in both modes — gestures detected but no system volume change |
| 17 | Drawing Canvas | ✅ Real | ✅ Real | Real HandPose detection + Canvas2D drawing with gesture-based tool switching |
| | | | | |
| | **M2 Projects (MoveNet + rule-based)** | | | |
| 18 | Dance Pose | ✅ Real | ✅ Real | Real MoveNet + real KNN `predictFromImage()` pose classification |
| 19 | Yoga Checker | ✅ Real | ✅ Real | Real MoveNet + real KNN `predict(features, 5)` with 2s hold validation |
| 20 | Posture Monitor | ✅ Real | ✅ Real | Real MoveNet + real `classifyPosture()` angle-threshold rules; unused KNN rebuild removed |
| 21 | Rep Counter | ✅ Real | ✅ Real | Real MoveNet + real `classifyRepState()` state machine; unused KNN rebuild removed |
| | | | | |
| | **Utilities** | | | |
| 22 | Kaggle Dataset Provider | ✅ Real | ✅ Real | HTTP fetch + JSZip extraction — files stored in memory (not written to disk) |
| 23 | Model Exporter (JSON metadata) | ✅ Real | ✅ Real | Blob download of JSON summary; no model weights serialized (KNN tensors stay in memory) |
| 24 | Rule-based classifiers utility | ✅ Real (by design) | ✅ Real (by design) | Deterministic heuristics for finger count, posture, rep state, piano key, volume level, draw/erase |

### Key

| Symbol | Meaning |
|--------|---------|
| ✅ Real | Full real ML inference or functional UI — works identically in both modes |
| ⚠️ Estimate | Deterministic heuristics (not random); labeled honestly as estimates |
| ❌ Fails | Does not function as intended in the given mode |
| Partial | Functionality partially works (e.g., gesture detection works but action doesn't) |

### Summary

- **22 of 24 features** work identically and realistically in both web and .exe
- Volume Controller's media key dispatch (R9) is the only broken feature — gestures are detected correctly but system volume won't change because programmatic `KeyboardEvent` is untrusted in both modes
- Evaluate Panel shows honest estimates (not real LOO cross-validation), but is transparently labeled as such
- No feature is "web-only" or "Electron-only" — all code is pure browser JS with no platform-specific branches
- All 15 project types + all 6 classifier types + all utilities work the same in both modes

---

## ✅ All Fixes Applied

| Priority | File | Issue | Fix |
|----------|------|-------|-----|
| Priority | File | Fix Applied | Status |
|----------|------|-------------|--------|
| 🔴 CRITICAL | `ml/ObjectDetectionTrainer.ts` | Removed fake epoch simulation (Phase 2); shows real annotation processing progress only | ✅ **DONE** |
| 🟠 HIGH | `ui/panels/EvaluatePanel.tsx` | Removed all `Math.random()`; metrics now deterministic from sample counts + real `mode.accuracy`; uses real trainer sample counts | ✅ **DONE** |
| 🟠 HIGH | `ml/ModelExporter.ts` | Removed fake TFJS/ONNX/TFLite export formats (scaffold-only); keeps only honest JSON metadata export | ✅ **DONE** |
| 🟡 MEDIUM | `ml/classifiers/AudioClassifier.ts` | Replaced naive O(n²) DFT with proper Cooley-Tukey FFT + Hann windowing; added `@tensorflow-models/speech-commands` CDN loader | ✅ **DONE** |
| 🟢 LOW | `PostureMonitor` / `RepCounter` | Removed wasted KNN-rebuild effects and `addSampleFromKeypoints` calls; keep real `detectPose()` + rule-based classifiers | ✅ **DONE** |
