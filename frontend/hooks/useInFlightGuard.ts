import { useRef, useCallback } from 'react';

interface InFlightGuardOptions {
  timeout?: number;
  onTimeout?: () => void;
}

export const useInFlightGuard = (options: InFlightGuardOptions = {}) => {
  const { timeout = 10000, onTimeout } = options;
  const inFlightRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startOperation = useCallback((operationId: string) => {
    if (inFlightRef.current.has(operationId)) {
      console.warn(`⚠️ [INFLIGHT] Operation ${operationId} already in progress`);
      return false;
    }

    inFlightRef.current.add(operationId);
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ [INFLIGHT] Operation ${operationId} timed out`);
      inFlightRef.current.delete(operationId);
      timeoutsRef.current.delete(operationId);
      onTimeout?.();
    }, timeout);

    timeoutsRef.current.set(operationId, timeoutId);
    console.log(`🚀 [INFLIGHT] Started operation: ${operationId}`);
    return true;
  }, [timeout, onTimeout]);

  const endOperation = useCallback((operationId: string) => {
    if (!inFlightRef.current.has(operationId)) {
      console.warn(`⚠️ [INFLIGHT] Operation ${operationId} not found`);
      return;
    }

    inFlightRef.current.delete(operationId);
    
    // Clear timeout
    const timeoutId = timeoutsRef.current.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(operationId);
    }

    console.log(`✅ [INFLIGHT] Completed operation: ${operationId}`);
  }, []);

  const isOperationInFlight = useCallback((operationId: string) => {
    return inFlightRef.current.has(operationId);
  }, []);

  const clearAllOperations = useCallback(() => {
    inFlightRef.current.clear();
    timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
    console.log(`🧹 [INFLIGHT] Cleared all operations`);
  }, []);

  const getInFlightOperations = useCallback(() => {
    return Array.from(inFlightRef.current);
  }, []);

  return {
    startOperation,
    endOperation,
    isOperationInFlight,
    clearAllOperations,
    getInFlightOperations,
  };
};
