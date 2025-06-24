/**
 * ESTIMATED HOURS HOOK - Custom hook for managing estimated hours functionality
 *
 * • Real-time data synchronization with timesheet store
 * • Automatic recalculation when data changes
 * • Memoized calculations for performance
 * • State management for UI interactions
 * • Integration with localStorage for persistence
 *
 * Keywords: estimated-hours, timesheet, hook, state-management, real-time
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimesheetStore, DataRow } from "@/store/timesheetStore";

export interface ProjectSummary {
  projectId: number;
  projectName: string;
  estimatedHours: number;
  actualHours: number;
  variance: number;
  percentComplete: number;
  status: 'on-track' | 'over-budget' | 'under-budget';
  lastUpdated: Date;
}

export interface OverallMetrics {
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
  averageAccuracy: number;
  projectCount: number;
  lastCalculated: Date;
}

export interface EstimatedHoursState {
  projectSummaries: ProjectSummary[];
  overallMetrics: OverallMetrics;
  isLoading: boolean;
  lastUpdated: Date | null;
}

// Configuration constants
const VARIANCE_THRESHOLD = 0.1; // 10% variance threshold for status calculation
const UPDATE_DEBOUNCE_MS = 300; // Debounce updates to prevent excessive recalculations

export const useEstimatedHours = () => {
  const { data: timesheetData, currentPeriod } = useTimesheetStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Memoized calculation of project summaries
  const projectSummaries = useMemo((): ProjectSummary[] => {
    const projectMap = new Map<number, {
      projectName: string;
      estimatedHours: number;
      actualHours: number;
      entries: DataRow[];
    }>();

    // Filter data by current period if available
    const filteredData = currentPeriod 
      ? timesheetData.filter(row => row.task === currentPeriod)
      : timesheetData;

    filteredData.forEach((row: DataRow) => {
      const projectId = row.projectId;
      const estimated = row.estimatedHours || 0;
      const actual = (row.regularTime || 0) + (row.overtimeTime || 0);

      if (projectMap.has(projectId)) {
        const existing = projectMap.get(projectId)!;
        existing.estimatedHours += estimated;
        existing.actualHours += actual;
        existing.entries.push(row);
      } else {
        projectMap.set(projectId, {
          projectName: row.project,
          estimatedHours: estimated,
          actualHours: actual,
          entries: [row],
        });
      }
    });

    return Array.from(projectMap.entries()).map(([projectId, data]) => {
      const variance = data.actualHours - data.estimatedHours;
      const percentComplete = data.estimatedHours > 0 
        ? Math.min((data.actualHours / data.estimatedHours) * 100, 100)
        : 0;
      
      let status: ProjectSummary['status'] = 'on-track';
      const variancePercent = data.estimatedHours > 0 ? Math.abs(variance) / data.estimatedHours : 0;
      
      if (variance > data.estimatedHours * VARIANCE_THRESHOLD) {
        status = 'over-budget';
      } else if (variance < -data.estimatedHours * VARIANCE_THRESHOLD) {
        status = 'under-budget';
      }

      // Find the most recent entry for lastUpdated
      const lastUpdated = data.entries.reduce((latest, entry) => {
        const entryDate = new Date(entry.entryDate);
        return entryDate > latest ? entryDate : latest;
      }, new Date(0));

      return {
        projectId,
        projectName: data.projectName,
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        variance,
        percentComplete,
        status,
        lastUpdated,
      };
    }).filter(summary => summary.estimatedHours > 0) // Only show projects with estimates
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()); // Sort by most recent
  }, [timesheetData, currentPeriod]);

  // Memoized calculation of overall metrics
  const overallMetrics = useMemo((): OverallMetrics => {
    const totalEstimated = projectSummaries.reduce((sum, p) => sum + p.estimatedHours, 0);
    const totalActual = projectSummaries.reduce((sum, p) => sum + p.actualHours, 0);
    const totalVariance = totalActual - totalEstimated;
    const averageAccuracy = totalEstimated > 0 
      ? Math.round((1 - Math.abs(totalVariance) / totalEstimated) * 100)
      : 100;

    return {
      totalEstimated,
      totalActual,
      totalVariance,
      averageAccuracy,
      projectCount: projectSummaries.length,
      lastCalculated: new Date(),
    };
  }, [projectSummaries]);

  // Update tracking
  useEffect(() => {
    if (timesheetData.length > 0) {
      setLastUpdateTime(new Date());
    }
  }, [timesheetData]);

  // Persistence for expanded state
  useEffect(() => {
    const savedState = localStorage.getItem('estimatedHoursExpanded');
    if (savedState !== null) {
      setIsExpanded(JSON.parse(savedState));
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('estimatedHoursExpanded', JSON.stringify(newState));
  }, [isExpanded]);

  // Utility functions
  const formatHours = useCallback((hours: number): string => {
    return hours.toFixed(1);
  }, []);

  const formatVariance = useCallback((variance: number): string => {
    const sign = variance >= 0 ? '+' : '';
    return `${sign}${formatHours(variance)}h`;
  }, [formatHours]);

  const getStatusColor = useCallback((status: ProjectSummary['status']): string => {
    switch (status) {
      case 'on-track': return 'bg-green-500';
      case 'over-budget': return 'bg-red-500';
      case 'under-budget': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getProjectById = useCallback((projectId: number): ProjectSummary | undefined => {
    return projectSummaries.find(p => p.projectId === projectId);
  }, [projectSummaries]);

  const getProjectsByStatus = useCallback((status: ProjectSummary['status']): ProjectSummary[] => {
    return projectSummaries.filter(p => p.status === status);
  }, [projectSummaries]);

  // Check if data needs attention (low accuracy or over budget projects)
  const needsAttention = useMemo(() => {
    return overallMetrics.averageAccuracy < 80 || 
           projectSummaries.some(p => p.status === 'over-budget');
  }, [overallMetrics.averageAccuracy, projectSummaries]);

  const state: EstimatedHoursState = {
    projectSummaries,
    overallMetrics,
    isLoading: false, // Could be enhanced with async data loading
    lastUpdated: lastUpdateTime,
  };

  return {
    // State
    state,
    isExpanded,
    needsAttention,
    
    // Actions
    toggleExpanded,
    
    // Utilities
    formatHours,
    formatVariance,
    getStatusColor,
    getProjectById,
    getProjectsByStatus,
    
    // Raw data access
    timesheetData,
    currentPeriod,
  };
}; 