import React from 'react'
import type { TabularState, TabularActions, TabularStep } from '../../hooks/useTabularState'
import type { TabularConfig } from '../../types/neura.types'
import DataPanel from '../panels/DataPanel'
import SetupPanel from '../panels/SetupPanel'
import TabularTrainPanel from '../panels/TabularTrainPanel'
import TabularTestPanel from '../panels/TabularTestPanel'
import TrainingReportCard from '../components/TrainingReportCard'

const STEPS: { id: TabularStep; label: string; emoji: string }[] = [
    { id: 'collect', label: 'Data', emoji: '📊' },
    { id: 'configure', label: 'Setup', emoji: '⚙️' },
    { id: 'train', label: 'Train', emoji: '🧠' },
    { id: 'test', label: 'Test', emoji: '🧪' },
]

interface StepperShellProps extends TabularState, TabularActions {}

export default function StepperShell(props: StepperShellProps) {
    const {
        step, collectMode, csvData, columnInfos, featureIndices, targetIndex,
        taskType, config, isTraining, currentEpoch, epochResults, valEpochResults,
        trainMetrics, finalAccuracy, trainSummary, isDragging,
        newRowCount, newColCount, editHeaders, editRows, disabledRows, disabledCols,
        dataReady, hasDataForStep,
        setStep, setCollectMode, setConfig,
        setFeatureIndices, setTargetIndex, setIsDragging,
        setNewRowCount, setNewColCount, setEditHeaders, setEditRows,
        setDisabledRows, setDisabledCols,
        handleFileUpload, handleDrop, handleCreateDataset, handleUseEditedData,
        handleFeatureToggle, handleTrain, handlePredict, handleExportModel,
        handleStepClick, fileInputRef,
    } = props

    const stepIndex = STEPS.findIndex(s => s.id === step)

    const canGoNext = () => {
        if (step === 'collect') return dataReady
        if (step === 'configure') return featureIndices.length > 0
        if (step === 'train') return finalAccuracy !== null
        return false
    }

    const goNext = () => {
        if (step === 'collect') setStep('configure')
        else if (step === 'configure') setStep('train')
        else if (step === 'train') setStep('test')
    }

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Step Bar */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between max-w-[600px] mx-auto">
                    {STEPS.map((s, i) => {
                        const isActive = step === s.id
                        const isDone = stepIndex > i || (stepIndex === i && s.id !== 'collect' && hasDataForStep(s.id))
                        const isClickable = hasDataForStep(s.id) || isActive
                        return (
                            <React.Fragment key={s.id}>
                                {i > 0 && (
                                    <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-300 ${isDone ? 'bg-[#630ed4]' : 'bg-gray-200'}`} />
                                )}
                                <button
                                    onClick={() => handleStepClick(s.id)}
                                    disabled={!isClickable}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold border-none transition-all duration-200 shrink-0 ${
                                        isActive
                                            ? 'bg-[#630ed4] text-white shadow-md shadow-purple-600/20 scale-105'
                                            : isDone
                                                ? 'bg-[#f5f3ff] text-[#630ed4] cursor-pointer hover:bg-[#ede9fe]'
                                                : isClickable
                                                    ? 'bg-violet-50 text-violet-500 cursor-pointer hover:bg-violet-100'
                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="text-sm">{isDone ? '✓' : s.emoji}</span>
                                    <span>{s.label}</span>
                                    {isDone && s.id === 'collect' && dataReady && (
                                        <span className="text-[8px] bg-[#630ed4]/10 text-[#630ed4] px-1.5 py-0.5 rounded-full">{csvData?.rows.length} rows</span>
                                    )}
                                    {isDone && s.id === 'train' && finalAccuracy !== null && (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{finalAccuracy}%</span>
                                    )}
                                </button>
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 min-h-0 flex flex-col">
                {step === 'collect' && (
                    <DataPanel
                        density="full"
                        collectMode={collectMode}
                        csvData={csvData}
                        columnInfos={columnInfos}
                        editHeaders={editHeaders}
                        editRows={editRows}
                        disabledRows={disabledRows}
                        disabledCols={disabledCols}
                        isDragging={isDragging}
                        newRowCount={newRowCount}
                        newColCount={newColCount}
                        fileInputRef={fileInputRef}
                        onSetCollectMode={setCollectMode}
                        onFileUpload={handleFileUpload}
                        onDrop={handleDrop}
                        onCreateDataset={handleCreateDataset}
                        onUseEditedData={handleUseEditedData}
                        onEditHeadersChange={setEditHeaders}
                        onEditRowsChange={setEditRows}
                        onDisabledRowsChange={setDisabledRows}
                        onDisabledColsChange={setDisabledCols}
                        onIsDraggingChange={setIsDragging}
                        onNewRowCountChange={setNewRowCount}
                        onNewColCountChange={setNewColCount}
                    />
                )}

                {step === 'configure' && (
                    <SetupPanel
                        density="full"
                        csvData={csvData}
                        columnInfos={columnInfos}
                        featureIndices={featureIndices}
                        targetIndex={targetIndex}
                        taskType={taskType}
                        onFeatureToggle={handleFeatureToggle}
                        onTargetChange={setTargetIndex}
                        onTaskTypeChange={(t) => { props.setTaskType(t); setConfig((prev: TabularConfig) => ({ ...prev, taskType: t })) }}
                    />
                )}

                {step === 'train' && (
                    <TabularTrainPanel
                        density="full"
                        config={config}
                        taskType={taskType}
                        isTraining={isTraining}
                        currentEpoch={currentEpoch}
                        epochResults={epochResults}
                        valEpochResults={valEpochResults}
                        trainMetrics={trainMetrics}
                        finalAccuracy={finalAccuracy}
                        trainSummary={trainSummary}
                        featureIndices={featureIndices}
                        onConfigChange={setConfig}
                        onTrain={handleTrain}
                        onExportModel={handleExportModel}
                    />
                )}

                {step === 'test' && (
                    <TabularTestPanel
                        density="full"
                        columnInfos={columnInfos}
                        featureIndices={featureIndices}
                        targetIndex={targetIndex}
                        taskType={taskType}
                        onPredict={handlePredict}
                        onExportModel={handleExportModel}
                    />
                )}
            </div>

            {/* Bottom Nav */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-2.5">
                <div className="flex gap-2 max-w-[600px] mx-auto">
                    {step !== 'collect' && (
                        <button
                            onClick={() => {
                                if (step === 'configure') setStep('collect')
                                else if (step === 'train') setStep('configure')
                                else if (step === 'test') setStep('train')
                            }}
                            className="py-2 px-4 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-500 cursor-pointer bg-white hover:bg-gray-50 transition-all"
                        >
                            ← Back
                        </button>
                    )}
                    {step !== 'test' && (
                        <button
                            onClick={goNext}
                            disabled={!canGoNext()}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-none transition-all ${
                                canGoNext()
                                    ? 'bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white cursor-pointer shadow-[0_4px_14px_rgba(99,14,212,0.35)]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {step === 'collect' ? 'Next: Setup →' : step === 'configure' ? 'Next: Train →' : 'Next: Test →'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
