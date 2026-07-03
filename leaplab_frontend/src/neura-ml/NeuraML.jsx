/**
 * NeuraML — Root entry point with smooth screen transitions.
 */
import { useState } from 'react';
import MyProjectsPage from './pages/MyProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ClassifierRouter from './pages/ClassifierRouter';
import './neura-styles.css';

export default function NeuraML({ onBack }) {
    const [screen, setScreen] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);

    const handleCreateProject = (project) => {
        const p = { ...project, id: Date.now(), classes: 0, lastUpdated: new Date(), status: 'Untrained' };
        setProjects((prev) => [p, ...prev]);
        setActiveProject(p);
        setScreen('classifier');
    };

    const handleOpenProject = (project) => {
        setActiveProject(project);
        setScreen('classifier');
    };

    if (screen === 'classifier' && activeProject) {
        return (
            <div className="animate-neura-fade">
                <ClassifierRouter
                    project={activeProject}
                    onBack={() => setScreen('projects')}
                    onProjectUpdate={(updated) => {
                        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                        setActiveProject(updated);
                    }}
                />
            </div>
        );
    }

    if (screen === 'create') {
        return (
            <div className="animate-neura-fade">
                <CreateProjectPage
                    onBack={() => setScreen('projects')}
                    onCreate={handleCreateProject}
                />
            </div>
        );
    }

    return (
        <div className="animate-neura-fade">
            <MyProjectsPage
                projects={projects}
                onBack={onBack}
                onCreateNew={() => setScreen('create')}
                onOpenProject={handleOpenProject}
            />
        </div>
    );
}
