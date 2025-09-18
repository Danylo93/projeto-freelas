import { analyticsService } from './analyticsService';
import { cacheService } from './cacheService';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'api' | 'navigation' | 'memory' | 'battery';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  averageRenderTime: number;
  averageApiResponseTime: number;
  memoryUsage: number;
  crashCount: number;
  errorCount: number;
  userSatisfactionScore: number;
  recommendations: string[];
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private renderStartTimes: Map<string, number> = new Map();
  private apiStartTimes: Map<string, number> = new Map();
  private maxMetricsHistory = 1000;

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Iniciar medição de renderização
  startRenderMeasurement(componentName: string): void {
    this.renderStartTimes.set(componentName, Date.now());
  }

  // Finalizar medição de renderização
  endRenderMeasurement(componentName: string): void {
    const startTime = this.renderStartTimes.get(componentName);
    if (startTime) {
      const renderTime = Date.now() - startTime;
      this.addMetric({
        name: `render_${componentName}`,
        value: renderTime,
        timestamp: Date.now(),
        category: 'render',
        metadata: { component: componentName },
      });
      this.renderStartTimes.delete(componentName);
    }
  }

  // Iniciar medição de API
  startApiMeasurement(endpoint: string): void {
    this.apiStartTimes.set(endpoint, Date.now());
  }

  // Finalizar medição de API
  endApiMeasurement(endpoint: string, success: boolean = true): void {
    const startTime = this.apiStartTimes.get(endpoint);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      this.addMetric({
        name: `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
        value: responseTime,
        timestamp: Date.now(),
        category: 'api',
        metadata: { endpoint, success },
      });
      this.apiStartTimes.delete(endpoint);
    }
  }

  // Medir performance de função
  async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    category: PerformanceMetric['category'] = 'render'
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const executionTime = Date.now() - startTime;
      
      this.addMetric({
        name,
        value: executionTime,
        timestamp: Date.now(),
        category,
        metadata: { success: true },
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.addMetric({
        name,
        value: executionTime,
        timestamp: Date.now(),
        category,
        metadata: { success: false, error: error.message },
      });
      
      throw error;
    }
  }

  // Adicionar métrica
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Manter apenas as últimas métricas
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Enviar para analytics se for crítico
    if (this.isCriticalMetric(metric)) {
      analyticsService.trackPerformanceMetric(metric.name, metric.value, metric.metadata);
    }
  }

  // Verificar se métrica é crítica
  private isCriticalMetric(metric: PerformanceMetric): boolean {
    switch (metric.category) {
      case 'render':
        return metric.value > 100; // Renderização > 100ms
      case 'api':
        return metric.value > 5000; // API > 5s
      case 'navigation':
        return metric.value > 300; // Navegação > 300ms
      default:
        return false;
    }
  }

  // Obter métricas por categoria
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  // Obter métricas por período
  getMetricsByTimeRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  // Calcular estatísticas
  calculateStats(metrics: PerformanceMetric[]): {
    average: number;
    min: number;
    max: number;
    count: number;
    p95: number;
  } {
    if (metrics.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0, p95: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const p95Index = Math.floor(values.length * 0.95);

    return {
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      count: values.length,
      p95: values[p95Index] || 0,
    };
  }

  // Gerar relatório de performance
  generateReport(): PerformanceReport {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentMetrics = this.getMetricsByTimeRange(last24Hours, now);
    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    const apiMetrics = recentMetrics.filter(m => m.category === 'api');
    
    const renderStats = this.calculateStats(renderMetrics);
    const apiStats = this.calculateStats(apiMetrics);
    
    const recommendations = this.generateRecommendations(renderStats, apiStats);
    
    return {
      averageRenderTime: renderStats.average,
      averageApiResponseTime: apiStats.average,
      memoryUsage: this.getMemoryUsage(),
      crashCount: this.getCrashCount(),
      errorCount: this.getErrorCount(),
      userSatisfactionScore: this.calculateSatisfactionScore(renderStats, apiStats),
      recommendations,
    };
  }

  // Gerar recomendações
  private generateRecommendations(
    renderStats: any,
    apiStats: any
  ): string[] {
    const recommendations: string[] = [];

    if (renderStats.average > 100) {
      recommendations.push('Otimizar renderização de componentes (média > 100ms)');
    }

    if (renderStats.p95 > 300) {
      recommendations.push('Investigar componentes com renderização lenta (P95 > 300ms)');
    }

    if (apiStats.average > 2000) {
      recommendations.push('Otimizar chamadas de API (média > 2s)');
    }

    if (apiStats.p95 > 5000) {
      recommendations.push('Implementar timeout e retry para APIs lentas (P95 > 5s)');
    }

    if (this.getMemoryUsage() > 80) {
      recommendations.push('Otimizar uso de memória (> 80%)');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance está dentro dos parâmetros aceitáveis');
    }

    return recommendations;
  }

  // Calcular score de satisfação do usuário
  private calculateSatisfactionScore(renderStats: any, apiStats: any): number {
    let score = 100;

    // Penalizar renderização lenta
    if (renderStats.average > 50) score -= 10;
    if (renderStats.average > 100) score -= 20;
    if (renderStats.p95 > 300) score -= 30;

    // Penalizar APIs lentas
    if (apiStats.average > 1000) score -= 10;
    if (apiStats.average > 3000) score -= 20;
    if (apiStats.p95 > 5000) score -= 30;

    // Penalizar erros
    const errorRate = this.getErrorCount() / Math.max(1, renderStats.count + apiStats.count);
    score -= errorRate * 50;

    return Math.max(0, Math.min(100, score));
  }

  // Obter uso de memória (simulado)
  private getMemoryUsage(): number {
    // Em um app real, você usaria uma biblioteca específica
    return Math.random() * 100;
  }

  // Obter contagem de crashes
  private getCrashCount(): number {
    return this.metrics.filter(m => 
      m.metadata?.error && m.metadata.error.includes('crash')
    ).length;
  }

  // Obter contagem de erros
  private getErrorCount(): number {
    return this.metrics.filter(m => 
      m.metadata?.success === false
    ).length;
  }

  // Monitoramento automático
  startAutoMonitoring(): void {
    // Monitorar a cada 5 minutos
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5 * 60 * 1000);
  }

  // Coletar métricas do sistema
  private collectSystemMetrics(): void {
    this.addMetric({
      name: 'memory_usage',
      value: this.getMemoryUsage(),
      timestamp: Date.now(),
      category: 'memory',
    });

    // Adicionar outras métricas do sistema conforme necessário
  }

  // Limpar métricas antigas
  clearOldMetrics(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  // Exportar métricas
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      report: this.generateReport(),
      timestamp: Date.now(),
    }, null, 2);
  }

  // Obter métricas críticas
  getCriticalMetrics(): PerformanceMetric[] {
    return this.metrics.filter(metric => this.isCriticalMetric(metric));
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService;
export type { PerformanceMetric, PerformanceReport };
