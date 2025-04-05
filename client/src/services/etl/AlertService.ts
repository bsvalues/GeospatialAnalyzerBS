/**
 * Alert Service
 * 
 * This service is responsible for managing ETL system alerts.
 */

/**
 * Alert type enum
 */
export enum AlertType {
  INFO = 0,
  SUCCESS = 1,
  WARNING = 2,
  ERROR = 3
}

/**
 * Alert severity enum
 */
export enum AlertSeverity {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Alert category enum
 */
export enum AlertCategory {
  SYSTEM = 0,
  JOB = 1,
  DATA_SOURCE = 2,
  TRANSFORMATION = 3,
  VALIDATION = 4,
  SECURITY = 5,
  PERFORMANCE = 6
}

/**
 * Alert interface
 */
export interface Alert {
  /** Alert ID */
  id: string;
  
  /** Alert type */
  type: AlertType;
  
  /** Alert severity */
  severity: AlertSeverity;
  
  /** Alert category */
  category: AlertCategory;
  
  /** Alert title */
  title: string;
  
  /** Alert message */
  message: string;
  
  /** Alert timestamp */
  timestamp: Date;
  
  /** Whether the alert has been read */
  read: boolean;
  
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
  
  /** Related entity ID (job ID, data source ID, etc.) */
  entityId?: string | number;
  
  /** Additional data */
  data?: Record<string, any>;
}

/**
 * Alert payload interface
 */
export interface AlertPayload {
  /** Alert type */
  type: AlertType;
  
  /** Alert severity */
  severity: AlertSeverity;
  
  /** Alert category */
  category: AlertCategory;
  
  /** Alert title */
  title: string;
  
  /** Alert message */
  message: string;
  
  /** Related entity ID (job ID, data source ID, etc.) */
  entityId?: string | number;
  
  /** Additional data */
  data?: Record<string, any>;
}

/**
 * Alert filter options
 */
export interface AlertFilterOptions {
  /** Filter by type */
  type?: AlertType;
  
  /** Filter by severity */
  severity?: AlertSeverity;
  
  /** Filter by category */
  category?: AlertCategory;
  
  /** Filter by read status */
  read?: boolean;
  
  /** Filter by acknowledged status */
  acknowledged?: boolean;
  
  /** Filter by entity ID */
  entityId?: string | number;
  
  /** Filter by search text (in title or message) */
  searchText?: string;
  
  /** Filter by timestamp (from) */
  timestampFrom?: Date;
  
  /** Filter by timestamp (to) */
  timestampTo?: Date;
  
  /** Maximum number of alerts to return */
  limit?: number;
  
  /** Sort field */
  sortBy?: 'timestamp' | 'type' | 'severity' | 'category';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Alert statistics
 */
export interface AlertStats {
  /** Total number of alerts */
  total: number;
  
  /** Number of unread alerts */
  unread: number;
  
  /** Number of unacknowledged alerts */
  unacknowledged: number;
  
  /** Alerts by type */
  byType: Record<AlertType, number>;
  
  /** Alerts by severity */
  bySeverity: Record<AlertSeverity, number>;
  
  /** Alerts by category */
  byCategory: Record<AlertCategory, number>;
}

type AlertListener = () => void;

/**
 * Alert Service
 * 
 * This service manages ETL system alerts.
 */
class AlertService {
  private nextId = 1;
  private alerts: Record<string, Alert> = {};
  private listeners: AlertListener[] = [];
  private maxAlerts = 1000;
  
  /**
   * Create a new alert
   */
  createAlert(payload: AlertPayload): Alert {
    // Generate ID
    const id = `alert-${this.nextId++}`;
    
    // Create alert
    const alert: Alert = {
      id,
      timestamp: new Date(),
      read: false,
      acknowledged: false,
      ...payload
    };
    
    // Add alert to record
    this.alerts[id] = alert;
    
    // If we have too many alerts, remove the oldest ones
    const alertCount = Object.keys(this.alerts).length;
    if (alertCount > this.maxAlerts) {
      const alertsToDelete = Object.entries(this.alerts)
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, alertCount - this.maxAlerts)
        .map(([id]) => id);
        
      for (const id of alertsToDelete) {
        delete this.alerts[id];
      }
    }
    
    // Notify listeners
    this.notifyListeners();
    
    // Log to console if severity is high or critical
    if (alert.severity >= AlertSeverity.HIGH) {
      console.warn(`[ETL Alert] ${AlertType[alert.type]}: ${alert.title} - ${alert.message}`);
    }
    
    return alert;
  }
  
  /**
   * Get an alert by ID
   */
  getAlert(id: string): Alert | undefined {
    return this.alerts[id];
  }
  
  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Object.values(this.alerts)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Filter alerts
   */
  filterAlerts(options: AlertFilterOptions): Alert[] {
    let filtered = this.getAllAlerts();
    
    // Apply filters
    if (options.type !== undefined) {
      filtered = filtered.filter(alert => alert.type === options.type);
    }
    
    if (options.severity !== undefined) {
      filtered = filtered.filter(alert => alert.severity === options.severity);
    }
    
    if (options.category !== undefined) {
      filtered = filtered.filter(alert => alert.category === options.category);
    }
    
    if (options.read !== undefined) {
      filtered = filtered.filter(alert => alert.read === options.read);
    }
    
    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === options.acknowledged);
    }
    
    if (options.entityId !== undefined) {
      filtered = filtered.filter(alert => alert.entityId === options.entityId);
    }
    
    if (options.searchText) {
      const searchText = options.searchText.toLowerCase();
      filtered = filtered.filter(
        alert => 
          alert.title.toLowerCase().includes(searchText) || 
          alert.message.toLowerCase().includes(searchText)
      );
    }
    
    if (options.timestampFrom) {
      filtered = filtered.filter(alert => alert.timestamp >= options.timestampFrom!);
    }
    
    if (options.timestampTo) {
      filtered = filtered.filter(alert => alert.timestamp <= options.timestampTo!);
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'timestamp';
    const sortDirection = options.sortDirection || 'desc';
    
    filtered.sort((a, b) => {
      let comparison: number;
      
      switch (sortBy) {
        case 'type':
          comparison = a.type - b.type;
          break;
        case 'severity':
          comparison = a.severity - b.severity;
          break;
        case 'category':
          comparison = a.category - b.category;
          break;
        case 'timestamp':
        default:
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  /**
   * Mark an alert as read
   */
  markAsRead(id: string): boolean {
    const alert = this.alerts[id];
    
    if (!alert || alert.read) {
      return false;
    }
    
    alert.read = true;
    this.notifyListeners();
    
    return true;
  }
  
  /**
   * Mark an alert as unread
   */
  markAsUnread(id: string): boolean {
    const alert = this.alerts[id];
    
    if (!alert || !alert.read) {
      return false;
    }
    
    alert.read = false;
    this.notifyListeners();
    
    return true;
  }
  
  /**
   * Mark all alerts as read
   */
  markAllAsRead(): number {
    let count = 0;
    
    for (const alert of Object.values(this.alerts)) {
      if (!alert.read) {
        alert.read = true;
        count++;
      }
    }
    
    if (count > 0) {
      this.notifyListeners();
    }
    
    return count;
  }
  
  /**
   * Mark an alert as acknowledged
   */
  acknowledge(id: string): boolean {
    const alert = this.alerts[id];
    
    if (!alert || alert.acknowledged) {
      return false;
    }
    
    alert.acknowledged = true;
    this.notifyListeners();
    
    return true;
  }
  
  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    const alertExists = id in this.alerts;
    
    if (alertExists) {
      delete this.alerts[id];
      this.notifyListeners();
    }
    
    return alertExists;
  }
  
  /**
   * Delete all alerts
   */
  clearAlerts(): number {
    const count = Object.keys(this.alerts).length;
    
    if (count > 0) {
      this.alerts = {};
      this.notifyListeners();
    }
    
    return count;
  }
  
  /**
   * Delete alerts by filter
   */
  deleteAlerts(options: AlertFilterOptions): number {
    const alertsToDelete = this.filterAlerts(options);
    
    if (alertsToDelete.length === 0) {
      return 0;
    }
    
    for (const alert of alertsToDelete) {
      delete this.alerts[alert.id];
    }
    
    this.notifyListeners();
    
    return alertsToDelete.length;
  }
  
  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alertCount = Object.keys(this.alerts).length;
    
    const stats: AlertStats = {
      total: alertCount,
      unread: 0,
      unacknowledged: 0,
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
        [AlertCategory.JOB]: 0,
        [AlertCategory.DATA_SOURCE]: 0,
        [AlertCategory.TRANSFORMATION]: 0,
        [AlertCategory.VALIDATION]: 0,
        [AlertCategory.SECURITY]: 0,
        [AlertCategory.PERFORMANCE]: 0
      }
    };
    
    for (const alert of Object.values(this.alerts)) {
      if (!alert.read) {
        stats.unread++;
      }
      
      if (!alert.acknowledged) {
        stats.unacknowledged++;
      }
      
      stats.byType[alert.type]++;
      stats.bySeverity[alert.severity]++;
      stats.byCategory[alert.category]++;
    }
    
    return stats;
  }
  
  /**
   * Add a listener for alert changes
   */
  addListener(listener: AlertListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener: AlertListener): void {
    const index = this.listeners.indexOf(listener);
    
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();