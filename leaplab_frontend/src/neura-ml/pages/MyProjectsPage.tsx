/**
 * MyProjectsPage — Premium project dashboard with glass-morphism empty state.
 */
import { useState } from 'react';
import NeuraHeader from '../components/NeuraHeader';
import type { MyProjectsPageProps, Project } from '../types';
import { TYPE_ICONS, STATUS_STYLES } from '../types';

export default function MyProjectsPage({
  projects,
  onBack,
  onCreateNew,
  onOpenProject,
}: MyProjectsPageProps): React.JSX.Element {
  const [search, setSearch] = useState<string>('');
  const filtered = projects.filter((p: Project) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="neura-app">
      <NeuraHeader onBack={onBack} showProjectInput={false} />

      {/* Toolbar */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 px-6 py-3 flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-bold text-violet-900 mr-2">My Projects</h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="neura-input pl-9 pr-4 py-2 w-52 text-sm"
          />
        </div>
        <button
          onClick={onCreateNew}
          className="neura-btn-primary text-sm px-5 py-2"
        >
          + New Project
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          /* Empty State */
          <div className="neura-empty-state animate-neura-fade">
            {/* Floating brain icon */}
            <div className="relative w-40 h-40 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-violet-50 border-2 border-dashed border-violet-200 flex items-center justify-center animate-neura-float">
                  <span className="text-4xl">🧠</span>
                </div>
              </div>
              {/* Floating chips */}
              <div className="absolute top-0 right-4 animate-neura-float neura-delay-1">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg shadow-sm border border-purple-200">
                  📝
                </div>
              </div>
              <div className="absolute bottom-2 left-0 animate-neura-float neura-delay-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-lg shadow-sm border border-teal-200">
                  🖐️
                </div>
              </div>
              <div className="absolute top-4 left-0 animate-neura-float neura-delay-5">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg shadow-sm border border-blue-200">
                  🎙️
                </div>
              </div>
              <div className="absolute bottom-4 right-0 animate-neura-float neura-delay-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg shadow-sm border border-green-200">
                  🔍
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-700 mb-1">
              No projects yet
            </h2>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Create your first ML project to start training image classifiers,
              object detectors, and more.
            </p>
            <button
              onClick={onCreateNew}
              className="neura-btn-primary px-8 py-3 text-sm"
            >
              + Create Your First Project
            </button>
          </div>
        ) : (
          /* Project Table */
          <div className="neura-card overflow-hidden animate-neura-fade">
            <div className="grid grid-cols-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider px-6 py-3">
              <span>Project</span>
              <span className="text-center">Type</span>
              <span className="text-center">Classes</span>
              <span className="text-center">Updated</span>
              <span className="text-center">Status</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.map((project: Project, i: number) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="grid grid-cols-5 px-6 py-4 hover:bg-violet-50/50 cursor-pointer transition-all duration-200 items-center group"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {TYPE_ICONS[project.type] || '🤖'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 text-sm truncate">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-600 font-medium">
                    {project.type}
                  </div>
                  <div className="text-center text-xs text-gray-600 font-medium">
                    {project.classes}
                  </div>
                  <div className="text-center text-[11px] text-gray-400">
                    {new Date(project.lastUpdated).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex justify-center">
                    <span
                      className={`neura-tag border ${
                        STATUS_STYLES[project.status] || STATUS_STYLES['Untrained']
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
