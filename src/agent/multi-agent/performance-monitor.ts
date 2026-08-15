/**
 * Performance Monitoring System
 * Advanced monitoring, logging, and alerting for multi-agent system
 */

import { SystemMetrics, AgentRole } from './agent-types';

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved?: boolean;
}

export interface PerformanceLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  data?: any;
}

export class PerformanceMonitor {
  private alerts: PerformanceAlert[];
  private logs: PerformanceLog[];
  private metricsHistory: SystemMetrics[];
  private thresholds: Map<string, { warning: number; critical: number }>;
  private alertCallbacks: Map<string, (alert: PerformanceAlert) => void>;

  constructor() {
    this.alerts = [];
    this.logs = [];
    this.metricsHistory = [];
    this.thresholds = new Map();
    this.alertCallbacks = new Map();
    
    this.setupDefaultThresholds();
    this.startMetricsCleanup();
  }

  /**
   * Setup default alert thresholds
   */
  private setupDefaultThresholds(): void {
    this.thresholds.set('systemLoad', { warning: 0.7, critical: 0.9 });
    this.thresholds.set('errorRate', { warning: 0.1, critical: 0.25 });
    this.thresholds.set('averageResponseTime', { warning: 5000, critical: 10000 });
    this.thresholds.set('cacheEfficiency', { warning: 0.3, critical: 0.1 });
  }

  /**
   * Set custom threshold for a metric
   */
  setThreshold(metric: string, warning: number, critical: number): void {
    this.thresholds.set(metric, { warning, critical });
  }

  /**
   * Register alert callback
   */
  onAlert(metric: string, callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.set(metric, callback);
  }

  /**
   * Log performance data
   */
  log(level: PerformanceLog['level'], component: string, message: string, data?: any): void {
    const logEntry: PerformanceLog = {
      timestamp: new Date(),
      level,
      component,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Console output for immediate visibility
    const consoleMethod = level === 'error' ? console.error : 
                        level === 'warn' ? console.warn : 
                        level === 'debug' ? console.debug : console.log;
    consoleMethod(`[${level.toUpperCase()}] ${component}: ${message}`, data || '');
  }

  /**
   * Record system metrics
   */
  recordMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push({
      ...metrics,
      recordedAt: new Date()
    } as any);

    // Keep only last 100 data points
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }

    // Check thresholds and generate alerts
    this.checkThresholds(metrics);
  }

  /**
   * Check if metrics exceed thresholds
   */
  private checkThresholds(metrics: SystemMetrics): void {
    const checks = [
      { metric: 'systemLoad', value: metrics.systemLoad },
      { metric: 'errorRate', value: metrics.errorRate },
      { metric: 'averageResponseTime', value: metrics.averageResponseTime },
      { metric: 'cacheEfficiency', value: metrics.cacheEfficiency, invert: true },
    ];

    for (const check of checks) {
      const threshold = this.thresholds.get(check.metric);
      if (!threshold) continue;

      const { warning, critical } = threshold;
      const value = check.value;
      const exceedsWarning = check.invert ? value < warning : value > warning;
      const exceedsCritical = check.invert ? value < critical : value > critical;

      if (exceedsCritical) {
        this.createAlert('critical', check.metric, value, critical);
      } else if (exceedsWarning) {
        this.createAlert('warning', check.metric, value, warning);
      }
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(
    severity: PerformanceAlert['severity'],
    metric: string,
    value: number,
    threshold: number
  ): void {
    // Check if similar alert already exists and not resolved
    const recentAlert = this.alerts.find(a => 
      a.metric === metric && 
      a.severity === severity && 
      !a.resolved &&
      Date.now() - a.timestamp.getTime() < 60000 // Within last minute
    );

    if (recentAlert) return;

    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${metric}`,
      severity,
      metric,
      message: `${metric} ${severity === 'critical' ? 'critically' : ''} ${severity === 'warning' ? 'exceeds warning' : 'exceeds critical'} threshold: ${value.toFixed(2)} (threshold: ${threshold})`,
      value,
      threshold,
      timestamp: new Date()
    };

    this.alerts.push(alert);
    this.log('warn', 'PerformanceMonitor', alert.message, { metric, value, threshold });

    // Trigger callback if registered
    const callback = this.alertCallbacks.get(metric);
    if (callback) {
      callback(alert);
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    let alerts = this.alerts.filter(a => !a.resolved);
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.log('info', 'PerformanceMonitor', `Alert resolved: ${alertId}`);
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: PerformanceLog['level'], component?: string): PerformanceLog[] {
    let logs = [...this.logs];

    if (level) {
      logs = logs.filter(l => l.level === level);
    }

    if (component) {
      logs = logs.filter(l => l.component === component);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 50): SystemMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    current: SystemMetrics;
    trends: {
      systemLoad: { trend: 'up' | 'down' | 'stable'; change: number };
      errorRate: { trend: 'up' | 'down' | 'stable'; change: number };
      averageResponseTime: { trend: 'up' | 'down' | 'stable'; change: number };
    };
    activeAlerts: number;
    healthScore: number;
  } {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    if (!current) {
      return {
        current: {} as SystemMetrics,
        trends: { systemLoad: { trend: 'stable', change: 0 }, errorRate: { trend: 'stable', change: 0 }, averageResponseTime: { trend: 'stable', change: 0 } },
        activeAlerts: 0,
        healthScore: 100
      };
    }

    const previous = this.metricsHistory[this.metricsHistory.length - 10] || current;

    const calculateTrend = (current: number, previous: number) => {
      const change = current - previous;
      const trend = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'stable';
      return { trend, change };
    };

    const trends = {
      systemLoad: calculateTrend(current.systemLoad, previous.systemLoad),
      errorRate: calculateTrend(current.errorRate, previous.errorRate),
      averageResponseTime: calculateTrend(current.averageResponseTime, previous.averageResponseTime)
    };

    const activeAlerts = this.alerts.filter(a => !a.resolved).length;
    
    // Calculate health score (0-100)
    const healthScore = Math.max(0, Math.min(100,
      100 - (current.systemLoad * 30) - (current.errorRate * 100) - (activeAlerts * 10)
    ));

    return {
      current,
      trends,
      activeAlerts,
      healthScore
    };
  }

  /**
   * Start periodic cleanup of old data
   */
  private startMetricsCleanup(): void {
    setInterval(() => {
      // Clean old alerts (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo || !a.resolved);

      // Clean old logs (older than 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 1800000);
      this.logs = this.logs.filter(l => l.timestamp > thirtyMinutesAgo);

    }, 300000); // Every 5 minutes
  }

  /**
   * Export performance report
   */
  exportReport(): string {
    const summary = this.getPerformanceSummary();
    const recentAlerts = this.getAlerts();
    
    return `
=== PERFORMANCE REPORT ===
Generated: ${new Date().toISOString()}

HEALTH SCORE: ${summary.healthScore.toFixed(1)}/100
Active Alerts: ${summary.activeAlerts}

CURRENT METRICS:
- System Load: ${(summary.current.systemLoad * 100).toFixed(1)}%
- Error Rate: ${(summary.current.errorRate * 100).toFixed(2)}%
- Avg Response Time: ${summary.current.averageResponseTime.toFixed(0)}ms
- Cache Efficiency: ${(summary.current.cacheEfficiency * 100).toFixed(1)}%
- Active Agents: ${summary.current.activeAgents}
- Total Tasks: ${summary.current.totalTasks}

TRENDS:
- System Load: ${summary.trends.systemLoad.trend} (${summary.trends.systemLoad.change > 0 ? '+' : ''}${summary.trends.systemLoad.change.toFixed(3)})
- Error Rate: ${summary.trends.errorRate.trend} (${summary.trends.errorRate.change > 0 ? '+' : ''}${summary.trends.errorRate.change.toFixed(3)})
- Response Time: ${summary.trends.averageResponseTime.trend} (${summary.trends.averageResponseTime.change > 0 ? '+' : ''}${summary.trends.averageResponseTime.change.toFixed(0)}ms)

RECENT ALERTS:
${recentAlerts.slice(0, 5).map(a => 
  `[${a.severity.toUpperCase()}] ${a.metric}: ${a.message}`
).join('\n') || 'No recent alerts'}
`;
  }

  /**
   * Reset all monitoring data
   */
  reset(): void {
    this.alerts = [];
    this.logs = [];
    this.metricsHistory = [];
    this.log('info', 'PerformanceMonitor', 'Performance monitor reset');
  }
}