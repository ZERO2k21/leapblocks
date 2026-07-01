/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProjectHeader from './components/neura/common/ProjectHeader';
import WelcomeHero from './components/neura/dashboard/WelcomeHero';
import EmptyStateIllustration from './components/neura/dashboard/EmptyStateIllustration';

import CreateProjectModal from './components/neura/create-project/CreateProjectModal';
import ImageClassifier from './components/neura/project-types/image-classifier/ImageClassifier';
import ObjectDetection from './components/neura/project-types/object-detection/ObjectDetection';
import PoseClassifier from './components/neura/project-types/pose-classifier/PoseClassifier';
import HandPoseClassifier from './components/neura/project-types/hand-pose-classifier/HandPoseClassifier';
import AudioClassifier from './components/neura/project-types/audio-classifier/AudioClassifier';
import NumbersCR from './components/neura/project-types/numbers-cr/NumbersCR';
import TextClassifier from './components/neura/project-types/text-classifier/TextClassifier';
import FaceDetection from './components/neura/project-types/face-detection/FaceDetection';
import { NeuraProject, ProjectType } from './types/neura.types';
import './styles/neura-theme.css';
import { fileService } from './Electra/Client/Src/services/FileService';
import { useCloudProjectStore } from './store/cloudProjectStore';
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
    const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null);
    const [currentProject, setCurrentProject] = useState<NeuraProject | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pendingProject = useCloudProjectStore((state) => state.pendingProject);
    const clearPendingProject = useCloudProjectStore((state) => state.clearPendingProject);

    useEffect(() => {
        if (!saveMessage) return;
        const timer = setTimeout(() => setSaveMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [saveMessage]);

    useEffect(() => {
        if (!pendingProject || pendingProject.mode !== 'neura') return;

        const data = pendingProject.data || {};
        const importedProject: NeuraProject = {
            id: data.id || crypto.randomUUID(),
            type: (data.type || 'image-classifier') as ProjectType,
            name: data.projectName || data.name || 'Untitled Neura Project',
            classes: data.classes || [],
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            modelTrained: data.modelTrained || false,
            accuracy: data.accuracy,
            projectData: data.projectData || {},
        };

        setCurrentProject(importedProject);
        setCurrentProjectType(importedProject.type);
        setHasUnsavedChanges(false);
        setView('project');
        clearPendingProject();
    }, [pendingProject, clearPendingProject]);

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
            case 'face-detection':
                component = <FaceDetection {...commonProps} />
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

            <div className="flex-1 overflow-y-auto relative flex flex-col">
                {view === 'dashboard' && (
                    <div className="pt-3 sm:pt-5 lg:pt-7 pb-5 sm:pb-8 lg:pb-10 px-4 sm:px-6 lg:px-8 xl:px-10 animate-fade-in">
                        <div className="mx-auto max-w-screen-2xl">
                            <WelcomeHero
                                onCreateNew={handleCreateNew}
                                onImportDataset={handleImportProject}
                                onTutorials={() => console.log('Open tutorials')}
                            />

                            <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-ml-border bg-ml-surface shadow-[0_24px_80px_rgba(15,23,42,0.08)] p-8 sm:p-10">
                                <div className="max-w-3xl mx-auto text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7c3aed] mb-3">Saved projects via MyProjects only</p>
                                    <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
                                        Neura no longer exposes an internal project list
                                    </h2>
                                    <p className={`mt-4 text-sm leading-7 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                        Your saved Neura projects are available through the My Projects workspace. Use this space to create or import new AI workspaces, while saved projects stay managed centrally in MyProjects.
                                    </p>
                                </div>
                            </div>

                            <div className="mx-auto max-w-3xl mt-6">
                                <EmptyStateIllustration
                                    onCreateNew={handleCreateNew}
                                    onImport={handleImportProject}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {view === 'create' && (
                    <div className="animate-fade-in h-full w-full">
                        <CreateProjectModal
                            onClose={handleBackToDashboard}
                            onCreateProject={handleCreateProjectFromModal}
                        />
                    </div>
                )}

                {view === 'project' && (
                    <div className="animate-fade-in flex flex-col flex-1 min-h-0" style={{ background: "var(--ml-bg)" }}>
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
