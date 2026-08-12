import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLeapLabAuthStore } from './auth/leaplabAuthStore';
import { LMS_API_BASE } from './auth/api';
import Logo, { CreoleapLogo } from './components/Logo';
import LeapLabAuthButton from './auth/LeapLabAuthButton';

// ─── Types ─────────────────────────────────────────────────────

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  totalPoints: number;
  passingPoints: number;
  timeLimitMinutes: number | null;
  retakeAllowed: number;
  maxRetakes: number;
  startDate: string | null;
  endDate: string | null;
  questionCount: number;
  attemptCount: number;
  canRetake: boolean;
  hasAttempted: boolean;
  lastScore: number | null;
  lastMaxScore: number | null;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  questionMediaUrl: string | null;
  questionMediaType: string | null;
  answerType: string;
  points: number;
  order: number;
  options: { id: string; text: string | null; mediaUrl: string | null; mediaType: string | null; order: number }[];
}

interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
  attemptNumber: number;
}

interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  timeTakenSeconds: number | null;
  completedAt: string;
}

const QUIZZES_PATH = '/api/leaplab/quiz/quizzes';

// Background ticker: browsers throttle main-thread timers in hidden tabs,
// but Web Worker timers keep ticking (~1s) even when the tab is in the background.
const TIMER_WORKER_CODE = `setInterval(() => { self.postMessage('tick'); }, 250);`;
const timerWorkerBlob = new Blob([TIMER_WORKER_CODE], { type: 'application/javascript' });
const timerWorkerUrl = URL.createObjectURL(timerWorkerBlob);

// Persist the in-progress quiz locally so answers survive network loss / page reloads
const SESSION_KEY = 'pulse_quiz_session_v1';
const clearQuizSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { }
};

// ─── API helpers ───────────────────────────────────────────────

async function apiGet(path: string, token: string) {
  const res = await fetch(`${LMS_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function apiPost(path: string, token: string, body: any) {
  const res = await fetch(`${LMS_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Main Component ────────────────────────────────────────────

interface PulseAppProps {
  onBack: () => void;
}

type View = 'list' | 'taking' | 'result';

export default function PulseApp({ onBack }: PulseAppProps) {
  const { token } = useLeapLabAuthStore();
  const [view, setView] = useState<View>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Question navigation & status table tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeQuiz && activeQuiz.questions && activeQuiz.questions[currentQuestionIndex]) {
      const qId = activeQuiz.questions[currentQuestionIndex].id;
      setVisitedQuestions((prev) => (prev[qId] ? prev : { ...prev, [qId]: true }));
    }
  }, [activeQuiz, currentQuestionIndex]);

  // Result state
  const [result, setResult] = useState<AttemptResult | null>(null);

  // Tab-warning, exit-confirm & pre-quiz confirm state
  const [leftDuringQuiz, setLeftDuringQuiz] = useState(false);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [quizToStart, setQuizToStart] = useState<Quiz | null>(null);
  const [showEscapeDialog, setShowEscapeDialog] = useState(false);
  const escapeDialogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Network & resume state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [resumedNotice, setResumedNotice] = useState(false);
  const pendingSubmitRef = useRef(false);

  // Fullscreen state & toggle
  const [isNativeFs, setIsNativeFs] = useState<boolean>(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const el = document.documentElement;
      const fs = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
      if (fs) {
        fs.call(el).then(() => setIsNativeFs(true)).catch(() => {});
      }
    } else {
      const exitFs = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen;
      if (exitFs) {
        exitFs.call(document).then(() => setIsNativeFs(false)).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFs(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    if (view === 'taking') {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const el = document.documentElement;
        const fs = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
        if (fs) {
          fs.call(el).catch(() => {});
        }
      }
    }
  }, [view]);

  // ── Fetch quizzes ──
  const fetchQuizzes = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(QUIZZES_PATH, token);
      setQuizzes(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuizzes();
    return () => controller.abort();
  }, [fetchQuizzes]);

  // Restore an in-progress quiz after a reload (survives network loss)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && s.attemptId && s.activeQuiz && s.answers && s.deadline && s.deadline > performance.now()) {
        setActiveQuiz(s.activeQuiz);
        setAttemptId(s.attemptId);
        setAnswers(s.answers);

        // Restore visited questions including first question & answered questions
        const initialVisited: Record<string, boolean> = {};
        if (s.activeQuiz.questions && s.activeQuiz.questions[0]) {
          initialVisited[s.activeQuiz.questions[0].id] = true;
        }
        Object.keys(s.answers || {}).forEach((qId) => {
          initialVisited[qId] = true;
        });
        setVisitedQuestions(initialVisited);

        deadlineRef.current = s.deadline;
        autoSubmittedRef.current = false;
        tabSwitchCountRef.current = 0;
        setTimeLeft(Math.max(0, Math.ceil((s.deadline - performance.now()) / 1000)));
        setView('taking');
        setResumedNotice(true);
      } else {
        clearQuizSession();
      }
    } catch {
      clearQuizSession();
    }
  }, []);

  // Persist the in-progress attempt locally so answers are never lost
  useEffect(() => {
    if (view !== 'taking' || !attemptId || !activeQuiz) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        attemptId,
        answers,
        activeQuiz,
        deadline: deadlineRef.current,
      }));
    } catch { }
  }, [view, attemptId, answers, activeQuiz]);

  // ── Timer (deadline-based: immune to setInterval drift & background throttling) ──
  const deadlineRef = useRef<number | null>(null);
  const autoSubmittedRef = useRef(false);
  const submitGuardRef = useRef(false);
  const tabSwitchCountRef = useRef(0);

  // Max popup warnings allowed before auto-submitting on tab/window switches
  const MAX_TAB_SWITCH_WARNINGS = 3;

  useEffect(() => {
    if (view !== 'taking' || deadlineRef.current === null) return;

    const finishIfExpired = () => {
      if (performance.now() >= deadlineRef.current! && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleSubmitRef.current();
      }
    };

    // Submit precisely at the deadline (no polling — exact remaining ms)
    const timeout = setTimeout(finishIfExpired, Math.max(0, deadlineRef.current - performance.now()));

    // Background-safe ticker via Web Worker (survives main-thread throttling)
    const worker = new Worker(timerWorkerUrl);
    worker.onmessage = () => {
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current! - performance.now()) / 1000)));
      finishIfExpired();
    };

    // Display-only countdown while visible
    const displayTimer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current! - performance.now()) / 1000)));
    }, 250);

    const onVisibility = () => {
      if (!document.hidden) {
        setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current! - performance.now()) / 1000)));
        finishIfExpired();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(timeout);
      clearInterval(displayTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      worker.terminate();
    };
  }, [view]);

  // Warn when the user leaves the tab/window mid-quiz (time keeps running regardless).
  // Allowed 3 times; the 4th switch auto-submits the quiz with the current answers.
  useEffect(() => {
    if (view !== 'taking') return;
    let awayFrom = 0;
    let isAway = false;

    const onLeave = () => {
      if (!isAway && (document.hidden || !document.hasFocus())) {
        isAway = true;
        awayFrom = performance.now();
      }
    };

    const onReturn = () => {
      if (!isAway) return;
      isAway = false;
      tabSwitchCountRef.current += 1;
      if (tabSwitchCountRef.current > MAX_TAB_SWITCH_WARNINGS) {
        handleSubmitRef.current();
        return;
      }
      setAwaySeconds(Math.round((performance.now() - awayFrom) / 1000));
      setLeftDuringQuiz(true);
    };

    const onVisibility = () => (document.hidden ? onLeave() : onReturn());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onLeave);
    window.addEventListener('focus', onReturn);
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('focus', onReturn);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [view]);

  // Network status: warn while offline, auto-retry a pending submit on reconnect
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (pendingSubmitRef.current && view === 'taking') {
        pendingSubmitRef.current = false;
        handleSubmitRef.current();
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [view]);

  // ── Fullscreen mode — enter on quiz start, LOCK until submit ──
  const quizSubmittedRef = useRef(false);

  useEffect(() => {
    if (view === 'taking') {
      quizSubmittedRef.current = false;

      // Enable Electron-level security (blocks Escape, DevTools, etc.)
      if ((window as any).electronAPI?.quizSecurityEnable) {
        (window as any).electronAPI.quizSecurityEnable();
      }

      const el = document.documentElement;

      const enterFS = () => {
        // Try Electron first
        if ((window as any).electronAPI?.quizFullscreenEnter) {
          (window as any).electronAPI.quizFullscreenEnter();
        } else {
          // Fallback to browser fullscreen API
          const fs = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
          if (fs && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            fs.call(el).catch(() => {});
          }
        }
      };

      // Enter fullscreen on quiz start
      enterFS();

      // Re-enter fullscreen if user exits (Escape, browser UI, etc.)
      const onFullscreenChange = () => {
        if (quizSubmittedRef.current) return;
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          // Immediately re-enter
          enterFS();
        }
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      };
    }

    if (view === 'result' || view === 'list') {
      // Disable Electron-level security
      if ((window as any).electronAPI?.quizSecurityDisable) {
        (window as any).electronAPI.quizSecurityDisable();
      }

      // Exit fullscreen via Electron IPC
      if ((window as any).electronAPI?.quizFullscreenExit) {
        (window as any).electronAPI.quizFullscreenExit();
      } else {
        // Fallback to browser fullscreen API
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          const exitFS = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen;
          if (exitFS) {
            exitFS.call(document).catch(() => {});
          }
        }
      }
    }
  }, [view]);

  // ── Block keyboard shortcuts (PrintScreen, Ctrl+C/P/S/U/A, F12, DevTools, etc.) ──
  useEffect(() => {
    if (view !== 'taking') return;

    const el = document.documentElement;

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const isMeta = e.metaKey;

      // PrintScreen & Alt+PrintScreen
      if (key === 'printscreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        return false;
      }

      // Escape — show submit dialog, or auto-submit if already open
      if (key === 'escape') {
        e.preventDefault();
        e.stopPropagation();

        if (showEscapeDialog) {
          // Second Escape press — auto-submit
          if (escapeDialogTimerRef.current) {
            clearTimeout(escapeDialogTimerRef.current);
            escapeDialogTimerRef.current = null;
          }
          setShowEscapeDialog(false);
          handleSubmitRef.current();
        } else {
          // First Escape press — show dialog
          setShowEscapeDialog(true);
          // Auto-close dialog after 5 seconds (no submit)
          escapeDialogTimerRef.current = setTimeout(() => {
            setShowEscapeDialog(false);
            escapeDialogTimerRef.current = null;
          }, 5000);
        }
        return false;
      }

      // Windows key / Meta key
      if (isMeta && !ctrl && !alt && !shift) {
        e.preventDefault();
        return false;
      }

      // Ctrl/Cmd combos — broad blocklist
      if (ctrl || isMeta) {
        const blocked = [
          'c', 'v', 'x', 'a', 'p', 's', 'u', 'j',   // copy/paste/print/save/view-source
          'n', 't', 'w', 'r', 'l', 'h', 'd', 'g',   // new-window/new-tab/close/refresh/last-pass/devtools
          'o', 'i', 'b', 'e', 'f', 'm',               // open/info-bookmarks/edit/find/menu
        ];
        if (blocked.includes(key)) {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift combos (DevTools, Incognito, etc.)
        if (shift) {
          const blockedShift = ['i', 'j', 'c', 'n', 'p', 't', 'w', 'delete'];
          if (blockedShift.includes(key)) {
            e.preventDefault();
            return false;
          }
        }
      }

      // Alt combos (menu bar, navigation, etc.)
      if (alt) {
        const blockedAlt = ['f4', 'tab', 'escape', 'arrowleft', 'arrowright'];
        if (blockedAlt.includes(key)) {
          e.preventDefault();
          return false;
        }
        // Alt+PrintScreen
        if (key === 'printscreen' || e.code === 'PrintScreen') {
          e.preventDefault();
          return false;
        }
      }

      // ALL function keys (F1–F12)
      if (/^f\d{1,2}$/.test(key)) {
        e.preventDefault();
        return false;
      }

      // Space & arrow keys (prevent page scroll)
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && !ctrl && !alt) {
        // allow arrow keys inside inputs
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          return false;
        }
      }
    };

    window.addEventListener('keydown', blockKeys, { capture: true });
    return () => window.removeEventListener('keydown', blockKeys, { capture: true });
  }, [view]);

  // ── Disable right-click context menu ──
  useEffect(() => {
    if (view !== 'taking') return;

    const disableContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('contextmenu', disableContextMenu);
    return () => window.removeEventListener('contextmenu', disableContextMenu);
  }, [view]);

  // ── Disable drag ──
  useEffect(() => {
    if (view !== 'taking') return;

    const disableDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('dragstart', disableDrag);
    return () => window.removeEventListener('dragstart', disableDrag);
  }, [view]);

  // ── Block window.open, window.print, document.view-source ──
  useEffect(() => {
    if (view !== 'taking') return;

    const origOpen = window.open;
    const origPrint = window.print;

    window.open = (() => null) as any;
    window.print = (() => {}) as any;

    // Disable print media stylesheet injection
    const printStyle = document.createElement('style');
    printStyle.textContent = '@media print { * { display: none !important; } body { display: none !important; } }';
    document.head.appendChild(printStyle);

    return () => {
      window.open = origOpen;
      window.print = origPrint;
      printStyle.remove();
    };
  }, [view]);

  // ── Screenshot detection via visibilitychange + show warning overlay ──
  useEffect(() => {
    if (view !== 'taking') return;

    let screenshotTimeout: ReturnType<typeof setTimeout> | null = null;

    const onVisibilityChange = () => {
      // On some OSes, PrintScreen triggers a brief visibility change
      if (document.hidden) {
        // Create warning overlay
        const warning = document.createElement('div');
        warning.id = 'screenshot-warning';
        Object.assign(warning.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '99999',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
          fontFamily: 'sans-serif',
        });
        warning.innerHTML = `
          <div style="font-size:48px;margin-bottom:16px;">&#x26A0;&#xFE0F;</div>
          <div style="font-size:24px;font-weight:800;margin-bottom:8px;">Screenshot Detected!</div>
          <div style="font-size:14px;opacity:0.8;">Taking screenshots is not allowed during the quiz.</div>
        `;
        document.body.appendChild(warning);

        // Remove after 2 seconds
        screenshotTimeout = setTimeout(() => {
          warning.remove();
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (screenshotTimeout) clearTimeout(screenshotTimeout);
      const existing = document.getElementById('screenshot-warning');
      if (existing) existing.remove();
    };
  }, [view]);

  // ── Screenshot-protective transparent overlay (blocks screen-capture tools) ──
  useEffect(() => {
    if (view !== 'taking') return;

    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9998',
      pointerEvents: 'none',
      background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)',
      mixBlendMode: 'multiply',
    });
    document.body.appendChild(overlay);

    return () => { overlay.remove(); };
  }, [view]);

  // ── Window resize prevention — lock viewport size ──
  useEffect(() => {
    if (view !== 'taking') return;

    const lockSize = () => {
      window.moveTo(0, 0);
      window.resizeTo(screen.availWidth, screen.availHeight);
    };

    const onResize = () => {
      lockSize();
    };

    window.addEventListener('resize', onResize);
    lockSize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [view]);

  // ── Developer tools detection via debugger timing ──
  useEffect(() => {
    if (view !== 'taking') return;

    const threshold = 100; // ms
    const id = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const elapsed = performance.now() - start;
      if (elapsed > threshold) {
        // DevTools is open — show warning
        const warning = document.createElement('div');
        warning.id = 'devtools-warning';
        Object.assign(warning.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '99999',
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '40px',
        });
        warning.innerHTML = `
          <div style="font-size:48px;margin-bottom:16px;">&#x1F6A7;</div>
          <div style="font-size:24px;font-weight:800;margin-bottom:8px;">Developer Tools Detected!</div>
          <div style="font-size:14px;opacity:0.8;">Please close Developer Tools and continue your quiz.</div>
        `;
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
      }
    }, 2000);

    return () => clearInterval(id);
  }, [view]);

  // ── Disable image drag & context menu on images ──
  useEffect(() => {
    if (view !== 'taking') return;

    const disableImageInteraction = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.querySelectorAll('img').forEach((img) => {
      img.setAttribute('draggable', 'false');
      img.addEventListener('contextmenu', disableImageInteraction);
      img.addEventListener('dragstart', disableImageInteraction);
    });

    return () => {
      document.querySelectorAll('img').forEach((img) => {
        img.removeEventListener('contextmenu', disableImageInteraction);
        img.removeEventListener('dragstart', disableImageInteraction);
      });
    };
  }, [view]);

  // ── Body-level protections during quiz ──
  useEffect(() => {
    if (view !== 'taking') return;

    const body = document.body;
    const html = document.documentElement;

    // Save original values
    const origBodyOverflow = body.style.overflow;
    const origBodyUserSelect = body.style.userSelect;
    const origBodyWebkitUserSelect = (body.style as any).webkitUserSelect;
    const origBodyMozUserSelect = (body.style as any).mozUserSelect;
    const origBodyMsUserSelect = (body.style as any).msUserSelect;
    const origHtmlOverflow = html.style.overflow;

    // Apply protections
    body.style.overflow = 'hidden';
    body.style.userSelect = 'none';
    (body.style as any).webkitUserSelect = 'none';
    (body.style as any).mozUserSelect = 'none';
    (body.style as any).msUserSelect = 'none';
    html.style.overflow = 'hidden';

    // Disable copy on body
    const disableCopy = (e: Event) => { e.preventDefault(); return false; };
    body.addEventListener('copy', disableCopy);
    body.addEventListener('cut', disableCopy);
    body.addEventListener('paste', disableCopy);

    return () => {
      body.style.overflow = origBodyOverflow;
      body.style.userSelect = origBodyUserSelect;
      (body.style as any).webkitUserSelect = origBodyWebkitUserSelect;
      (body.style as any).mozUserSelect = origBodyMozUserSelect;
      (body.style as any).msUserSelect = origBodyMsUserSelect;
      html.style.overflow = origHtmlOverflow;
      body.removeEventListener('copy', disableCopy);
      body.removeEventListener('cut', disableCopy);
      body.removeEventListener('paste', disableCopy);
    };
  }, [view]);

  // ── Start quiz ──
  const startQuiz = async (quizId: string) => {
    if (!token) return;
    setError(null);

    // Request fullscreen immediately (requires user gesture from button click)
    const el = document.documentElement;
    const fs = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).msRequestFullscreen;
    if (fs && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      fs.call(el).catch(() => {});
    }

    try {
      // Fetch quiz details
      const quizRes = await apiGet(`${QUIZZES_PATH}/${quizId}`, token);
      const rawQuestions = quizRes.data.questions || [];

      // Deep clone & shuffle options for every question to prevent malpractice
      const questions: QuizQuestion[] = rawQuestions.map((q: QuizQuestion) => {
        const shuffledOptions = [...(q.options || [])];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        return {
          ...q,
          options: shuffledOptions,
        };
      });

      // Fisher-Yates shuffle question order
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      const quiz = { ...quizRes.data, questions };
      setActiveQuiz(quiz);

      // Start attempt
      const attemptRes = await apiPost(`${QUIZZES_PATH}/${quizId}/start`, token, {});
      setAttemptId(attemptRes.data.attemptId);
      setAnswers({});
      const firstQId = quiz.questions?.[0]?.id;
      setCurrentQuestionIndex(0);
      setVisitedQuestions(firstQId ? { [firstQId]: true } : {});
      setView('taking');
      setLeftDuringQuiz(false);
      setShowExitConfirm(false);
      setResumedNotice(false);
      tabSwitchCountRef.current = 0;

      // Set timer if quiz has time limit (deadline-based, exact ms)
      autoSubmittedRef.current = false;
      if (quizRes.data.timeLimitMinutes) {
        const seconds = quizRes.data.timeLimitMinutes * 60;
        deadlineRef.current = performance.now() + seconds * 1000;
        setTimeLeft(seconds);
      } else {
        deadlineRef.current = null;
        setTimeLeft(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Use ref so timer always calls latest handleSubmit
  const handleSubmitRef = useRef<() => Promise<void>>(async () => { });

  // ── Submit quiz ──
  const handleSubmit = async () => {
    if (!token || !attemptId || submitting || submitGuardRef.current) return;
    submitGuardRef.current = true;
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiPost(`${QUIZZES_PATH}/attempts/${attemptId}/submit`, token, {
        answers: answerArray,
        timeLeftSeconds: timeLeft,
        submittedAt: new Date().toISOString(),
      });

      setResult(res.data);
      quizSubmittedRef.current = true;
      setView('result');
      setTimeLeft(null);
      pendingSubmitRef.current = false;
      clearQuizSession();
    } catch (err: any) {
      if (!navigator.onLine) {
        pendingSubmitRef.current = true;
        setError('Network lost — your answers are saved on this device. Submission will retry automatically when you are back online.');
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
      submitGuardRef.current = false;
    }
  };

  // Keep ref in sync with latest handleSubmit
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // ── Format time ──
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Image URL helper ──
  const getImageUrl = (key: string | null) => {
    if (!key) return null;
    return `${LMS_API_BASE}/api/file/proxy?key=${encodeURIComponent(key)}`;
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER: Quiz List
  // ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="h-screen overflow-y-auto bg-slate-50 font-sans text-slate-900">
        {/* TopBar */}
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[60px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none">
          {/* Left Section: Back + Logo + Module Name */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white cursor-pointer transition-all active:scale-95 shrink-0"
              title="Back to Workspace"
            >
              <span className="text-base font-bold">←</span>
            </button>

            <div className="h-6 w-px bg-white/15 my-auto" />

            <div className="flex items-center gap-2.5">
              <Logo height={38} />
              <span className="text-white text-[22px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2.5">
                PULSE
              </span>
            </div>
          </div>

          {/* Right Section: Auth + Creoleap Logo */}
          <div className="flex items-center gap-2.5">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: 30, borderRadius: '9999px' }} />
            <div className="hidden sm:block">
              <CreoleapLogo height={28} />
            </div>
          </div>
        </header>

        {/* Page Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-sm border-b border-indigo-900/50">
          <h1 className="text-2xl font-extrabold m-0 tracking-tight">Available Quizzes</h1>
          <p className="text-xs text-indigo-200 mt-1 mb-0 font-medium">Select a quiz to test your knowledge</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 px-6">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-3">Loading quizzes...</p>
          </div>
        )}

        {error && (
          <div className="mx-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            <p className="m-0 text-sm font-medium">{error}</p>
            <button onClick={fetchQuizzes} className="mt-2 py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg cursor-pointer text-xs font-semibold transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6">
            <p className="text-slate-400 text-base">No quizzes available yet</p>
          </div>
        )}

        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border-2 border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]">
              <div className="px-5 pt-4 pb-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-extrabold m-0 text-slate-900 tracking-tight break-words">{quiz.title}</h3>
                    {quiz.retakeAllowed === 1 && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                        Retake
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-2 mb-0 leading-relaxed break-words">{quiz.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold gap-2 flex-wrap">
                    <span>📝 {quiz.questionCount} Questions</span>
                    <span>⭐ {quiz.totalPoints} Pts</span>
                    {quiz.timeLimitMinutes ? <span>⏱️ {quiz.timeLimitMinutes}m</span> : null}
                  </div>

                  {quiz.hasAttempted && quiz.lastScore !== null && (
                    <div className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-indigo-50/70 rounded-xl text-xs font-bold text-slate-700 border border-indigo-100/60 w-fit">
                      <span>Last Score:</span>
                      <span className="text-indigo-600 font-extrabold">{quiz.lastScore}/{quiz.lastMaxScore}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                className={`w-full py-3 text-xs font-extrabold tracking-widest uppercase cursor-pointer border-none transition-all ${
                  !quiz.canRetake && quiz.hasAttempted
                    ? 'bg-[#A5B4FC] text-white opacity-90 cursor-not-allowed'
                    : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-md'
                }`}
                onClick={() => setQuizToStart(quiz)}
                disabled={!quiz.canRetake && quiz.hasAttempted}
              >
                {quiz.hasAttempted && quiz.canRetake ? 'Retake Quiz' : quiz.hasAttempted ? 'Completed' : 'Start Quiz'}
              </button>
            </div>
          ))}
        </div>

        {/* Pre-Quiz Start Confirmation Modal */}
        {quizToStart && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-2 border border-indigo-100 shadow-sm">
                📝
              </div>

              <h2 className="text-xl font-extrabold text-center text-slate-900 m-0 mb-1">
                Are you ready for this quiz??
              </h2>
              <p className="text-xs text-center text-slate-500 m-0 mb-4 font-semibold">
                Please review all quiz details before starting.
              </p>

              {/* Quiz Details Card */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 flex flex-col gap-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quiz Name</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{quizToStart.title}</div>
                  {quizToStart.description && (
                    <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{quizToStart.description}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Total Questions</span>
                    <span className="text-slate-900 font-extrabold text-sm">{quizToStart.questionCount} Questions</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Total Points</span>
                    <span className="text-indigo-600 font-extrabold text-sm">{quizToStart.totalPoints} Pts</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Time Limit</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {quizToStart.timeLimitMinutes ? `${quizToStart.timeLimitMinutes} Mins` : 'No Limit'}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Retakes Allowed</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {quizToStart.retakeAllowed === 1 ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {quizToStart.hasAttempted && quizToStart.lastScore !== null && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Previous Score:</span>
                    <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {quizToStart.lastScore} / {quizToStart.lastMaxScore}
                    </span>
                  </div>
                )}
              </div>

              {/* Quiz Rules Warning */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 mb-4 flex items-start gap-2.5 text-xs text-amber-900 shadow-sm">
                <span className="text-base shrink-0 select-none">⚠️</span>
                <div className="flex-1">
                  <div className="font-extrabold text-amber-950 text-[11px] uppercase tracking-wider mb-0.5">Important Rules</div>
                  <div className="font-medium text-amber-900 leading-snug">
                    Do not switch tabs or leave the window during the quiz. Doing so will automatically submit your test.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuizToStart(null)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-extrabold cursor-pointer transition-colors"
                >
                  No
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const qId = quizToStart.id;
                    setQuizToStart(null);
                    startQuiz(qId);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-none bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-sm font-extrabold cursor-pointer transition-all shadow-md shadow-indigo-600/20"
                >
                  Yes, Start Quiz →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // RENDER: Taking Quiz
  // ──────────────────────────────────────────────────────────────
  if (view === 'taking' && activeQuiz) {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = activeQuiz.questions.length;

    let visitedUnansweredCount = 0;
    let unvisitedCount = 0;

    activeQuiz.questions.forEach((q, idx) => {
      const isAns = !!answers[q.id];
      const isVis = !!visitedQuestions[q.id] || idx === currentQuestionIndex;
      if (!isAns && isVis) visitedUnansweredCount++;
      if (!isAns && !isVis) unvisitedCount++;
    });

    const currentQuestion = activeQuiz.questions[currentQuestionIndex] || activeQuiz.questions[0];

    return (
      <div
        className="fixed inset-0 z-[99999] w-screen h-screen overflow-y-auto bg-slate-50 font-sans text-slate-900 select-none flex flex-col justify-between"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        onCopy={(e) => { e.preventDefault(); return false; }}
        onCut={(e) => { e.preventDefault(); return false; }}
        onPaste={(e) => { e.preventDefault(); return false; }}
      >
        {/* TopBar */}
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[60px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none shrink-0">
          {/* Left Section: Exit + Logo + Module Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center justify-center h-8 px-3 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0"
              title="Exit Quiz"
            >
              <span>←</span>
              <span>Exit</span>
            </button>

            <div className="h-6 w-px bg-white/15 my-auto shrink-0" />

            <div className="flex items-center gap-2 shrink-0">
              <Logo height={38} />
              <span className="text-white text-[20px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2">
                PULSE
              </span>
            </div>
          </div>

          <h2 className="hidden md:block flex-1 min-w-0 truncate text-center text-sm font-extrabold text-slate-100 px-3 m-0">
            {activeQuiz.title}
          </h2>

          <div className="flex items-center gap-2.5 shrink-0">
            {timeLeft !== null && (
              <span className={`text-xs md:text-sm font-black tabular-nums py-1 px-2.5 rounded-lg bg-white/10 border border-white/15 ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                ⏱️ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-[11px] text-slate-200 font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              {answeredCount}/{totalQuestions} Answered
            </span>
          </div>
        </header>

        {!isOnline && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center font-medium">
            Network lost — your answers are saved on this device. Submission will retry automatically when you're back online.
          </div>
        )}

        {resumedNotice && (
          <div className="m-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-sm text-center font-medium">
            Resumed your in-progress quiz — answers saved on this device.
            <button onClick={() => setResumedNotice(false)} className="ml-2 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-md cursor-pointer text-xs font-semibold transition-colors">
              OK
            </button>
          </div>
        )}

        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            <p className="m-0 font-medium">{error}</p>
            <div className="flex justify-center gap-2 mt-2">
              <button onClick={handleSubmit} disabled={submitting} className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                {submitting ? 'Submitting...' : 'Retry Submit'}
              </button>
              <button onClick={() => { setView('list'); setTimeLeft(null); deadlineRef.current = null; clearQuizSession(); }} className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 border-none rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                Exit
              </button>
            </div>
          </div>
        )}

        {timeLeft === 0 && !error && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center font-medium">
            Time's up — submitting your answers...
          </div>
        )}

        {leftDuringQuiz && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-extrabold mx-auto mb-2">!</div>
              <h2 className="text-lg font-extrabold m-0 mb-1 text-slate-900">You left the quiz</h2>
              <p className="text-sm text-slate-600 m-0 mb-1 font-medium">
                The quiz timer kept running while you were away.
              </p>
              {awaySeconds > 0 && (
                <p className="text-sm text-slate-500 m-0 mb-3 font-medium">
                  You were away for {formatTime(awaySeconds)}.
                </p>
              )}
              <p className="text-xs text-amber-600 m-0 mb-3 font-semibold">
                Warning {tabSwitchCountRef.current} of {MAX_TAB_SWITCH_WARNINGS}. On the next switch the quiz will be submitted automatically.
              </p>
              <button
                onClick={() => setLeftDuringQuiz(false)}
                className="w-full py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-sm font-bold cursor-pointer transition-colors"
              >
                Continue Quiz
              </button>
            </div>
          </div>
        )}

        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl border-2 border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-2 border border-emerald-100 shadow-sm">
                🚀
              </div>

              <h2 className="text-xl font-extrabold text-center text-slate-900 m-0 mb-1">
                Ready to Submit Quiz?
              </h2>
              <p className="text-xs text-center text-slate-500 m-0 mb-4 font-semibold">
                Please review your answer summary before final submission.
              </p>

              {/* Quiz Progress Details Box */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 flex flex-col gap-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quiz Name</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{activeQuiz.title}</div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Answered</span>
                    <span className="text-emerald-600 font-extrabold text-sm">
                      {answeredCount} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Unanswered</span>
                    <span className={`font-extrabold text-sm ${totalQuestions - answeredCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {totalQuestions - answeredCount} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Visited / Read</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {Object.keys(visitedQuestions).length} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Time Left</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {timeLeft !== null ? formatTime(timeLeft) : 'No Limit'}
                    </span>
                  </div>
                </div>

                {totalQuestions - answeredCount > 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>You still have <strong>{totalQuestions - answeredCount} unanswered</strong> question{totalQuestions - answeredCount > 1 ? 's' : ''}.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <span>🎉</span>
                    <span>All questions have been answered!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-extrabold cursor-pointer transition-colors"
                >
                  No, Continue Quiz
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    handleSubmit();
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl border-none bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white text-sm font-extrabold cursor-pointer transition-all shadow-md shadow-emerald-600/20"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Escape Key Submit Dialog */}
        {showEscapeDialog && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border-2 border-slate-200 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">
                ⚠️
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 m-0 mb-1">
                Submit Quiz?
              </h2>
              <p className="text-sm text-slate-500 m-0 mb-1 font-medium">
                Press <span className="font-bold text-slate-700">Escape</span> again to submit, or wait to continue.
              </p>
              <p className="text-xs text-amber-600 m-0 mb-4 font-semibold">
                Auto-closing in 5 seconds...
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (escapeDialogTimerRef.current) {
                      clearTimeout(escapeDialogTimerRef.current);
                      escapeDialogTimerRef.current = null;
                    }
                    setShowEscapeDialog(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-extrabold cursor-pointer transition-colors"
                >
                  Continue Quiz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (escapeDialogTimerRef.current) {
                      clearTimeout(escapeDialogTimerRef.current);
                      escapeDialogTimerRef.current = null;
                    }
                    setShowEscapeDialog(false);
                    handleSubmit();
                  }}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl border-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-extrabold cursor-pointer transition-all shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-side Question & Overview Container (Full Screen Layout) */}
        <div className="w-full flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6 pb-28 min-h-0 overflow-y-auto items-start">
          {/* LEFT COLUMN: Active Question View */}
          <div className="flex-1 min-w-0 w-full flex flex-col">
            {currentQuestion && (
              <div key={currentQuestion.id} className="relative bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex-1 flex flex-col justify-between">
                {/* Screenshot-protective overlay on question area */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 6px)',
                    mixBlendMode: 'multiply',
                    borderRadius: 'inherit',
                  }}
                />
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 py-1.5 px-3 rounded-xl border border-indigo-100">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-xl">{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold leading-relaxed mb-4 text-slate-900 break-words whitespace-pre-line">{currentQuestion.questionText}</p>
                  {currentQuestion.questionMediaUrl && getImageUrl(currentQuestion.questionMediaUrl) && (
                    <div className="w-full max-w-md h-[300px] rounded-2xl overflow-hidden mb-4 bg-slate-100 flex items-center justify-center border border-slate-200">
                      <img
                        src={getImageUrl(currentQuestion.questionMediaUrl)!}
                        alt="Question"
                        className="w-full h-full object-contain"
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === opt.text;
                    return (
                      <button
                        key={opt.id}
                        className={`flex items-start gap-4 py-4 px-5 min-w-0 border-2 rounded-2xl cursor-pointer text-left transition-all text-base ${isSelected ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 font-extrabold shadow-sm' : 'bg-slate-50/80 border-slate-200 text-slate-800 hover:bg-white font-semibold'
                          }`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.text || '' }))}
                      >
                        <span className={`w-8 h-8 flex items-center justify-center rounded-xl font-black text-xs shrink-0 mt-0.5 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{String.fromCharCode(65 + optIdx)}</span>
                        <span className="flex-1 min-w-0 break-words">{opt.text}</span>
                        {opt.mediaUrl && getImageUrl(opt.mediaUrl) && (
                          <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200 p-1 flex items-center justify-center shadow-sm">
                            <img
                              src={getImageUrl(opt.mediaUrl)!}
                              alt=""
                              className="w-full h-full object-contain"
                              draggable="false"
                              onContextMenu={(e) => e.preventDefault()}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              style={{ pointerEvents: 'none' }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Question Overview Sidebar */}
          <div className="w-full md:w-[320px] lg:w-[380px] xl:w-[420px] shrink-0">
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-100 pb-2">
                <span className="text-sm font-extrabold text-slate-800 tracking-wide">
                  📊 Question Overview
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Q{currentQuestionIndex + 1}/{totalQuestions}
                </span>
              </div>

              {/* Status Badges & Counters */}
              <div className="flex flex-col gap-1 text-xs font-semibold mb-3">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Answered
                  </span>
                  <span className="font-extrabold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Read (Unanswered)
                  </span>
                  <span className="font-extrabold">{visitedUnansweredCount}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    Not Visited
                  </span>
                  <span className="font-extrabold">{unvisitedCount}</span>
                </div>
              </div>

              {/* Question Number Palette Grid */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Select Question</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeQuiz.questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAns = !!answers[q.id];
                    const isVis = !!visitedQuestions[q.id] || isCurrent;

                    let styleClass = 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200';
                    let labelStatus = 'Not visited';

                    if (isAns) {
                      styleClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
                      labelStatus = 'Answered';
                    } else if (isVis) {
                      styleClass = 'bg-amber-500 text-white border-amber-500 shadow-sm';
                      labelStatus = 'Read (Unanswered)';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded-xl font-extrabold text-[11px] transition-all flex items-center justify-center cursor-pointer ${styleClass} ${isCurrent ? 'ring-4 ring-indigo-500/40 border-2 border-indigo-600 scale-105' : ''}`}
                        title={`Question ${idx + 1}: ${labelStatus}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation & Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 py-2.5 px-5 bg-white border-t-2 border-slate-200 flex items-center justify-between z-50 shadow-lg">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={`py-2.5 px-6 rounded-xl border border-slate-300 font-extrabold text-sm transition-all cursor-pointer ${currentQuestionIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            {currentQuestionIndex < totalQuestions - 1 && (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="py-2.5 px-7 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-sm font-extrabold cursor-pointer transition-all shadow-md shadow-indigo-600/20"
              >
                Next →
              </button>
            )}

            <button
              className={`py-2.5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white border-none rounded-xl text-sm font-extrabold cursor-pointer transition-all shadow-md shadow-green-600/20 ${submitting ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              onClick={() => setShowExitConfirm(true)}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // RENDER: Result
  // ──────────────────────────────────────────────────────────────
  if (view === 'result' && result) {
    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    const passed = activeQuiz ? result.score >= activeQuiz.passingPoints : true;

    return (
      <div className="h-screen overflow-y-auto bg-slate-50 font-sans text-slate-900">
        {/* TopBar */}
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[60px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none">
          {/* Left Section: Back + Logo + Module Name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setView('list'); setResult(null); setActiveQuiz(null); }}
              className="flex items-center justify-center h-8 px-3 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
              title="Back to Quizzes"
            >
              <span>←</span>
              <span className="ml-1">Quizzes</span>
            </button>

            <div className="h-6 w-px bg-white/15 my-auto" />

            <div className="flex items-center gap-2">
              <Logo height={38} />
              <span className="text-white text-[20px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2">
                PULSE
              </span>
            </div>
          </div>

          {/* Right Section: Auth + Creoleap Logo */}
          <div className="flex items-center gap-2.5">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: 30, borderRadius: '9999px' }} />
            <div className="hidden sm:block">
              <CreoleapLogo height={28} />
            </div>
          </div>
        </header>

        <div className="max-w-[400px] my-10 mx-auto p-7 bg-white rounded-3xl border-2 border-slate-200 text-center shadow-lg">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-3 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {passed ? '✓' : '✗'}
          </div>
          <h2 className="text-xl font-extrabold m-0 text-slate-900">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            {passed ? 'You passed the quiz.' : 'You did not pass this time.'}
          </p>

          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-indigo-600">{result.score}</span>
            <span className="text-xl text-slate-400">/</span>
            <span className="text-xl text-slate-400 font-semibold">{result.maxScore}</span>
          </div>
          <p className="text-sm text-slate-500 font-semibold mt-0.5 mb-0">{percentage}%</p>

          {result.timeTakenSeconds && (
            <p className="text-xs text-slate-400 mt-2 mb-0">
              Time taken: {formatTime(result.timeTakenSeconds)}
            </p>
          )}

          <div className="mt-4">
            <button onClick={() => { setView('list'); setResult(null); setActiveQuiz(null); }} className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm">
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
