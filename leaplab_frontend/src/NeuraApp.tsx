/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProjectHeader from './components/neura/common/ProjectHeader';
import WelcomeHero from './components/neura/dashboard/WelcomeHero';
import TemplateGrid from './components/neura/dashboard/TemplateGrid';
import ProjectsTable from './components/neura/dashboard/ProjectsTable';
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

interface NeuraAppProps {
    onBack?: () => void;
}

type NeuraView = 'dashboard' | 'create' | 'project';

export default function NeuraApp({ onBack }: NeuraAppProps) {
    const [view, setView] = useState<NeuraView>('dashboard');
    const [projects, setProjects] = useState<NeuraProject[]>([]);
    const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null);
    const [currentProject, setCurrentProject] = useState<NeuraProject | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingProject, setRenamingProject] = useState<NeuraProject | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadProjects = async () => {
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
            } catch {
                // User may not be logged in
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

    const handleOpenProject = (project: NeuraProject) => {
        navigateWithUnsavedCheck(async () => {
            setCurrentProject(project);
            setCurrentProjectType(project.type);
            setHasUnsavedChanges(false);
            setView('project');
        });
    };

    const handleSaveProject = async () => {
        if (!currentProject) return;
        setIsSaving(true);
        try {
            await fileService.saveProject(currentProject.name, 'neura', currentProject);
            setHasUnsavedChanges(false);
            setSaveMessage({ type: 'success', text: 'Project saved to cloud!' });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save project.';
            setSaveMessage({ type: 'error', text: message });
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
            const validation = fileService.validateProject(data, 'neura');
            if (!validation.isValid) {
                setSaveMessage({ type: 'error', text: validation.error || 'Invalid project file.' });
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
        await handleSaveProject();
        setShowUnsavedModal(false);
        pendingNavigation?.();
        setPendingNavigation(null);
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

    const handleDeleteProject = (projectId: string) => {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setSaveMessage({ type: 'success', text: 'Project deleted.' });
    };

    const handleRenameProject = (project: NeuraProject) => {
        setRenamingProject(project);
        setRenameValue(project.name);
        setShowRenameModal(true);
    };

    const handleConfirmRename = () => {
        if (!renamingProject || !renameValue.trim()) return;
        setProjects((prev) =>
            prev.map((p) =>
                p.id === renamingProject.id ? { ...p, name: renameValue.trim(), updatedAt: Date.now() } : p
            )
        );
        setShowRenameModal(false);
        setRenamingProject(null);
        setRenameValue('');
        setSaveMessage({ type: 'success', text: 'Project renamed.' });
    };

    const handleDownloadFromTable = (project: NeuraProject) => {
        fileService.saveProjectLocally(project.name || 'neura-project', 'neura', project);
    };

    const renderProjectComponent = () => {
        switch (currentProjectType) {
            case 'image-classifier':
                return <ImageClassifier onBack={handleBackToDashboard} />;
            case 'object-detection':
                return <ObjectDetection onBack={handleBackToDashboard} />;
            case 'pose-classifier':
                return <PoseClassifier onBack={handleBackToDashboard} />;
            case 'hand-pose-classifier':
                return <HandPoseClassifier onBack={handleBackToDashboard} />;
            case 'audio-classifier':
                return <AudioClassifier onBack={handleBackToDashboard} />;
            case 'numbers-cr':
                return <NumbersCR onBack={handleBackToDashboard} />;
            case 'text-classifier':
                return <TextClassifier onBack={handleBackToDashboard} />;
            default:
                return null;
        }
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
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
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

            <div className="flex-1 overflow-y-auto relative">
                {view === 'dashboard' && (
                    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
                        <WelcomeHero
                            onCreateNew={handleCreateNew}
                            onImportDataset={handleImportProject}
                            onTutorials={() => console.log('Open tutorials')}
                        />

                        {projects.length > 0 && (
                            <ProjectsTable
                                projects={projects}
                                onOpenProject={handleOpenProject}
                                onDeleteProject={handleDeleteProject}
                                onRenameProject={handleRenameProject}
                                onDownloadProject={handleDownloadFromTable}
                            />
                        )}

                        {projects.length === 0 && (
                            <TemplateGrid
                                onSelectTemplate={(typeId) => {
                                    navigateWithUnsavedCheck(() => setView('create'));
                                }}
                                onViewAll={() => console.log('View all templates')}
                            />
                        )}

                        {projects.length === 0 && (
                            <EmptyStateIllustration
                                onCreateNew={handleCreateNew}
                                onImport={handleImportProject}
                            />
                        )}
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
                    <div className="animate-fade-in">
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

            {/* Rename Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden animate-fade-in-scale border border-gray-100">
                        <div className="relative bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between">
                            <h2 className="text-white text-lg font-bold">Rename Project</h2>
                            <button onClick={() => { setShowRenameModal(false); setRenamingProject(null); }} className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                <svg width="18" height="18" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                        </div>
                        <div className="px-6 py-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Name</label>
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(); if (e.key === 'Escape') { setShowRenameModal(false); setRenamingProject(null); } }}
                                autoFocus
                                className="neura-input w-full px-4 py-3 text-sm text-gray-800"
                            />
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-3">
                            <button onClick={() => { setShowRenameModal(false); setRenamingProject(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all duration-200 active:scale-[0.97]">Cancel</button>
                            <button onClick={handleConfirmRename} disabled={!renameValue.trim()} className="neura-button-primary px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">Rename</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
