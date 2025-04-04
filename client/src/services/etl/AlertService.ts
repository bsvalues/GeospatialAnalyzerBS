import { ETLJob } from './ETLTypes';

/**
 * Alert type enum
 */
export enum AlertType {
  JOB_SCHEDULED = 'job_scheduled',
  JOB_STARTED = 'job_started',
  JOB_COMPLETED = 'job_completed',
  JOB_FAILURE = 'job_failure',
  JOB_CANCELLED = 'job_cancelled',
  DATA_QUALITY = 'data_quality',
  OPTIMIZATION = 'optimization',
  SYSTEM = 'system',
  CONNECTION = 'connection',
  TRANSFORMATION = 'transformation',
  SECURITY = 'security',
  CUSTOM = 'custom'
}

/**
 * Alert severity enum
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert state enum
 */
export enum AlertState {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

/**
 * Job metrics interface
 */
export interface JobMetrics {
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errorRecords: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  peakMemoryUsage: number;
  avgCpuUsage: number;
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  state: AlertState;
  jobId?: string;
  jobName?: string;
  details?: Record<string, any>;
  actions?: { label: string, action: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Alert rule interface
 */
interface AlertRule {
  id: string;
  type: AlertType;
  condition: (data: any) => boolean;
  severity: AlertSeverity;
  title: string;
  message: string | ((data: any) => string);
  enabled: boolean;
}

/**
 * Alert listener interface
 */
type AlertListener = (alert: Alert) => void;

/**
 * Alert service for managing alerts in the ETL system
 */
class AlertService {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private listeners: AlertListener[] = [];
  private maxAlerts: number = 1000;
  
  constructor() {
    this.createDefaultRules();
  }
  
  /**
   * Create default alert rules
   */
  private createDefaultRules(): void {
    // Job started rule
    this.addRule({
      id: 'rule-job-started',
      type: AlertType.JOB_STARTED,
      condition: () => true,
      severity: AlertSeverity.INFO,
      title: 'Job Started',
      message: (data) => `Job ${data.jobName} has started execution`,
      enabled: true
    });
    
    // Job completed rule
    this.addRule({
      id: 'rule-job-completed',
      type: AlertType.JOB_COMPLETED,
      condition: () => true,
      severity: AlertSeverity.INFO,
      title: 'Job Completed',
      message: (data) => `Job ${data.jobName} has completed successfully (${data.duration}ms)`,
      enabled: true
    });
    
    // Job failure rule
    this.addRule({
      id: 'rule-job-failure',
      type: AlertType.JOB_FAILURE,
      condition: () => true,
      severity: AlertSeverity.ERROR,
      title: 'Job Failed',
      message: (data) => `Job ${data.jobName} has failed: ${data.error}`,
      enabled: true
    });
    
    // Job cancelled rule
    this.addRule({
      id: 'rule-job-cancelled',
      type: AlertType.JOB_CANCELLED,
      condition: () => true,
      severity: AlertSeverity.WARNING,
      title: 'Job Cancelled',
      message: (data) => `Job ${data.jobName} was cancelled`,
      enabled: true
    });
    
    // Low data quality rule
    this.addRule({
      id: 'rule-low-data-quality',
      type: AlertType.DATA_QUALITY,
      condition: (data) => data.qualityScore < 0.7,
      severity: AlertSeverity.WARNING,
      title: 'Low Data Quality',
      message: (data) => `Job ${data.jobName} produced data with low quality score (${data.qualityScore})`,
      enabled: true
    });
    
    // Critical data quality rule
    this.addRule({
      id: 'rule-critical-data-quality',
      type: AlertType.DATA_QUALITY,
      condition: (data) => data.qualityScore < 0.5,
      severity: AlertSeverity.ERROR,
      title: 'Critical Data Quality',
      message: (data) => `Job ${data.jobName} produced data with critically low quality score (${data.qualityScore})`,
      enabled: true
    });
    
    // High error rate rule
    this.addRule({
      id: 'rule-high-error-rate',
      type: AlertType.DATA_QUALITY,
      condition: (data) => data.metrics && data.metrics.errorRecords > 100,
      severity: AlertSeverity.WARNING,
      title: 'High Error Rate',
      message: (data) => `Job ${data.jobName} had ${data.metrics.errorRecords} errors during processing`,
      enabled: true
    });
    
    // Connection failure rule
    this.addRule({
      id: 'rule-connection-failure',
      type: AlertType.CONNECTION,
      condition: () => true,
      severity: AlertSeverity.ERROR,
      title: 'Connection Failure',
      message: (data) => `Failed to connect to ${data.connectionName}: ${data.error}`,
      enabled: true
    });
    
    // Optimization suggestion rule
    this.addRule({
      id: 'rule-optimization-suggestion',
      type: AlertType.OPTIMIZATION,
      condition: () => true,
      severity: AlertSeverity.INFO,
      title: 'Optimization Suggestion',
      message: (data) => `New optimization suggestion for ${data.jobName}: ${data.suggestion}`,
      enabled: true
    });
  }
  
  /**
   * Add an alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }
  
  /**
   * Enable an alert rule
   */
  enableRule(ruleId: string): void {
    const rule = this.rules.find(rule => rule.id === ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }
  
  /**
   * Disable an alert rule
   */
  disableRule(ruleId: string): void {
    const rule = this.rules.find(rule => rule.id === ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }
  
  /**
   * Add alert listener
   */
  addListener(listener: AlertListener): () => void {
    this.listeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return this.alerts;
  }
  
  /**
   * Get alerts by job
   */
  getAlertsByJob(jobId: string): Alert[] {
    return this.alerts.filter(alert => alert.jobId === jobId);
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.state === AlertState.ACTIVE);
  }
  
  /**
   * Get alerts by type
   */
  getAlertsByType(type: AlertType): Alert[] {
    return this.alerts.filter(alert => alert.type === type);
  }
  
  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }
  
  /**
   * Create an alert from a job event
   */
  createAlert(type: AlertType, data: Record<string, any>): Alert {
    // Find matching rules
    const matchingRules = this.rules.filter(rule => 
      rule.type === type && 
      rule.enabled && 
      rule.condition(data)
    );
    
    if (matchingRules.length === 0) {
      // No matching rules, don't create an alert
      return null;
    }
    
    // Use the highest severity rule that matched
    const ruleSeverityOrder = [
      AlertSeverity.INFO,
      AlertSeverity.WARNING,
      AlertSeverity.ERROR,
      AlertSeverity.CRITICAL
    ];
    
    matchingRules.sort((a, b) => 
      ruleSeverityOrder.indexOf(b.severity) - ruleSeverityOrder.indexOf(a.severity)
    );
    
    const rule = matchingRules[0];
    
    // Generate message if it's a function
    const message = typeof rule.message === 'function' 
      ? rule.message(data) 
      : rule.message;
    
    // Create the alert
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: rule.title,
      message,
      severity: rule.severity,
      timestamp: new Date(),
      state: AlertState.ACTIVE,
      jobId: data.jobId,
      jobName: data.jobName,
      details: { ...data }
    };
    
    // Add the alert to the list
    this.addAlert(alert);
    
    return alert;
  }
  
  /**
   * Add an alert to the list
   */
  private addAlert(alert: Alert): void {
    this.alerts.unshift(alert);
    
    // Trim the alerts list if it's too long
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }
    
    // Notify listeners
    this.notifyListeners(alert);
  }
  
  /**
   * Notify listeners of a new alert
   */
  private notifyListeners(alert: Alert): void {
    for (const listener of this.listeners) {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    }
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.state = AlertState.ACKNOWLEDGED;
      alert.updatedAt = new Date();
    }
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.state = AlertState.RESOLVED;
      alert.updatedAt = new Date();
    }
  }
  
  /**
   * Dismiss an alert
   */
  dismissAlert(alertId: string): void {
    const alert = this.alerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.state = AlertState.DISMISSED;
      alert.updatedAt = new Date();
    }
  }
  
  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }
  
  /**
   * Create a job started alert
   */
  createJobStartedAlert(job: ETLJob): Alert {
    return this.createAlert(AlertType.JOB_STARTED, {
      jobId: job.id,
      jobName: job.name
    });
  }
  
  /**
   * Create a job completed alert
   */
  createJobCompletedAlert(job: ETLJob, duration: number): Alert {
    return this.createAlert(AlertType.JOB_COMPLETED, {
      jobId: job.id,
      jobName: job.name,
      duration
    });
  }
  
  /**
   * Create a job failure alert
   */
  createJobFailureAlert(job: ETLJob, error: any): Alert {
    return this.createAlert(AlertType.JOB_FAILURE, {
      jobId: job.id,
      jobName: job.name,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  /**
   * Create a job cancelled alert
   */
  createJobCancelledAlert(job: ETLJob): Alert {
    return this.createAlert(AlertType.JOB_CANCELLED, {
      jobId: job.id,
      jobName: job.name
    });
  }
  
  /**
   * Create a data quality alert
   */
  createDataQualityAlert(job: ETLJob, qualityScore: number, details?: Record<string, any>): Alert {
    return this.createAlert(AlertType.DATA_QUALITY, {
      jobId: job.id,
      jobName: job.name,
      qualityScore,
      ...details
    });
  }
  
  /**
   * Create a connection failure alert
   */
  createConnectionFailureAlert(
    connectionName: string, 
    connectionType: string, 
    error: any, 
    details?: Record<string, any>
  ): Alert {
    return this.createAlert(AlertType.CONNECTION, {
      connectionName,
      connectionType,
      error: error instanceof Error ? error.message : String(error),
      ...details
    });
  }
}

// Export a singleton instance
export const alertService = new AlertService();