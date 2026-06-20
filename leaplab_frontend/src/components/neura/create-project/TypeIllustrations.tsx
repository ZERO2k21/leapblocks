/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import type { ProjectType } from '../../../types/neura.types';

interface IllustrationProps {
    className?: string;
}

/* ── Image Classifier ──────────────────────────────────────────────────── */
function ImageClassifierIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            {/* Background */}
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#EEF2FF" />
            {/* Image frame */}
            <rect x="25" y="25" width="70" height="55" rx="6" fill="#C7D2FE" stroke="#818CF8" strokeWidth="1.5" />
            {/* Cat face */}
            <circle cx="50" cy="48" r="12" fill="#FDE68A" />
            <circle cx="46" cy="45" r="2" fill="#1E1B4B" />
            <circle cx="54" cy="45" r="2" fill="#1E1B4B" />
            <path d="M48 52 Q50 55 52 52" stroke="#1E1B4B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            {/* Cat ears */}
            <path d="M40 38 L44 42 L38 42Z" fill="#FDE68A" />
            <path d="M60 38 L56 42 L62 42Z" fill="#FDE68A" />
            {/* Dog face */}
            <circle cx="80" cy="48" r="12" fill="#FBBF24" />
            <circle cx="76" cy="45" r="2" fill="#1E1B4B" />
            <circle cx="84" cy="45" r="2" fill="#1E1B4B" />
            <ellipse cx="80" cy="51" rx="3" ry="2" fill="#92400E" />
            {/* Dog ears */}
            <ellipse cx="70" cy="38" rx="4" ry="6" fill="#FBBF24" transform="rotate(-15 70 38)" />
            <ellipse cx="90" cy="38" rx="4" ry="6" fill="#FBBF24" transform="rotate(15 90 38)" />
            {/* Classification bars */}
            <rect x="110" y="28" width="60" height="8" rx="4" fill="#E0E7FF" />
            <rect x="110" y="28" width="45" height="8" rx="4" fill="#6366F1" />
            <text x="175" y="35" fontSize="7" fill="#4338CA" fontWeight="bold">75%</text>
            <rect x="110" y="42" width="60" height="8" rx="4" fill="#E0E7FF" />
            <rect x="110" y="42" width="15" height="8" rx="4" fill="#A5B4FC" />
            <text x="175" y="49" fontSize="7" fill="#4338CA" fontWeight="bold">25%</text>
            {/* Labels */}
            <text x="110" y="24" fontSize="7" fill="#3730A3" fontWeight="600">Cat</text>
            <text x="110" y="58" fontSize="7" fill="#3730A3" fontWeight="600">Dog</text>
            {/* Divider */}
            <line x1="105" y1="22" x2="105" y2="62" stroke="#C7D2FE" strokeWidth="1" strokeDasharray="2 2" />
            {/* Bottom accent */}
            <rect x="25" y="90" width="150" height="4" rx="2" fill="#C7D2FE" />
            <rect x="25" y="90" width="90" height="4" rx="2" fill="#6366F1" />
        </svg>
    );
}

/* ── Object Detection ──────────────────────────────────────────────────── */
function ObjectDetectionIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#FFF7ED" />
            {/* Scene background */}
            <rect x="20" y="20" width="100" height="80" rx="8" fill="#FED7AA" />
            {/* Cat */}
            <circle cx="50" cy="55" r="14" fill="#FDE68A" />
            <circle cx="45" cy="52" r="2" fill="#1E1B4B" />
            <circle cx="55" cy="52" r="2" fill="#1E1B4B" />
            <path d="M42 42 L46 48 L38 48Z" fill="#FDE68A" />
            <path d="M58 42 L54 48 L62 48Z" fill="#FDE68A" />
            {/* Dog */}
            <circle cx="90" cy="58" r="13" fill="#FBBF24" />
            <circle cx="86" cy="55" r="2" fill="#1E1B4B" />
            <circle cx="94" cy="55" r="2" fill="#1E1B4B" />
            <ellipse cx="90" cy="60" rx="3" ry="2" fill="#92400E" />
            {/* Bounding boxes */}
            <rect x="28" y="35" width="44" height="44" rx="3" stroke="#F97316" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            <rect x="28" y="30" width="32" height="12" rx="2" fill="#F97316" />
            <text x="32" y="39" fontSize="7" fill="white" fontWeight="bold">Cat 92%</text>
            <rect x="68" y="38" width="44" height="44" rx="3" stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            <rect x="68" y="33" width="40" height="12" rx="2" fill="#3B82F6" />
            <text x="72" y="42" fontSize="7" fill="white" fontWeight="bold">Dog 88%</text>
            {/* Right panel */}
            <rect x="130" y="20" width="55" height="80" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
            <text x="140" y="38" fontSize="7" fill="#92400E" fontWeight="bold">Objects:</text>
            <rect x="137" y="44" width="40" height="6" rx="3" fill="#FEF3C7" />
            <rect x="137" y="44" width="30" height="6" rx="3" fill="#F97316" />
            <rect x="137" y="56" width="40" height="6" rx="3" fill="#FEF3C7" />
            <rect x="137" y="56" width="25" height="6" rx="3" fill="#3B82F6" />
            <rect x="137" y="68" width="40" height="6" rx="3" fill="#FEF3C7" />
            <rect x="137" y="68" width="10" height="6" rx="3" fill="#22C55E" />
            <text x="140" y="88" fontSize="6" fill="#92400E">3 detected</text>
        </svg>
    );
}

/* ── Pose Classifier ───────────────────────────────────────────────────── */
function PoseClassifierIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#ECFDF5" />
            {/* Pose figure 1 - standing */}
            <circle cx="55" cy="30" r="8" fill="#10B981" />
            <line x1="55" y1="38" x2="55" y2="70" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="50" x2="38" y2="62" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="50" x2="72" y2="55" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="70" x2="42" y2="90" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="55" y1="70" x2="68" y2="90" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            {/* Keypoints */}
            <circle cx="55" cy="50" r="3" fill="#059669" />
            <circle cx="38" cy="62" r="3" fill="#059669" />
            <circle cx="72" cy="55" r="3" fill="#059669" />
            <circle cx="42" cy="90" r="3" fill="#059669" />
            <circle cx="68" cy="90" r="3" fill="#059669" />
            {/* Pose figure 2 - yoga */}
            <circle cx="120" cy="35" r="8" fill="#6366F1" />
            <line x1="120" y1="43" x2="120" y2="72" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="120" y1="55" x2="100" y2="48" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="120" y1="55" x2="140" y2="48" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="120" y1="72" x2="105" y2="92" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="120" y1="72" x2="140" y2="85" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
            {/* Keypoints */}
            <circle cx="120" cy="55" r="3" fill="#4F46E5" />
            <circle cx="100" cy="48" r="3" fill="#4F46E5" />
            <circle cx="140" cy="48" r="3" fill="#4F46E5" />
            <circle cx="105" cy="92" r="3" fill="#4F46E5" />
            <circle cx="140" cy="85" r="3" fill="#4F46E5" />
            {/* Labels */}
            <rect x="30" y="98" width="50" height="14" rx="7" fill="#10B981" />
            <text x="40" y="108" fontSize="7" fill="white" fontWeight="bold">Standing</text>
            <rect x="95" y="98" width="50" height="14" rx="7" fill="#6366F1" />
            <text x="105" y="108" fontSize="7" fill="white" fontWeight="bold">Yoga</text>
        </svg>
    );
}

/* ── Hand Pose Classifier ──────────────────────────────────────────────── */
function HandPoseClassifierIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#ECFEFF" />
            {/* Hand 1 - thumbs up with detailed fingers */}
            <g transform="translate(22, 18)">
                {/* Palm base */}
                <path d="M12 55 Q12 42 20 40 L40 40 Q48 42 48 55 L48 85 Q48 92 40 92 L20 92 Q12 92 12 85Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
                {/* Curled index finger */}
                <path d="M20 40 Q20 30 25 28 Q30 26 32 30 Q34 34 32 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M24 28 Q26 26 28 28" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                {/* Curled middle finger */}
                <path d="M30 40 Q30 28 35 26 Q40 24 42 28 Q44 32 42 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M34 26 Q36 24 38 26" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                {/* Curled ring finger */}
                <path d="M38 40 Q38 32 42 30 Q46 28 48 32 Q49 36 48 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M42 30 Q44 28 46 30" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                {/* Curled pinky */}
                <path d="M44 42 Q44 36 47 34 Q50 33 51 36 Q52 39 51 42" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.0" />
                {/* Extended thumb - lower segment */}
                <path d="M12 55 Q8 48 10 38 Q12 28 16 22" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                {/* Extended thumb - upper segment with nail */}
                <path d="M16 22 Q18 14 22 10 Q26 8 28 12 Q30 16 26 22 Q22 26 18 24" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                <ellipse cx="24" cy="12" rx="4" ry="3" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
                {/* Wrist */}
                <path d="M16 92 L16 100 Q16 104 20 104 L40 104 Q44 104 44 100 L44 92" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                {/* Keypoints */}
                <circle cx="24" cy="10" r="3" fill="#F97316" />
                <circle cx="16" cy="22" r="2.5" fill="#FB923C" />
                <circle cx="12" cy="55" r="2.5" fill="#FB923C" />
                <circle cx="48" cy="55" r="2" fill="#FB923C" />
            </g>
            <rect x="18" y="100" width="64" height="14" rx="7" fill="#F97316" />
            <text x="26" y="110" fontSize="7" fill="white" fontWeight="bold">Thumbs Up</text>
            {/* Hand 2 - peace sign with detailed fingers */}
            <g transform="translate(105, 16)">
                {/* Palm base */}
                <path d="M8 55 Q8 42 16 40 L44 40 Q52 42 52 55 L52 85 Q52 92 44 92 L16 92 Q8 92 8 85Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
                {/* Extended index finger - left side of V */}
                <path d="M18 40 Q18 28 16 18 Q14 10 16 6 Q20 2 24 4 Q28 6 26 14 Q24 24 22 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                <ellipse cx="18" cy="6" rx="4" ry="3.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
                {/* Extended middle finger - right side of V */}
                <path d="M32 40 Q32 26 34 16 Q36 8 38 4 Q42 0 46 4 Q48 8 44 16 Q40 26 38 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                <ellipse cx="40" cy="4" rx="4" ry="3.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
                {/* Curled ring finger */}
                <path d="M40 40 Q40 34 43 32 Q46 30 48 34 Q49 38 48 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M43 32 Q45 30 47 32" stroke="#F59E0B" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                {/* Curled pinky */}
                <path d="M46 42 Q46 38 48 36 Q50 35 51 38 Q52 41 51 42" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.0" />
                {/* Curled thumb across palm */}
                <path d="M8 55 Q6 50 8 44 Q10 40 14 40" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
                {/* Wrist */}
                <path d="M12 92 L12 100 Q12 104 16 104 L44 104 Q48 104 48 100 L48 92" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
                {/* Keypoints */}
                <circle cx="18" cy="6" r="3" fill="#F97316" />
                <circle cx="40" cy="4" r="3" fill="#F97316" />
                <circle cx="16" cy="18" r="2" fill="#FB923C" />
                <circle cx="40" cy="16" r="2" fill="#FB923C" />
                <circle cx="8" cy="55" r="2.5" fill="#FB923C" />
            </g>
            <rect x="108" y="100" width="50" height="14" rx="7" fill="#06B6D4" />
            <text x="120" y="110" fontSize="7" fill="white" fontWeight="bold">Peace</text>
        </svg>
    );
}

/* ── Audio Classifier ──────────────────────────────────────────────────── */
function AudioClassifierIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#FFF1F2" />
            {/* Sound wave bars */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
                const heights = [20, 35, 28, 50, 42, 65, 55, 75, 60, 45, 55, 35, 25, 40, 30];
                const h = heights[i];
                return (
                    <rect
                        key={i}
                        x={25 + i * 11}
                        y={70 - h / 2}
                        width="6"
                        height={h}
                        rx="3"
                        fill={i < 5 ? '#F43F5E' : i < 10 ? '#FB7185' : '#FDA4AF'}
                        opacity={0.7 + (i < 10 ? 0.3 : 0)}
                    />
                );
            })}
            {/* Labels */}
            <rect x="20" y="85" width="45" height="14" rx="7" fill="#F43F5E" />
            <text x="28" y="95" fontSize="7" fill="white" fontWeight="bold">Music</text>
            <rect x="75" y="85" width="50" height="14" rx="7" fill="#FB7185" />
            <text x="83" y="95" fontSize="7" fill="white" fontWeight="bold">Speech</text>
            <rect x="135" y="85" width="45" height="14" rx="7" fill="#FDA4AF" />
            <text x="142" y="95" fontSize="7" fill="white" fontWeight="bold">Noise</text>
            {/* Confidence */}
            <text x="25" y="115" fontSize="8" fill="#9F1239" fontWeight="600">Audio Classification Results</text>
        </svg>
    );
}

/* ── Numbers CR ────────────────────────────────────────────────────────── */
function NumbersCRIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#F5F3FF" />
            {/* Axes */}
            <line x1="35" y1="100" x2="175" y2="100" stroke="#8B5CF6" strokeWidth="1.5" />
            <line x1="35" y1="100" x2="35" y2="25" stroke="#8B5CF6" strokeWidth="1.5" />
            {/* Grid lines */}
            <line x1="35" y1="80" x2="175" y2="80" stroke="#DDD6FE" strokeWidth="0.5" />
            <line x1="35" y1="60" x2="175" y2="60" stroke="#DDD6FE" strokeWidth="0.5" />
            <line x1="35" y1="40" x2="175" y2="40" stroke="#DDD6FE" strokeWidth="0.5" />
            {/* Scatter points - class 1 */}
            {[[50,75],[60,68],[55,82],[65,72],[70,78],[45,70],[58,65]].map(([x,y], i) => (
                <circle key={`a${i}`} cx={x} cy={y} r="4" fill="#8B5CF6" opacity="0.8" />
            ))}
            {/* Scatter points - class 2 */}
            {[[100,45],[110,38],[105,52],[115,42],[120,48],[95,40],[108,35]].map(([x,y], i) => (
                <circle key={`b${i}`} cx={x} cy={y} r="4" fill="#F97316" opacity="0.8" />
            ))}
            {/* Decision boundary */}
            <path d="M85 25 Q90 60 88 100" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" fill="none" />
            {/* Labels */}
            <rect x="130" y="25" width="45" height="14" rx="7" fill="#8B5CF6" />
            <text x="140" y="35" fontSize="7" fill="white" fontWeight="bold">Class A</text>
            <rect x="130" y="44" width="45" height="14" rx="7" fill="#F97316" />
            <text x="140" y="54" fontSize="7" fill="white" fontWeight="bold">Class B</text>
        </svg>
    );
}

/* ── Text Classifier ───────────────────────────────────────────────────── */
function TextClassifierIllustration({ className }: IllustrationProps) {
    return (
        <svg viewBox="0 0 200 140" fill="none" className={className}>
            <rect x="10" y="10" width="180" height="120" rx="12" fill="#EFF6FF" />
            {/* Speech bubble 1 - positive */}
            <rect x="20" y="22" width="80" height="35" rx="10" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
            <path d="M40 57 L50 65 L55 57" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
            <text x="30" y="40" fontSize="7" fill="#1E40AF" fontWeight="500">Great product!</text>
            <text x="30" y="50" fontSize="7" fill="#1E40AF" fontWeight="500">Love it!</text>
            <rect x="105" y="28" width="35" height="12" rx="6" fill="#22C55E" />
            <text x="110" y="37" fontSize="6" fill="white" fontWeight="bold">Positive</text>
            {/* Speech bubble 2 - negative */}
            <rect x="100" y="72" width="85" height="35" rx="10" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
            <path d="M150 107 L145 115 L140 107" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round" />
            <text x="110" y="90" fontSize="7" fill="#991B1B" fontWeight="500">Not satisfied</text>
            <text x="110" y="100" fontSize="7" fill="#991B1B" fontWeight="500">Poor quality</text>
            <rect x="15" y="78" width="35" height="12" rx="6" fill="#EF4444" />
            <text x="20" y="87" fontSize="6" fill="white" fontWeight="bold">Negative</text>
            {/* Divider line */}
            <line x1="100" y1="62" x2="100" y2="115" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
            {/* Neutral bubble */}
            <rect x="20" y="78" width="70" height="25" rx="8" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1" />
            <text x="30" y="94" fontSize="6" fill="#475569" fontWeight="500">It is okay</text>
            <rect x="15" y="68" width="30" height="10" rx="5" fill="#94A3B8" />
            <text x="19" y="76" fontSize="5" fill="white" fontWeight="bold">Neutral</text>
        </svg>
    );
}

/* ── Map ───────────────────────────────────────────────────────────────── */
const illustrationMap: Record<ProjectType, React.ComponentType<IllustrationProps>> = {
    'image-classifier': ImageClassifierIllustration,
    'object-detection': ObjectDetectionIllustration,
    'pose-classifier': PoseClassifierIllustration,
    'hand-pose-classifier': HandPoseClassifierIllustration,
    'audio-classifier': AudioClassifierIllustration,
    'numbers-cr': NumbersCRIllustration,
    'text-classifier': TextClassifierIllustration,
};

export default function TypeIllustration({ type, className }: { type: ProjectType } & IllustrationProps) {
    const Illustration = illustrationMap[type];
    if (!Illustration) return null;
    return <Illustration className={className} />;
}
