/**
 * Shared project type configuration for Neura dashboard components.
 * Single source of truth for icons, labels, colors, and badge styles.
 */

import { ProjectType } from '../../../types/neura.types';
import { Image, ScanSearch, PersonStanding, Hand, AudioLines, Calculator, FileText, Bot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ProjectTypeConfig {
    icon: LucideIcon;
    label: string;
    accentBorder: string;
    gradient: string;
    glow: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
}

export const projectTypeConfig: Record<ProjectType, ProjectTypeConfig> = {
    'image-classifier': {
        icon: Image,
        label: 'Image Classifier',
        accentBorder: '#6366f1',
        gradient: 'from-blue-500 to-indigo-600',
        glow: 'shadow-blue-500/25',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
    },
    'object-detection': {
        icon: ScanSearch,
        label: 'Object Detection',
        accentBorder: '#f97316',
        gradient: 'from-amber-400 to-orange-500',
        glow: 'shadow-orange-500/25',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        badgeBorder: 'border-orange-200',
    },
    'pose-classifier': {
        icon: PersonStanding,
        label: 'Pose Classifier',
        accentBorder: '#22c55e',
        gradient: 'from-emerald-400 to-green-500',
        glow: 'shadow-green-500/25',
        badgeBg: 'bg-green-50',
        badgeText: 'text-green-700',
        badgeBorder: 'border-green-200',
    },
    'hand-pose-classifier': {
        icon: Hand,
        label: 'Hand Pose',
        accentBorder: '#06b6d4',
        gradient: 'from-teal-400 to-cyan-500',
        glow: 'shadow-cyan-500/25',
        badgeBg: 'bg-cyan-50',
        badgeText: 'text-cyan-700',
        badgeBorder: 'border-cyan-200',
    },
    'audio-classifier': {
        icon: AudioLines,
        label: 'Audio Classifier',
        accentBorder: '#ef4444',
        gradient: 'from-rose-400 to-red-500',
        glow: 'shadow-red-500/25',
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
    },
    'numbers-cr': {
        icon: Calculator,
        label: 'Numbers CR',
        accentBorder: '#a855f7',
        gradient: 'from-violet-400 to-purple-500',
        glow: 'shadow-purple-500/25',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
    },
    'text-classifier': {
        icon: FileText,
        label: 'Text Classifier',
        accentBorder: '#3b82f6',
        gradient: 'from-sky-400 to-blue-500',
        glow: 'shadow-blue-500/25',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        badgeBorder: 'border-sky-200',
    },
};

export const fallbackConfig: ProjectTypeConfig = {
    icon: Bot,
    label: 'Unknown',
    accentBorder: '#6b7280',
    gradient: 'from-gray-400 to-gray-500',
    glow: 'shadow-gray-500/25',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-700',
    badgeBorder: 'border-gray-200',
};
