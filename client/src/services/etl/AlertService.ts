/**
 * AlertService.ts
 * 
 * Service for managing and displaying alert messages throughout the ETL pipeline
 */

import { toast } from '@/hooks/use-toast';

export enum AlertCategory {
  IMPORT = 'import',
  EXPORT = 'export',
  DATA_QUALITY = 'data_quality',
  CONNECTION = 'connection',
  TRANSFORM = 'transform',
  SECURITY = 'security',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  SYSTEM = 'system'
}

export enum AlertSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  category: AlertCategory;
  severity: AlertSeverity;
  source: string;
  acknowledged: boolean;
  relatedEntityId?: string;
}

class AlertService {
  private alerts: Alert[] = [];
  private listeners: Array<(alerts: Alert[]) => void> = [];
  
  /**
   * Create a success alert
   * @param message Alert message
   * @param source Source of the alert
   * @param details Additional details or data
   * @returns Created alert
   */
  success(message: string, source: string, details?: string | Record<string, any>): Alert {
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    
    return this.addAlert({
      title: 'Success',
      message,
      details: detailsStr,
      category: AlertCategory.SYSTEM,
      severity: AlertSeverity.SUCCESS,
      source
    });
  }
  
  /**
   * Create an error alert
   * @param message Alert message
   * @param source Source of the alert
   * @param details Additional details or data
   * @returns Created alert
   */
  error(message: string, source: string, details?: string | Record<string, any>): Alert {
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    
    return this.addAlert({
      title: 'Error',
      message,
      details: detailsStr,
      category: AlertCategory.SYSTEM,
      severity: AlertSeverity.ERROR,
      source
    });
  }

  /**
   * Add a new alert
   * @param alert Alert to add
   */
  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts = [newAlert, ...this.alerts];
    this.notifyListeners();

    // Show toast for non-info alerts
    if (alert.severity !== AlertSeverity.INFO) {
      toast({
        title: this.getSeverityTitle(alert.severity),
        description: alert.message,
        variant: alert.severity === AlertSeverity.SUCCESS ? 'default' : 'destructive',
      });
    }

    return newAlert;
  }

  /**
   * Get all alerts
   * @returns All alerts
   */
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by category
   * @param category Alert category
   * @returns Alerts of the specified category
   */
  getAlertsByCategory(category: AlertCategory): Alert[] {
    return this.alerts.filter(alert => alert.category === category);
  }

  /**
   * Get alerts by severity
   * @param severity Alert severity
   * @returns Alerts of the specified severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Mark an alert as acknowledged
   * @param id Alert ID
   */
  acknowledgeAlert(id: string): void {
    this.alerts = this.alerts.map(alert => {
      if (alert.id === id) {
        return { ...alert, acknowledged: true };
      }
      return alert;
    });
    this.notifyListeners();
  }

  /**
   * Delete an alert
   * @param id Alert ID
   */
  deleteAlert(id: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.notifyListeners();
  }

  /**
   * Register a listener for alert changes
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  registerListener(listener: (alerts: Alert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  /**
   * Notify all listeners of alert changes
   * @private
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }

  /**
   * Get title for severity level
   * @param severity Alert severity
   * @returns Title for the severity level
   * @private
   */
  private getSeverityTitle(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'Information';
      case AlertSeverity.SUCCESS:
        return 'Success';
      case AlertSeverity.WARNING:
        return 'Warning';
      case AlertSeverity.ERROR:
        return 'Error';
      case AlertSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Alert';
    }
  }
}

// Export a singleton instance
export const alertService = new AlertService();
export default alertService;