/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
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

interface NeuraAppProps {
    onBack?: () => void;
}

type NeuraView = 'dashboard' | 'create' | 'project';

export default function NeuraApp({ onBack }: NeuraAppProps) {
    const [view, setView] = useState<NeuraView>('dashboard');
    const [projects, setProjects] = useState<NeuraProject[]>([]);
    const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null);
    const [currentProject, setCurrentProject] = useState<NeuraProject | null>(null);

    const handleCreateNew = () => {
        setView('create');
    };

    const handleSelectType = (typeId: string) => {
        setCurrentProjectType(typeId as ProjectType);
        setView('project');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
        setCurrentProjectType(null);
        setCurrentProject(null);
    };

    const handleOpenProject = (project: NeuraProject) => {
        setCurrentProject(project);
        setCurrentProjectType(project.type);
        setView('project');
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
            onSave: () => console.log('Save project'),
        };
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <ProjectHeader {...getHeaderProps()} />

            <div className="flex-1 overflow-y-auto relative">
                {view === 'dashboard' && (
                    <div className="p-6">
                        <WelcomeHero
                            onCreateNew={handleCreateNew}
                            onImportDataset={() => console.log('Import dataset')}
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
                                    <button className="flex items-center gap-1 text-xs font-semibold text-[#0a015a] hover:text-[#15027a] transition-colors">
                                        View All Projects
                                        <span className="text-sm leading-none">&rsaquo;</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <EmptyStateIllustration onCreateNew={handleCreateNew} />
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
        </div>
    );
}
