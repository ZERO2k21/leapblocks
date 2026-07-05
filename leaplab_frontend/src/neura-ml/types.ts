/**
 * types.ts — Shared TypeScript interfaces for the Neura ML module.
 */

// ── Project Domain ──────────────────────────────────────────────────────────

export type ProjectType =
  | 'Image Classifier'
  | 'Object Detection'
  | 'Pose Classifier'
  | 'Hand Pose Classifier'
  | 'Audio Classifier'
  | 'Text Classifier'
  | 'Numbers (C/R)';

export type ProjectStatus = 'Untrained' | 'Training' | 'Trained';

export interface Project {
  id: number;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  classes: number;
  lastUpdated: Date;
}

// ── Sample / Class Data ─────────────────────────────────────────────────────

export interface Sample {
  preview?: string;
  image?: HTMLImageElement | HTMLCanvasElement;
  audio?: Blob;
  audioUrl?: string;
  landmarks?: number[][];
}

export interface ClassData {
  id: number;
  name: string;
  samples: Sample[];
}

// ── Training ────────────────────────────────────────────────────────────────

export type TrainingStatus = 'idle' | 'training' | 'trained' | 'done';

// ── Prediction ──────────────────────────────────────────────────────────────

export interface Prediction {
  classId: number;
  confidence: number;
}

export interface PredictionResult {
  label: string;
  confidences: Record<string, number>;
}

// ── Object Detection (COCO-SSD) ─────────────────────────────────────────────

export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// ── TF Classifier Hook Return ───────────────────────────────────────────────

export interface TFClassifierReturn {
  model: object | null;
  classifier: object | null;
  isLoading: boolean;
  isTraining: boolean;
  trainingProgress: number;
  addExample: (
    imageElement: HTMLCanvasElement | HTMLImageElement,
    classId: number
  ) => Promise<void>;
  train: (classes: ClassData[]) => Promise<boolean>;
  predict: (
    imageElement: HTMLCanvasElement | HTMLImageElement
  ) => Promise<PredictionResult>;
  saveModel: () => object | null;
  loadModel: (dataset: object) => void;
}

// ── Project Type Definitions (for CreateProjectPage) ────────────────────────

export interface ProjectTypeOption {
  id: string;
  label: ProjectType;
  emoji: string;
  gradient: string;
  bg: string;
  border: string;
  desc: string;
}

// ── Component Props ─────────────────────────────────────────────────────────

export interface NeuraHeaderProps {
  onBack?: () => void;
  onSave?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  showProjectInput?: boolean;
}

export interface ClassifierLayoutProps {
  project: Project;
  onBack: () => void;
  children: React.ReactNode;
}

export interface ClassCardProps {
  classData: ClassData;
  index: number;
  onRename?: (id: number, name: string) => void;
  onDelete?: (id: number) => void;
  onAddSamples?: (id: number, dataURL: string) => void;
  onWebcam?: (id: number) => void;
  onUpload?: (id: number) => void;
  showImagePreviews?: boolean;
}

export interface TrainingPanelProps {
  status?: TrainingStatus;
  progress?: number;
  accuracy?: number;
  canTrain?: boolean;
  onTrain?: () => void;
  showAdvanced?: boolean;
  setShowAdvanced?: (show: boolean) => void;
  epochs?: number;
  setEpochs?: (epochs: number) => void;
  trained?: boolean;
  sampleCounts?: Record<string, number>;
  isTraining?: boolean;
  modelTrained?: boolean;
}

export interface TestingPanelProps {
  trained?: boolean;
  predict?: (canvas: HTMLCanvasElement) => Promise<PredictionResult>;
  classes?: ClassData[];
  model?: boolean;
  onPredict?: (canvas: HTMLCanvasElement) => Promise<PredictionResult>;
}

export interface WebcamModalProps {
  classLabel: string;
  colorIndex?: number;
  onCapture: (dataURL: string) => void;
  onClose: () => void;
}

export interface CreateProjectPageProps {
  onBack: () => void;
  onCreate: (
    project: Omit<Project, 'id' | 'classes' | 'lastUpdated' | 'status'>
  ) => void;
}

export interface MyProjectsPageProps {
  projects: Project[];
  onBack: () => void;
  onCreateNew: () => void;
  onOpenProject: (project: Project) => void;
}

export interface ClassifierRouterProps {
  project: Project;
  onBack: () => void;
  onProjectUpdate: (project: Project) => void;
}

export interface ClassifierBaseProps {
  project: Project;
  onBack: () => void;
}

// ── Color Constants (Inline Tailwind) ──────────────────────────────────────

export interface ColorDef {
  header: string;
  light: string;
  border: string;
  text: string;
}

export const CLASS_COLORS: ColorDef[] = [
  { header: 'bg-gradient-to-r from-red-500 to-rose-500', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  { header: 'bg-gradient-to-r from-teal-500 to-emerald-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  { header: 'bg-gradient-to-r from-violet-500 to-purple-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  { header: 'bg-gradient-to-r from-orange-400 to-amber-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { header: 'bg-gradient-to-r from-pink-400 to-rose-400', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { header: 'bg-gradient-to-r from-blue-400 to-indigo-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
];

export const BAR_COLORS: string[] = [
  'bg-violet-500',
  'bg-teal-500',
  'bg-orange-400',
  'bg-pink-500',
  'bg-blue-500',
  'bg-green-500',
];

export const WEBCAM_COLORS: string[] = [
  'bg-gradient-to-r from-red-500 to-rose-500',
  'bg-gradient-to-r from-teal-500 to-emerald-500',
  'bg-gradient-to-r from-violet-500 to-purple-500',
  'bg-gradient-to-r from-orange-400 to-amber-500',
  'bg-gradient-to-r from-pink-400 to-rose-400',
  'bg-gradient-to-r from-blue-400 to-indigo-500',
];

export const TYPE_ICONS: Record<string, string> = {
  'Image Classifier': '🖼️',
  'Object Detection': '🔍',
  'Pose Classifier': '🧍',
  'Hand Pose Classifier': '🖐️',
  'Audio Classifier': '🎙️',
  'Text Classifier': '📝',
  'Numbers (C/R)': '📊',
};

export const STATUS_STYLES: Record<string, string> = {
  Untrained: 'bg-amber-50 text-amber-700 border-amber-200',
  Trained: 'bg-green-50 text-green-700 border-green-200',
  Training: 'bg-blue-50 text-blue-700 border-blue-200',
};
