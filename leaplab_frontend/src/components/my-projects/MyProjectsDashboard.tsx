/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
    ArrowLeft,
    Trash2,
    Share2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Cpu,
    Lock,
    FolderOpen,
    AlertTriangle,
    Code,
    Brain,
    Layers,
    Tv,
    Search,
    X
} from 'lucide-react';
import {
    listMyProjects,
    getCloudProject,
    fetchCloudProjectContent,
    deleteCloudProject,
    CloudProject,
} from '../../services/cloudProjectApi';
import ShareProjectModal from './ShareProjectModal';
import { useLeapLabAuthStore } from '../../auth/leaplabAuthStore';
import { useCloudProjectStore } from '../../store/cloudProjectStore';
import { isPacked, unpack } from '../../Electra/Client/utlis/compress';
import '../../Electra/Client/utlis/elements/leap-elements';

interface MyProjectsDashboardProps {
    onOpenProject: (mode: string) => void;
}

interface ModuleMeta {
    label: string;
    icon: string;
    accent: string;
    gradient: string;
    darkAccent: string;
}

const MODULES: Record<string, ModuleMeta> = {
    junior: {
        label: 'Ignite',
        icon: 'assets/ignite_icon.png',
        accent: '#F97316',
        gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(251, 146, 60, 0.1) 100%)',
        darkAccent: '#C2410C',
    },
    intermediate: {
        label: 'Embed',
        icon: 'assets/arduino_icon.png',
        accent: '#59aaa4',
        gradient: 'linear-gradient(135deg, rgba(89, 170, 164, 0.05) 0%, rgba(139, 211, 206, 0.1) 100%)',
        darkAccent: '#0F766E',
    },
    python: {
        label: 'Logix',
        icon: 'assets/python_icon.png',
        accent: '#3B82F6',
        gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(96, 165, 250, 0.1) 100%)',
        darkAccent: '#1D4ED8',
    },
    neura: {
        label: 'Neura',
        icon: 'assets/ml_brain_icon.png',
        accent: '#A855F7',
        gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(192, 132, 252, 0.1) 100%)',
        darkAccent: '#7E22CE',
    },
    electra: {
        label: 'Electra',
        icon: 'assets/creocad_icon.png',
        accent: '#22C55E',
        gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(74, 222, 128, 0.1) 100%)',
        darkAccent: '#15803D',
    },
    creova: {
        label: 'Creova',
        icon: 'assets/app_game_dev_icon.png',
        accent: '#EC4899',
        gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(244, 114, 182, 0.1) 100%)',
        darkAccent: '#BE185D',
    },
    vision3d: {
        label: 'Vision3D',
        icon: 'assets/vision3d_icon.png',
        accent: '#6366F1',
        gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(129, 140, 248, 0.1) 100%)',
        darkAccent: '#4338CA',
    },
};

// Generates a modern abstract SVG representing the project's domain instead of repeating the logo
const renderCardVisual = (mode: string, projectName: string) => {
    const seed = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const accent = MODULES[mode]?.accent || '#6366F1';

    switch (mode) {
        case 'electra':
        case 'intermediate':
            return (
                <div className="project-card-visual visual-electra">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id={`grid-${seed}`} width="12" height="12" patternUnits="userSpaceOnUse">
                                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(34, 197, 94, 0.07)" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${seed})`} rx="8" />
                        {/* Interactive schematic look */}
                        <path d={`M 20 55 H 80 L 100 ${seed % 2 === 0 ? '25' : '85'} H 140`} stroke={accent} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        <path d={`M 40 85 H 105 L 125 ${seed % 2 === 0 ? '90' : '20'} H 175`} stroke={accent} strokeWidth="1" opacity="0.4" />
                        
                        {/* Glowing Connection Nodes */}
                        <circle cx="100" cy={seed % 2 === 0 ? '25' : '85'} r="3.5" fill={accent} className="animate-pulse" />
                        <circle cx="125" cy={seed % 2 === 0 ? '90' : '20'} r="2.5" fill={accent} />
                        
                        {/* Stylized microcontroller block */}
                        <rect x="80" y="40" width="40" height="30" rx="3" fill="#0F172A" stroke={accent} strokeWidth="1.5" />
                        <line x1="88" y1="36" x2="88" y2="40" stroke={accent} strokeWidth="1" />
                        <line x1="96" y1="36" x2="96" y2="40" stroke={accent} strokeWidth="1" />
                        <line x1="104" y1="36" x2="104" y2="40" stroke={accent} strokeWidth="1" />
                        <line x1="112" y1="36" x2="112" y2="40" stroke={accent} strokeWidth="1" />
                        <line x1="88" y1="70" x2="88" y2="74" stroke={accent} strokeWidth="1" />
                        <line x1="96" y1="70" x2="96" y2="74" stroke={accent} strokeWidth="1" />
                        <line x1="104" y1="70" x2="104" y2="74" stroke={accent} strokeWidth="1" />
                        <line x1="112" y1="70" x2="112" y2="74" stroke={accent} strokeWidth="1" />
                        <Cpu size={18} color="#FFF" style={{ position: 'absolute', left: '91px', top: '46px', opacity: 0.9 }} />
                    </svg>
                </div>
            );
        case 'python':
            return (
                <div className="project-card-visual visual-python">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="rgba(59, 130, 246, 0.02)" rx="8" />
                        {/* Stylized code terminal */}
                        <rect x="10" y="10" width="180" height="90" rx="6" fill="#0B0F19" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                        <circle cx="22" cy="22" r="3" fill="#EF4444" />
                        <circle cx="32" cy="22" r="3" fill="#F59E0B" />
                        <circle cx="42" cy="22" r="3" fill="#10B981" />
                        
                        <text x="20" y="45" fontSize="8" fontFamily="monospace" fill="#3B82F6" fontWeight="bold">&gt;&gt; {projectName.substring(0, 14)}</text>
                        <text x="20" y="60" fontSize="7" fontFamily="monospace" fill="#64748B">status: compiled successfully</text>
                        <text x="20" y="75" fontSize="7" fontFamily="monospace" fill="#10B981">executing blockly modules...</text>
                        
                        <path d="M160 70 L170 80 L160 90" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            );
        case 'neura':
            return (
                <div className="project-card-visual visual-neura">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="rgba(168, 85, 247, 0.02)" rx="8" />
                        {/* Synapse network nodes */}
                        <line x1="30" y1="55" x2="80" y2="25" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" />
                        <line x1="30" y1="55" x2="80" y2="85" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" />
                        <line x1="80" y1="25" x2="140" y2="55" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" />
                        <line x1="80" y1="85" x2="140" y2="55" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" />
                        <line x1="80" y1="25" x2="80" y2="85" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="0.75" />
                        
                        <circle cx="30" cy="55" r="6" fill="#A855F7" />
                        <circle cx="80" cy="25" r="4.5" fill="#C084FC" />
                        <circle cx="80" cy="85" r="4.5" fill="#C084FC" />
                        <circle cx="140" cy="55" r="8" fill="#E979F9" />
                        <circle cx="140" cy="55" r="12" stroke="#E979F9" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.8" />
                        <Brain size={14} color="#FFF" style={{ position: 'absolute', left: '133px', top: '48px' }} />
                    </svg>
                </div>
            );
        case 'vision3d':
            return (
                <div className="project-card-visual visual-vision3d">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="rgba(99, 102, 241, 0.02)" rx="8" />
                        {/* 3D cube */}
                        <g transform="translate(60, 25)">
                            <path d="M0 30 L40 0 L80 30 L40 60 Z" fill="rgba(99, 102, 241, 0.15)" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M0 30 L0 70 L40 100 L40 60 Z" fill="rgba(99, 102, 241, 0.1)" stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
                            <path d="M40 60 L40 100 L80 70 L80 30 Z" fill="rgba(99, 102, 241, 0.08)" stroke={accent} strokeWidth="1.2" strokeLinejoin="round" />
                            <circle cx="40" cy="50" r="2.5" fill={accent} />
                            <circle cx="60" cy="20" r="2" fill={accent} />
                            <circle cx="25" cy="66" r="2" fill={accent} />
                        </g>
                        {/* Orbit path */}
                        <ellipse cx="100" cy="85" rx="35" ry="8" stroke={accent} strokeWidth="0.75" strokeDasharray="2 3" fill="none" opacity="0.3" />
                        <circle cx="135" cy="85" r="2" fill={accent} opacity="0.5" />
                    </svg>
                </div>
            );
        case 'creova':
            return (
                <div className="project-card-visual visual-creova">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="rgba(236, 72, 153, 0.02)" rx="8" />
                        {/* Device frame preview */}
                        <rect x="65" y="15" width="70" height="80" rx="8" fill="#1E293B" stroke={accent} strokeWidth="1.5" />
                        <rect x="71" y="21" width="58" height="52" rx="4" fill="#0F172A" />
                        <circle cx="100" cy="84" r="3" fill="#EC4899" />
                        
                        {/* UI Blocks inside preview */}
                        <rect x="77" y="28" width="20" height="12" rx="2" fill="#EC4899" opacity="0.8" />
                        <circle cx="110" cy="34" r="4" fill="#3B82F6" />
                        <line x1="77" y1="48" x2="105" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                        <line x1="77" y1="56" x2="115" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="project-card-visual visual-default">
                    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="rgba(99, 102, 241, 0.02)" rx="8" />
                        <path d="M100 25 L145 75 H55 Z" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                        <circle cx="100" cy="50" r="7" fill={accent} opacity="0.4" />
                    </svg>
                </div>
            );
    }
};

const renderHeaderBackgroundVisual = (mode: string) => {
    const accent = MODULES[mode]?.accent || '#6366F1';
    
    switch (mode) {
        case 'electra':
        case 'intermediate':
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-electra" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="rgba(34, 197, 94, 0.01)" />
                                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.12)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-electra)" />
                        <path d="M 400 60 H 600 L 620 30 H 680 L 690 60 H 750" stroke={accent} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25" />
                        <path d="M 500 90 H 550 L 570 110 H 660 L 675 75 H 780" stroke={accent} strokeWidth="1.2" opacity="0.18" />
                        <path d="M 450 30 H 530 L 540 50 H 590 L 600 10 H 700" stroke={accent} strokeWidth="1" opacity="0.12" />
                        
                        <path d="M 648 20 V 40 M 652 20 V 40 M 644 30 H 648 M 652 30 H 656" stroke={accent} strokeWidth="1.5" opacity="0.3" />
                        <path d="M 560 50 H 565 L 568 45 L 571 55 L 574 45 L 577 55 L 580 45 L 583 55 L 586 50 H 590" stroke={accent} strokeWidth="1.5" opacity="0.3" />
                        
                        <circle cx="600" cy="60" r="3.5" fill={accent} opacity="0.4" />
                        <circle cx="620" cy="30" r="2.5" fill={accent} opacity="0.3" />
                        <circle cx="680" cy="30" r="2.5" fill={accent} opacity="0.3" />
                        <circle cx="690" cy="60" r="3.5" fill={accent} opacity="0.4" />
                        <circle cx="570" cy="110" r="3" fill={accent} opacity="0.3" />
                        <circle cx="660" cy="110" r="3" fill={accent} opacity="0.3" />
                        <circle cx="675" cy="75" r="2" fill={accent} opacity="0.3" />
                    </svg>
                </div>
            );
        case 'python':
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-python" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.01)" />
                                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-python)" />
                        <text x="480" y="30" fontFamily="monospace" fontSize="9" fill={accent} opacity="0.15">def init_workspace():</text>
                        <text x="500" y="45" fontFamily="monospace" fontSize="9" fill={accent} opacity="0.12">    load_modules(active=True)</text>
                        <text x="500" y="60" fontFamily="monospace" fontSize="9" fill={accent} opacity="0.12">    compile_blocks()</text>
                        <text x="500" y="75" fontFamily="monospace" fontSize="9" fill={accent} opacity="0.15">    return System.live_run()</text>
                        
                        <text x="680" y="40" fontFamily="monospace" fontSize="11" fill={accent} opacity="0.25" fontWeight="bold">&lt;/&gt;</text>
                        <text x="710" y="85" fontFamily="monospace" fontSize="10" fill={accent} opacity="0.18">&gt;&gt;&gt; sys.ready</text>
                        
                        <path d="M 450 15 H 750 V 105 H 450 Z" stroke={accent} strokeWidth="1" strokeDasharray="8 8" opacity="0.08" />
                    </svg>
                </div>
            );
        case 'neura':
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-neura" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="rgba(168, 85, 247, 0.01)" />
                                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.12)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-neura)" />
                        <line x1="520" y1="60" x2="600" y2="30" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="520" y1="60" x2="600" y2="90" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="600" y1="30" x2="680" y2="60" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="600" y1="90" x2="680" y2="60" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="680" y1="60" x2="760" y2="30" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="680" y1="60" x2="760" y2="90" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <line x1="600" y1="30" x2="600" y2="90" stroke={accent} strokeWidth="0.75" opacity="0.1" />
                        <line x1="680" y1="60" x2="680" y2="10" stroke={accent} strokeWidth="0.75" opacity="0.1" />
                        
                        <circle cx="520" cy="60" r="4" fill={accent} opacity="0.3" />
                        <circle cx="600" cy="30" r="5" fill={accent} opacity="0.25" />
                        <circle cx="600" cy="90" r="5" fill={accent} opacity="0.25" />
                        <circle cx="680" cy="60" r="6" fill={accent} opacity="0.35" />
                        <circle cx="760" cy="30" r="4" fill={accent} opacity="0.25" />
                        <circle cx="760" cy="90" r="4" fill={accent} opacity="0.25" />
                        <circle cx="680" cy="60" r="10" stroke={accent} strokeWidth="0.75" strokeDasharray="2 2" opacity="0.3" />
                    </svg>
                </div>
            );
        case 'creova':
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-creova" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="rgba(236, 72, 153, 0.01)" />
                                <stop offset="100%" stopColor="rgba(236, 72, 153, 0.12)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-creova)" />
                        <rect x="580" y="20" width="60" height="80" rx="6" stroke={accent} strokeWidth="1" opacity="0.2" fill="none" />
                        <rect x="585" y="25" width="50" height="50" rx="3" stroke={accent} strokeWidth="0.75" opacity="0.15" fill="none" />
                        <circle cx="610" cy="85" r="2.5" fill={accent} opacity="0.25" />
                        
                        <path d="M 520 60 H 580" stroke={accent} strokeWidth="0.75" strokeDasharray="3 3" opacity="0.2" />
                        <path d="M 640 40 H 700 L 720 60 H 760" stroke={accent} strokeWidth="1" opacity="0.18" />
                        <circle cx="700" cy="40" r="2.5" fill={accent} opacity="0.3" />
                        
                        <line x1="680" y1="10" x2="680" y2="110" stroke={accent} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.1" />
                        <line x1="480" y1="80" x2="780" y2="80" stroke={accent} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.1" />
                    </svg>
                </div>
            );
        case 'junior':
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-junior" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="rgba(249, 115, 22, 0.01)" />
                                <stop offset="100%" stopColor="rgba(249, 115, 22, 0.12)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-junior)" />
                        <path d="M 520 40 H 540 A 5 5 0 0 1 550 40 H 570 V 60 A 5 5 0 0 1 570 70 H 520 Z" stroke={accent} strokeWidth="1.2" opacity="0.25" fill="none" />
                        <path d="M 580 60 H 600 A 5 5 0 0 1 610 60 H 630 V 80 A 5 5 0 0 1 630 90 H 580 Z" stroke={accent} strokeWidth="1.2" opacity="0.18" fill="none" />
                        
                        <circle cx="670" cy="30" r="3" fill={accent} opacity="0.2" />
                        <circle cx="700" cy="75" r="4.5" fill={accent} opacity="0.25" />
                        <circle cx="740" cy="45" r="2.5" fill={accent} opacity="0.2" />
                        
                        <path d="M 680 70 C 680 50, 720 50, 720 70 C 720 90, 680 90, 680 70" stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.15" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="my-projects-header-bg-visual">
                    <svg viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="header-grad-default" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="100%" stopColor="rgba(99, 102, 241, 0.08)" />
                            </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#header-grad-default)" />
                        <path d="M 500 20 L 520 40 L 500 60" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <path d="M 600 80 L 620 100 L 600 120" stroke={accent} strokeWidth="1" opacity="0.15" />
                        <circle cx="700" cy="50" r="8" stroke={accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
                    </svg>
                </div>
            );
    }
};

interface SavedProjectCardVisualProps {
    projectId: string;
    fileUrl: string | null;
    mode: string;
    projectName: string;
    accent: string;
}

const SavedProjectCardVisual: React.FC<SavedProjectCardVisualProps> = ({ projectId, fileUrl, mode, projectName, accent }) => {
    const [loading, setLoading] = useState(true);
    const [projectContent, setProjectContent] = useState<any | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                let url = fileUrl;
                if (!url && projectId) {
                    const fullProject = await getCloudProject(projectId);
                    url = fullProject.fileUrl;
                }

                if (!url) {
                    if (!cancelled) setLoading(false);
                    return;
                }

                const fullUrl = url.startsWith('http')
                    ? url
                    : `${(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) || 'https://lms-api.creoleap.workers.dev'}${url}`;
                
                const response = await fetch(fullUrl);
                if (!response.ok) throw new Error('Failed to load project content');
                const text = await response.text();
                
                let content;
                try {
                    content = isPacked(text) ? unpack<any>(text) : JSON.parse(text);
                } catch (parseErr) {
                    console.error('[SavedProjectCardVisual] Failed to parse content:', parseErr);
                    content = null;
                }

                if (content && !cancelled) {
                    setProjectContent(content);
                }
            } catch (err) {
                console.error('[SavedProjectCardVisual] Failed to load content:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [fileUrl, projectId]);

    if (loading) {
        return (
            <div className="project-card-visual-loader">
                <div className="mini-spinner" style={{ '--spinner-color': accent } as React.CSSProperties} />
            </div>
        );
    }

    if (!projectContent) {
        return renderCardVisual(mode, projectName);
    }

    // ── Mode 1: Electra (Circuit Canvas) ──
    if (mode === 'electra') {
        const nodes = projectContent.nodes || projectContent.circuit?.nodes || [];
        const edges = projectContent.edges || projectContent.circuit?.edges || [];
        if (!Array.isArray(nodes) || nodes.length === 0) {
            return renderCardVisual(mode, projectName);
        }

        const padding = 50;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach((n: any) => {
            const x = n.position?.x ?? 0;
            const y = n.position?.y ?? 0;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
            minX = 0; maxX = 800; minY = 0; maxY = 600;
        }

        const width = Math.max(maxX - minX + padding * 2, 200);
        const height = Math.max(maxY - minY + padding * 2, 110);
        const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

        return (
            <div className="project-card-visual actual-circuit-render">
                <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="actual-circuit-svg">
                    <defs>
                        <pattern id="card-circuit-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(15, 23, 42, 0.05)" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect x={minX - padding} y={minY - padding} width={width} height={height} fill="url(#card-circuit-grid)" />

                    {Array.isArray(edges) && edges.map((edge: any) => {
                        const srcNode = nodes.find((n: any) => n.id === edge.source);
                        const tgtNode = nodes.find((n: any) => n.id === edge.target?.replace('__target', ''));
                        if (!srcNode || !tgtNode) return null;

                        const waypoints = edge.data?.waypoints || [];
                        const color = edge.data?.color || accent;

                        if (Array.isArray(waypoints) && waypoints.length > 0) {
                            const pointsString = [
                                { x: srcNode.position?.x ?? 0, y: srcNode.position?.y ?? 0 },
                                ...waypoints,
                                { x: tgtNode.position?.x ?? 0, y: tgtNode.position?.y ?? 0 }
                            ].map(pt => `${pt.x},${pt.y}`).join(' ');

                            return (
                                <polyline
                                    key={edge.id}
                                    points={pointsString}
                                    stroke={color}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.8"
                                />
                            );
                        }

                        return (
                            <line
                                key={edge.id}
                                x1={srcNode.position?.x ?? 0}
                                y1={srcNode.position?.y ?? 0}
                                x2={tgtNode.position?.x ?? 0}
                                y2={tgtNode.position?.y ?? 0}
                                stroke={color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                opacity="0.8"
                            />
                        );
                    })}

                    {nodes.map((node: any) => {
                        const x = node.position?.x ?? 0;
                        const y = node.position?.y ?? 0;
                        const rawType = node.data?.type || 'resistor';
                        const elementType = rawType === 'lcd1602-i2c' ? 'lcd1602' : rawType === 'lcd2004-i2c' ? 'lcd2004' : rawType;
                        const TagName = `leap-${elementType}`;
                        const rotation = node.data?.rotation || 0;

                        let compWidth = 120, compHeight = 120;
                        if (['arduino-uno', 'arduino-mega'].includes(elementType)) {
                            compWidth = 280; compHeight = 210;
                        } else if (['esp32-c3', 'esp32', 'nano-rp2040-connect', 'arduino-nano'].includes(elementType)) {
                            compWidth = 160; compHeight = 160;
                        } else if (['lcd1602', 'lcd2004', 'ili9341', 'ili9341-touch', 'membrane-keypad', 'led-ring', 'neopixel-matrix'].includes(elementType)) {
                            compWidth = 220; compHeight = 180;
                        }

                        const mappedProps: any = { ...node.data, simulating: false };
                        if (elementType === 'led') {
                            mappedProps.value = node.data.brightness ? true : false;
                            mappedProps.color = node.data.color || 'red';
                        } else if (elementType === 'servo' || elementType === 'stepper-motor') {
                            mappedProps.angle = node.data.angle ?? 0;
                        } else if (['potentiometer', 'slide-potentiometer'].includes(elementType)) {
                            mappedProps.value = node.data.sensorValues?.value ?? 0;
                        } else if (['dc-motor', 'motor', 'stepper-motor'].includes(elementType)) {
                            mappedProps.speed = 0;
                            mappedProps.animating = false;
                        }

                        return (
                            <foreignObject
                                key={node.id}
                                x={x - compWidth / 2}
                                y={y - compHeight / 2}
                                width={compWidth}
                                height={compHeight}
                                style={{ overflow: 'visible', pointerEvents: 'none' }}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transform: `rotate(${rotation}deg)`,
                                    transformOrigin: 'center center'
                                }}>
                                    {React.createElement(TagName, mappedProps)}
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>
            </div>
        );
    }

    // ── Mode 2: Logix / Python (Code Session View) ──
    if (mode === 'python') {
        let rawCode = projectContent.code || '';
        if (!rawCode && projectContent.projectFiles) {
            const files = projectContent.projectFiles;
            rawCode = files['main.py'] || Object.values(files)[0] || '';
        }
        if (!rawCode) rawCode = `# ${projectName}\nimport time\n\ndef main():\n    print("System active")\n    time.sleep(1)\n\nif __name__ == "__main__":\n    main()`;

        const codeLines = rawCode.split('\n').slice(0, 6);

        return (
            <div className="project-card-visual actual-code-session">
                <div className="code-session-header">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                    <span className="code-filename">{projectContent.activeFile || 'main.py'}</span>
                </div>
                <div className="code-session-body">
                    {codeLines.map((line: string, i: number) => {
                        const formatted = line.replace(/(import|from|def|class|return|if|else|elif|while|for|in|print|True|False|None|async|await)/g, '<span class="kw">$1</span>');
                        return (
                            <div key={i} className="code-line">
                                <span className="line-num">{i + 1}</span>
                                <span className="line-text" dangerouslySetInnerHTML={{ __html: formatted }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Mode 3: Creova (Phone Canvas View) ──
    if (mode === 'creova') {
        const screens = projectContent.screens || [];
        const activeScreen = screens[0] || {};
        const components = activeScreen.components || [];
        const appTitle = projectContent.appName || activeScreen.name || projectName;

        return (
            <div className="project-card-visual actual-creova-phone">
                <div className="phone-frame">
                    <div className="phone-notch" />
                    <div className="phone-screen" style={{ backgroundColor: activeScreen.backgroundColor || '#F8FAFC' }}>
                        <div className="phone-app-bar" style={{ backgroundColor: activeScreen.titleBarColor || accent }}>
                            <span>{appTitle}</span>
                        </div>
                        <div className="phone-components-container">
                            {components.length > 0 ? (
                                components.slice(0, 4).map((comp: any, idx: number) => {
                                    const type = comp.type || comp.componentType || 'Label';
                                    const text = comp.text || comp.props?.text || comp.name || type;
                                    
                                    if (type.includes('Button')) {
                                        return (
                                            <div key={idx} className="phone-comp-button" style={{ backgroundColor: comp.props?.backgroundColor || accent }}>
                                                {text}
                                            </div>
                                        );
                                    }
                                    if (type.includes('TextBox') || type.includes('Input')) {
                                        return (
                                            <div key={idx} className="phone-comp-input">
                                                <span>{text}</span>
                                            </div>
                                        );
                                    }
                                    if (type.includes('Slider')) {
                                        return (
                                            <div key={idx} className="phone-comp-slider">
                                                <div className="slider-track" />
                                                <div className="slider-thumb" style={{ backgroundColor: accent }} />
                                            </div>
                                        );
                                    }
                                    if (type.includes('Switch') || type.includes('Toggle')) {
                                        return (
                                            <div key={idx} className="phone-comp-switch">
                                                <span>{text}</span>
                                                <div className="switch-pill" />
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={idx} className="phone-comp-label" style={{ color: comp.props?.textColor || '#1E293B' }}>
                                            {text}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="phone-empty-canvas">
                                    <div className="phone-mock-btn" style={{ backgroundColor: accent }}>Welcome</div>
                                    <div className="phone-mock-input">Enter details...</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Mode 4 & 5: Junior (Ignite) & Intermediate (Embed) (Workspace Stage View) ──
    const scene = projectContent.scenes?.[0] || projectContent;
    const spritesList = scene.sprites || projectContent.sprites || [];
    const backdropName = scene.backdropName || scene.name || (mode === 'junior' ? 'Ignite Stage' : 'Embed Stage');

    return (
        <div className="project-card-visual actual-workspace-stage">
            <div className="stage-bg-grid" />
            
            {/* Stage Top Controls Bar */}
            <div className="stage-top-bar">
                <div className="stage-flag-controls">
                    <span className="mini-flag-btn" title="Run script">🚩</span>
                    <span className="mini-stop-btn" title="Stop">🛑</span>
                </div>
                <span className="stage-title-tag">{backdropName}</span>
            </div>

            <div className="stage-workspace-split">
                {/* Left Column: Visual Blockly Script Preview Stack */}
                <div className="stage-blocks-stack">
                    <div className="block-chip block-event">when 🚩 clicked</div>
                    <div className="block-chip block-motion">move 10 steps</div>
                    <div className="block-chip block-looks">say Hello!</div>
                </div>

                {/* Right Column: Character Sprites Stage Canvas */}
                <div className="stage-sprites-canvas">
                    {Array.isArray(spritesList) && spritesList.length > 0 ? (
                        spritesList.slice(0, 2).map((sprite: any, idx: number) => {
                            const name = sprite.name || `Sprite ${idx + 1}`;
                            const costumeSrc = sprite.costumeUrl || sprite.icon || (typeof sprite.costumes === 'object' ? (sprite.costumes[sprite.currentCostume] || sprite.costumes.default) : null);
                            const finalSrc = costumeSrc && !costumeSrc.startsWith('http') && !costumeSrc.startsWith('/') ? `/${costumeSrc}` : costumeSrc;

                            return (
                                <div key={idx} className="stage-sprite-character">
                                    {finalSrc ? (
                                        <img src={finalSrc} alt={name} className="sprite-char-img" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                                    ) : (
                                        <div className="sprite-avatar-badge" style={{ backgroundColor: accent }}>
                                            <Cpu size={18} color="#FFF" />
                                        </div>
                                    )}
                                    <span className="sprite-char-name">{name}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="stage-sprite-character">
                            <div className="sprite-avatar-badge" style={{ backgroundColor: accent }}>
                                <Cpu size={20} color="#FFF" />
                            </div>
                            <span className="sprite-char-name">Robot</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ProjectBoardBadgeProps {
    project: CloudProject;
}

const ProjectBoardBadge: React.FC<ProjectBoardBadgeProps> = ({ project }) => {
    const [board, setBoard] = useState<string | null>(() => {
        if (project.metadata) {
            try {
                const parsed = typeof project.metadata === 'string' ? JSON.parse(project.metadata) : project.metadata;
                if (parsed?.board) return parsed.board;
            } catch (e) {}
        }
        return null;
    });

    useEffect(() => {
        if (board) return;
        let cancelled = false;
        (async () => {
            try {
                if (!project.fileUrl) return;
                const fullUrl = project.fileUrl.startsWith('http')
                    ? project.fileUrl
                    : `${(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) || 'https://lms-api.creoleap.workers.dev'}${project.fileUrl}`;
                const res = await fetch(fullUrl);
                if (!res.ok) return;
                const text = await res.text();
                const content = isPacked(text) ? unpack<any>(text) : JSON.parse(text);
                const loadedNodes = content.nodes || content.circuit?.nodes || [];
                const detectedBoard = content.board || (loadedNodes.some((n: any) => n.data?.type === 'esp32-c3' || n.data?.type === 'esp32') ? 'esp32-c3' : 'arduino-uno');
                if (!cancelled && detectedBoard) {
                    setBoard(detectedBoard);
                }
            } catch (err) {}
        })();
        return () => { cancelled = true; };
    }, [project.fileUrl, project.metadata, board]);

    if (project.mode !== 'electra' && project.mode !== 'intermediate') return null;
    const targetBoard = board || 'arduino-uno';

    const displayLabel = (targetBoard === 'esp32-c3' || targetBoard === 'esp32') ? 'ESP32-C3' : 'Arduino Uno';
    const isEsp32 = targetBoard === 'esp32-c3' || targetBoard === 'esp32';

    return (
        <span className={`my-project-board-tag ${isEsp32 ? 'tag-esp32' : 'tag-arduino'}`}>
            <Cpu size={12} style={{ marginRight: '4px' }} />
            {displayLabel}
        </span>
    );
};

interface DeleteConfirmationModalProps {
    projectName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ projectName, onConfirm, onCancel }) => {
    return (
        <div className="custom-modal-overlay" onClick={onCancel}>
            <div className="custom-delete-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onCancel} title="Close">
                    <X size={18} />
                </button>
                
                <div className="delete-modal-icon-wrapper">
                    <div className="delete-modal-icon">
                        <AlertTriangle size={28} color="#EF4444" />
                    </div>
                </div>

                <h3 className="delete-modal-title">Delete Project</h3>
                <p className="delete-modal-description">
                    Are you sure you want to delete <strong className="delete-modal-project-name">"{projectName}"</strong>? This action cannot be undone.
                </p>

                <div className="delete-modal-actions">
                    <button className="delete-modal-cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="delete-modal-confirm-btn" onClick={onConfirm}>
                        <Trash2 size={16} style={{ marginRight: '6px' }} />
                        Delete Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function MyProjectsDashboard({ onOpenProject }: MyProjectsDashboardProps) {
    const { isAuthenticated } = useLeapLabAuthStore();
    const [projects, setProjects] = useState<CloudProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<CloudProject | null>(null);
    const [openingId, setOpeningId] = useState<string | null>(null);
    const [sharingProject, setSharingProject] = useState<CloudProject | null>(null);
    const [selectedMode, setSelectedMode] = useState<string | null>(() => {
        return sessionStorage.getItem('myProjectsSelectedMode') || null;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const { setPendingProject } = useCloudProjectStore();
    
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await listMyProjects();
                if (!cancelled) setProjects(data);
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Failed to load projects');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isAuthenticated]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft } = scrollRef.current;
            const scrollAmount = 300; // Match card width + gap
            const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const handleOpenProject = async (project: CloudProject) => {
        if (openingId) return;
        setOpeningId(project.id);
        try {
            const fullProject = await getCloudProject(project.id);
            if (!fullProject.fileUrl) {
                throw new Error('Project file URL is missing');
            }

            const fileUrl = fullProject.fileUrl.startsWith('http')
                ? fullProject.fileUrl
                : `${(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) || 'https://lms-api.creoleap.workers.dev'}${fullProject.fileUrl}`;

            const content = await fetchCloudProjectContent(fileUrl);

            setPendingProject({
                mode: project.mode,
                data: content,
                projectName: project.name,
            });

            useCloudProjectStore.getState().setActiveProjectId(project.id);
            useCloudProjectStore.getState().clearSharedProjectInfo();

            onOpenProject(project.mode);
        } catch (err: any) {
            console.error('[MyProjectsDashboard] Failed to open project:', err);
            alert(err?.message || 'Failed to open project');
        } finally {
            setOpeningId(null);
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, project: CloudProject) => {
        e.stopPropagation();
        setProjectToDelete(project);
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        const project = projectToDelete;
        setProjectToDelete(null);
        setDeletingId(project.id);
        try {
            await deleteCloudProject(project.id);
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
        } catch (err: any) {
            console.error('[MyProjectsDashboard] Failed to delete project:', err);
            alert(err?.message || 'Failed to delete project');
        } finally {
            setDeletingId(null);
        }
    };

    const handleShareProject = (e: React.MouseEvent, project: CloudProject) => {
        e.stopPropagation();
        setSharingProject(project);
    };

    const handleShareUpdate = (updatedProject: CloudProject) => {
        setProjects((prev) =>
            prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setSharingProject(updatedProject);
    };

    const renderShareButton = (project: CloudProject) => (
        <button
            className={`my-project-share-btn ${project.isShared === 1 ? 'shared' : ''}`}
            onClick={(e) => handleShareProject(e, project)}
            title={project.isShared === 1 ? 'Manage sharing' : 'Share project'}
        >
            <Share2 size={16} />
        </button>
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Unknown date';
        try {
            return new Date(dateString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return 'Unknown date';
        }
    };

    const escapeRegExp = (str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const escapedQuery = escapeRegExp(query.trim());
        const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
        const lowerQuery = query.trim().toLowerCase();
        return (
            <>
                {parts.map((part, index) =>
                    part.toLowerCase() === lowerQuery ? (
                        <mark key={index} className="project-name-highlight">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    const groupedProjects = projects.reduce((acc, project) => {
        const mode = project.mode || 'unknown';
        if (!acc[mode]) acc[mode] = [];
        acc[mode].push(project);
        return acc;
    }, {} as Record<string, CloudProject[]>);

    const sortedModes = ['junior', 'intermediate', 'python', 'neura', 'electra', 'vision3d', 'creova'];

    if (!isAuthenticated) {
        return (
            <div className="my-projects-empty">
                <div className="my-projects-empty-icon">
                    <Lock size={44} />
                </div>
                <h3>Sign in to see your projects</h3>
                <p>Your saved LeapLab projects will appear here after you sign in.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-projects-loading">
                <div className="my-projects-spinner" />
                <p>Loading your projects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-projects-error">
                <div className="my-projects-error-icon">
                    <AlertTriangle size={44} color="#EF4444" />
                </div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    // Module selection view
    if (!selectedMode) {
        return (
            <div className="my-projects-dashboard">
                <h2 className="my-projects-title">My Workspace</h2>
                <p className="my-projects-subtitle">Select a module category to access your files</p>
                <div className="my-modules-grid">
                    {sortedModes.map((mode) => {
                        const meta = MODULES[mode];
                        const modeProjects = groupedProjects[mode] || [];
                        return (
                            <button
                                key={mode}
                                className="my-module-card cursor-pointer"
                                style={{
                                    '--module-accent': meta?.accent || '#6366f1',
                                    '--module-gradient': meta?.gradient || '#ffffff',
                                    '--module-dark-accent': meta?.darkAccent || '#4f46e5'
                                } as React.CSSProperties}
                                onClick={() => {
                                    setSelectedMode(mode);
                                    sessionStorage.setItem('myProjectsSelectedMode', mode);
                                }}
                            >
                                <div className="my-module-card-banner">
                                    <img
                                        src={meta?.icon || 'assets/splash_logo_b.png'}
                                        alt={meta?.label || mode}
                                        className="my-module-card-icon"
                                    />
                                    <span className="my-module-card-count">
                                        {modeProjects.length} {modeProjects.length === 1 ? 'project' : 'projects'}
                                    </span>
                                </div>
                                <div className="my-module-card-info">
                                    <h3 className="my-module-card-name">{meta?.label || mode}</h3>
                                    <p className="my-module-card-hint">Open Workspace</p>
                                </div>
                                <div className="my-module-card-arrow">
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        );
                    })}
                </div>
                
                {/* Clean design credits footer */}
                <div className="my-projects-footer">
                    <span>LeapLab v1.1.0-STABLE</span>
                    <span className="footer-divider" />
                    <span>© 2026 Creoleap Technologies Pvt. Ltd. All rights reserved.</span>
                </div>
            </div>
        );
    }

    // Selected module project list view
    const meta = MODULES[selectedMode];
    const modeProjects = groupedProjects[selectedMode] || [];
    const filteredProjects = modeProjects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div 
            className="my-projects-dashboard page-projects-view"
            style={{
                '--module-accent': meta?.accent || '#6366f1',
                '--module-gradient': meta?.gradient || '#ffffff',
                '--module-dark-accent': meta?.darkAccent || '#4f46e5'
            } as React.CSSProperties}
        >
            <div className="my-projects-top-nav">
                <button
                    className="my-projects-back-btn cursor-pointer"
                    onClick={() => {
                        setSelectedMode(null);
                        sessionStorage.removeItem('myProjectsSelectedMode');
                        setSearchQuery('');
                        useCloudProjectStore.getState().clearActiveProjectId();
                    }}
                    aria-label="Back to modules"
                    title="Back to modules"
                >
                    <ArrowLeft size={16} style={{ marginRight: '6px', transition: 'transform 0.2s' }} className="back-btn-arrow" />
                    <span>Back to modules</span>
                </button>
            </div>

            <div className="my-projects-module-header">
                {renderHeaderBackgroundVisual(selectedMode)}

                <div className="my-projects-header-left">
                    <div className="my-module-header-icon-wrapper">
                        <img
                            src={meta?.icon || 'assets/splash_logo_b.png'}
                            alt={meta?.label || selectedMode}
                            className="my-projects-module-header-icon"
                        />
                    </div>
                    <div className="my-projects-header-text">
                        <h2 className="my-projects-module-header-name">{meta?.label || selectedMode} Workspace</h2>
                        <div className="my-projects-header-badge-row">
                            <span className="my-projects-module-header-count">
                                {modeProjects.length} {modeProjects.length === 1 ? 'project' : 'projects'}
                            </span>
                            <span className="my-projects-live-badge">Live System</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar aligned to the right inside the header banner */}
                {modeProjects.length > 0 && (
                    <div className="my-projects-header-right">
                        <div className="my-projects-search-wrapper">
                            <Search size={18} className="my-projects-search-icon" />
                            <input
                                type="text"
                                placeholder={`Search ${meta?.label || selectedMode} projects...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="my-projects-search-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="my-projects-search-clear"
                                    aria-label="Clear search"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Project Grid Wrapper */}
            {modeProjects.length === 0 ? (
                <div className="my-projects-category-empty">
                    <FolderOpen size={44} style={{ opacity: 0.6, marginBottom: '12px', color: meta?.accent }} />
                    <h3>No projects saved yet</h3>
                    <p>Open the workspace editor from the main landing page to build and save a project under {meta?.label}.</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="my-projects-search-empty">
                    <Search size={44} style={{ opacity: 0.4, marginBottom: '12px', color: meta?.accent }} />
                    <h3>No matching projects</h3>
                    <p>We couldn't find any projects matching "{searchQuery}". Try adjusting your keywords.</p>
                    <button className="clear-search-btn cursor-pointer" onClick={() => setSearchQuery('')}>
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="my-projects-grid" ref={scrollRef}>
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            className="my-project-card cursor-pointer"
                            onClick={() => handleOpenProject(project)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleOpenProject(project);
                                }
                            }}
                        >
                            {/* Visual schematic panel or project thumbnail cover image */}
                            {project.thumbnailUrl ? (
                                <div className="project-card-visual">
                                    <img
                                        src={project.thumbnailUrl.startsWith('http')
                                            ? project.thumbnailUrl
                                            : `${(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LMS_API_URL) || 'https://lms-api.creoleap.workers.dev'}${project.thumbnailUrl}`}
                                        alt={project.name}
                                        className="project-card-thumbnail-img"
                                    />
                                </div>
                            ) : (
                                <SavedProjectCardVisual projectId={project.id} fileUrl={project.fileUrl} mode={project.mode || selectedMode} projectName={project.name} accent={meta?.accent || '#6366F1'} />
                            )}

                            <div className="my-project-card-content">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                    <h4 className="my-project-card-name" title={project.name} style={{ margin: 0, flex: 1 }}>{highlightMatch(project.name, searchQuery)}</h4>
                                    <ProjectBoardBadge project={project} />
                                </div>
                                <div className="my-project-card-footer-row">
                                    <div className="my-project-card-date">
                                        <Calendar size={14} style={{ marginRight: '4px', opacity: 0.7 }} />
                                        <span>{formatDate(project.updatedAt)}</span>
                                    </div>
                                    <div className="my-project-card-actions">
                                        {renderShareButton(project)}
                                        <button
                                            className="my-project-delete-btn"
                                            onClick={(e) => handleDeleteProject(e, project)}
                                            disabled={deletingId === project.id}
                                            title="Delete project"
                                        >
                                            {deletingId === project.id ? (
                                                <span className="btn-spinner" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {openingId === project.id && (
                                <div className="my-project-opening">
                                    <div className="opening-spinner" />
                                    <span>Opening Workspace...</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Dynamic Status / Credits footer */}
            <div className="my-projects-footer">
                <span>LeapLab v1.1.0-STABLE</span>
                <span className="footer-divider" />
                <span>© 2026 Creoleap Technologies Pvt. Ltd. All rights reserved.</span>
            </div>

            {sharingProject && (
                <ShareProjectModal
                    project={sharingProject}
                    onClose={() => setSharingProject(null)}
                    onUpdate={handleShareUpdate}
                />
            )}

            {projectToDelete && (
                <DeleteConfirmationModal
                    projectName={projectToDelete.name}
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </div>
    );
}

