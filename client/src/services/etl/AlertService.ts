/**
 * Alert Service
 * 
 * Provides functionality for creating, managing, and distributing alerts
 * throughout the ETL system.
 */

/**
 * Alert type enum
 */
export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

/**
 * Alert severity enum
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Alert state enum
 */
export enum AlertState {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

/**
 * Alert category enum
 */
export enum AlertCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  DATA_QUALITY = 'data_quality',
  CONNECTIVITY = 'connectivity',
  TRANSFORMATION = 'transformation',
  SCHEDULING = 'scheduling',
  CUSTOM = 'custom'
}

/**
 * Alert interface
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  state: AlertState;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  expiresAt?: Date;
  jobId?: number;
  sourceId?: number;
  ruleId?: number;
  details?: any;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  dismissedAt?: Date;
  userId?: string;
}

/**
 * Alert creation options interface
 */
export interface AlertOptions {
  type: AlertType;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  expiresIn?: number; // in milliseconds
  jobId?: number;
  sourceId?: number;
  ruleId?: number;
  details?: any;
  userId?: string;
}

/**
 * Alert filter options interface
 */
export interface AlertFilterOptions {
  type?: AlertType;
  severity?: AlertSeverity;
  state?: AlertState;
  category?: AlertCategory;
  jobId?: number;
  sourceId?: number;
  ruleId?: number;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Alert listener callback function type
 */
export type AlertListenerCallback = (alert: Alert) => void;

/**
 * Alert service class
 */
class AlertService {
  private alerts: Alert[] = [];
  private listeners: Map<string, AlertListenerCallback[]> = new Map();
  private nextId = 1;
  
  constructor() {
    console.log('Alert service initialized');
    this.createDefaultRules();
  }
  
  /**
   * Create a new alert
   */
  createAlert(options: AlertOptions): Alert {
    const now = new Date();
    
    const alert: Alert = {
      id: `alert-${this.nextId++}`,
      type: options.type,
      severity: options.severity,
      state: AlertState.NEW,
      category: options.category,
      title: options.title,
      message: options.message,
      timestamp: now,
      expiresAt: options.expiresIn ? new Date(now.getTime() + options.expiresIn) : undefined,
      jobId: options.jobId,
      sourceId: options.sourceId,
      ruleId: options.ruleId,
      details: options.details,
      createdAt: now,
      updatedAt: now,
      userId: options.userId
    };
    
    this.alerts.push(alert);
    
    // Notify listeners
    this.notifyListeners(alert);
    
    return alert;
  }
  
  /**
   * Get all alerts, optionally filtered
   */
  getAlerts(filter?: AlertFilterOptions): Alert[] {
    if (!filter) {
      return [...this.alerts];
    }
    
    return this.alerts.filter(alert => {
      if (filter.type && alert.type !== filter.type) {
        return false;
      }
      
      if (filter.severity && alert.severity !== filter.severity) {
        return false;
      }
      
      if (filter.state && alert.state !== filter.state) {
        return false;
      }
      
      if (filter.category && alert.category !== filter.category) {
        return false;
      }
      
      if (filter.jobId !== undefined && alert.jobId !== filter.jobId) {
        return false;
      }
      
      if (filter.sourceId !== undefined && alert.sourceId !== filter.sourceId) {
        return false;
      }
      
      if (filter.ruleId !== undefined && alert.ruleId !== filter.ruleId) {
        return false;
      }
      
      if (filter.userId && alert.userId !== filter.userId) {
        return false;
      }
      
      if (filter.fromDate && alert.timestamp < filter.fromDate) {
        return false;
      }
      
      if (filter.toDate && alert.timestamp > filter.toDate) {
        return false;
      }
      
      return true;
    })
    .slice(filter.offset || 0, filter.limit ? (filter.offset || 0) + filter.limit : undefined);
  }
  
  /**
   * Get a specific alert by ID
   */
  getAlertById(id: string): Alert | undefined {
    return this.alerts.find(alert => alert.id === id);
  }
  
  /**
   * Update the state of an alert
   */
  updateAlertState(id: string, state: AlertState, userId?: string): boolean {
    const alert = this.getAlertById(id);
    
    if (!alert) {
      return false;
    }
    
    const now = new Date();
    
    alert.state = state;
    alert.updatedAt = now;
    
    if (userId) {
      alert.userId = userId;
    }
    
    switch (state) {
      case AlertState.ACKNOWLEDGED:
        alert.acknowledgedAt = now;
        break;
      
      case AlertState.RESOLVED:
        alert.resolvedAt = now;
        break;
      
      case AlertState.DISMISSED:
        alert.dismissedAt = now;
        break;
    }
    
    // Notify listeners of the state change
    this.notifyListeners(alert);
    
    return true;
  }
  
  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    return this.alerts.length !== initialLength;
  }
  
  /**
   * Add a listener for alerts
   */
  addListener(id: string, callback: AlertListenerCallback): void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    
    this.listeners.get(id)?.push(callback);
  }
  
  /**
   * Remove a listener
   */
  removeListener(id: string): boolean {
    return this.listeners.delete(id);
  }
  
  /**
   * Notify all listeners of a new or updated alert
   */
  private notifyListeners(alert: Alert): void {
    for (const listeners of this.listeners.values()) {
      for (const listener of listeners) {
        try {
          listener(alert);
        } catch (error) {
          console.error('Error in alert listener:', error);
        }
      }
    }
  }
  
  /**
   * Clear expired alerts
   */
  clearExpiredAlerts(): Alert[] {
    const now = new Date();
    const expiredAlerts = this.alerts.filter(alert => alert.expiresAt && alert.expiresAt < now);
    
    this.alerts = this.alerts.filter(alert => !alert.expiresAt || alert.expiresAt >= now);
    
    return expiredAlerts;
  }
  
  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    byState: Record<AlertState, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const byType: Record<AlertType, number> = {
      [AlertType.INFO]: 0,
      [AlertType.WARNING]: 0,
      [AlertType.ERROR]: 0,
      [AlertType.SUCCESS]: 0
    };
    
    const bySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.LOW]: 0,
      [AlertSeverity.MEDIUM]: 0,
      [AlertSeverity.HIGH]: 0,
      [AlertSeverity.CRITICAL]: 0
    };
    
    const byState: Record<AlertState, number> = {
      [AlertState.NEW]: 0,
      [AlertState.ACKNOWLEDGED]: 0,
      [AlertState.RESOLVED]: 0,
      [AlertState.DISMISSED]: 0
    };
    
    const byCategory: Record<AlertCategory, number> = {
      [AlertCategory.SYSTEM]: 0,
      [AlertCategory.SECURITY]: 0,
      [AlertCategory.PERFORMANCE]: 0,
      [AlertCategory.DATA_QUALITY]: 0,
      [AlertCategory.CONNECTIVITY]: 0,
      [AlertCategory.TRANSFORMATION]: 0,
      [AlertCategory.SCHEDULING]: 0,
      [AlertCategory.CUSTOM]: 0
    };
    
    for (const alert of this.alerts) {
      byType[alert.type]++;
      bySeverity[alert.severity]++;
      byState[alert.state]++;
      byCategory[alert.category]++;
    }
    
    return {
      total: this.alerts.length,
      byType,
      bySeverity,
      byState,
      byCategory
    };
  }
  
  /**
   * Create default rules (example alerts)
   */
  private createDefaultRules(): void {
    // Add some example alerts
    this.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'System Startup',
      message: 'ETL system has been initialized'
    });
    
    this.createAlert({
      type: AlertType.SUCCESS,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'Database Connection Established',
      message: 'Successfully connected to the database'
    });
  }
}

// Export a singleton instance
export const alertService = new AlertService();