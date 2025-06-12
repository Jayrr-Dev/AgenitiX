import { getValidationMetrics, getValidationHealthScore, type ValidationMetrics } from './validation';

/**
 * Enterprise validation monitoring dashboard
 * 
 * Provides comprehensive monitoring capabilities for node validation
 * health, performance metrics, and real-time status reporting.
 */

export interface ValidationDashboard {
  overall: {
    totalNodes: number;
    healthyNodes: number;
    warningNodes: number;
    criticalNodes: number;
    overallHealthScore: number;
  };
  nodeTypes: ValidationNodeReport[];
  alerts: ValidationAlert[];
  trends: ValidationTrend[];
}

export interface ValidationNodeReport {
  nodeType: string;
  healthScore: number;
  totalValidations: number;
  failures: number;
  successRate: number;
  status: 'healthy' | 'warning' | 'critical';
  lastFailure?: Date;
  commonErrors: { error: string; count: number }[];
}

export interface ValidationAlert {
  id: string;
  nodeType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface ValidationTrend {
  nodeType: string;
  timeframe: '1h' | '6h' | '24h' | '7d';
  data: { timestamp: Date; successRate: number; failureCount: number }[];
}

/**
 * Generate comprehensive validation dashboard
 */
export function generateValidationDashboard(): ValidationDashboard {
  const metrics = getValidationMetrics();
  const nodeReports = metrics.map(generateNodeReport);
  
  // Calculate overall health
  const totalNodes = nodeReports.length;
  const healthyNodes = nodeReports.filter(n => n.status === 'healthy').length;
  const warningNodes = nodeReports.filter(n => n.status === 'warning').length;
  const criticalNodes = nodeReports.filter(n => n.status === 'critical').length;
  
  const overallHealthScore = totalNodes > 0 
    ? Math.round(nodeReports.reduce((sum, report) => sum + report.healthScore, 0) / totalNodes)
    : 100;

  return {
    overall: {
      totalNodes,
      healthyNodes,
      warningNodes,
      criticalNodes,
      overallHealthScore,
    },
    nodeTypes: nodeReports,
    alerts: generateValidationAlerts(nodeReports),
    trends: [], // TODO: Implement trend tracking with time-series data
  };
}

/**
 * Generate detailed report for a single node type
 */
function generateNodeReport(metrics: ValidationMetrics): ValidationNodeReport {
  const healthScore = getValidationHealthScore(metrics.nodeType);
  const successRate = metrics.validationCount > 0 
    ? ((metrics.validationCount - metrics.failureCount) / metrics.validationCount) * 100
    : 100;

  // Determine status based on health score and recent failures
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (healthScore < 50) {
    status = 'critical';
  } else if (healthScore < 80 || (metrics.lastFailure && isRecent(metrics.lastFailure))) {
    status = 'warning';
  }

  // Extract common errors
  const commonErrors = Object.entries(metrics.errorTypes)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 errors

  return {
    nodeType: metrics.nodeType,
    healthScore,
    totalValidations: metrics.validationCount,
    failures: metrics.failureCount,
    successRate: Math.round(successRate * 100) / 100,
    status,
    lastFailure: metrics.lastFailure,
    commonErrors,
  };
}

/**
 * Generate validation alerts based on node reports
 */
function generateValidationAlerts(reports: ValidationNodeReport[]): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];

  reports.forEach(report => {
    // Critical health score alert
    if (report.healthScore < 50) {
      alerts.push({
        id: `critical-health-${report.nodeType}`,
        nodeType: report.nodeType,
        severity: 'critical',
        message: `Critical validation health score: ${report.healthScore}%`,
        timestamp: new Date(),
        resolved: false,
      });
    }
    
    // High failure rate alert
    if (report.successRate < 80 && report.totalValidations > 10) {
      alerts.push({
        id: `high-failure-${report.nodeType}`,
        nodeType: report.nodeType,
        severity: 'high',
        message: `High failure rate: ${(100 - report.successRate).toFixed(1)}% of validations failing`,
        timestamp: new Date(),
        resolved: false,
      });
    }
    
    // Recent failures alert
    if (report.lastFailure && isRecent(report.lastFailure)) {
      alerts.push({
        id: `recent-failure-${report.nodeType}`,
        nodeType: report.nodeType,
        severity: 'medium',
        message: `Recent validation failures detected`,
        timestamp: new Date(),
        resolved: false,
      });
    }
    
    // Common error patterns
    if (report.commonErrors.length > 0 && report.commonErrors[0].count > 5) {
      alerts.push({
        id: `pattern-error-${report.nodeType}`,
        nodeType: report.nodeType,
        severity: 'medium',
        message: `Recurring error pattern: ${report.commonErrors[0].error}`,
        timestamp: new Date(),
        resolved: false,
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Check if a date is within the last hour
 */
function isRecent(date: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return date > oneHourAgo;
}

/**
 * Export validation metrics in various formats
 */
export const ValidationExporter = {
  /**
   * Export to JSON for API consumption
   */
  toJSON: (dashboard: ValidationDashboard) => {
    return JSON.stringify(dashboard, null, 2);
  },

  /**
   * Export to CSV for spreadsheet analysis
   */
  toCSV: (dashboard: ValidationDashboard) => {
    const headers = [
      'Node Type',
      'Health Score',
      'Total Validations', 
      'Failures',
      'Success Rate',
      'Status',
      'Last Failure'
    ];
    
    const rows = dashboard.nodeTypes.map(report => [
      report.nodeType,
      report.healthScore,
      report.totalValidations,
      report.failures,
      report.successRate,
      report.status,
      report.lastFailure?.toISOString() || 'None'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  /**
   * Export to Markdown for documentation
   */
  toMarkdown: (dashboard: ValidationDashboard) => {
    let md = '# Node Validation Dashboard\n\n';
    
    // Overall stats
    md += '## Overall Health\n\n';
    md += `- **Overall Health Score**: ${dashboard.overall.overallHealthScore}%\n`;
    md += `- **Total Node Types**: ${dashboard.overall.totalNodes}\n`;
    md += `- **Healthy**: ${dashboard.overall.healthyNodes}\n`;
    md += `- **Warning**: ${dashboard.overall.warningNodes}\n`;
    md += `- **Critical**: ${dashboard.overall.criticalNodes}\n\n`;
    
    // Node details
    md += '## Node Type Details\n\n';
    md += '| Node Type | Health Score | Validations | Failures | Success Rate | Status |\n';
    md += '|-----------|--------------|-------------|----------|--------------|--------|\n';
    
    dashboard.nodeTypes.forEach(report => {
      md += `| ${report.nodeType} | ${report.healthScore}% | ${report.totalValidations} | ${report.failures} | ${report.successRate}% | ${report.status} |\n`;
    });
    
    // Alerts
    if (dashboard.alerts.length > 0) {
      md += '\n## Active Alerts\n\n';
      dashboard.alerts.forEach(alert => {
        md += `- **${alert.severity.toUpperCase()}** [${alert.nodeType}]: ${alert.message}\n`;
      });
    }
    
    return md;
  },
};

/**
 * Validation monitoring utilities
 * For React integration, create a custom hook in your component file:
 * 
 * ```typescript
 * import { useState, useEffect } from 'react';
 * import { generateValidationDashboard } from './validation-monitor';
 * 
 * export function useValidationMonitoring(refreshInterval = 30000) {
 *   const [dashboard, setDashboard] = useState(null);
 *   
 *   useEffect(() => {
 *     const refresh = () => setDashboard(generateValidationDashboard());
 *     refresh();
 *     const interval = setInterval(refresh, refreshInterval);
 *     return () => clearInterval(interval);
 *   }, [refreshInterval]);
 *   
 *   return dashboard;
 * }
 * ```
 */
export const ValidationMonitoringUtils = {
  /**
   * Get current validation dashboard
   */
  getDashboard: () => generateValidationDashboard(),
  
  /**
   * Log validation health summary to console
   */
  logHealthSummary: () => {
    const dashboard = generateValidationDashboard();
    console.log(ValidationMonitorUtils.getHealthSummary(dashboard));
  },
  
  /**
   * Check if system needs attention
   */
  needsAttention: () => {
    const dashboard = generateValidationDashboard();
    return !ValidationMonitorUtils.isSystemHealthy(dashboard);
  },
};

/**
 * Utility functions for validation monitoring integration
 */
export const ValidationMonitorUtils = {
  /**
   * Check if overall system health is acceptable
   */
  isSystemHealthy: (dashboard: ValidationDashboard) => {
    return dashboard.overall.overallHealthScore >= 80 && 
           dashboard.overall.criticalNodes === 0;
  },

  /**
   * Get nodes that need immediate attention
   */
  getCriticalNodes: (dashboard: ValidationDashboard) => {
    return dashboard.nodeTypes.filter(node => node.status === 'critical');
  },

  /**
   * Generate health status summary for logging
   */
  getHealthSummary: (dashboard: ValidationDashboard) => {
    return `System Health: ${dashboard.overall.overallHealthScore}% | ` +
           `Critical: ${dashboard.overall.criticalNodes} | ` +
           `Warning: ${dashboard.overall.warningNodes} | ` +
           `Healthy: ${dashboard.overall.healthyNodes}`;
  },
};

/**
 * Enterprise Validation Monitoring System
 * 
 * This module provides comprehensive monitoring for node validation health.
 * Use generateValidationDashboard() to get real-time metrics and alerts.
 */ 