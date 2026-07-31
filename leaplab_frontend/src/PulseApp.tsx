import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLeapLabAuthStore } from './auth/leaplabAuthStore';
import { LMS_API_BASE } from './auth/api';

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
  } catch {}
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

  // Result state
  const [result, setResult] = useState<AttemptResult | null>(null);

  // Tab-warning & exit-confirm state
  const [leftDuringQuiz, setLeftDuringQuiz] = useState(false);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Network & resume state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [resumedNotice, setResumedNotice] = useState(false);
  const pendingSubmitRef = useRef(false);

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
    } catch {}
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

  // ── Start quiz ──
  const startQuiz = async (quizId: string) => {
    if (!token) return;
    setError(null);
    try {
      // Fetch quiz details
      const quizRes = await apiGet(`${QUIZZES_PATH}/${quizId}`, token);
      setActiveQuiz(quizRes.data);

      // Start attempt
      const attemptRes = await apiPost(`${QUIZZES_PATH}/${quizId}/start`, token, {});
      setAttemptId(attemptRes.data.attemptId);
      setAnswers({});
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
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});

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
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white">
          <button onClick={onBack} className="bg-white/15 hover:bg-white/25 border-none text-white py-1.5 px-3 rounded-lg cursor-pointer text-xs font-semibold mb-3 transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-extrabold m-0">Quizzes</h1>
          <p className="text-sm opacity-80 mt-1 mb-0">Test your knowledge</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-15 px-6">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-3">Loading quizzes...</p>
          </div>
        )}

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            <p className="m-0 text-sm font-medium">{error}</p>
            <button onClick={fetchQuizzes} className="mt-2 py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white border-none rounded-lg cursor-pointer text-xs font-semibold transition-colors">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-15 px-6">
            <p className="text-slate-400 text-base">No quizzes available yet</p>
          </div>
        )}

        <div className="p-4 px-6 pb-6 flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 pb-3">
                <h3 className="text-base font-bold m-0 text-slate-900 break-words">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-xs text-slate-500 mt-1 mb-0 leading-snug break-words">{quiz.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400 font-medium">
                  <span>{quiz.questionCount} questions</span>
                  <span>{quiz.totalPoints} pts</span>
                  {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes}m</span>}
                  {quiz.retakeAllowed === 1 && <span className="text-indigo-600">Retake</span>}
                </div>
                {quiz.hasAttempted && quiz.lastScore !== null && (
                  <div className="mt-2 inline-block py-0.5 px-2 bg-slate-100 rounded-md text-xs font-semibold text-slate-600">
                    Last: {quiz.lastScore}/{quiz.lastMaxScore}
                  </div>
                )}
              </div>
              <button
                className={`w-full py-3 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-none text-sm font-bold cursor-pointer transition-opacity ${
                  !quiz.canRetake && quiz.hasAttempted ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-95'
                }`}
                onClick={() => startQuiz(quiz.id)}
                disabled={!quiz.canRetake && quiz.hasAttempted}
              >
                {quiz.hasAttempted && quiz.canRetake ? 'Retake' : quiz.hasAttempted ? 'Completed' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // RENDER: Taking Quiz
  // ──────────────────────────────────────────────────────────────
  if (view === 'taking' && activeQuiz) {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = activeQuiz.questions.length;

    return (
      <div className="h-screen overflow-y-auto bg-slate-50 font-sans text-slate-900">
        {/* Top bar */}
        <div className="sticky top-0 z-[100] flex items-center justify-between p-3 px-4 bg-white border-b-2 border-slate-200">
          <button onClick={() => setShowExitConfirm(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none py-1.5 px-3 rounded-lg cursor-pointer text-xs font-semibold transition-colors">
            ← Exit
          </button>
          <h2 className="flex-1 min-w-0 truncate text-center text-lg font-extrabold m-0 text-slate-900 px-2">{activeQuiz.title}</h2>
          <div className="flex items-center gap-3 shrink-0">
            {timeLeft !== null && (
              <span className={`text-lg font-extrabold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-xs text-slate-400 font-semibold">{answeredCount}/{totalQuestions}</span>
          </div>
        </div>

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
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-3">!</div>
              <h2 className="text-lg font-extrabold m-0 mb-2 text-slate-900">You left the quiz</h2>
              <p className="text-sm text-slate-600 m-0 mb-1 font-medium">
                The quiz timer kept running while you were away.
              </p>
              {awaySeconds > 0 && (
                <p className="text-sm text-slate-500 m-0 mb-4 font-medium">
                  You were away for {formatTime(awaySeconds)}.
                </p>
              )}
              <p className="text-xs text-amber-600 m-0 mb-4 font-semibold">
                Warning {tabSwitchCountRef.current} of {MAX_TAB_SWITCH_WARNINGS}. On the next switch the quiz will be submitted automatically.
              </p>
              <button
                onClick={() => setLeftDuringQuiz(false)}
                className="w-full py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-sm font-bold cursor-pointer transition-colors"
              >
                Continue Quiz
              </button>
            </div>
          </div>
        )}

        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <h2 className="m-0 mb-2 text-lg font-bold text-slate-900">Submit quiz?</h2>
              <p className="m-0 mb-5 text-sm text-slate-600 leading-relaxed font-medium">
                You have answered {answeredCount}/{totalQuestions} questions. Submit now and finish the quiz?
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setShowExitConfirm(false); autoSubmittedRef.current = true; setView('list'); setTimeLeft(null); deadlineRef.current = null; clearQuizSession(); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer transition-all hover:bg-slate-50"
                >
                  No, Exit Quiz
                </button>
                <button
                  type="button"
                  onClick={() => { setShowExitConfirm(false); handleSubmit(); }}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl border-0 bg-green-600 text-white text-xs font-semibold cursor-pointer transition-all hover:bg-green-700 shadow-md shadow-green-600/20"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="p-4 flex flex-col gap-4 pb-28">
          {activeQuiz.questions.map((q, idx) => (
            <div key={q.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 py-0.5 px-2 rounded-md">Q{idx + 1}</span>
                <span className="text-xs text-slate-400 font-semibold">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed mb-3 text-slate-900 break-words whitespace-pre-line">{q.questionText}</p>
              {q.questionMediaUrl && getImageUrl(q.questionMediaUrl) && (
                <img
                  src={getImageUrl(q.questionMediaUrl)!}
                  alt="Question"
                  className="max-w-full rounded-xl mb-3"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex flex-col gap-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === opt.text;
                  return (
                    <button
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 px-3.5 min-w-0 border-2 rounded-xl cursor-pointer text-left transition-all text-sm ${
                        isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-600 font-medium' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-white'
                      }`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.text || '' }))}
                    >
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 font-bold text-xs shrink-0 text-slate-700">{String.fromCharCode(65 + optIdx)}</span>
                      <span className="flex-1 min-w-0 break-words font-medium">{opt.text}</span>
                      {opt.mediaUrl && getImageUrl(opt.mediaUrl) && (
                        <img src={getImageUrl(opt.mediaUrl)!} alt="" className="w-12 h-12 object-cover rounded-lg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 px-6 bg-white border-t-2 border-slate-200 flex justify-center z-50">
          <button
            className={`py-3.5 px-12 bg-gradient-to-br from-green-600 to-emerald-500 text-white border-none rounded-xl text-base font-bold cursor-pointer transition-opacity ${
              submitting || answeredCount === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-95'
            }`}
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
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
        <div className="max-w-[400px] my-15 mx-auto p-10 bg-white rounded-3xl border-2 border-slate-200 text-center shadow-lg">
          <div className={`w-18 h-18 rounded-full flex items-center justify-center text-4xl font-extrabold mx-auto mb-4 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {passed ? '✓' : '✗'}
          </div>
          <h2 className="text-2xl font-extrabold m-0 text-slate-900">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-0">
            {passed ? 'You passed the quiz.' : 'You did not pass this time.'}
          </p>

          <div className="mt-6 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold text-indigo-600">{result.score}</span>
            <span className="text-2xl text-slate-400">/</span>
            <span className="text-2xl text-slate-400 font-semibold">{result.maxScore}</span>
          </div>
          <p className="text-base text-slate-500 font-semibold mt-1 mb-0">{percentage}%</p>

          {result.timeTakenSeconds && (
            <p className="text-xs text-slate-400 mt-2 mb-0">
              Time taken: {formatTime(result.timeTakenSeconds)}
            </p>
          )}

          <div className="mt-6">
            <button onClick={() => { setView('list'); setResult(null); setActiveQuiz(null); }} className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm">
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
