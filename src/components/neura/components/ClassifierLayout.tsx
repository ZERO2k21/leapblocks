import React from 'react'

type ClassifierLayoutProps = {
  project?: any
  onBack: () => void
  children: React.ReactNode
}

export default function ClassifierLayout({ project, onBack, children }: ClassifierLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-3xl border border-purple-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-500">Neura</p>
          <h1 className="text-xl font-semibold text-slate-900">{project?.name || 'ML Project'}</h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Back
        </button>
      </div>
      {children}
    </div>
  )
}
