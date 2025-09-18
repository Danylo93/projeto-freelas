import { useEffect, useRef, useCallback } from 'react';
import { performanceService } from '../services/performanceService';
import { analyticsService } from '../services/analyticsService';

interface UsePerformanceOptions {
  componentName: string;
  trackRender?: boolean;
  trackMounts?: boolean;
  trackUpdates?: boolean;
  trackUnmounts?: boolean;
  customMetrics?: boolean;
}

interface PerformanceHookReturn {
  startMeasurement: (name: string) => void;
  endMeasurement: (name: string) => void;
  measureFunction: <T>(name: string, fn: () => Promise<T> | T) => Promise<T>;
  trackCustomMetric: (name: string, value: number, metadata?: Record<string, any>) => void;
  getComponentStats: () => {
    renderCount: number;
    averageRenderTime: number;
    mountTime: number;
  };
}

export const usePerformance = (options: UsePerformanceOptions): PerformanceHookReturn => {
  const {
    componentName,
    trackRender = true,
    trackMounts = true,
    trackUpdates = false,
    trackUnmounts = false,
    customMetrics = true,
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);
  const measurementStartTimes = useRef<Map<string, number>>(new Map());

  // Rastrear montagem do componente
  useEffect(() => {
    if (trackMounts) {
      mountTime.current = Date.now();
      performanceService.startRenderMeasurement(`${componentName}_mount`);
      
      analyticsService.track('component_mounted', {
        component: componentName,
        timestamp: mountTime.current,
      });

      return () => {
        if (trackUnmounts) {
          const unmountTime = Date.now();
          const lifespan = unmountTime - mountTime.current;
          
          analyticsService.track('component_unmounted', {
            component: componentName,
            lifespan,
            renderCount: renderCount.current,
          });
        }
      };
    }
  }, [componentName, trackMounts, trackUnmounts]);

  // Rastrear renderizações
  useEffect(() => {
    if (trackRender) {
      const renderStart = Date.now();
      renderCount.current += 1;

      // Medir tempo de renderização no próximo tick
      const timeoutId = setTimeout(() => {
        const renderTime = Date.now() - renderStart;
        renderTimes.current.push(renderTime);
        
        // Manter apenas as últimas 50 renderizações
        if (renderTimes.current.length > 50) {
          renderTimes.current = renderTimes.current.slice(-50);
        }

        performanceService.endRenderMeasurement(`${componentName}_render`);
        
        if (trackUpdates && renderCount.current > 1) {
          analyticsService.track('component_updated', {
            component: componentName,
            renderTime,
            renderCount: renderCount.current,
          });
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  });

  // Iniciar medição personalizada
  const startMeasurement = useCallback((name: string): void => {
    if (customMetrics) {
      const fullName = `${componentName}_${name}`;
      measurementStartTimes.current.set(fullName, Date.now());
      performanceService.startRenderMeasurement(fullName);
    }
  }, [componentName, customMetrics]);

  // Finalizar medição personalizada
  const endMeasurement = useCallback((name: string): void => {
    if (customMetrics) {
      const fullName = `${componentName}_${name}`;
      const startTime = measurementStartTimes.current.get(fullName);
      
      if (startTime) {
        const duration = Date.now() - startTime;
        measurementStartTimes.current.delete(fullName);
        performanceService.endRenderMeasurement(fullName);
        
        analyticsService.track('custom_measurement', {
          component: componentName,
          measurement: name,
          duration,
        });
      }
    }
  }, [componentName, customMetrics]);

  // Medir função
  const measureFunction = useCallback(async <T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    if (customMetrics) {
      const fullName = `${componentName}_${name}`;
      return performanceService.measureFunction(fullName, fn, 'render');
    } else {
      return await fn();
    }
  }, [componentName, customMetrics]);

  // Rastrear métrica personalizada
  const trackCustomMetric = useCallback((
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void => {
    if (customMetrics) {
      analyticsService.track('custom_metric', {
        component: componentName,
        metric: name,
        value,
        ...metadata,
      });
    }
  }, [componentName, customMetrics]);

  // Obter estatísticas do componente
  const getComponentStats = useCallback(() => {
    const averageRenderTime = renderTimes.current.length > 0
      ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length
      : 0;

    return {
      renderCount: renderCount.current,
      averageRenderTime,
      mountTime: mountTime.current,
    };
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    measureFunction,
    trackCustomMetric,
    getComponentStats,
  };
};

// Hook específico para componentes de lista
export const useListPerformance = (
  componentName: string,
  itemCount: number
) => {
  const performance = usePerformance({ componentName });
  
  useEffect(() => {
    performance.trackCustomMetric('list_item_count', itemCount);
    
    if (itemCount > 100) {
      analyticsService.track('large_list_rendered', {
        component: componentName,
        itemCount,
      });
    }
  }, [itemCount, componentName, performance]);

  return performance;
};

// Hook específico para componentes de formulário
export const useFormPerformance = (
  componentName: string,
  fieldCount: number
) => {
  const performance = usePerformance({ componentName });
  const validationTimes = useRef<number[]>([]);

  const measureValidation = useCallback(async <T>(
    validationFn: () => Promise<T> | T
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await validationFn();
      const validationTime = Date.now() - startTime;
      validationTimes.current.push(validationTime);
      
      performance.trackCustomMetric('validation_time', validationTime);
      
      return result;
    } catch (error) {
      const validationTime = Date.now() - startTime;
      performance.trackCustomMetric('validation_error_time', validationTime);
      throw error;
    }
  }, [performance]);

  useEffect(() => {
    performance.trackCustomMetric('form_field_count', fieldCount);
  }, [fieldCount, performance]);

  return {
    ...performance,
    measureValidation,
    getValidationStats: () => {
      const avgValidationTime = validationTimes.current.length > 0
        ? validationTimes.current.reduce((sum, time) => sum + time, 0) / validationTimes.current.length
        : 0;
      
      return {
        averageValidationTime: avgValidationTime,
        validationCount: validationTimes.current.length,
      };
    },
  };
};

// Hook específico para componentes de navegação
export const useNavigationPerformance = (screenName: string) => {
  const performance = usePerformance({ 
    componentName: `screen_${screenName}`,
    trackMounts: true,
    trackUnmounts: true,
  });

  useEffect(() => {
    const navigationStart = Date.now();
    
    // Simular tempo de carregamento da tela
    const timeoutId = setTimeout(() => {
      const loadTime = Date.now() - navigationStart;
      performance.trackCustomMetric('screen_load_time', loadTime);
      
      analyticsService.track('screen_loaded', {
        screen: screenName,
        loadTime,
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [screenName, performance]);

  return performance;
};
