/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * FaceDetectionExtension.ts
 *
 * Standalone face detection extension for leapembed Embed stage mode.
 *
 * HOW IT WORKS:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. User adds Face Detection extension from the Extension Library
 * 2. Blocks appear in the toolbox under "Face Detection"
 * 3. User drags "turn on video on stage" + "analyse image from camera" blocks
 * 4. Green flag → camera opens → detection loop starts (rAF-based, 60fps)
 * 5. Reporter blocks (face count, x/y, emotion) return live values
 * 6. Sprites react in real-time via forever loops
 *
 * DETECTION STRATEGY:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Try browser FaceDetector API (Chrome/Edge with experimental flag)
 * 2. Fallback: canvas pixel analysis to detect presence + center position
 *    This gives sprites something to react to on all browsers.
 *
 * SPRITE INTERACTION EXAMPLES:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Example 1 — Sprite follows face:
 *   when green flag clicked
 *     turn on video on stage with 0% transparency
 *     analyse image from camera
 *     forever
 *       go to x: (get x position of face 1) y: (get y position of face 1)
 *
 * Example 2 — Sprite reacts to emotion:
 *   when green flag clicked
 *     turn on video on stage with 0% transparency
 *     analyse image from camera
 *     forever
 *       if (is expression of face 1 happy) then
 *         say "You're happy!" for 1 secs
 *         change size by 10
 *
 * Example 3 — Count faces and show:
 *   when green flag clicked
 *     turn on video on stage with 50% transparency
 *     analyse image from camera
 *     forever
 *       set size to ((face count) * 20)
 *       say (join "Faces: " (face count))
 *
 * Example 4 — Sprite follows left eye:
 *   when green flag clicked
 *     turn on video on stage with 0% transparency
 *     analyse image from camera
 *     forever
 *       go to x: (get x position of left eye of face 1)
 *              y: (get y position of left eye of face 1)
 */

// This file documents the extension. The actual implementation is in:
//   src/extensions/extensionDefinitions.ts  (block definitions + generators)
//   src/runtime/RuntimeBridge.ts            (FaceRuntime class)
//   src/vm/AnimationVM.ts                   (fd_action / fd_report VM steps)
//   src/generators/animation-generator.ts  (compiler cases for reporter blocks)

export const FACE_DETECTION_EXTENSION_ID = 'face_detection';

/**
 * Block types provided by this extension:
 *
 * SETTINGS (statement blocks):
 *   fd_video_on_stage    — turn on/off video on stage with N% transparency
 *   fd_show_bounding_box — show/hide bounding box
 *   fd_set_threshold     — set detection threshold to 0.5–0.9
 *
 * DETECTION (statement + reporter blocks):
 *   fd_analyse_image     — analyse image from camera/image
 *   fd_get_num_faces     — get # faces (says count via sprite)
 *   fd_get_expression    — get expression of face N (says emotion)
 *   fd_is_expression     — is expression of face N happy/sad/... (Boolean)
 *   fd_get_xy_position   — get x/y position of face N (Number)
 *   fd_get_landmark_pos  — get x/y position of left eye/right eye/nose/mouth of face N
 *   fd_get_landmark_num  — get x/y position of landmark N of face N
 *   fd_face_count        — face count (Number reporter)
 *   fd_emotion           — emotion (String reporter)
 *   fd_face_x            — face N x position (Number reporter)
 *   fd_face_y            — face N y position (Number reporter)
 *
 * FACE RECOGNITION: TRAINING:
 *   fd_add_class         — add class N as [name] from camera/image
 *   fd_reset_class       — reset class
 *
 * FACE RECOGNITION: TESTING:
 *   fd_do_face_matching  — do face matching on camera/image
 *   fd_is_class_detected — is N class detected (Boolean)
 *   fd_get_class_detected — get class of face N detected (String)
 */

/**
 * Runtime API (window.runtime.face):
 *
 *   analyse(action)              — 'on'|'off'|'analyze'
 *   getFaceCount()               — number of detected faces
 *   getX(n)                      — x position of face n in stage coords
 *   getY(n)                      — y position of face n in stage coords
 *   getEmotion()                 — 'happy'|'sad'|'neutral'|'surprised'|'angry'
 *   getLandmark(name, n, axis)   — landmark position
 *   getLandmarkByIndex(i, n, ax) — landmark by index
 *   setVideoTransparency(t)      — 0–100
 *   setBoundingBox(state)        — 'show'|'hide'
 *   setThreshold(t)              — 0.5–0.9
 *   addClass(n, name, source)    — add training class
 *   resetClasses()               — clear all classes
 *   doFaceMatching(source)       — run face matching
 *   isClassDetected(n)           — boolean
 *   getClassOfFace(n)            — string
 */
