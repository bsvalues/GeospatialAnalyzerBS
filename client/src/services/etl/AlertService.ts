/**
 * Alert type enum
 */
export enum AlertType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

/**
 * Alert severity enum
 */
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Alert category enum
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
 * Alert state enum
 */
export enum AlertState {
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
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  state: AlertState;
  jobId?: number;
  userId?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Alert create options interface
 */
export interface AlertCreateOptions {
  type: AlertType;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  details?: string;
  jobId?: number;
  userId?: string;
  state?: AlertState;
}

/**
 * Alert update options interface
 */
export interface AlertUpdateOptions {
  state?: AlertState;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

/**
 * Alert filter options interface
 */
export interface AlertFilterOptions {
  type?: AlertType;
  severity?: AlertSeverity;
  category?: AlertCategory;
  state?: AlertState;
  startDate?: Date;
  endDate?: Date;
  jobId?: number;
  userId?: string;
  search?: string;
}

/**
 * Alert listener callback type
 */
export type AlertListenerCallback = (alert: Alert) => void;

/**
 * AlertService class
 */
class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private listeners: Map<string, AlertListenerCallback[]> = new Map();
  private nextId = 1;
  
  constructor() {
    this.createDefaultRules();
    console.log('AlertService initialized');
  }
  
  /**
   * Create an alert
   */
  createAlert(options: AlertCreateOptions): Alert {
    const id = this.generateAlertId();
    
    const alert: Alert = {
      id,
      type: options.type,
      severity: options.severity,
      category: options.category,
      title: options.title,
      message: options.message,
      details: options.details,
      timestamp: new Date(),
      state: options.state || AlertState.NEW,
      jobId: options.jobId,
      userId: options.userId
    };
    
    this.alerts.set(id, alert);
    this.notifyListeners(alert);
    
    console.log(`Alert created: ${id} - ${options.title}`);
    
    return alert;
  }
  
  /**
   * Update an alert
   */
  updateAlert(id: string, options: AlertUpdateOptions): Alert | null {
    const alert = this.alerts.get(id);
    
    if (!alert) {
      console.warn(`Alert not found: ${id}`);
      return null;
    }
    
    const updatedAlert = { ...alert };
    
    if (options.state !== undefined) {
      updatedAlert.state = options.state;
      
      // Set timestamps based on state change
      if (options.state === AlertState.ACKNOWLEDGED && !updatedAlert.acknowledgedAt) {
        updatedAlert.acknowledgedAt = new Date();
        updatedAlert.acknowledgedBy = options.acknowledgedBy;
      } else if (options.state === AlertState.RESOLVED && !updatedAlert.resolvedAt) {
        updatedAlert.resolvedAt = new Date();
        updatedAlert.resolvedBy = options.resolvedBy;
      }
    }
    
    // Update the alert
    this.alerts.set(id, updatedAlert);
    this.notifyListeners(updatedAlert);
    
    console.log(`Alert updated: ${id} - ${updatedAlert.title}`);
    
    return updatedAlert;
  }
  
  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
  
  /**
   * Get an alert by ID
   */
  getAlert(id: string): Alert | null {
    return this.alerts.get(id) || null;
  }
  
  /**
   * Get alerts with filtering
   */
  getAlerts(filter: AlertFilterOptions = {}): Alert[] {
    // Get all alerts
    let alerts = this.getAllAlerts();
    
    // Filter by type
    if (filter.type !== undefined) {
      alerts = alerts.filter(alert => alert.type === filter.type);
    }
    
    // Filter by severity
    if (filter.severity !== undefined) {
      alerts = alerts.filter(alert => alert.severity === filter.severity);
    }
    
    // Filter by category
    if (filter.category !== undefined) {
      alerts = alerts.filter(alert => alert.category === filter.category);
    }
    
    // Filter by state
    if (filter.state !== undefined) {
      alerts = alerts.filter(alert => alert.state === filter.state);
    }
    
    // Filter by job ID
    if (filter.jobId !== undefined) {
      alerts = alerts.filter(alert => alert.jobId === filter.jobId);
    }
    
    // Filter by user ID
    if (filter.userId !== undefined) {
      alerts = alerts.filter(alert => alert.userId === filter.userId);
    }
    
    // Filter by date range
    if (filter.startDate !== undefined) {
      alerts = alerts.filter(alert => alert.timestamp >= filter.startDate!);
    }
    
    if (filter.endDate !== undefined) {
      alerts = alerts.filter(alert => alert.timestamp <= filter.endDate!);
    }
    
    // Filter by search term (in title or message)
    if (filter.search !== undefined && filter.search.trim() !== '') {
      const searchLower = filter.search.toLowerCase();
      alerts = alerts.filter(
        alert => alert.title.toLowerCase().includes(searchLower) || 
                 alert.message.toLowerCase().includes(searchLower) ||
                 (alert.details && alert.details.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by timestamp (newest first)
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get alert counts by status
   */
  getAlertCounts(): {
    total: number;
    byState: Record<AlertState, number>;
    byType: Record<AlertType, number>;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const counts = {
      total: this.alerts.size,
      byState: {
        [AlertState.NEW]: 0,
        [AlertState.ACKNOWLEDGED]: 0,
        [AlertState.RESOLVED]: 0,
        [AlertState.CLOSED]: 0
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
    
    for (const alert of this.alerts.values()) {
      counts.byState[alert.state]++;
      counts.byType[alert.type]++;
      counts.bySeverity[alert.severity]++;
      counts.byCategory[alert.category]++;
    }
    
    return counts;
  }
  
  /**
   * Register a listener for alerts
   */
  addListener(listenerId: string, callback: AlertListenerCallback): void {
    if (!this.listeners.has(listenerId)) {
      this.listeners.set(listenerId, []);
    }
    
    this.listeners.get(listenerId)!.push(callback);
  }
  
  /**
   * Remove all listeners with the given ID
   */
  removeListener(listenerId: string): void {
    this.listeners.delete(listenerId);
  }
  
  /**
   * Notify all listeners of a new or updated alert
   */
  private notifyListeners(alert: Alert): void {
    for (const callbacks of this.listeners.values()) {
      for (const callback of callbacks) {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in alert listener callback:', error);
        }
      }
    }
  }
  
  /**
   * Generate a unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${this.nextId++}`;
  }
  
  /**
   * Create default alert rules for the system
   */
  private createDefaultRules(): void {
    // Create a system startup alert
    this.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'System Initialized',
      message: 'ETL system has been initialized',
      details: `Initialized at ${new Date().toISOString()}`
    });
  }
  
  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts.clear();
    console.log('All alerts cleared');
  }
  
  /**
   * Acknowledge all alerts
   */
  acknowledgeAllAlerts(userId?: string): void {
    for (const [id, alert] of this.alerts) {
      if (alert.state === AlertState.NEW) {
        this.updateAlert(id, {
          state: AlertState.ACKNOWLEDGED,
          acknowledgedBy: userId
        });
      }
    }
    
    console.log('All alerts acknowledged');
  }
  
  /**
   * Close alerts that are older than the specified number of days
   */
  closeOldAlerts(days: number = 30): number {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let closedCount = 0;
    
    for (const [id, alert] of this.alerts) {
      if (alert.timestamp < cutoffDate && alert.state !== AlertState.CLOSED) {
        this.updateAlert(id, {
          state: AlertState.CLOSED
        });
        closedCount++;
      }
    }
    
    console.log(`Closed ${closedCount} old alerts`);
    return closedCount;
  }
}

// Export a singleton instance
export const alertService = new AlertService();