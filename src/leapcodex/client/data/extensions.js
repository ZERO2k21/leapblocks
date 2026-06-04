/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */

export const EXTENSIONS = [
    { id: 'music', name: 'Music', icon: '🎵', desc: 'Play notes and instruments', code: '# Music\nfrom music import play_note' },
    { id: 'pen', name: 'Pen', icon: '✏', desc: 'Draw lines on stage canvas', code: '# Pen\nfrom pen import pen_down, pen_up' },
    { id: 'ml', name: 'Machine Learning', icon: '🧠', desc: 'KNN classifier, image AI', code: '# ML\nfrom ml import KNNClassifier' },
    { id: 'face', name: 'Face Detection', icon: '👁', desc: 'Detect faces via camera', code: '# Face\nfrom face import FaceDetection' },
    { id: 'speech', name: 'Speech', icon: '🗣', desc: 'TTS and speech recognition', code: '# Speech\nfrom speech import say, listen' },
    { id: 'iot', name: 'IoT / Quarky', icon: '⚡', desc: 'Control LEDs, sensors', code: '# Quarky\nfrom quarky import Quarky' },
    { id: 'arduino', name: 'Arduino', icon: '🔌', desc: 'Digital and analog pins', code: '# Arduino\nfrom arduino import Arduino' },
];

export default EXTENSIONS;
