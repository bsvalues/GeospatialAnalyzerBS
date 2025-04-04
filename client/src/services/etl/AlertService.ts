/**
 * Alert service
 * 
 * This service handles the creation, management, and notification of alerts
 * throughout the ETL pipeline.
 */

/**
 * Alert type
 */
export enum AlertType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

/**
 * Alert severity
 */
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Alert category
 */
export enum AlertCategory {
  SYSTEM = 'SYSTEM',
  DATA_SOURCE = 'DATA_SOURCE',
  TRANSFORMATION = 'TRANSFORMATION',
  SCHEDULING = 'SCHEDULING',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER = 'USER'
}

/**
 * Alert status
 */
export enum AlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
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
  category: AlertCategory;
  status: AlertStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

/**
 * Create alert options
 */
export interface CreateAlertOptions {
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  metadata?: Record<string, any>;
}

/**
 * Update alert options
 */
export interface UpdateAlertOptions {
  status?: AlertStatus;
  metadata?: Record<string, any>;
}

/**
 * Alert filter options
 */
export interface AlertFilterOptions {
  types?: AlertType[];
  severities?: AlertSeverity[];
  categories?: AlertCategory[];
  statuses?: AlertStatus[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Alert listener callback
 */
export type AlertListenerCallback = (alert: Alert) => void;

/**
 * Alert service class
 */
class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private listeners: Map<string, AlertListenerCallback[]> = new Map();
  private nextId = 1;
  
  /**
   * Create a new alert
   */
  createAlert(options: CreateAlertOptions): Alert {
    const id = `alert-${this.nextId++}`;
    const now = new Date();
    
    const alert: Alert = {
      id,
      status: AlertStatus.NEW,
      createdAt: now,
      updatedAt: now,
      ...options
    };
    
    this.alerts.set(id, alert);
    
    // Notify listeners
    this.notifyListeners('create', alert);
    
    return alert;
  }
  
  /**
   * Get an alert by ID
   */
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }
  
  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
  
  /**
   * Get filtered alerts
   */
  getFilteredAlerts(options: AlertFilterOptions): Alert[] {
    let alerts = this.getAllAlerts();
    
    // Apply filters
    if (options.types && options.types.length > 0) {
      alerts = alerts.filter(alert => options.types!.includes(alert.type));
    }
    
    if (options.severities && options.severities.length > 0) {
      alerts = alerts.filter(alert => options.severities!.includes(alert.severity));
    }
    
    if (options.categories && options.categories.length > 0) {
      alerts = alerts.filter(alert => options.categories!.includes(alert.category));
    }
    
    if (options.statuses && options.statuses.length > 0) {
      alerts = alerts.filter(alert => options.statuses!.includes(alert.status));
    }
    
    if (options.startDate) {
      alerts = alerts.filter(alert => alert.createdAt >= options.startDate!);
    }
    
    if (options.endDate) {
      alerts = alerts.filter(alert => alert.createdAt <= options.endDate!);
    }
    
    if (options.search) {
      const search = options.search.toLowerCase();
      alerts = alerts.filter(
        alert =>
          alert.title.toLowerCase().includes(search) ||
          alert.message.toLowerCase().includes(search)
      );
    }
    
    return alerts;
  }
  
  /**
   * Update an alert
   */
  updateAlert(id: string, options: UpdateAlertOptions): Alert | undefined {
    const alert = this.alerts.get(id);
    
    if (!alert) {
      return undefined;
    }
    
    const now = new Date();
    const updatedAlert: Alert = {
      ...alert,
      ...options,
      updatedAt: now
    };
    
    // Set additional timestamps based on status
    if (options.status) {
      switch (options.status) {
        case AlertStatus.ACKNOWLEDGED:
          updatedAlert.acknowledgedAt = now;
          break;
          
        case AlertStatus.RESOLVED:
          updatedAlert.resolvedAt = now;
          break;
          
        case AlertStatus.CLOSED:
          updatedAlert.closedAt = now;
          break;
      }
    }
    
    this.alerts.set(id, updatedAlert);
    
    // Notify listeners
    this.notifyListeners('update', updatedAlert);
    
    return updatedAlert;
  }
  
  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    
    if (!alert) {
      return false;
    }
    
    this.alerts.delete(id);
    
    // Notify listeners
    this.notifyListeners('delete', alert);
    
    return true;
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(id: string): Alert | undefined {
    return this.updateAlert(id, { status: AlertStatus.ACKNOWLEDGED });
  }
  
  /**
   * Resolve an alert
   */
  resolveAlert(id: string): Alert | undefined {
    return this.updateAlert(id, { status: AlertStatus.RESOLVED });
  }
  
  /**
   * Close an alert
   */
  closeAlert(id: string): Alert | undefined {
    return this.updateAlert(id, { status: AlertStatus.CLOSED });
  }
  
  /**
   * Add an alert listener
   */
  addListener(event: 'create' | 'update' | 'delete', callback: AlertListenerCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
  }
  
  /**
   * Remove an alert listener
   */
  removeListener(event: 'create' | 'update' | 'delete', callback: AlertListenerCallback): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  /**
   * Notify listeners of an event
   */
  private notifyListeners(event: 'create' | 'update' | 'delete', alert: Alert): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    for (const callback of this.listeners.get(event)!) {
      try {
        callback(alert);
      } catch (error) {
        console.error(`Error in alert listener for event '${event}':`, error);
      }
    }
  }
  
  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    byStatus: Record<AlertStatus, number>;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const alerts = this.getAllAlerts();
    
    const stats = {
      total: alerts.length,
      byStatus: {
        [AlertStatus.NEW]: 0,
        [AlertStatus.ACKNOWLEDGED]: 0,
        [AlertStatus.RESOLVED]: 0,
        [AlertStatus.CLOSED]: 0
      },
      byType: {
        [AlertType.INFO]: 0,
        [AlertType.SUCCESS]: 0,
        [AlertType.WARNING]: 0,
        [AlertType.ERROR]: 0
      },
      bySeverity: {
        [AlertSeverity.LOW]: 0,
        [AlertSeverity.MEDIUM]: 0,
        [AlertSeverity.HIGH]: 0,
        [AlertSeverity.CRITICAL]: 0
      },
      byCategory: {
        [AlertCategory.SYSTEM]: 0,
        [AlertCategory.DATA_SOURCE]: 0,
        [AlertCategory.TRANSFORMATION]: 0,
        [AlertCategory.SCHEDULING]: 0,
        [AlertCategory.SECURITY]: 0,
        [AlertCategory.PERFORMANCE]: 0,
        [AlertCategory.USER]: 0
      }
    };
    
    // Count alerts by status, type, severity, and category
    for (const alert of alerts) {
      stats.byStatus[alert.status]++;
      stats.byType[alert.type]++;
      stats.bySeverity[alert.severity]++;
      stats.byCategory[alert.category]++;
    }
    
    return stats;
  }
}

// Export a singleton instance
export const alertService = new AlertService();