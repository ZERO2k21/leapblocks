import React from 'react'
import type { TabularState, TabularActions } from '../../hooks/useTabularState'
import type { TabularConfig } from '../../types/neura.types'
import DataPanel from '../panels/DataPanel'
import SetupPanel from '../panels/SetupPanel'
import TabularTrainPanel from '../panels/TabularTrainPanel'
import TabularTestPanel from '../panels/TabularTestPanel'

interface DashboardShellProps extends TabularState, TabularActions {}

function PanelCard({ title, emoji, children, isActive = true }: { title: string; emoji: string; children: React.ReactNode; isActive?: boolean }) {
    return (
        <div className={`flex flex-col rounded-xl border overflow-hidden ${isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#f5f3ff] to-[#ede9fe] border-b border-gray-200">
                <span className="text-xs">{emoji}</span>
                <span className="text-[10px] font-bold text-[#630ed4] uppercase tracking-wider">{title}</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto neura-scrollbar">
                {children}
            </div>
        </div>
    )
}

export default function DashboardShell(props: DashboardShellProps) {
    const {
        step, collectMode, csvData, columnInfos, featureIndices, targetIndex,
        taskType, config, isTraining, currentEpoch, epochResults, valEpochResults,
        trainMetrics, finalAccuracy, trainSummary, isDragging,
        newRowCount, newColCount, editHeaders, editRows, disabledRows, disabledCols,
        dataReady,
        setStep, setCollectMode, setConfig,
        setFeatureIndices, setTargetIndex, setIsDragging,
        setNewRowCount, setNewColCount, setEditHeaders, setEditRows,
        setDisabledRows, setDisabledCols,
        handleFileUpload, handleDrop, handleCreateDataset, handleUseEditedData,
        handleFeatureToggle, handleTrain, handlePredict, handleExportModel,
        fileInputRef,
    } = props

    const hasData = dataReady
    const hasSetup = featureIndices.length > 0
    const hasTrained = finalAccuracy !== null

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Dashboard Header */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between max-w-[900px] mx-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">📊</span>
                        <span className="text-xs font-extrabold text-[#630ed4]">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasTrained && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                ✓ Model ready — {finalAccuracy}%
                            </span>
                        )}
                        <button
                            onClick={() => setStep('collect')}
                            className="text-[9px] font-bold text-[#630ed4] bg-[#f5f3ff] py-1 px-2 rounded border-none cursor-pointer hover:bg-[#ede9fe]"
                        >
                            ↻ Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* 2x2 Grid */}
            <div className="flex-1 min-h-0 p-3">
                <div className="grid grid-cols-2 gap-3 h-full max-w-[900px] mx-auto">
                    {/* Data Panel */}
                    <PanelCard title="Data" emoji="📊" isActive={hasData}>
                        <DataPanel
                            density="compact"
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
                    </PanelCard>

                    {/* Setup Panel */}
                    <PanelCard title="Setup" emoji="⚙️" isActive={hasSetup}>
                        {hasData ? (
                            <SetupPanel
                                density="compact"
                                csvData={csvData}
                                columnInfos={columnInfos}
                                featureIndices={featureIndices}
                                targetIndex={targetIndex}
                                taskType={taskType}
                                onFeatureToggle={handleFeatureToggle}
                                onTargetChange={setTargetIndex}
                                onTaskTypeChange={(t) => { props.setTaskType(t); setConfig((prev: TabularConfig) => ({ ...prev, taskType: t })) }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                                Upload data first
                            </div>
                        )}
                    </PanelCard>

                    {/* Train Panel */}
                    <PanelCard title="Train" emoji="🧠" isActive={hasTrained}>
                        {hasSetup ? (
                            <TabularTrainPanel
                                density="compact"
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
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                                Select features first
                            </div>
                        )}
                    </PanelCard>

                    {/* Test Panel */}
                    <PanelCard title="Test" emoji="🧪" isActive={hasTrained}>
                        {hasTrained ? (
                            <TabularTestPanel
                                density="compact"
                                columnInfos={columnInfos}
                                featureIndices={featureIndices}
                                targetIndex={targetIndex}
                                taskType={taskType}
                                onPredict={handlePredict}
                                onExportModel={handleExportModel}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">
                                Train a model first
                            </div>
                        )}
                    </PanelCard>
                </div>
            </div>
        </div>
    )
}
