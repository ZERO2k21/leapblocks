import React, { useState, useEffect, useCallback } from 'react';
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
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet('/api/leaplab/quiz/quizzes', token);
      setQuizzes(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // ── Timer ──
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
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
    try {
      // Fetch quiz details
      const quizRes = await apiGet(`/api/leaplab/quiz/quizzes/${quizId}`, token);
      setActiveQuiz(quizRes.data);

      // Start attempt
      const attemptRes = await apiPost(`/api/leaplab/quiz/quizzes/${quizId}/start`, token, {});
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

  // ── Submit quiz ──
  const handleSubmit = async () => {
    if (!token || !attemptId || submitting) return;
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiPost(`/api/leaplab/quiz/quizzes/attempts/${attemptId}/submit`, token, {
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
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backBtn}>← Back</button>
          <h1 style={styles.title}>Quizzes</h1>
          <p style={styles.subtitle}>Test your knowledge</p>
        </div>

        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ color: '#94a3b8', marginTop: 12 }}>Loading quizzes...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
            <button onClick={fetchQuizzes} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div style={styles.center}>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>No quizzes available yet</p>
          </div>
        )}

        <div style={styles.quizGrid}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} style={styles.quizCard}>
              <div style={styles.quizCardBody}>
                <h3 style={styles.quizTitle}>{quiz.title}</h3>
                {quiz.description && (
                  <p style={styles.quizDesc}>{quiz.description}</p>
                )}
                <div style={styles.quizMeta}>
                  <span>{quiz.questionCount} questions</span>
                  <span>{quiz.totalPoints} pts</span>
                  {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes}m</span>}
                  {quiz.retakeAllowed === 1 && <span style={{ color: '#4F46E5' }}>Retake</span>}
                </div>
                {quiz.hasAttempted && quiz.lastScore !== null && (
                  <div style={styles.attemptBadge}>
                    Last: {quiz.lastScore}/{quiz.lastMaxScore}
                  </div>
                )}
              </div>
              <button
                style={{
                  ...styles.startBtn,
                  opacity: !quiz.canRetake && quiz.hasAttempted ? 0.5 : 1,
                }}
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
      <div style={styles.container}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <button onClick={() => { setView('list'); setTimeLeft(null); }} style={styles.backBtn}>
            ← Exit
          </button>
          <h2 style={{ ...styles.title, fontSize: 18 }}>{activeQuiz.title}</h2>
          <div style={styles.timerArea}>
            {timeLeft !== null && (
              <span style={{
                ...styles.timer,
                color: timeLeft < 60 ? '#ef4444' : '#0f172a',
              }}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span style={styles.answerCount}>{answeredCount}/{totalQuestions}</span>
          </div>
        </div>

        {/* Questions */}
        <div style={styles.questionsArea}>
          {activeQuiz.questions.map((q, idx) => (
            <div key={q.id} style={styles.questionCard}>
              <div style={styles.questionHeader}>
                <span style={styles.questionNumber}>Q{idx + 1}</span>
                <span style={styles.questionPoints}>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              </div>
              <p style={styles.questionText}>{q.questionText}</p>
              {q.questionMediaUrl && getImageUrl(q.questionMediaUrl) && (
                <img
                  src={getImageUrl(q.questionMediaUrl)!}
                  alt="Question"
                  style={styles.questionImage}
                />
              )}
              <div style={styles.optionsList}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === opt.text;
                  return (
                    <button
                      key={opt.id}
                      style={{
                        ...styles.optionBtn,
                        ...(isSelected ? styles.optionBtnSelected : {}),
                      }}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.text || '' }))}
                    >
                      <span style={styles.optionLabel}>{String.fromCharCode(65 + optIdx)}</span>
                      <span style={styles.optionText}>{opt.text}</span>
                      {opt.mediaUrl && getImageUrl(opt.mediaUrl) && (
                        <img src={getImageUrl(opt.mediaUrl)!} alt="" style={styles.optionImage} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div style={styles.submitArea}>
          <button
            style={{
              ...styles.submitBtn,
              opacity: submitting || answeredCount === 0 ? 0.5 : 1,
            }}
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
      <div style={styles.container}>
        <div style={styles.resultCard}>
          <div style={{
            ...styles.resultIcon,
            background: passed ? '#dcfce7' : '#fef2f2',
            color: passed ? '#16a34a' : '#dc2626',
          }}>
            {passed ? '✓' : '✗'}
          </div>
          <h2 style={styles.resultTitle}>
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p style={styles.resultSubtitle}>
            {passed ? 'You passed the quiz.' : 'You did not pass this time.'}
          </p>

          <div style={styles.scoreDisplay}>
            <span style={styles.scoreValue}>{result.score}</span>
            <span style={styles.scoreSeparator}>/</span>
            <span style={styles.scoreMax}>{result.maxScore}</span>
          </div>
          <p style={styles.percentage}>{percentage}%</p>

          {result.timeTakenSeconds && (
            <p style={styles.timeTaken}>
              Time taken: {formatTime(result.timeTakenSeconds)}
            </p>
          )}

          <div style={styles.resultActions}>
            <button onClick={() => { setView('list'); setResult(null); setActiveQuiz(null); }} style={styles.resultBtn}>
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Styles ────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    color: '#0f172a',
  },
  header: {
    padding: '24px 24px 16px',
    background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
    color: '#fff',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
    margin: '4px 0 0',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#4F46E5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    margin: '24px',
    padding: 16,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 12,
    color: '#dc2626',
    textAlign: 'center' as const,
  },
  retryBtn: {
    marginTop: 8,
    padding: '6px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  quizGrid: {
    padding: '16px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  quizCard: {
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  quizCardBody: {
    padding: '16px 16px 12px',
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
  },
  quizDesc: {
    fontSize: 13,
    color: '#64748b',
    margin: '4px 0 0',
    lineHeight: 1.4,
  },
  quizMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },
  attemptBadge: {
    marginTop: 8,
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f1f5f9',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
  },
  startBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
    color: '#fff',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Taking quiz
  topBar: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fff',
    borderBottom: '2px solid #e2e8f0',
  },
  timerArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  timer: {
    fontSize: 18,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  answerCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: 600,
  },
  questionsArea: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 100,
  },
  questionCard: {
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: 16,
    padding: 20,
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 13,
    fontWeight: 800,
    color: '#4F46E5',
    background: '#eef2ff',
    padding: '2px 8px',
    borderRadius: 6,
  },
  questionPoints: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  questionText: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.5,
    margin: '0 0 12px',
  },
  questionImage: {
    maxWidth: '100%',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    fontSize: 14,
  },
  optionBtnSelected: {
    background: '#eef2ff',
    borderColor: '#4F46E5',
    color: '#4F46E5',
  },
  optionLabel: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    background: '#e2e8f0',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    fontWeight: 500,
  },
  optionImage: {
    width: 48,
    height: 48,
    objectFit: 'cover',
    borderRadius: 8,
  },
  submitArea: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 24px',
    background: '#fff',
    borderTop: '2px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center',
  },
  submitBtn: {
    padding: '14px 48px',
    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Result
  resultCard: {
    maxWidth: 400,
    margin: '60px auto',
    padding: 40,
    background: '#fff',
    borderRadius: 24,
    border: '2px solid #e2e8f0',
    textAlign: 'center' as const,
  },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    fontWeight: 800,
    margin: '0 auto 16px',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  scoreDisplay: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 800,
    color: '#4F46E5',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#94a3b8',
  },
  scoreMax: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: 600,
  },
  percentage: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: 600,
    marginTop: 4,
  },
  timeTaken: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  resultActions: {
    marginTop: 24,
  },
  resultBtn: {
    padding: '12px 32px',
    background: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
