import React from 'react';

const ICONS = {

  // ── User Interface ──────────────────────────────────────────
  Button: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="3" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
      <rect x="6" y="9" width="12" height="6" rx="1" fill="#DBEAFE" opacity="0.8"/>
    </svg>
  ),
  Label: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
      <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#7C2D12">T</text>
    </svg>
  ),
  TextBox: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5"/>
      <rect x="4" y="8" width="16" height="8" rx="1" fill="#E2E8F0"/>
      <line x1="6" y1="11" x2="14" y2="11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="6" y1="14" x2="12" y2="14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  PasswordTextBox: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5"/>
      <rect x="4" y="8" width="16" height="8" rx="1" fill="#E2E8F0"/>
      <circle cx="12" cy="12" r="2" fill="#94A3B8"/>
      <rect x="5" y="2" width="14" height="4" rx="2" fill="#EF4444" stroke="#DC2626" strokeWidth="1"/>
    </svg>
  ),
  CheckBox: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#10B981" stroke="#059669" strokeWidth="1.5"/>
      <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Switch: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="10" rx="5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1"/>
      <circle cx="17" cy="12" r="5" fill="#10B981" stroke="#059669" strokeWidth="1"/>
    </svg>
  ),
  Slider: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="3" y1="12" x2="21" y2="12" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="12" r="5" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
    </svg>
  ),
  Image: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5"/>
      <circle cx="7" cy="9" r="2" fill="#DDD6FE"/>
      <path d="M2 16l5-4 4 3 5-5 6 6" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  WebViewer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <rect x="2" y="4" width="20" height="4" rx="2" fill="#E2E8F0"/>
      <circle cx="6" cy="6" r="0.8" fill="#EF4444"/>
      <circle cx="8" cy="6" r="0.8" fill="#F59E0B"/>
      <circle cx="10" cy="6" r="0.8" fill="#10B981"/>
      <line x1="4" y1="11" x2="14" y2="11" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/>
      <line x1="4" y1="13" x2="12" y2="13" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/>
      <line x1="4" y1="15" x2="10" y2="15" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  DatePicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <rect x="3" y="4" width="18" height="5" rx="3" fill="#3B82F6"/>
      <text x="12" y="8" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">2025</text>
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1E293B">17</text>
      <line x1="7" y1="11" x2="7" y2="12" stroke="#3B82F6" strokeWidth="1.5"/>
      <line x1="17" y1="11" x2="17" y2="12" stroke="#3B82F6" strokeWidth="1.5"/>
    </svg>
  ),
  TimePicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="#3B82F6"/>
      <line x1="12" y1="6" x2="12" y2="11" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="15" y2="14" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ListPicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
      <rect x="5" y="7" width="14" height="3" rx="1" fill="#FEF3C7"/>
      <rect x="5" y="11" width="14" height="3" rx="1" fill="#FEF3C7"/>
      <rect x="5" y="15" width="10" height="3" rx="1" fill="#FEF3C7"/>
      <path d="M17 16l2 2-2 2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ListView: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="5" y="5" width="14" height="3" rx="1" fill="#E0E7FF"/>
      <rect x="5" y="9" width="14" height="3" rx="1" fill="#E0E7FF"/>
      <rect x="5" y="13" width="14" height="3" rx="1" fill="#E0E7FF"/>
      <rect x="5" y="17" width="8" height="3" rx="1" fill="#E0E7FF"/>
    </svg>
  ),
  Notifier: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 006 8c0 7-3 1-3 4h18c0-3-3 3-3-4z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
      <path d="M9 19c.5 1.5 2.5 2 3 2s2.5-.5 3-2" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Spinner: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5"/>
      <rect x="4" y="7" width="16" height="10" rx="2" fill="#E2E8F0"/>
      <text x="12" y="15" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="bold">▼</text>
    </svg>
  ),
  CircularProgress: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#E2E8F0" strokeWidth="2.5" fill="none"/>
      <path d="M12 3a9 9 0 017.8 4.5" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  LinearProgress: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="9" width="18" height="6" rx="3" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1"/>
      <rect x="3" y="9" width="10" height="6" rx="3" fill="#3B82F6"/>
    </svg>
  ),

  // ── Layout ───────────────────────────────────────────────────
  HorizontalArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="4" y="7" width="4" height="10" rx="1" fill="#818CF8"/>
      <rect x="10" y="7" width="4" height="10" rx="1" fill="#818CF8"/>
      <rect x="16" y="7" width="4" height="10" rx="1" fill="#818CF8"/>
    </svg>
  ),
  VerticalArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="5" y="6" width="14" height="3" rx="1" fill="#818CF8"/>
      <rect x="5" y="11" width="14" height="3" rx="1" fill="#818CF8"/>
      <rect x="5" y="16" width="14" height="3" rx="1" fill="#818CF8"/>
    </svg>
  ),
  TableArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <line x1="9" y1="3" x2="9" y2="21" stroke="#8B5CF6" strokeWidth="1"/>
      <line x1="16" y1="3" x2="16" y2="21" stroke="#8B5CF6" strokeWidth="1"/>
      <line x1="2" y1="10" x2="22" y2="10" stroke="#8B5CF6" strokeWidth="1"/>
      <line x1="2" y1="16" x2="22" y2="16" stroke="#8B5CF6" strokeWidth="1"/>
      <rect x="4" y="5" width="3" height="3" rx="0.5" fill="#C4B5FD"/>
      <rect x="11" y="5" width="3" height="3" rx="0.5" fill="#C4B5FD"/>
      <rect x="18" y="5" width="3" height="3" rx="0.5" fill="#C4B5FD"/>
    </svg>
  ),
  HorizontalScrollArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="4" y="7" width="4" height="10" rx="1" fill="#818CF8"/>
      <rect x="10" y="7" width="4" height="10" rx="1" fill="#818CF8"/>
      <rect x="16" y="7" width="4" height="10" rx="1" fill="#A5B4FC"/>
      <path d="M19 17l2-2-2-2" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  VerticalScrollArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="5" y="6" width="14" height="3" rx="1" fill="#818CF8"/>
      <rect x="5" y="11" width="14" height="3" rx="1" fill="#818CF8"/>
      <rect x="5" y="16" width="14" height="3" rx="1" fill="#A5B4FC"/>
      <path d="M5 18l-2 2 2 2" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  AbsoluteArrangement: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <line x1="12" y1="3" x2="12" y2="21" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="2 2"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="2 2"/>
      <rect x="6" y="6" width="5" height="5" rx="1" fill="#818CF8" stroke="#6366F1" strokeWidth="1"/>
      <circle cx="6" cy="6" r="1.5" fill="#EF4444"/>
      <circle cx="11" cy="11" r="1.5" fill="#EF4444"/>
    </svg>
  ),

  // ── Media ────────────────────────────────────────────────────
  Camera: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="5" fill="#475569"/>
      <circle cx="12" cy="13" r="3" fill="#1E293B"/>
      <rect x="9" y="3" width="6" height="3" rx="1" fill="#334155"/>
      <circle cx="17" cy="10" r="1" fill="#F59E0B"/>
    </svg>
  ),
  Camcorder: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="16" height="12" rx="2" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
      <path d="M18 10l4-2v8l-4-2" fill="#F87171" stroke="#DC2626" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="10" cy="12" r="2" fill="#FCA5A5"/>
    </svg>
  ),
  ImagePicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5"/>
      <circle cx="7" cy="9" r="2" fill="#DDD6FE"/>
      <path d="M2 16l5-4 4 3 5-5 6 6" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 2v-1M16 2v1M15 2h2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Player: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6366F1" stroke="#4F46E5" strokeWidth="1.5"/>
      <path d="M10 8l6 4-6 4V8z" fill="#E0E7FF"/>
    </svg>
  ),
  Sound: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="4" height="8" rx="0.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
      <path d="M10 8l5-3v14l-5-3" fill="#FBBF24" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
      <path d="M16 10c1 1.5 1 2.5 0 4" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  SoundRecorder: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
      <path d="M5 11c0 3.5 3 6 7 6s7-2.5 7-6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <rect x="7" y="18" width="10" height="3" rx="1" fill="#FCA5A5"/>
    </svg>
  ),
  SpeechRecognizer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#10B981" stroke="#059669" strokeWidth="1.5"/>
      <path d="M5 11c0 3.5 3 6 7 6s7-2.5 7-6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M8 19h8" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  TextToSpeech: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="4" height="8" rx="0.5" fill="#6366F1" stroke="#4F46E5" strokeWidth="1"/>
      <path d="M10 8l5-3v14l-5-3" fill="#818CF8" stroke="#4F46E5" strokeWidth="1" strokeLinejoin="round"/>
      <text x="17" y="12" fontSize="6" fill="#4F46E5" fontWeight="bold" fontFamily="sans-serif">Aa</text>
    </svg>
  ),
  VideoPlayer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#475569"/>
      <path d="M11 10l3 2-3 2v-4z" fill="#F8FAFC"/>
    </svg>
  ),
  YandexTranslate: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="bold" fontFamily="sans-serif">A</text>
      <path d="M12 6v12M6 18h12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Translator: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5"/>
      <text x="8" y="15" fontSize="7" fill="#10B981" fontWeight="bold" fontFamily="sans-serif">A</text>
      <text x="13" y="15" fontSize="7" fill="#10B981" fontWeight="bold" fontFamily="sans-serif">B</text>
      <path d="M4 7h8M4 9h6" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M17 7l3 3M20 7l-3 3" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  MediaStore: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M12 8v8M8 12h8" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  // ── Drawing & Animation ──────────────────────────────────────
  Canvas: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="white" stroke="#6366F1" strokeWidth="1.5"/>
      <path d="M5 18l3-6 4 4 7-11" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="7" cy="7" r="1.5" fill="#EF4444"/>
    </svg>
  ),
  ImageSprite: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="5" width="14" height="14" rx="3" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#FEF3C7"/>
      <path d="M16 3l2 2-2 2" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 5l2 2-2 2" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Ball: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
      <path d="M12 3a9 9 0 010 18" fill="#FCA5A5" opacity="0.5"/>
      <path d="M5 5l3 3M16 16l3 3" stroke="#DC2626" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),

  // ── Maps ──────────────────────────────────────────────────────
  Map: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" fill="#A7F3D0" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 4v13M15 7v13" stroke="#059669" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="2" fill="#059669"/>
    </svg>
  ),
  Marker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
      <circle cx="12" cy="9" r="3" fill="#FCA5A5"/>
    </svg>
  ),
  Circle: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#FBBF24" opacity="0.5"/>
    </svg>
  ),
  FeatureCollection: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1" fill="#A7F3D0" stroke="#059669" strokeWidth="1.2"/>
      <rect x="13" y="3" width="8" height="8" rx="1" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1.2"/>
      <rect x="8" y="13" width="8" height="8" rx="1" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1.2"/>
    </svg>
  ),
  LineString: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 20l8-12 10 8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="3" cy="20" r="2" fill="#3B82F6"/>
      <circle cx="11" cy="8" r="2" fill="#3B82F6"/>
      <circle cx="21" cy="16" r="2" fill="#3B82F6"/>
    </svg>
  ),
  Polygon: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 5v8l-8 5-8-5V8l8-5z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="2" fill="#F59E0B"/>
    </svg>
  ),
  Rectangle: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/>
    </svg>
  ),
  Navigation: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <path d="M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#6366F1"/>
    </svg>
  ),

  // ── Sensors ──────────────────────────────────────────────────
  AccelerometerSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <rect x="8" y="4" width="8" height="6" rx="1" fill="#334155"/>
      <circle cx="12" cy="18" r="2" fill="#475569"/>
      <line x1="12" y1="12" x2="12" y2="16" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 14l2-2M15 14l-2-2" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  BarcodeScanner: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
      <rect x="16" y="2" width="6" height="6" rx="1" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
      <rect x="2" y="16" width="6" height="6" rx="1" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
      <rect x="16" y="16" width="6" height="6" rx="1" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
      <rect x="6" y="9" width="12" height="6" rx="0.5" fill="#3B82F6"/>
      <line x1="9" y1="9" x2="9" y2="15" stroke="white" strokeWidth="1.5"/>
      <line x1="12" y1="9" x2="12" y2="15" stroke="white" strokeWidth="1.5"/>
      <line x1="15" y1="9" x2="15" y2="15" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  Clock: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5"/>
      <line x1="12" y1="6" x2="12" y2="12" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="15" y2="14" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill="#64748B"/>
    </svg>
  ),
  GyroscopeSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <path d="M12 3a9 9 0 01-6 15.6" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M12 21a9 9 0 006-15.6" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="#6366F1"/>
    </svg>
  ),
  Hygrometer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2 4h-4l2-4z" fill="#3B82F6"/>
      <rect x="9" y="6" width="6" height="12" rx="1" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <rect x="11" y="8" width="2" height="8" rx="1" fill="#3B82F6"/>
      <path d="M6 18c0 2.5 3 4 6 4s6-1.5 6-4" stroke="#3B82F6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  LightSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  LocationSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" fill="#10B981"/>
      <path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  MagneticFieldSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 20V8c0-3 3-5 6-5s6 2 6 5v12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M6 14c0-2 3-3 6-3s6 1 6 3" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="12" r="1.5" fill="#EF4444"/>
    </svg>
  ),
  NearField: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <path d="M8 8c2-2 6-2 8 0" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M10 10c1-1 3-1 4 0" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="14" r="1.5" fill="#8B5CF6"/>
    </svg>
  ),
  OrientationSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <rect x="7" y="5" width="10" height="6" rx="1" fill="#E0E7FF"/>
      <circle cx="12" cy="15" r="3" fill="#C4B5FD"/>
      <line x1="12" y1="12" x2="12" y2="15" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Pedometer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4a2 2 0 100 4 2 2 0 000-4z" fill="#F59E0B"/>
      <path d="M9 10c.5 2 .5 4 0 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M15 10c-.5 2-.5 4 0 6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M7 12c2-1 6-1 10 0" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M8 16l2 2M16 16l-2 2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="6" y="18" width="4" height="3" rx="1" fill="#F59E0B"/>
      <rect x="14" y="18" width="4" height="3" rx="1" fill="#F59E0B"/>
    </svg>
  ),
  ProximitySensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <path d="M7 10c2-3 8-3 10 0" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M9 13c1-1.5 5-1.5 6 0" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="16" r="1.5" fill="#8B5CF6"/>
    </svg>
  ),
  Thermometer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="10" y="2" width="4" height="16" rx="2" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
      <circle cx="12" cy="18" r="4" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1.5"/>
      <line x1="12" y1="10" x2="12" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Barometer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M12 5v2M12 17v2M5 12h2M17 12h2" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M12 12l3-3" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="12" y="11" textAnchor="middle" fontSize="6" fill="#3B82F6" fontWeight="bold">hPa</text>
    </svg>
  ),

  // ── Social ───────────────────────────────────────────────────
  ContactPicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="4" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  EmailPicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M2 7l10 6 10-6" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  PhoneCall: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22 16.9v3c0 1.1-.9 2-2 2-10.5 0-19-8.5-19-19 0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2 0 1.5.25 3 .75 4.35.3.85.1 1.8-.5 2.45l-2.8 2.8a18 18 0 007.5 7.5l2.8-2.8c.65-.6 1.6-.8 2.45-.5A12 12 0 0022 16.9z" fill="#A7F3D0" stroke="#10B981" strokeWidth="1.5"/>
    </svg>
  ),
  PhoneNumberPicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5"/>
      <rect x="5" y="7" width="14" height="3" rx="1" fill="#A7F3D0"/>
      <rect x="5" y="11" width="14" height="3" rx="1" fill="#A7F3D0"/>
      <rect x="5" y="15" width="10" height="3" rx="1" fill="#A7F3D0"/>
      <path d="M17 16l2 2-2 2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Sharing: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="12" r="3" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
      <circle cx="18" cy="7" r="3" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
      <circle cx="18" cy="17" r="3" fill="#10B981" stroke="#059669" strokeWidth="1.5"/>
      <line x1="8.5" y1="10.5" x2="15.5" y2="8.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8.5" y1="13.5" x2="15.5" y2="15.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Texting: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 11.5a8.5 8.5 0 01-8.5 8.5H5l3-3a8.5 8.5 0 1113-5.5z" fill="#A7F3D0" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="8" y1="9" x2="16" y2="9" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="13" y2="13" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Twitter: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#2563EB" strokeWidth="1.5"/>
      <path d="M7 17c2 2 5 2 7 0s2-5 0-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M8 8c2 2 4 4 8 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Storage ──────────────────────────────────────────────────
  CloudDB: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 16c-2 0-4-1.5-4-4s1.5-4 3.5-4c.5-3 3-5 6-5s5.5 2 6 5c2 0 3.5 1.5 3.5 4s-2 4-4 4H6z" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="8" y="14" width="8" height="6" rx="1" fill="#3B82F6"/>
      <line x1="12" y1="14" x2="12" y2="20" stroke="white" strokeWidth="1.5"/>
    </svg>
  ),
  DataFile: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <rect x="8" y="12" width="8" height="6" rx="1" fill="#A7F3D0" stroke="#059669" strokeWidth="1"/>
      <line x1="12" y1="12" x2="12" y2="18" stroke="#059669" strokeWidth="1.5"/>
    </svg>
  ),
  File: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  FirebaseDB: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20l3-16 5 4 5-4 3 16H4z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 10v6M9 13h6" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  TinyDB: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5"/>
      <rect x="6" y="5" width="12" height="4" rx="0.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8"/>
      <rect x="6" y="11" width="12" height="4" rx="0.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8"/>
      <rect x="6" y="17" width="8" height="2" rx="0.5" fill="#E2E8F0"/>
    </svg>
  ),
  TinyWebDB: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5"/>
      <rect x="6" y="8" width="12" height="8" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <line x1="9" y1="10" x2="9" y2="14" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="10" x2="15" y2="14" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="16" y2="16" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Spreadsheet: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="#10B981" strokeWidth="1"/>
      <line x1="3" y1="15" x2="21" y2="15" stroke="#10B981" strokeWidth="1"/>
      <line x1="9" y1="3" x2="9" y2="21" stroke="#10B981" strokeWidth="1"/>
      <line x1="15" y1="3" x2="15" y2="21" stroke="#10B981" strokeWidth="1"/>
    </svg>
  ),
  FilePicker: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <path d="M8 14l3-3 2 2 3-3" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="13" r="1" fill="#8B5CF6"/>
    </svg>
  ),

  // ── Connectivity ─────────────────────────────────────────────
  ActivityStarter: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M12 7v10M7 12h10" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  BluetoothClient: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 8l10 8-5 6V2l5 6-10 8" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  BluetoothServer: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 8l10 8-5 6V2l5 6-10 8" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="19" cy="12" r="3" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1"/>
    </svg>
  ),
  Serial: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5"/>
      <circle cx="9" cy="12" r="1.5" fill="#64748B"/>
      <circle cx="15" cy="12" r="1.5" fill="#64748B"/>
      <line x1="12" y1="9" x2="12" y2="15" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Web: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M2 12h20M12 2a15 15 0 000 20 15 15 0 000-20z" stroke="#3B82F6" strokeWidth="1.2" fill="none"/>
      <path d="M7 4.5c1 3 1.5 6 1.5 12" stroke="#93C5FD" strokeWidth="1" fill="none"/>
      <path d="M17 4.5c-1 3-1.5 6-1.5 12" stroke="#93C5FD" strokeWidth="1" fill="none"/>
    </svg>
  ),

  // ── LEGO MINDSTORMS ──────────────────────────────────────────
  Ev3Motors: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#F8FAFC" stroke="#EF4444" strokeWidth="1.5"/>
      <circle cx="9" cy="12" r="3" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1"/>
      <circle cx="15" cy="12" r="3" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1"/>
      <line x1="9" y1="9" x2="9" y2="7" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15" y2="15" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Ev3ColorSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" fill="url(#rainbow)"/>
      <defs>
        <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EF4444"/>
          <stop offset="50%" stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#3B82F6"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Ev3GyroSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5"/>
      <path d="M12 4c4 0 7 3 7 7" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="11" r="3" fill="#FBBF24"/>
    </svg>
  ),
  Ev3TouchSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="10" rx="3" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Ev3UltrasonicSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="6" width="14" height="12" rx="3" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <circle cx="10" cy="12" r="3" fill="#C4B5FD"/>
      <path d="M16 9c1 2 1 4 0 6" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  Ev3Sound: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="6" width="4" height="12" rx="1" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
      <path d="M12 6l5-3v18l-5-3" fill="#FBBF24" stroke="#D97706" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  ),
  Ev3UI: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <rect x="5" y="6" width="14" height="6" rx="1" fill="#334155"/>
      <rect x="5" y="14" width="6" height="4" rx="0.5" fill="#475569"/>
    </svg>
  ),
  Ev3Commands: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#3B82F6" fontWeight="bold">EV3</text>
    </svg>
  ),
  NxtDrive: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="8" width="18" height="8" rx="4" fill="#F8FAFC" stroke="#EF4444" strokeWidth="1.5"/>
      <circle cx="8" cy="12" r="3" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1"/>
      <circle cx="16" cy="12" r="3" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1"/>
    </svg>
  ),
  NxtColorSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#8B5CF6"/>
    </svg>
  ),
  NxtLightSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="10" r="6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5"/>
      <path d="M12 16v4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  NxtSoundSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="6" width="4" height="12" rx="1" fill="#F59E0B"/>
      <path d="M12 6l5-3v18l-5-3" fill="#FBBF24"/>
    </svg>
  ),
  NxtTouchSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="8" width="12" height="10" rx="3" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
    </svg>
  ),
  NxtUltrasonicSensor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="7" width="14" height="10" rx="2" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <path d="M16 10l3-1v6l-3-1" fill="#C4B5FD" stroke="#6366F1" strokeWidth="1"/>
    </svg>
  ),
  NxtDirectCommands: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#EF4444" fontWeight="bold">NXT</text>
    </svg>
  ),

  // ── Experimental ─────────────────────────────────────────────
  ChromeWebView: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="1.5"/>
      <path d="M6 6l4 4M18 6l-4 4M6 18l4-4M18 18l-4-4" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
    </svg>
  ),

  // ── Charts ───────────────────────────────────────────────────
  Chart: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="1.5"/>
      <path d="M4 20l5-7 4 3 7-9" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="9" cy="13" r="1.5" fill="#8B5CF6"/>
      <circle cx="13" cy="16" r="1.5" fill="#8B5CF6"/>
      <circle cx="20" cy="7" r="1.5" fill="#8B5CF6"/>
    </svg>
  ),
  ChartData2D: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5"/>
      <circle cx="8" cy="16" r="2" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
      <circle cx="12" cy="12" r="2" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
      <circle cx="16" cy="10" r="2" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
    </svg>
  ),

  // ── Data Science ─────────────────────────────────────────────
  DataCollection: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5"/>
      <rect x="6" y="8" width="4" height="10" rx="0.5" fill="#A7F3D0"/>
      <rect x="12" y="5" width="4" height="13" rx="0.5" fill="#A7F3D0"/>
      <rect x="18" y="11" width="2" height="7" rx="0.5" fill="#A7F3D0"/>
    </svg>
  ),
  Regression: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#F8FAFC" stroke="#6366F1" strokeWidth="1.5"/>
      <path d="M4 18l5-3 4 2 7-8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="4" y1="18" x2="20" y2="18" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  ),
  Trendline: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#F8FAFC" stroke="#F59E0B" strokeWidth="1.5"/>
      <path d="M4 18l5-5 4 3 7-9" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="4" y1="8" x2="20" y2="16" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2"/>
    </svg>
  ),
  AnomalyDetection: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#F8FAFC" stroke="#EF4444" strokeWidth="1.5"/>
      <circle cx="7" cy="10" r="2" fill="#A7F3D0" stroke="#10B981" strokeWidth="1"/>
      <circle cx="12" cy="8" r="2" fill="#A7F3D0" stroke="#10B981" strokeWidth="1"/>
      <circle cx="17" cy="12" r="2" fill="#A7F3D0" stroke="#10B981" strokeWidth="1"/>
      <circle cx="15" cy="17" r="2.5" fill="#FCA5A5" stroke="#EF4444" strokeWidth="1.5"/>
      <path d="M15 15.5l2 3M14 18l2-1" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Screen: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="14" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5"/>
      <rect x="5" y="6" width="14" height="10" rx="1" fill="#334155"/>
      <rect x="7" y="18" width="10" height="2" rx="1" fill="#475569"/>
      <circle cx="12" cy="11" r="3" fill="#3B82F6" opacity="0.8"/>
      <line x1="12" y1="8" x2="12" y2="14" stroke="#DBEAFE" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="11" x2="15" y2="11" stroke="#DBEAFE" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

export default function ComponentIcon({ type, size = 28, className = '' }) {
  const IconComponent = ICONS[type] || ICONS.Button;
  return (
    <span className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}>
      <IconComponent size={size} />
    </span>
  );
}
