import { useEffect } from 'react';

export function useKeyboardShortcuts({ onSave, onSaveAs, onNew, onOpen, onUndo, onRedo }, deps) {
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        await onSave();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        await onSaveAs();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        await onNew();
      } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        await onOpen();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        await onUndo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        await onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}
