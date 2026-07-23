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

  // ── Timer ──
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

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

      // Set timer if quiz has time limit
      if (quizRes.data.timeLimitMinutes) {
        setTimeLeft(quizRes.data.timeLimitMinutes * 60);
      } else {
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
    if (!token || !attemptId || submitting) return;
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiPost(`${QUIZZES_PATH}/attempts/${attemptId}/submit`, token, {
        answers: answerArray,
      });

      setResult(res.data);
      setView('result');
      setTimeLeft(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
      <div className="h-full overflow-y-auto bg-slate-50 font-sans text-slate-900">
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
                <h3 className="text-base font-bold m-0 text-slate-900">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-xs text-slate-500 mt-1 mb-0 leading-snug">{quiz.description}</p>
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
      <div className="h-full overflow-y-auto bg-slate-50 font-sans text-slate-900">
        {/* Top bar */}
        <div className="sticky top-0 z-[100] flex items-center justify-between p-3 px-4 bg-white border-b-2 border-slate-200">
          <button onClick={() => { setView('list'); setTimeLeft(null); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none py-1.5 px-3 rounded-lg cursor-pointer text-xs font-semibold transition-colors">
            ← Exit
          </button>
          <h2 className="text-lg font-extrabold m-0 text-slate-900">{activeQuiz.title}</h2>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <span className={`text-lg font-extrabold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-xs text-slate-400 font-semibold">{answeredCount}/{totalQuestions}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="p-4 flex flex-col gap-4 pb-28">
          {activeQuiz.questions.map((q, idx) => (
            <div key={q.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 py-0.5 px-2 rounded-md">Q{idx + 1}</span>
                <span className="text-xs text-slate-400 font-semibold">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed mb-3 text-slate-900">{q.questionText}</p>
              {q.questionMediaUrl && getImageUrl(q.questionMediaUrl) && (
                <img
                  src={getImageUrl(q.questionMediaUrl)!}
                  alt="Question"
                  className="max-w-full rounded-xl mb-3"
                />
              )}
              <div className="flex flex-col gap-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === opt.text;
                  return (
                    <button
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 px-3.5 border-2 rounded-xl cursor-pointer text-left transition-all text-sm ${
                        isSelected ? 'bg-indigo-50 border-indigo-600 text-indigo-600 font-medium' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-white'
                      }`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.text || '' }))}
                    >
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 font-bold text-xs shrink-0 text-slate-700">{String.fromCharCode(65 + optIdx)}</span>
                      <span className="flex-1 font-medium">{opt.text}</span>
                      {opt.mediaUrl && getImageUrl(opt.mediaUrl) && (
                        <img src={getImageUrl(opt.mediaUrl)!} alt="" className="w-12 h-12 object-cover rounded-lg" />
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
      <div className="h-full overflow-y-auto bg-slate-50 font-sans text-slate-900">
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
