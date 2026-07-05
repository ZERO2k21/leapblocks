/**
 * ClassCard — Sample management card for each class.
 * Features: inline rename, file upload, webcam capture, thumbnail grid.
 */
import { useState, useRef } from 'react';
import type { ClassCardProps } from '../types';
import { CLASS_COLORS } from '../types';

export default function ClassCard({
  classData,
  index = 0,
  onRename,
  onDelete,
  onAddSamples,
  onWebcam,
  onUpload,
  showImagePreviews = true,
}: ClassCardProps): React.JSX.Element {
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(classData.name);
  const fileRef = useRef<HTMLInputElement>(null);
  const color = CLASS_COLORS[index % CLASS_COLORS.length];

  const commitRename = (): void => {
    if (draft.trim() && onRename) {
      onRename(classData.id, draft.trim());
    } else {
      setDraft(classData.name);
    }
    setEditing(false);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!onAddSamples || !e.target.files) return;
    Array.from(e.target.files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        if (ev.target?.result) {
          onAddSamples(classData.id, ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleUploadClick = (): void => {
    if (onUpload) onUpload(classData.id);
    else fileRef.current?.click();
  };

  const samples = classData.samples || [];

  return (
    <div className="neura-class-card animate-neura-slide-up">
      {/* Header */}
      <div className={`neura-class-header ${color.header}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDraft(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') {
                  setDraft(classData.name);
                  setEditing(false);
                }
              }}
              onBlur={commitRename}
              className="bg-white/20 text-white placeholder-white/60 rounded-md px-2 py-0.5 text-sm font-bold outline-none border border-white/30 flex-1 min-w-0"
            />
          ) : (
            <span className="text-white font-bold text-sm truncate">
              {classData.name}
            </span>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-white/60 hover:text-white transition-colors shrink-0 p-0.5"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(classData.id)}
            className="text-white/50 hover:text-white transition-colors ml-1 p-0.5"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex divide-x divide-gray-100">
        {/* Left: Add samples */}
        <div className="neura-class-section">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
            Add Samples
          </p>
          <div className="flex gap-2">
            <button onClick={handleUploadClick} className="neura-drop-zone flex-1">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9l4-4 4 4 4-4 4 4"
                />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
              <span className="text-[11px] font-semibold">Upload</span>
            </button>
            {onWebcam && (
              <button
                onClick={() => onWebcam(classData.id)}
                className="neura-drop-zone flex-1"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                  />
                </svg>
                <span className="text-[11px] font-semibold">Webcam</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        {/* Right: Samples */}
        <div className={`neura-class-section-samples ${color.light}`}>
          <p className={`text-[11px] font-bold ${color.text} mb-2`}>
            {samples.length} Sample{samples.length !== 1 ? 's' : ''}
          </p>
          {showImagePreviews && samples.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {samples.slice(-12).map((s, i) => (
                <img
                  key={i}
                  src={s.preview || ''}
                  alt=""
                  className="neura-sample-thumb"
                />
              ))}
              {samples.length > 12 && (
                <div className="neura-sample-thumb bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                  +{samples.length - 12}
                </div>
              )}
            </div>
          ) : samples.length === 0 ? (
            <p className="text-[11px] text-gray-300 italic">No samples yet</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
