import { useEffect } from 'react';

export interface KeyboardShortcutHandlers {
  onSave?: () => void | Promise<void>;
  onSaveAs?: () => void | Promise<void>;
  onNew?: () => void | Promise<void>;
  onOpen?: () => void | Promise<void>;
  onUndo?: () => void | Promise<void>;
  onRedo?: () => void | Promise<void>;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  deps: React.DependencyList = []
): void {
  const { onSave, onSaveAs, onNew, onOpen, onUndo, onRedo } = handlers;

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        if (onSaveAs) await onSaveAs();
      } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (onSave) await onSave();
      } else if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (onNew) await onNew();
      } else if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        if (onOpen) await onOpen();
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (onUndo) await onUndo();
      } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        if (onRedo) await onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}
