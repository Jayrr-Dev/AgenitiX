/**
 * ESTIMATED HOURS TAB - Time tracking and estimation display
 *
 * • Real-time comparison of estimated vs actual hours
 * • Visual progress indicators for time tracking
 * • Summary statistics and variance analysis
 * • Integration with timesheet data store
 * • Responsive design with collapsible interface
 *
 * Keywords: time-tracking, estimation, hours, progress, variance, timesheet
 */

"use client";

import { Clock, TrendingDown, TrendingUp, Target, AlertTriangle } from "lucide-react";
import React from "react";
import {
  useComponentClasses,
} from "../theming/components";
import { useEstimatedHours } from "./hooks/useEstimatedHours";

// STYLING CONSTANTS
const TAB_STYLES = {
  container: "bg-[var(--infra-history-bg)] border border-[var(--infra-history-border)] rounded-lg shadow-lg overflow-hidden max-w-full min-w-0",
  header: "px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm",
  headerLayout: "flex items-center justify-between min-w-0 gap-2",
  headerTitle: "flex items-center gap-2",
  headerIcon: "w-4 h-4 text-primary",
  headerText: "text-sm font-semibold text-foreground",
  headerBadge: "text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full",
  content: "p-4 space-y-3",
  collapsed: "p-3 flex items-center justify-between hover:bg-[var(--infra-history-bg-hover)] transition-colors cursor-pointer",
} as const;

const METRIC_STYLES = {
  container: "grid grid-cols-1 sm:grid-cols-3 gap-3",
  card: "bg-card/50 border border-border/50 rounded-lg p-3 transition-all hover:shadow-md",
  cardHeader: "flex items-center gap-2 mb-2",
  cardIcon: "w-4 h-4",
  cardTitle: "text-sm font-medium text-foreground",
  cardValue: "text-lg font-bold",
  cardSubtext: "text-xs text-muted-foreground mt-1",
} as const;

const PROGRESS_STYLES = {
  container: "space-y-2",
  item: "flex items-center justify-between p-2 bg-muted/30 rounded border",
  itemLeft: "flex items-center gap-2 min-w-0 flex-1",
  itemRight: "flex items-center gap-2 text-xs",
  projectName: "text-sm font-medium truncate",
  progressBar: "w-full bg-muted rounded-full h-2 overflow-hidden",
  progressFill: "h-full transition-all duration-300",
  variance: "font-mono",
} as const;

interface EstimatedHoursTabProps {
  className?: string;
}

const EstimatedHoursTab: React.FC<EstimatedHoursTabProps> = ({
  className = "",
}) => {
  const {
    state,
    isExpanded,
    needsAttention,
    toggleExpanded,
    formatHours,
    formatVariance,
    getStatusColor,
  } = useEstimatedHours();

  const { projectSummaries, overallMetrics } = state;

  // Get themed classes
  const containerClasses = useComponentClasses(
    "actionToolbar",
    "default",
    `${TAB_STYLES.container} ${className}`
  );

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-3 h-3 text-red-500" />;
    if (variance < 0) return <TrendingDown className="w-3 h-3 text-green-500" />;
    return <Target className="w-3 h-3 text-blue-500" />;
  };

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className={containerClasses}>
        <div className={TAB_STYLES.collapsed} onClick={toggleExpanded}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Est Hours</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {overallMetrics.projectCount}
            </span>
            {overallMetrics.averageAccuracy < 80 && (
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatHours(overallMetrics.totalActual)}/{formatHours(overallMetrics.totalEstimated)}h
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={TAB_STYLES.header}>
        <div className={TAB_STYLES.headerLayout}>
          <div className={TAB_STYLES.headerTitle} onClick={toggleExpanded} style={{ cursor: 'pointer' }}>
            <Clock className={TAB_STYLES.headerIcon} />
            <span className={TAB_STYLES.headerText}>Estimated Hours</span>
            <span className={TAB_STYLES.headerBadge}>
              {overallMetrics.projectCount} projects
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {overallMetrics.averageAccuracy}% accuracy
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={TAB_STYLES.content}>
        {/* Overall Metrics */}
        <div className={METRIC_STYLES.container}>
          <div className={METRIC_STYLES.card}>
            <div className={METRIC_STYLES.cardHeader}>
              <Target className={`${METRIC_STYLES.cardIcon} text-blue-500`} />
              <span className={METRIC_STYLES.cardTitle}>Estimated</span>
            </div>
            <div className={`${METRIC_STYLES.cardValue} text-blue-600`}>
              {formatHours(overallMetrics.totalEstimated)}h
            </div>
          </div>

          <div className={METRIC_STYLES.card}>
            <div className={METRIC_STYLES.cardHeader}>
              <Clock className={`${METRIC_STYLES.cardIcon} text-green-500`} />
              <span className={METRIC_STYLES.cardTitle}>Actual</span>
            </div>
            <div className={`${METRIC_STYLES.cardValue} text-green-600`}>
              {formatHours(overallMetrics.totalActual)}h
            </div>
          </div>

          <div className={METRIC_STYLES.card}>
            <div className={METRIC_STYLES.cardHeader}>
              {getVarianceIcon(overallMetrics.totalVariance)}
              <span className={METRIC_STYLES.cardTitle}>Variance</span>
            </div>
            <div className={`${METRIC_STYLES.cardValue} ${
              overallMetrics.totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatVariance(overallMetrics.totalVariance)}
            </div>
          </div>
        </div>

        {/* Project Progress */}
        {projectSummaries.length > 0 ? (
          <div className={PROGRESS_STYLES.container}>
            <h4 className="text-sm font-medium text-foreground mb-2">Project Progress</h4>
            {projectSummaries.map((project) => (
              <div key={project.projectId} className={PROGRESS_STYLES.item}>
                <div className={PROGRESS_STYLES.itemLeft}>
                  <div className="min-w-0 flex-1">
                    <div className={PROGRESS_STYLES.projectName}>
                      {project.projectName}
                    </div>
                    <div className={PROGRESS_STYLES.progressBar}>
                      <div 
                        className={`${PROGRESS_STYLES.progressFill} ${getStatusColor(project.status)}`}
                        style={{ width: `${Math.min(project.percentComplete, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className={PROGRESS_STYLES.itemRight}>
                  <span className={PROGRESS_STYLES.variance}>
                    {formatVariance(project.variance)}
                  </span>
                  {getVarianceIcon(project.variance)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No estimated hours data available</p>
            <p className="text-xs mt-1">Add estimated hours to timesheet entries to see tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimatedHoursTab; 