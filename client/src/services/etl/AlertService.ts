/**
 * Alert service
 * 
 * This service manages alerts and notifications for the ETL system.
 */

/**
 * Alert type enum
 */
export enum AlertType {
  /** General information */
  INFO = 'INFO',
  
  /** Success message */
  SUCCESS = 'SUCCESS',
  
  /** Warning message */
  WARNING = 'WARNING',
  
  /** Error message */
  ERROR = 'ERROR'
}

/**
 * Alert severity level
 */
export enum AlertSeverity {
  /** Low severity (informational) */
  LOW = 'LOW',
  
  /** Medium severity (may require attention) */
  MEDIUM = 'MEDIUM',
  
  /** High severity (requires attention) */
  HIGH = 'HIGH',
  
  /** Critical severity (requires immediate action) */
  CRITICAL = 'CRITICAL'
}

/**
 * Alert category
 */
export enum AlertCategory {
  /** System-related alerts */
  SYSTEM = 'SYSTEM',
  
  /** Data source-related alerts */
  DATA_SOURCE = 'DATA_SOURCE',
  
  /** Job-related alerts */
  JOB = 'JOB',
  
  /** Transformation-related alerts */
  TRANSFORMATION = 'TRANSFORMATION',
  
  /** Data quality-related alerts */
  DATA_QUALITY = 'DATA_QUALITY',
  
  /** Authentication-related alerts */
  AUTHENTICATION = 'AUTHENTICATION',
  
  /** Security-related alerts */
  SECURITY = 'SECURITY',
  
  /** Performance-related alerts */
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Alert payload
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
  
  /** Alert metadata (optional) */
  metadata?: Record<string, any>;
  
  /** Context (e.g., job ID, data source ID) */
  context?: Record<string, any>;
}

/**
 * Alert interface
 */
export interface Alert extends AlertPayload {
  /** Alert ID */
  id: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Whether the alert has been read */
  read: boolean;
  
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
  
  /** Acknowledgement timestamp */
  acknowledgedAt?: Date;
  
  /** Resolution timestamp */
  resolvedAt?: Date;
}

/**
 * Alert filter options
 */
export interface AlertFilterOptions {
  /** Filter by alert type */
  type?: AlertType;
  
  /** Filter by alert severity */
  severity?: AlertSeverity;
  
  /** Filter by alert category */
  category?: AlertCategory;
  
  /** Filter by read status */
  read?: boolean;
  
  /** Filter by acknowledged status */
  acknowledged?: boolean;
  
  /** Filter by created after date */
  createdAfter?: Date;
  
  /** Filter by created before date */
  createdBefore?: Date;
  
  /** Filter by search text (in title and message) */
  searchText?: string;
}

/**
 * Alert stats
 */
export interface AlertStats {
  /** Total number of alerts */
  total: number;
  
  /** Number of unread alerts */
  unread: number;
  
  /** Number of acknowledged alerts */
  acknowledged: number;
  
  /** Number of alerts by type */
  byType: Record<AlertType, number>;
  
  /** Number of alerts by severity */
  bySeverity: Record<AlertSeverity, number>;
  
  /** Number of alerts by category */
  byCategory: Record<AlertCategory, number>;
}

/**
 * Alert service class
 */
class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private nextId = 1;
  
  /**
   * Create a new alert
   */
  createAlert(payload: AlertPayload): Alert {
    const id = `alert-${this.nextId++}`;
    const alert: Alert = {
      id,
      ...payload,
      createdAt: new Date(),
      read: false,
      acknowledged: false
    };
    
    this.alerts.set(id, alert);
    
    // In a real implementation, this would dispatch the alert via websocket, etc.
    console.log(`Alert created: ${alert.title} (${alert.type}, ${alert.severity})`);
    
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
    return Array.from(this.alerts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  /**
   * Get filtered alerts
   */
  getFilteredAlerts(options: AlertFilterOptions): Alert[] {
    return this.getAllAlerts().filter(alert => {
      // Apply filters
      if (options.type && alert.type !== options.type) {
        return false;
      }
      
      if (options.severity && alert.severity !== options.severity) {
        return false;
      }
      
      if (options.category && alert.category !== options.category) {
        return false;
      }
      
      if (options.read !== undefined && alert.read !== options.read) {
        return false;
      }
      
      if (options.acknowledged !== undefined && alert.acknowledged !== options.acknowledged) {
        return false;
      }
      
      if (options.createdAfter && alert.createdAt < options.createdAfter) {
        return false;
      }
      
      if (options.createdBefore && alert.createdAt > options.createdBefore) {
        return false;
      }
      
      if (options.searchText) {
        const searchTextLower = options.searchText.toLowerCase();
        const titleLower = alert.title.toLowerCase();
        const messageLower = alert.message.toLowerCase();
        
        if (!titleLower.includes(searchTextLower) && !messageLower.includes(searchTextLower)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Mark an alert as read
   */
  markAsRead(id: string): boolean {
    const alert = this.getAlert(id);
    
    if (!alert) {
      return false;
    }
    
    alert.read = true;
    return true;
  }
  
  /**
   * Mark an alert as unread
   */
  markAsUnread(id: string): boolean {
    const alert = this.getAlert(id);
    
    if (!alert) {
      return false;
    }
    
    alert.read = false;
    return true;
  }
  
  /**
   * Mark all alerts as read
   */
  markAllAsRead(): number {
    let count = 0;
    
    for (const alert of this.alerts.values()) {
      if (!alert.read) {
        alert.read = true;
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(id: string): boolean {
    const alert = this.getAlert(id);
    
    if (!alert) {
      return false;
    }
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.read = true; // Also mark as read
    
    return true;
  }
  
  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    return this.alerts.delete(id);
  }
  
  /**
   * Delete all alerts
   */
  deleteAllAlerts(): number {
    const count = this.alerts.size;
    this.alerts.clear();
    return count;
  }
  
  /**
   * Get alert statistics
   */
  getAlertStats(): AlertStats {
    const stats: AlertStats = {
      total: 0,
      unread: 0,
      acknowledged: 0,
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
        [AlertCategory.JOB]: 0,
        [AlertCategory.TRANSFORMATION]: 0,
        [AlertCategory.DATA_QUALITY]: 0,
        [AlertCategory.AUTHENTICATION]: 0,
        [AlertCategory.SECURITY]: 0,
        [AlertCategory.PERFORMANCE]: 0
      }
    };
    
    // Calculate stats
    for (const alert of this.alerts.values()) {
      stats.total++;
      
      if (!alert.read) {
        stats.unread++;
      }
      
      if (alert.acknowledged) {
        stats.acknowledged++;
      }
      
      stats.byType[alert.type]++;
      stats.bySeverity[alert.severity]++;
      stats.byCategory[alert.category]++;
    }
    
    return stats;
  }
}

// Export singleton instance
export const alertService = new AlertService();