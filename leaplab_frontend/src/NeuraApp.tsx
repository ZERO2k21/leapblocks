/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProjectHeader from './components/neura/common/ProjectHeader';
import WelcomeHero from './components/neura/dashboard/WelcomeHero';
import TemplateGrid from './components/neura/dashboard/TemplateGrid';
import ProjectCard from './components/neura/dashboard/ProjectCard';
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
import { listMyProjects, fetchCloudProjectContent } from './services/cloudProjectApi';
import NeuraUnsavedWarningModal from './components/neura/common/NeuraUnsavedWarningModal';
import ProjectNameModal from './components/neura/common/ProjectNameModal';

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
    const [showNameModal, setShowNameModal] = useState(false);
    const [pendingProjectType, setPendingProjectType] = useState<ProjectType | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

    const handleSelectType = (typeId: string) => {
        setPendingProjectType(typeId as ProjectType);
        setShowNameModal(true);
    };

    const handleCreateProject = (name: string) => {
        if (!pendingProjectType) return;

        const newProject: NeuraProject = {
            id: crypto.randomUUID(),
            type: pendingProjectType,
            name,
            classes: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelTrained: false,
        };

        setCurrentProject(newProject);
        setCurrentProjectType(pendingProjectType);
        setProjects((prev) => [newProject, ...prev]);
        setShowNameModal(false);
        setPendingProjectType(null);
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
                <div className={`fixed top-20 right-6 z-[9998] px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
                    saveMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
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
                    <div className="p-6 lg:p-8">
                        <WelcomeHero
                            onCreateNew={handleCreateNew}
                            onImportDataset={handleImportProject}
                            onTutorials={() => console.log('Open tutorials')}
                        />

                        {projects.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0a015a] tracking-tight flex items-center gap-2">
                                            <span className="text-base">&#x1F4C2;</span>
                                            Recent Projects
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">All your machine learning projects in one place.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    {projects.map((project) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            onClick={() => handleOpenProject(project)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <TemplateGrid
                            onSelectTemplate={(typeId) => handleSelectType(typeId)}
                            onViewAll={() => console.log('View all templates')}
                        />

                        {projects.length === 0 && (
                            <EmptyStateIllustration
                                onCreateNew={handleCreateNew}
                                onImport={handleImportProject}
                            />
                        )}
                    </div>
                )}

                {view === 'create' && (
                    <CreateProjectModal
                        onClose={handleBackToDashboard}
                        onSelectType={handleSelectType}
                    />
                )}

                {view === 'project' && renderProjectComponent()}
            </div>

            <NeuraUnsavedWarningModal
                isOpen={showUnsavedModal}
                onSave={handleUnsavedSave}
                onDiscard={handleUnsavedDiscard}
                onCancel={handleUnsavedCancel}
            />

            <ProjectNameModal
                isOpen={showNameModal}
                projectType={pendingProjectType || ''}
                onCreate={handleCreateProject}
                onCancel={() => {
                    setShowNameModal(false);
                    setPendingProjectType(null);
                }}
            />
        </div>
    );
}
