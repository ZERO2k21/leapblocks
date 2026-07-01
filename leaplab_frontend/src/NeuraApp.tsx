/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProjectHeader from './components/neura/common/ProjectHeader';
import WelcomeHero from './components/neura/dashboard/WelcomeHero';
import ActionBar from './components/neura/dashboard/ActionBar';
import EmptyStateIllustration from './components/neura/dashboard/EmptyStateIllustration';

import CreateProjectModal from './components/neura/create-project/CreateProjectModal';
import ImageClassifier from './components/neura/project-types/image-classifier/ImageClassifier';
import ObjectDetection from './components/neura/project-types/object-detection/ObjectDetection';
import PoseClassifier from './components/neura/project-types/pose-classifier/PoseClassifier';
import HandPoseClassifier from './components/neura/project-types/hand-pose-classifier/HandPoseClassifier';
import AudioClassifier from './components/neura/project-types/audio-classifier/AudioClassifier';
import NumbersCR from './components/neura/project-types/numbers-cr/NumbersCR';
import TextClassifier from './components/neura/project-types/text-classifier/TextClassifier';
import { NeuraProject, ProjectType } from './types/neura.types';
import './styles/neura-theme.css';
import { fileService } from './Electra/Client/Src/services/FileService';
import { listMyProjects } from './services/cloudProjectApi';
import NeuraUnsavedWarningModal from './components/neura/common/NeuraUnsavedWarningModal';
import ClassifierErrorBoundary from './components/neura/common/ClassifierErrorBoundary';
import { NeuraThemeProvider, useNeuraTheme } from './components/neura/common/NeuraThemeContext';

interface NeuraAppProps {
    onBack?: () => void;
}

type NeuraView = 'dashboard' | 'create' | 'project';

export default function NeuraApp({ onBack }: NeuraAppProps) {
    return (
        <NeuraThemeProvider>
            <NeuraAppInner onBack={onBack} />
        </NeuraThemeProvider>
    );
}

function NeuraAppInner({ onBack }: NeuraAppProps) {
    const { isDark } = useNeuraTheme();
    const [view, setView] = useState<NeuraView>('dashboard');
    const [projects, setProjects] = useState<NeuraProject[]>([]);
    const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null);
    const [currentProject, setCurrentProject] = useState<NeuraProject | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const cached = localStorage.getItem('neura-projects-cache');
                if (cached) {
                    setProjects(JSON.parse(cached));
                }
            } catch { /* ignore cache read errors */ }

            try {
                const cloudProjects = await listMyProjects('neura');
                const loaded: NeuraProject[] = cloudProjects.map((cp) => {
                    const meta = cp.metadata ? JSON.parse(cp.metadata) : {};
                    return {
                        id: cp.id,
                        type: (meta.type || 'image-classifier') as ProjectType,
                        name: cp.name,
                        classes: meta.classes || [],
                        createdAt: cp.createdAt ? new Date(cp.createdAt).getTime() : Date.now(),
                        updatedAt: cp.updatedAt ? new Date(cp.updatedAt).getTime() : Date.now(),
                        modelTrained: meta.modelTrained || false,
                        accuracy: meta.accuracy,
                    };
                });
                setProjects(loaded);
                try {
                    localStorage.setItem('neura-projects-cache', JSON.stringify(loaded));
                } catch { /* ignore quota errors */ }
            } catch {
                // Cloud failed — keep using cache if available
            }
        };
        loadProjects();
    }, []);

    useEffect(() => {
        if (saveMessage) {
            const timer = setTimeout(() => setSaveMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveMessage]);

    useEffect(() => {
        try {
            localStorage.setItem('neura-projects-cache', JSON.stringify(projects));
        } catch { /* ignore quota errors */ }
    }, [projects]);

    const navigateWithUnsavedCheck = useCallback((action: () => void) => {
        if (hasUnsavedChanges && currentProject) {
            setPendingNavigation(() => action);
            setShowUnsavedModal(true);
        } else {
            action();
        }
    }, [hasUnsavedChanges, currentProject]);

    const handleCreateNew = () => {
        navigateWithUnsavedCheck(() => setView('create'));
    };

    const handleCreateProjectFromModal = (name: string, type: ProjectType, _description?: string) => {
        const newProject: NeuraProject = {
            id: crypto.randomUUID(),
            type,
            name,
            classes: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelTrained: false,
        };

        setCurrentProject(newProject);
        setCurrentProjectType(type);
        setProjects((prev) => [newProject, ...prev]);
        setHasUnsavedChanges(false);
        setView('project');
    };

    const handleBackToDashboard = () => {
        navigateWithUnsavedCheck(() => {
            setView('dashboard');
            setCurrentProjectType(null);
            setCurrentProject(null);
            setHasUnsavedChanges(false);
        });
    };

    const handleSaveProject = async (): Promise<boolean> => {
        if (!currentProject) return false;
        setIsSaving(true);
        try {
            await fileService.saveProject(currentProject.name, 'neura', currentProject);
            setHasUnsavedChanges(false);
            setSaveMessage({ type: 'success', text: 'Project saved to cloud!' });
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save project.';
            setSaveMessage({ type: 'error', text: message });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadProject = () => {
        if (!currentProject) return;
        fileService.saveProjectLocally(currentProject.name || 'neura-project', 'neura', currentProject);
    };

    const handleImportProject = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await fileService.loadProject(file);
            if (!data || typeof data !== 'object') {
                setSaveMessage({ type: 'error', text: 'Invalid project file.' });
                return;
            }

            const importedProject: NeuraProject = {
                id: data.id || crypto.randomUUID(),
                type: data.type || 'image-classifier',
                name: data.projectName || data.name || file.name.replace('.leap', ''),
                classes: data.classes || [],
                createdAt: data.createdAt || data.timestamp || Date.now(),
                updatedAt: data.updatedAt || data.timestamp || Date.now(),
                modelTrained: data.modelTrained || false,
                accuracy: data.accuracy,
                projectData: data.projectData || {},
            };

            setCurrentProject(importedProject);
            setCurrentProjectType(importedProject.type);
            setProjects((prev) => [importedProject, ...prev.filter((p) => p.id !== importedProject.id)]);
            setHasUnsavedChanges(false);
            setView('project');
            setSaveMessage({ type: 'success', text: 'Project imported successfully!' });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to import project.';
            setSaveMessage({ type: 'error', text: message });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUnsavedSave = async () => {
        const saved = await handleSaveProject();
        if (saved) {
            setShowUnsavedModal(false);
            pendingNavigation?.();
            setPendingNavigation(null);
        }
    };

    const handleUnsavedDiscard = () => {
        setHasUnsavedChanges(false);
        setShowUnsavedModal(false);
        pendingNavigation?.();
        setPendingNavigation(null);
    };

    const handleUnsavedCancel = () => {
        setShowUnsavedModal(false);
        setPendingNavigation(null);
    };

    const handleProjectDataChange = useCallback((data: Record<string, any>) => {
        setCurrentProject(prev => prev ? { ...prev, projectData: { ...prev.projectData, ...data }, updatedAt: Date.now() } : null);
        setHasUnsavedChanges(true);
    }, []);

    const renderProjectComponent = () => {
        const commonProps = { project: currentProject, onBack: handleBackToDashboard, onDataChange: handleProjectDataChange }
        let component: React.ReactNode = null
        switch (currentProjectType) {
            case 'image-classifier':
                component = <ImageClassifier {...commonProps} />
                break
            case 'object-detection':
                component = <ObjectDetection {...commonProps} />
                break
            case 'pose-classifier':
                component = <PoseClassifier {...commonProps} />
                break
            case 'hand-pose-classifier':
                component = <HandPoseClassifier {...commonProps} />
                break
            case 'audio-classifier':
                component = <AudioClassifier {...commonProps} />
                break
            case 'numbers-cr':
                component = <NumbersCR {...commonProps} />
                break
            case 'text-classifier':
                component = <TextClassifier {...commonProps} />
                break
            default:
                return null
        }
        return (
            <ClassifierErrorBoundary onBackToDashboard={handleBackToDashboard} key={currentProjectType}>
                {component}
            </ClassifierErrorBoundary>
        )
    };

    const getHeaderProps = () => {
        if (view === 'dashboard' || view === 'create') {
            return {
                showMiddleSection: false,
                onBack: view === 'create' ? handleBackToDashboard : onBack,
            };
        }
        return {
            showMiddleSection: true,
            icon: '🧠',
            title: currentProjectType?.replace('-', ' ') || 'ML Project',
            projectName: currentProject?.name,
            onBack: handleBackToDashboard,
            onSave: isSaving ? undefined : handleSaveProject,
            onDownload: handleDownloadProject,
        };
    };

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-[#0f1117]' : 'bg-gray-50'}`}>
            <ProjectHeader {...getHeaderProps()} />

            {saveMessage && (
                <div className={`fixed top-16 sm:top-20 right-4 sm:right-6 z-[9998] px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 sm:gap-2.5 animate-slide-in-up backdrop-blur-sm border max-w-[calc(100vw-2rem)] ${
                    saveMessage.type === 'success'
                        ? 'bg-emerald-500/90 text-white border-emerald-400/30 shadow-emerald-500/25'
                        : 'bg-red-500/90 text-white border-red-400/30 shadow-red-500/25'
                }`}>
                    {saveMessage.type === 'success' ? (
                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="shrink-0">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="shrink-0">
                            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    )}
                    {saveMessage.text}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept=".leap,.lbproject,application/json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
            />

            <div className="flex-1 overflow-y-auto relative flex flex-col px-4 sm:px-6 lg:px-10 xl:px-12">
                {view === 'dashboard' && (
                    <div className="pt-3 sm:pt-5 lg:pt-7 pb-5 sm:pb-8 lg:pb-10 animate-fade-in">
                        <WelcomeHero
                            onCreateNew={handleCreateNew}
                            onImportDataset={handleImportProject}
                            onTutorials={() => console.log('Open tutorials')}
                        />

                        <ActionBar
                            projectCount={projects.length}
                            onCreateNew={handleCreateNew}
                            onImport={handleImportProject}
                        />

                        <EmptyStateIllustration
                            onCreateNew={handleCreateNew}
                            onImport={handleImportProject}
                        />
                    </div>
                )}

                {view === 'create' && (
                    <div className="animate-fade-in">
                        <CreateProjectModal
                            onClose={handleBackToDashboard}
                            onCreateProject={handleCreateProjectFromModal}
                        />
                    </div>
                )}

                {view === 'project' && (
                    <div className="animate-fade-in flex flex-col flex-1" style={{ background: "var(--ml-bg)" }}>
                        {renderProjectComponent()}
                    </div>
                )}
            </div>

            <NeuraUnsavedWarningModal
                isOpen={showUnsavedModal}
                onSave={handleUnsavedSave}
                onDiscard={handleUnsavedDiscard}
                onCancel={handleUnsavedCancel}
            />
        </div>
    );
}
