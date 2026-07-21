// Stub — implemented in Phase 4

export interface Project {
  [key: string]: any;
}

export interface AnalysisResult {
  method: string;
  permissions: string[];
  features: string[];
  estimatedTime: string;
}

export const analyze = (project?: Project): AnalysisResult => ({
  method: 'injection',
  permissions: [],
  features: [],
  estimatedTime: '10-30 sec',
});

export default {
  analyze,
};
