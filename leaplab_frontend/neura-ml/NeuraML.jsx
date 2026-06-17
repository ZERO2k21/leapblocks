// NeuraML.jsx — Root entry point for LeapLab Neura ML Environment
// Usage: import NeuraML from './neura-ml/NeuraML'
//        <NeuraML onBack={() => navigate('/')} />

import { useState } from 'react'
import MyProjectsPage from './pages/MyProjectsPage'
import CreateProjectPage from './pages/CreateProjectPage'
import ClassifierRouter from './pages/ClassifierRouter'

// screen = 'projects' | 'create' | 'classifier'
export default function NeuraML({ onBack }) {
    const [screen, setScreen] = useState('projects')
    const [projects, setProjects] = useState([])
    const [activeProject, setActiveProject] = useState(null)

    const handleCreateProject = (project) => {
        const p = { ...project, id: Date.now(), classes: 0, lastUpdated: new Date(), status: 'Untrained' }
        setProjects(prev => [p, ...prev])
        setActiveProject(p)
        setScreen('classifier')
    }

    const handleOpenProject = (project) => {
        setActiveProject(project)
        setScreen('classifier')
    }

    if (screen === 'classifier' && activeProject) {
        return (
            <ClassifierRouter
                project={activeProject}
                onBack={() => setScreen('projects')}
                onProjectUpdate={(updated) => {
                    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
                    setActiveProject(updated)
                }}
            />
        )
    }

    if (screen === 'create') {
        return (
            <CreateProjectPage
                onBack={() => setScreen('projects')}
                onCreate={handleCreateProject}
            />
        )
    }

    return (
        <MyProjectsPage
            projects={projects}
            onBack={onBack}
            onCreateNew={() => setScreen('create')}
            onOpenProject={handleOpenProject}
        />
    )
}
