import { useEffect } from 'react';

export function useKeyboardShortcuts({ onSave, onSaveAs, onNew, onOpen, onUndo, onRedo }, deps) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave();
      } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        onSaveAs();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        onNew();
      } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        onOpen();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        onUndo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}
