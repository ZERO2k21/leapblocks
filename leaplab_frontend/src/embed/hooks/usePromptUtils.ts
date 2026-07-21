import { useCallback } from 'react';
import type React from 'react';
import Blockly from '@blockly-runtime';

interface AskState {
    isAsking: boolean;
    question: string;
    resolve: ((answer: string) => void) | null;
}

interface PromptState {
    isOpen: boolean;
    message: string;
    defaultValue: string;
    callback: ((value: string | null) => void) | null;
    type: 'standard' | 'variable' | 'list' | 'table';
}

export function usePromptUtils(
    askState: AskState,
    setAskState: React.Dispatch<React.SetStateAction<AskState>>,
    promptState: PromptState,
    setPromptState: React.Dispatch<React.SetStateAction<PromptState>>,
    workspaceRef: React.MutableRefObject<Blockly.WorkspaceSvg | null>,
    variableType: string,
    variableScope: string,
    promptInput: string,
) {
    const handleAskSubmit = useCallback((answer: string) => {
        if (askState.resolve) askState.resolve(answer);
        setAskState({ isAsking: false, question: '', resolve: null });
    }, [askState.resolve, setAskState]);

    const handlePromptSubmit = () => {
        if (promptState.callback) {
            if (promptState.type === 'variable' && workspaceRef.current) {
                const ws = workspaceRef.current;
                ws.getVariableMap().createVariable(promptInput, variableType);
                if (variableScope === 'local') {
                    console.warn('Local variables not fully supported, created as global');
                }
            } else if (promptState.type === 'list' && workspaceRef.current) {
                const ws = workspaceRef.current;
                ws.getVariableMap().createVariable(promptInput, 'list');
            } else if (promptState.type === 'table' && workspaceRef.current) {
                const ws = workspaceRef.current;
                ws.getVariableMap().createVariable(promptInput, 'table');
            }

            promptState.callback(promptInput);
        }
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };

    const handlePromptCancel = () => {
        if (promptState.callback) {
            promptState.callback(null);
        }
        setPromptState(prev => ({ ...prev, isOpen: false }));
    };

    return { handleAskSubmit, handlePromptSubmit, handlePromptCancel };
}
