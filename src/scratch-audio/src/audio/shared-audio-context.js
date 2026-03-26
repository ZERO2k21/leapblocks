let AUDIO_CONTEXT;
let _listenerAttached = false;

function ensureAudioContextListener() {
    if (_listenerAttached) return;
    _listenerAttached = true;

    const event =
        typeof document.ontouchstart === 'undefined' ?
            'mousedown' :
            'touchstart';
    const initAudioContext = () => {
        document.removeEventListener(event, initAudioContext);
        AUDIO_CONTEXT = new (window.AudioContext ||
            window.webkitAudioContext)();
    };
    document.addEventListener(event, initAudioContext);
}

/**
 * Wrap browser AudioContext because we shouldn't create more than one
 * @return {AudioContext} The singleton AudioContext
 */
export default function () {
    ensureAudioContextListener();
    return AUDIO_CONTEXT;
}
