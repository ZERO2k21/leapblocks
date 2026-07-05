/**
 * NeuraML — Root entry point with smooth screen transitions.
 */
import { useState } from 'react';
import MyProjectsPage from './pages/MyProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ClassifierRouter from './pages/ClassifierRouter';
import './neura-styles.css';
import type { Project } from './types';

type Screen = 'projects' | 'create' | 'classifier';

interface NeuraMLProps {
  onBack?: () => void;
}

export default function NeuraML({ onBack }: NeuraMLProps): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const handleCreateProject = (
    project: Omit<Project, 'id' | 'classes' | 'lastUpdated' | 'status'>
  ): void => {
    const p: Project = {
      ...project,
      id: Date.now(),
      classes: 0,
      lastUpdated: new Date(),
      status: 'Untrained',
    };
    setProjects((prev: Project[]) => [p, ...prev]);
    setActiveProject(p);
    setScreen('classifier');
  };

  const handleOpenProject = (project: Project): void => {
    setActiveProject(project);
    setScreen('classifier');
  };

  if (screen === 'classifier' && activeProject) {
    return (
      <div className="animate-neura-fade">
        <ClassifierRouter
          project={activeProject}
          onBack={() => setScreen('projects')}
          onProjectUpdate={(updated: Project) => {
            setProjects((prev: Project[]) =>
              prev.map((p: Project) =>
                p.id === updated.id ? updated : p
              )
            );
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
        onBack={onBack ?? (() => {})}
        onCreateNew={() => setScreen('create')}
        onOpenProject={handleOpenProject}
      />
    </div>
  );
}
