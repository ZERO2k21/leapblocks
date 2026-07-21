// Stub — implemented in Phase 5

export interface Project {
  appName?: string;
  [key: string]: any;
}

export const inject = async (project: Project): Promise<never> => {
  throw new Error('APK Injector not yet implemented');
};

export default {
  inject,
};
