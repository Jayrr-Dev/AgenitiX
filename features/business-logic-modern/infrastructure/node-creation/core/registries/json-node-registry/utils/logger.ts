/**
 * DEVELOPMENT LOGGER - Tree-shakeable logging for registry operations
 *
 * • Provides development-only logging that gets stripped in production
 * • Zero runtime overhead in production builds
 * • Consistent logging interface across registry system
 *
 * Keywords: logging, development, tree-shaking, production-optimization
 */

// Development flag - gets replaced by bundler
declare const __DEV__: boolean;

/**
 * Development-only logger that gets tree-shaken in production
 */
export const logger = {
  log: (__DEV__ ? console.log : () => {}) as typeof console.log,
  warn: (__DEV__ ? console.warn : () => {}) as typeof console.warn,
  error: (__DEV__ ? console.error : () => {}) as typeof console.error,
  info: (__DEV__ ? console.info : () => {}) as typeof console.info,
  debug: (__DEV__ ? console.debug : () => {}) as typeof console.debug,
};

/**
 * Registry-specific logger with namespace
 */
export function createRegistryLogger(namespace: string) {
  return {
    log: (__DEV__
      ? (...args: any[]) => console.log(`[${namespace}]`, ...args)
      : () => {}) as typeof console.log,
    warn: (__DEV__
      ? (...args: any[]) => console.warn(`[${namespace}]`, ...args)
      : () => {}) as typeof console.warn,
    error: (__DEV__
      ? (...args: any[]) => console.error(`[${namespace}]`, ...args)
      : () => {}) as typeof console.error,
    info: (__DEV__
      ? (...args: any[]) => console.info(`[${namespace}]`, ...args)
      : () => {}) as typeof console.info,
    debug: (__DEV__
      ? (...args: any[]) => console.debug(`[${namespace}]`, ...args)
      : () => {}) as typeof console.debug,
  };
}

/**
 * Check if we're in development mode
 */
export const isDev = __DEV__;

/**
 * Guard for development-only code blocks
 */
export function devOnly<T>(fn: () => T): T | void {
  if (__DEV__) {
    return fn();
  }
}

/**
 * Performance timing utility (dev-only)
 */
export function timeOperation<T>(label: string, operation: () => T): T {
  if (!__DEV__) {
    return operation();
  }

  const start = performance.now();
  const result = operation();
  const end = performance.now();

  logger.debug(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}
