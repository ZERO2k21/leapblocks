/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import ProjectHeader from './components/common/projectHeader';
import MyProjectsHeader from './components/dashboard/myProjectsHeader';
import EmptyStateIllustration from './components/dashboard/emptyStateIllustration';
import ProjectCard from './components/dashboard/projectCard';
import CreateProjectModal from './components/createProject/createProjectModal';
import ImageClassifier from './components/classifiers/imageClassifier/imageClassifier';
import ObjectDetection from './components/classifiers/objectDetection/objectDetection';
import PoseClassifier from './components/classifiers/poseClassifier/poseClassifier';
import HandPoseClassifier from './components/classifiers/handPoseClassifier/handPoseClassifier';
import AudioClassifier from './components/classifiers/audioClassifier/audioClassifier';
import NumbersCR from './components/classifiers/numbersClassifier/numbersClassifier';
import TextClassifier from './components/classifiers/textClassifier/textClassifier';
import { NeuraProject, ProjectType } from './types/neura.types';
import './styles/neuraTheme.css';

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

    // Render project component based on type
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
            {/* Unified Topbar shared across all views */}
            <ProjectHeader {...getHeaderProps()} />

            <div className="flex-1 overflow-y-auto relative">
                {/* Dashboard view */}
                {view === 'dashboard' && (
                    <div className="p-8">
                        <MyProjectsHeader onCreateNew={handleCreateNew} />

                        {projects.length === 0 ? (
                            <EmptyStateIllustration onCreateNew={handleCreateNew} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => handleOpenProject(project)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create project modal (now rendered full screen inside flex-1) */}
                {view === 'create' && (
                    <CreateProjectModal
                        onClose={handleBackToDashboard}
                        onSelectType={handleSelectType}
                    />
                )}

                {/* Project view */}
                {view === 'project' && renderProjectComponent()}
            </div>
        </div>
    );
}
