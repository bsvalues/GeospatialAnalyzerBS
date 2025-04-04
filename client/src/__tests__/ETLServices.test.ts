import {
  alertService,
  dataConnector,
  transformationService,
  scheduler,
  etlPipelineManager,
  AlertType,
  AlertSeverity,
  AlertCategory,
  FilterOperator,
  FilterLogic,
  TransformationType,
  ScheduleFrequency,
  DataSourceType,
  JobStatus
} from '../services/etl';

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterEach(() => {
  console = { ...originalConsole };
});

describe('ETL Services', () => {
  describe('AlertService', () => {
    test('creates and retrieves alerts', () => {
      // Create an alert
      const alert = alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.SYSTEM,
        title: 'Test Alert',
        message: 'This is a test alert'
      });
      
      // Verify the alert was created
      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.title).toBe('Test Alert');
      
      // Retrieve the alert
      const retrievedAlert = alertService.getAlert(alert.id);
      expect(retrievedAlert).toBeDefined();
      expect(retrievedAlert?.id).toBe(alert.id);
      
      // Get all alerts
      const alerts = alertService.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.id === alert.id)).toBe(true);
    });
  });
  
  describe('TransformationService', () => {
    test('applies filter transformation', async () => {
      // Sample data
      const data = [
        { id: 1, value: 10, name: 'Item 1' },
        { id: 2, value: 20, name: 'Item 2' },
        { id: 3, value: 30, name: 'Item 3' },
        { id: 4, value: 15, name: 'Item 4' },
        { id: 5, value: 25, name: 'Item 5' }
      ];
      
      // Filter transformation rule
      const rule = {
        id: 1,
        name: 'Test Filter',
        type: TransformationType.FILTER,
        enabled: true,
        config: {
          filter: {
            logic: FilterLogic.AND,
            conditions: [
              {
                field: 'value',
                operator: FilterOperator.GREATER_THAN,
                value: 15
              }
            ]
          }
        }
      };
      
      // Apply the transformation
      const result = await transformationService.applyTransformations(data, [rule]);
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(3);
      expect(result.data.every(item => item.value > 15)).toBe(true);
    });
  });
  
  describe('Scheduler', () => {
    test('schedules and unschedules jobs', () => {
      // Start the scheduler
      scheduler.start();
      
      // Schedule a job
      const handler = jest.fn().mockResolvedValue(undefined);
      const job = scheduler.scheduleJob(
        1,
        'Test Job',
        {
          frequency: ScheduleFrequency.ONCE,
          startDate: new Date(Date.now() + 60000) // Start in 1 minute
        },
        handler
      );
      
      // Verify the job was scheduled
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe('Test Job');
      
      // Get all scheduled jobs
      const jobs = scheduler.getAllScheduledJobs();
      expect(jobs.length).toBeGreaterThan(0);
      expect(jobs.some(j => j.id === job.id)).toBe(true);
      
      // Unschedule the job
      const unscheduled = scheduler.unscheduleJob(job.id);
      expect(unscheduled).toBe(true);
      
      // Stop the scheduler
      scheduler.stop();
    });
  });
  
  describe('ETLPipelineManager', () => {
    test('initializes and manages ETL components', async () => {
      // Sample data
      const jobs = [
        {
          id: 1,
          name: 'Test Job',
          description: 'A test job',
          sources: [1],
          destinations: [2],
          rules: [1],
          status: JobStatus.CREATED,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const dataSources = [
        {
          id: 1,
          name: 'Test Source',
          description: 'A test source',
          type: DataSourceType.MEMORY,
          config: {
            data: [
              { id: 1, value: 10 },
              { id: 2, value: 20 }
            ]
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Test Destination',
          description: 'A test destination',
          type: DataSourceType.MEMORY,
          config: {
            data: []
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const transformationRules = [
        {
          id: 1,
          name: 'Test Rule',
          type: TransformationType.FILTER,
          config: {
            filter: {
              logic: FilterLogic.AND,
              conditions: [
                {
                  field: 'value',
                  operator: FilterOperator.GREATER_THAN,
                  value: 15
                }
              ]
            }
          },
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // Initialize the pipeline manager
      await etlPipelineManager.initialize(jobs, dataSources, transformationRules);
      
      // Verify initialization
      expect(etlPipelineManager.getAllJobs().length).toBe(jobs.length);
      expect(etlPipelineManager.getAllDataSources().length).toBe(dataSources.length);
      expect(etlPipelineManager.getAllTransformationRules().length).toBe(transformationRules.length);
      
      // Get system status
      const status = etlPipelineManager.getSystemStatus();
      expect(status.jobCount).toBe(jobs.length);
      expect(status.dataSourceCount).toBe(dataSources.length);
      expect(status.transformationRuleCount).toBe(transformationRules.length);
      
      // Shutdown the pipeline manager
      etlPipelineManager.shutdown();
    });
  });
});