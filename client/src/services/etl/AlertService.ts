/**
 * AlertService is responsible for monitoring ETL jobs and creating alerts
 * when issues are detected.
 */

import { ETLJob } from './ETLTypes';
import { JobRun } from './ETLPipelineManager';

/**
 * Alert Types
 */
export enum AlertType {
  JOB_FAILURE = 'JOB_FAILURE',
  DATA_QUALITY = 'DATA_QUALITY',
  PERFORMANCE = 'PERFORMANCE',
  SCHEDULED_JOB_MISSED = 'SCHEDULED_JOB_MISSED',
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM'
}

/**
 * Alert Severity Levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Alert State
 */
export enum AlertState {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SILENCED = 'silenced'
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  jobId?: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  details?: any;
  state: AlertState;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  silencedUntil?: Date;
  notificationSent: boolean;
}

/**
 * Alert Creation interface
 */
export interface AlertCreation {
  jobId?: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  details?: any;
}

/**
 * Alert Rule types
 */
export enum AlertRuleType {
  JOB_FAILURE = 'JOB_FAILURE',
  JOB_DURATION = 'JOB_DURATION',
  RECORD_COUNT = 'RECORD_COUNT',
  ERROR_RATE = 'ERROR_RATE',
  SCHEDULED_JOB_MISSED = 'SCHEDULED_JOB_MISSED',
  CUSTOM = 'CUSTOM'
}

/**
 * Alert Rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: AlertRuleType;
  jobId?: string; // If null, applies to all jobs
  enabled: boolean;
  severity: AlertSeverity;
  conditions: any; // Depends on rule type
  throttling?: {
    silenceDuration: number; // Minutes
    maxAlertsPerHour: number;
  };
  notificationChannels?: string[];
}

class AlertService {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  
  constructor() {
    // Initialize with default rules
  }
  
  /**
   * Create default monitoring rules
   */
  createDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-1',
        name: 'Job Failure',
        description: 'Alert when a job fails',
        type: AlertRuleType.JOB_FAILURE,
        enabled: true,
        severity: AlertSeverity.ERROR,
        conditions: {
          status: 'failed'
        }
      },
      {
        id: 'rule-2',
        name: 'Long Running Job',
        description: 'Alert when a job takes too long to complete',
        type: AlertRuleType.JOB_DURATION,
        enabled: true,
        severity: AlertSeverity.WARNING,
        conditions: {
          durationThreshold: 30 * 60 * 1000 // 30 minutes
        }
      },
      {
        id: 'rule-3',
        name: 'Low Record Count',
        description: 'Alert when a job processes fewer records than expected',
        type: AlertRuleType.RECORD_COUNT,
        enabled: true,
        severity: AlertSeverity.WARNING,
        conditions: {
          minRecords: 100
        }
      },
      {
        id: 'rule-4',
        name: 'Missed Scheduled Job',
        description: 'Alert when a scheduled job is missed',
        type: AlertRuleType.SCHEDULED_JOB_MISSED,
        enabled: true,
        severity: AlertSeverity.WARNING,
        conditions: {
          toleranceMinutes: 30
        }
      }
    ] as AlertRule[];
  }
  
  /**
   * Get all alerts
   */
  getAlerts(): Alert[] {
    return this.alerts;
  }
  
  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.state === AlertState.ACTIVE);
  }
  
  /**
   * Get alerts by job ID
   */
  getAlertsByJob(jobId: string): Alert[] {
    return this.alerts.filter(alert => alert.jobId === jobId);
  }
  
  /**
   * Create an alert
   */
  createAlert(alertCreation: AlertCreation): Alert {
    const now = new Date();
    
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      jobId: alertCreation.jobId,
      severity: alertCreation.severity,
      type: alertCreation.type,
      message: alertCreation.message,
      details: alertCreation.details,
      state: AlertState.ACTIVE,
      createdAt: now,
      updatedAt: now,
      notificationSent: false
    };
    
    this.alerts.push(alert);
    
    // In a real implementation, this would also send notifications
    // based on the alert severity and notification channels
    console.log(`Alert created: ${alert.message}`);
    
    return alert;
  }
  
  /**
   * Mark an alert as acknowledged
   */
  acknowledgeAlert(alertId: string): Alert | undefined {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert && alert.state === AlertState.ACTIVE) {
      alert.state = AlertState.ACKNOWLEDGED;
      alert.acknowledgedAt = new Date();
      alert.updatedAt = new Date();
      console.log(`Alert ${alertId} acknowledged`);
    }
    
    return alert;
  }
  
  /**
   * Mark an alert as resolved
   */
  resolveAlert(alertId: string): Alert | undefined {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert && (alert.state === AlertState.ACTIVE || alert.state === AlertState.ACKNOWLEDGED)) {
      alert.state = AlertState.RESOLVED;
      alert.resolvedAt = new Date();
      alert.updatedAt = new Date();
      console.log(`Alert ${alertId} resolved`);
    }
    
    return alert;
  }
  
  /**
   * Silence an alert for a duration
   */
  silenceAlert(alertId: string, durationMinutes: number): Alert | undefined {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert && alert.state === AlertState.ACTIVE) {
      const silencedUntil = new Date();
      silencedUntil.setMinutes(silencedUntil.getMinutes() + durationMinutes);
      
      alert.state = AlertState.SILENCED;
      alert.silencedUntil = silencedUntil;
      alert.updatedAt = new Date();
      console.log(`Alert ${alertId} silenced until ${silencedUntil.toISOString()}`);
    }
    
    return alert;
  }
  
  /**
   * Process job run to check for alerts
   */
  processJobRun(jobRun: JobRun, job: ETLJob): void {
    // Check each rule
    for (const rule of this.rules.filter(r => r.enabled && (!r.jobId || r.jobId === job.id))) {
      switch (rule.type) {
        case AlertRuleType.JOB_FAILURE:
          // Check if job failed
          if (jobRun.status === 'failed') {
            this.createAlert({
              jobId: job.id,
              severity: rule.severity,
              type: AlertType.JOB_FAILURE,
              message: `Job "${job.name}" failed`,
              details: {
                runId: jobRun.id,
                errors: jobRun.errors
              }
            });
          }
          break;
        
        case AlertRuleType.JOB_DURATION:
          // Check if job took too long
          if (jobRun.endTime) {
            const duration = new Date(jobRun.endTime).getTime() - new Date(jobRun.startTime).getTime();
            if (duration > rule.conditions.durationThreshold) {
              this.createAlert({
                jobId: job.id,
                severity: rule.severity,
                type: AlertType.PERFORMANCE,
                message: `Job "${job.name}" took too long to complete (${Math.round(duration / 1000)}s)`,
                details: {
                  runId: jobRun.id,
                  duration,
                  threshold: rule.conditions.durationThreshold
                }
              });
            }
          }
          break;
        
        case AlertRuleType.RECORD_COUNT:
          // Check if job processed enough records
          if (jobRun.recordsProcessed < rule.conditions.minRecords) {
            this.createAlert({
              jobId: job.id,
              severity: rule.severity,
              type: AlertType.DATA_QUALITY,
              message: `Job "${job.name}" processed fewer records than expected (${jobRun.recordsProcessed} < ${rule.conditions.minRecords})`,
              details: {
                runId: jobRun.id,
                recordsProcessed: jobRun.recordsProcessed,
                minRecords: rule.conditions.minRecords
              }
            });
          }
          break;
      }
    }
  }
  
  /**
   * Add a custom rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return this.rules;
  }
  
  /**
   * Clear expired silenced alerts
   */
  clearExpiredSilences(): void {
    const now = new Date();
    
    for (const alert of this.alerts) {
      if (alert.state === AlertState.SILENCED && alert.silencedUntil && alert.silencedUntil < now) {
        alert.state = AlertState.ACTIVE;
        alert.updatedAt = now;
        console.log(`Silence expired for alert ${alert.id}`);
      }
    }
  }
}

// Export a singleton instance
export const alertService = new AlertService();