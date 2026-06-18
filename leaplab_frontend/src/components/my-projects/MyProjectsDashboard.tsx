/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */
import React, { useEffect, useState } from 'react';
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

interface MyProjectsDashboardProps {
    onOpenProject: (mode: string) => void;
}

interface ModuleMeta {
    label: string;
    icon: string;
    accent: string;
    gradient: string;
}

const MODULES: Record<string, ModuleMeta> = {
    junior: {
        label: 'Ignite',
        icon: 'assets/ignite_icon.png',
        accent: '#F97316',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #fff0e5 60%, #fce5d4 100%)',
    },
    intermediate: {
        label: 'Embed',
        icon: 'assets/arduino_icon.png',
        accent: '#59aaa4',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #e5f2f5 60%, #d5f2f7 100%)',
    },
    python: {
        label: 'Logix',
        icon: 'assets/python_icon.png',
        accent: '#3B82F6',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #ebf0fd 60%, #ccdafa 100%)',
    },
    neura: {
        label: 'Neura',
        icon: 'assets/ml_brain_icon.png',
        accent: '#A855F7',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #f4ebfa 60%, #eddef7 100%)',
    },
    electra: {
        label: 'Electra',
        icon: 'assets/creocad_icon.png',
        accent: '#22C55E',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #eaf8ed 60%, #d6f7df 100%)',
    },
    creova: {
        label: 'Creova',
        icon: 'assets/app_game_dev_icon.png',
        accent: '#EC4899',
        gradient: 'linear-gradient(155deg, #ffffff 0%, #fbedf4 60%, #fae1ee 100%)',
    },
};

export default function MyProjectsDashboard({ onOpenProject }: MyProjectsDashboardProps) {
    const { isAuthenticated } = useLeapLabAuthStore();
    const [projects, setProjects] = useState<CloudProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<string | null>(null);
    const [sharingProject, setSharingProject] = useState<CloudProject | null>(null);
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const { setPendingProject } = useCloudProjectStore();

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

            useCloudProjectStore.getState().clearSharedProjectInfo();

            onOpenProject(project.mode);
        } catch (err: any) {
            console.error('[MyProjectsDashboard] Failed to open project:', err);
            alert(err?.message || 'Failed to open project');
        } finally {
            setOpeningId(null);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, project: CloudProject) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
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
    };

    const renderShareButton = (project: CloudProject) => (
        <button
            className="my-project-share-btn"
            onClick={(e) => handleShareProject(e, project)}
            title={project.isShared === 1 ? 'Manage share link' : 'Share project'}
        >
            {project.isShared === 1 ? '🔗' : '⤴️'}
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

    const groupedProjects = projects.reduce((acc, project) => {
        const mode = project.mode || 'unknown';
        if (!acc[mode]) acc[mode] = [];
        acc[mode].push(project);
        return acc;
    }, {} as Record<string, CloudProject[]>);

    const sortedModes = Object.keys(groupedProjects).sort((a, b) => {
        const aKnown = MODULES[a]?.label || a;
        const bKnown = MODULES[b]?.label || b;
        return aKnown.localeCompare(bKnown);
    });

    if (!isAuthenticated) {
        return (
            <div className="my-projects-empty">
                <div className="my-projects-empty-icon">🔒</div>
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
                <div className="my-projects-error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="my-projects-empty">
                <div className="my-projects-empty-icon">📁</div>
                <h3>No projects yet</h3>
                <p>Projects you save from any LeapLab module will appear here.</p>
            </div>
        );
    }

    // Module selection view
    if (!selectedMode) {
        return (
            <div className="my-projects-dashboard">
                <h2 className="my-projects-title">My Projects</h2>
                <p className="my-projects-subtitle">Choose a module to view your saved projects</p>
                <div className="my-modules-grid">
                    {sortedModes.map((mode) => {
                        const meta = MODULES[mode];
                        const modeProjects = groupedProjects[mode];
                        return (
                            <button
                                key={mode}
                                className="my-module-card"
                                style={{ '--module-accent': meta?.accent || '#6366f1', '--module-gradient': meta?.gradient || '#ffffff' } as React.CSSProperties}
                                onClick={() => setSelectedMode(mode)}
                            >
                                <div className="my-module-card-top">
                                    <img
                                        src={meta?.icon || 'assets/splash_logo_b.png'}
                                        alt={meta?.label || mode}
                                        className="my-module-card-icon"
                                    />
                                    <span className="my-module-card-count">
                                        {modeProjects.length} project{modeProjects.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="my-module-card-bottom">
                                    <h3 className="my-module-card-name">{meta?.label || mode}</h3>
                                    <p className="my-module-card-hint">Click to open</p>
                                </div>
                                <div className="my-module-card-arrow">→</div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Selected module project list view
    const meta = MODULES[selectedMode];
    const modeProjects = groupedProjects[selectedMode] || [];

    return (
        <div className="my-projects-dashboard">
            <button
                className="my-projects-back"
                onClick={() => setSelectedMode(null)}
                aria-label="Back to modules"
            >
                ← Back to modules
            </button>

            <div className="my-projects-module-header">
                <img
                    src={meta?.icon || 'assets/splash_logo_b.png'}
                    alt={meta?.label || selectedMode}
                    className="my-projects-module-header-icon"
                />
                <div>
                    <h2 className="my-projects-module-header-name">{meta?.label || selectedMode}</h2>
                    <p className="my-projects-module-header-count">
                        {modeProjects.length} project{modeProjects.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="my-projects-grid">
                {modeProjects.map((project) => (
                    <div
                        key={project.id}
                        className="my-project-card"
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
                        <div className="my-project-card-header">
                            <img
                                src={meta?.icon || 'assets/splash_logo_b.png'}
                                alt=""
                                className="my-project-card-icon-img"
                            />
                            <div className="my-project-card-actions">
                                {renderShareButton(project)}
                                <button
                                    className="my-project-delete-btn"
                                    onClick={(e) => handleDeleteProject(e, project)}
                                    disabled={deletingId === project.id}
                                    title="Delete project"
                                >
                                    {deletingId === project.id ? '...' : '🗑️'}
                                </button>
                            </div>
                        </div>
                        <h4 className="my-project-card-name">{project.name}</h4>
                        <p className="my-project-card-date">{formatDate(project.updatedAt)}</p>
                        {openingId === project.id && (
                            <div className="my-project-opening">Opening...</div>
                        )}
                    </div>
                ))}
            </div>

            {sharingProject && (
                <ShareProjectModal
                    project={sharingProject}
                    onClose={() => setSharingProject(null)}
                    onUpdate={handleShareUpdate}
                />
            )}
        </div>
    );
}
