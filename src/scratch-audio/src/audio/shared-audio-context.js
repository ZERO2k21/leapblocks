import StartAudioContext from 'startaudiocontext';

let AUDIO_CONTEXT;
let _listenerAttached = false;

function ensureAudioContextListener() {
    if (_listenerAttached) return;
    _listenerAttached = true;

    // Lazily access bowser to avoid TDZ in production builds
    let isMsie = false;
    try {
        const bowser = require('bowser');
        isMsie = !!(bowser && bowser.msie);
    } catch (e) {
        // bowser not available, assume not IE
    }

    if (!isMsie) {
        const event =
            typeof document.ontouchstart === 'undefined' ?
                'mousedown' :
                'touchstart';
        const initAudioContext = () => {
            document.removeEventListener(event, initAudioContext);
            AUDIO_CONTEXT = new (window.AudioContext ||
                window.webkitAudioContext)();
            StartAudioContext(AUDIO_CONTEXT);
        };
        document.addEventListener(event, initAudioContext);
    }
}

/**
 * Wrap browser AudioContext because we shouldn't create more than one
 * @return {AudioContext} The singleton AudioContext
 */
export default function () {
    ensureAudioContextListener();
    return AUDIO_CONTEXT;
}
