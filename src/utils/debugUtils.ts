const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

export const debugLog = {
  info: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  group: (label: string) => {
    if (DEBUG_ENABLED) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (DEBUG_ENABLED) {
      console.groupEnd();
    }
  }
};