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
      const firstQId = quizRes.data.questions?.[0]?.id;
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
        {/* TopBar */}
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[68px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none">
          {/* Left Section: Back + Logo + Module Name */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white cursor-pointer transition-all active:scale-95 shrink-0"
              title="Back to Workspace"
            >
              <span className="text-base font-bold">←</span>
            </button>

            <div className="h-7 w-px bg-white/15 my-auto" />

            <div className="flex items-center gap-2.5">
              <Logo height={44} />
              <span className="text-white text-[22px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2.5">
                QUIZ
              </span>
            </div>
          </div>

          {/* Right Section: Auth + Creoleap Logo */}
          <div className="flex items-center gap-3.5">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: 34, borderRadius: '9999px' }} />
            <div className="hidden sm:block">
              <CreoleapLogo height={32} />
            </div>
          </div>
        </header>

        {/* Page Banner */}
        <div className="p-6 pb-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-sm border-b border-indigo-900/50">
          <h1 className="text-2xl font-extrabold m-0 tracking-tight">Available Quizzes</h1>
          <p className="text-xs text-indigo-200 mt-1 mb-0 font-medium">Select a quiz to test your knowledge</p>
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

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-extrabold m-0 text-slate-900 break-words">{quiz.title}</h3>
                    {quiz.retakeAllowed === 1 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                        Retake
                      </span>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="text-xs text-slate-500 mt-1.5 mb-0 leading-relaxed break-words">{quiz.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-semibold gap-1">
                    <span>📝 {quiz.questionCount} Questions</span>
                    <span>⭐ {quiz.totalPoints} Pts</span>
                    {quiz.timeLimitMinutes ? <span>⏱️ {quiz.timeLimitMinutes}m</span> : null}
                  </div>

                  {quiz.hasAttempted && quiz.lastScore !== null && (
                    <div className="inline-flex items-center gap-1 py-1 px-2.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 w-fit">
                      <span>Last Score:</span>
                      <span className="text-indigo-600">{quiz.lastScore}/{quiz.lastMaxScore}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                className={`w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white border-none text-xs font-extrabold tracking-wide uppercase cursor-pointer transition-all ${
                  !quiz.canRetake && quiz.hasAttempted ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'opacity-100 shadow-sm'
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
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 border border-indigo-100 shadow-sm">
                📝
              </div>

              <h2 className="text-xl font-extrabold text-center text-slate-900 m-0 mb-1">
                Are you ready for this quiz??
              </h2>
              <p className="text-xs text-center text-slate-500 m-0 mb-5 font-semibold">
                Please review all quiz details before starting.
              </p>

              {/* Quiz Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 flex flex-col gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quiz Name</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{quizToStart.title}</div>
                  {quizToStart.description && (
                    <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{quizToStart.description}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Total Questions</span>
                    <span className="text-slate-900 font-extrabold text-sm">{quizToStart.questionCount} Questions</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Total Points</span>
                    <span className="text-indigo-600 font-extrabold text-sm">{quizToStart.totalPoints} Pts</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Time Limit</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {quizToStart.timeLimitMinutes ? `${quizToStart.timeLimitMinutes} Mins` : 'No Limit'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
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
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-6 flex items-start gap-2.5 text-xs text-amber-900 shadow-sm">
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
      <div className="h-screen overflow-y-auto bg-slate-50 font-sans text-slate-900">
        {/* TopBar */}
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[68px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none">
          {/* Left Section: Exit + Logo + Module Name */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center justify-center h-10 px-3.5 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0"
              title="Exit Quiz"
            >
              <span>←</span>
              <span>Exit</span>
            </button>

            <div className="h-7 w-px bg-white/15 my-auto shrink-0" />

            <div className="flex items-center gap-2.5 shrink-0">
              <Logo height={44} />
              <span className="text-white text-[22px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2.5">
                QUIZ
              </span>
            </div>
          </div>

          <h2 className="hidden md:block flex-1 min-w-0 truncate text-center text-base font-extrabold text-slate-100 px-4 m-0">
            {activeQuiz.title}
          </h2>

          <div className="flex items-center gap-3.5 shrink-0">
            {timeLeft !== null && (
              <span className={`text-sm md:text-base font-black tabular-nums py-1.5 px-3.5 rounded-xl bg-white/10 border border-white/15 ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                ⏱️ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-xs text-slate-200 font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
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
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-2 border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 border border-emerald-100 shadow-sm">
                🚀
              </div>

              <h2 className="text-xl font-extrabold text-center text-slate-900 m-0 mb-1">
                Ready to Submit Quiz?
              </h2>
              <p className="text-xs text-center text-slate-500 m-0 mb-5 font-semibold">
                Please review your answer summary before final submission.
              </p>

              {/* Quiz Progress Details Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-5 flex flex-col gap-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quiz Name</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">{activeQuiz.title}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/80 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Answered</span>
                    <span className="text-emerald-600 font-extrabold text-sm">
                      {answeredCount} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Unanswered</span>
                    <span className={`font-extrabold text-sm ${totalQuestions - answeredCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {totalQuestions - answeredCount} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="text-slate-400 font-semibold block text-[11px]">Visited / Read</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      {Object.keys(visitedQuestions).length} / {totalQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
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

        {/* Side-by-side Question & Overview Container */}
        <div className="p-4 flex flex-col md:flex-row gap-6 pb-28 max-w-6xl mx-auto items-start">
          {/* LEFT COLUMN: Active Question View */}
          <div className="flex-1 min-w-0 w-full">
            {currentQuestion && (
              <div key={currentQuestion.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 py-1 px-2.5 rounded-md">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed mb-3 text-slate-900 break-words whitespace-pre-line">{currentQuestion.questionText}</p>
                {currentQuestion.questionMediaUrl && getImageUrl(currentQuestion.questionMediaUrl) && (
                  <div className="w-[256px] h-[319px] max-w-full rounded-xl overflow-hidden mb-3 bg-slate-100 flex items-center justify-center border border-slate-200">
                    <img
                      src={getImageUrl(currentQuestion.questionMediaUrl)!}
                      alt="Question"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === opt.text;
                    return (
                      <button
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 px-3.5 min-w-0 border-2 rounded-xl cursor-pointer text-left transition-all text-sm ${
                          isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-600 font-medium' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-white'
                        }`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt.text || '' }))}
                      >
                        <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 font-bold text-xs shrink-0 text-slate-700">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="flex-1 min-w-0 break-words font-medium">{opt.text}</span>
                        {opt.mediaUrl && getImageUrl(opt.mediaUrl) && (
                          <div className="w-40 h-40 shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-sm">
                            <img
                              src={getImageUrl(opt.mediaUrl)!}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
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
          <div className="w-full md:w-[320px] shrink-0 sticky top-20">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-extrabold text-slate-800 tracking-wide">
                  📊 Question Overview
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Q{currentQuestionIndex + 1}/{totalQuestions}
                </span>
              </div>

              {/* Status Badges & Counters */}
              <div className="flex flex-col gap-1.5 text-xs font-semibold mb-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Answered
                  </span>
                  <span className="font-extrabold">{answeredCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Read (Unanswered)
                  </span>
                  <span className="font-extrabold">{visitedUnansweredCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
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
                <div className="flex flex-wrap gap-2">
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
                        className={`w-9 h-9 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center cursor-pointer ${styleClass} ${
                          isCurrent ? 'ring-4 ring-indigo-500/40 border-2 border-indigo-600 scale-105' : ''
                        }`}
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
        <div className="fixed bottom-0 left-0 right-0 p-3 px-6 bg-white border-t-2 border-slate-200 flex items-center justify-between z-50 shadow-lg">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={`py-2.5 px-6 rounded-xl border border-slate-300 font-extrabold text-sm transition-all cursor-pointer ${
              currentQuestionIndex === 0
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
              className={`py-2.5 px-8 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white border-none rounded-xl text-sm font-extrabold cursor-pointer transition-all shadow-md shadow-green-600/20 ${
                submitting ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
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
        <header className="sticky top-0 z-[200] flex items-center justify-between px-5 h-[68px] bg-gradient-to-r from-[#0a0a1f] via-[#0a015a] to-[#080a25] border-b border-sky-400/10 text-white shadow-[0_4px_20px_rgba(8,10,37,0.5),inset_0_-1px_0_rgba(255,255,255,0.06)] select-none">
          {/* Left Section: Back + Logo + Module Name */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => { setView('list'); setResult(null); setActiveQuiz(null); }}
              className="flex items-center justify-center h-10 px-3.5 bg-[#94c5ff]/18 hover:bg-[#bfdbfe]/24 border border-[#94c5ff]/24 rounded-xl text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
              title="Back to Quizzes"
            >
              <span>←</span>
              <span className="ml-1">Quizzes</span>
            </button>

            <div className="h-7 w-px bg-white/15 my-auto" />

            <div className="flex items-center gap-2.5">
              <Logo height={44} />
              <span className="text-white text-[22px] font-black tracking-[0.08em] font-sans uppercase border-l border-white/20 pl-2.5">
                QUIZ
              </span>
            </div>
          </div>

          {/* Right Section: Auth + Creoleap Logo */}
          <div className="flex items-center gap-3.5">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: 34, borderRadius: '9999px' }} />
            <div className="hidden sm:block">
              <CreoleapLogo height={32} />
            </div>
          </div>
        </header>

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
