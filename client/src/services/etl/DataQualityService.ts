import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Data quality issue severity enum
 */
export enum DataQualityIssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  /** Field name */
  field: string;
  
  /** Issue type */
  type: string;
  
  /** Issue description */
  description: string;
  
  /** Issue severity */
  severity: DataQualityIssueSeverity;
  
  /** Affected records count */
  recordCount: number;
  
  /** Affected record percentage */
  percentage: number;
  
  /** Example values */
  examples?: any[];
  
  /** Remediation suggestion */
  suggestion?: string;
}

/**
 * Field statistics interface
 */
export interface FieldStatistics {
  /** Field name */
  field: string;
  
  /** Number of records */
  count: number;
  
  /** Number of null values */
  nullCount: number;
  
  /** Null value percentage */
  nullPercentage: number;
  
  /** Number of missing values */
  missingCount: number;
  
  /** Missing value percentage */
  missingPercentage: number;
  
  /** Number of unique values */
  uniqueCount: number;
  
  /** Unique value percentage */
  uniquePercentage: number;
  
  /** Field data type */
  dataType: string;
  
  /** Min value (for numeric fields) */
  min?: number;
  
  /** Max value (for numeric fields) */
  max?: number;
  
  /** Average value (for numeric fields) */
  avg?: number;
  
  /** Median value (for numeric fields) */
  median?: number;
  
  /** Standard deviation (for numeric fields) */
  stdDev?: number;
  
  /** Min length (for string fields) */
  minLength?: number;
  
  /** Max length (for string fields) */
  maxLength?: number;
  
  /** Average length (for string fields) */
  avgLength?: number;
  
  /** Value distribution */
  distribution?: Record<string, number>;
  
  /** Top values */
  topValues?: { value: any; count: number; percentage: number }[];
  
  /** Pattern distribution */
  patternDistribution?: Record<string, number>;
}

/**
 * Data quality analysis options interface
 */
export interface DataQualityAnalysisOptions {
  /** Whether to check for null values */
  checkNull?: boolean;
  
  /** Whether to check for missing values */
  checkMissing?: boolean;
  
  /** Whether to check for duplicate values */
  checkDuplicates?: boolean;
  
  /** Whether to check for outliers */
  checkOutliers?: boolean;
  
  /** Whether to check for inconsistent formats */
  checkFormats?: boolean;
  
  /** Whether to check for value distributions */
  checkDistributions?: boolean;
  
  /** Maximum number of examples to collect */
  maxExamples?: number;
  
  /** Threshold for null percentage warning */
  nullThreshold?: number;
  
  /** Threshold for duplicate percentage warning */
  duplicateThreshold?: number;
  
  /** Number of standard deviations for outlier detection */
  outlierStdDevs?: number;
  
  /** Fields to exclude from analysis */
  excludeFields?: string[];
  
  /** Fields to include in analysis (if specified, only these fields are analyzed) */
  includeFields?: string[];
  
  /** Expected data types for fields */
  expectedTypes?: Record<string, string>;
  
  /** Expected format patterns for fields */
  expectedPatterns?: Record<string, RegExp>;
  
  /** Expected value ranges for fields */
  expectedRanges?: Record<string, { min?: number; max?: number }>;
}

/**
 * Data quality analysis result interface
 */
export interface DataQualityAnalysisResult {
  /** Analysis timestamp */
  timestamp: Date;
  
  /** Number of records analyzed */
  recordCount: number;
  
  /** Number of fields analyzed */
  fieldCount: number;
  
  /** Field statistics */
  fieldStats: Record<string, FieldStatistics>;
  
  /** Data quality issues */
  issues: DataQualityIssue[];
  
  /** Data quality score (0-100) */
  qualityScore: number;
  
  /** Completeness score (0-100) */
  completenessScore: number;
  
  /** Accuracy score (0-100) */
  accuracyScore: number;
  
  /** Consistency score (0-100) */
  consistencyScore: number;
  
  /** Uniqueness score (0-100) */
  uniquenessScore: number;
  
  /** Analysis options used */
  options: DataQualityAnalysisOptions;
  
  /** Summary of findings */
  summary: string;
  
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Data Quality Service
 * 
 * This service is responsible for analyzing data quality.
 */
class DataQualityService {
  /**
   * Analyze data quality
   */
  analyzeData(
    data: any[],
    options: DataQualityAnalysisOptions = {}
  ): DataQualityAnalysisResult {
    try {
      // Set default options
      const defaultOptions: DataQualityAnalysisOptions = {
        checkNull: true,
        checkMissing: true,
        checkDuplicates: true,
        checkOutliers: true,
        checkFormats: true,
        checkDistributions: true,
        maxExamples: 5,
        nullThreshold: 0.1, // 10%
        duplicateThreshold: 0.05, // 5%
        outlierStdDevs: 3,
        excludeFields: []
      };
      
      const resolvedOptions = { ...defaultOptions, ...options };
      const recordCount = data.length;
      const issues: DataQualityIssue[] = [];
      
      // If no data, return empty result
      if (recordCount === 0) {
        return {
          timestamp: new Date(),
          recordCount: 0,
          fieldCount: 0,
          fieldStats: {},
          issues: [],
          qualityScore: 100,
          completenessScore: 100,
          accuracyScore: 100,
          consistencyScore: 100,
          uniquenessScore: 100,
          options: resolvedOptions,
          summary: 'No data to analyze',
          recommendations: ['Provide data for analysis']
        };
      }
      
      // Get all field names
      const allFields = new Set<string>();
      
      for (const record of data) {
        for (const field in record) {
          allFields.add(field);
        }
      }
      
      // Filter fields based on include/exclude options
      let fields: string[] = Array.from(allFields);
      
      if (resolvedOptions.includeFields && resolvedOptions.includeFields.length > 0) {
        fields = fields.filter(field => resolvedOptions.includeFields!.includes(field));
      }
      
      if (resolvedOptions.excludeFields && resolvedOptions.excludeFields.length > 0) {
        fields = fields.filter(field => !resolvedOptions.excludeFields!.includes(field));
      }
      
      // Calculate field statistics
      const fieldStats: Record<string, FieldStatistics> = {};
      
      for (const field of fields) {
        fieldStats[field] = this.calculateFieldStatistics(data, field);
      }
      
      // Check for null values
      if (resolvedOptions.checkNull) {
        this.checkNullValues(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for missing values
      if (resolvedOptions.checkMissing) {
        this.checkMissingValues(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for duplicate values
      if (resolvedOptions.checkDuplicates) {
        this.checkDuplicateValues(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for outliers
      if (resolvedOptions.checkOutliers) {
        this.checkOutliers(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for inconsistent formats
      if (resolvedOptions.checkFormats) {
        this.checkFormats(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for expected data types
      if (resolvedOptions.expectedTypes) {
        this.checkExpectedTypes(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Check for expected value ranges
      if (resolvedOptions.expectedRanges) {
        this.checkExpectedRanges(data, fields, fieldStats, issues, resolvedOptions);
      }
      
      // Calculate quality scores
      const completenessScore = this.calculateCompletenessScore(fieldStats);
      const accuracyScore = this.calculateAccuracyScore(issues);
      const consistencyScore = this.calculateConsistencyScore(issues);
      const uniquenessScore = this.calculateUniquenessScore(fieldStats, issues);
      
      // Calculate overall quality score
      const qualityScore = (completenessScore + accuracyScore + consistencyScore + uniquenessScore) / 4;
      
      // Generate summary and recommendations
      const summary = this.generateSummary(recordCount, fields.length, issues, qualityScore);
      const recommendations = this.generateRecommendations(issues, fieldStats);
      
      // Log results
      if (issues.length > 0) {
        const criticalIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL).length;
        const highIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.HIGH).length;
        
        alertService.createAlert({
          type: criticalIssues > 0 ? AlertType.ERROR : highIssues > 0 ? AlertType.WARNING : AlertType.INFO,
          severity: criticalIssues > 0 ? AlertSeverity.HIGH : highIssues > 0 ? AlertSeverity.MEDIUM : AlertSeverity.LOW,
          category: AlertCategory.VALIDATION,
          title: 'Data Quality Analysis',
          message: `Found ${issues.length} quality issues (${criticalIssues} critical, ${highIssues} high)`
        });
      }
      
      return {
        timestamp: new Date(),
        recordCount,
        fieldCount: fields.length,
        fieldStats,
        issues,
        qualityScore,
        completenessScore,
        accuracyScore,
        consistencyScore,
        uniquenessScore,
        options: resolvedOptions,
        summary,
        recommendations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.VALIDATION,
        title: 'Data Quality Analysis Error',
        message: `Error analyzing data quality: ${errorMessage}`
      });
      
      // Return a minimal result
      return {
        timestamp: new Date(),
        recordCount: data.length,
        fieldCount: 0,
        fieldStats: {},
        issues: [
          {
            field: 'all',
            type: 'error',
            description: `Analysis error: ${errorMessage}`,
            severity: DataQualityIssueSeverity.HIGH,
            recordCount: data.length,
            percentage: 100
          }
        ],
        qualityScore: 0,
        completenessScore: 0,
        accuracyScore: 0,
        consistencyScore: 0,
        uniquenessScore: 0,
        options: options,
        summary: `Error analyzing data quality: ${errorMessage}`,
        recommendations: ['Fix analysis error and try again']
      };
    }
  }
  
  /**
   * Calculate statistics for a field
   */
  private calculateFieldStatistics(data: any[], field: string): FieldStatistics {
    const count = data.length;
    const values = data.map(record => record[field]);
    
    // Count null values
    const nullCount = values.filter(value => value === null || value === undefined).length;
    const nullPercentage = (nullCount / count) * 100;
    
    // Count missing values (empty strings, etc.)
    const missingCount = values.filter(value => 
      value === '' || 
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
    ).length;
    const missingPercentage = (missingCount / count) * 100;
    
    // Count unique values
    const uniqueValues = new Set(values.filter(value => value !== null && value !== undefined));
    const uniqueCount = uniqueValues.size;
    const uniquePercentage = (uniqueCount / (count - nullCount)) * 100;
    
    // Determine data type
    const nonNullValues = values.filter(value => value !== null && value !== undefined);
    const dataType = this.determineDataType(nonNullValues);
    
    // Calculate numeric statistics if appropriate
    let min: number | undefined;
    let max: number | undefined;
    let avg: number | undefined;
    let median: number | undefined;
    let stdDev: number | undefined;
    
    if (dataType === 'number') {
      const numericValues = nonNullValues.map(Number);
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);
      avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
      
      // Calculate standard deviation
      if (avg !== undefined) {
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / numericValues.length;
        stdDev = Math.sqrt(variance);
      }
    }
    
    // Calculate string statistics if appropriate
    let minLength: number | undefined;
    let maxLength: number | undefined;
    let avgLength: number | undefined;
    
    if (dataType === 'string') {
      const stringValues = nonNullValues.map(String);
      const lengths = stringValues.map(str => str.length);
      minLength = Math.min(...lengths);
      maxLength = Math.max(...lengths);
      avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    }
    
    // Calculate value distribution
    const distribution: Record<string, number> = {};
    
    for (const value of values) {
      const key = value === null || value === undefined
        ? 'null'
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
      
      distribution[key] = (distribution[key] || 0) + 1;
    }
    
    // Calculate top values
    const topValues = Object.entries(distribution)
      .map(([value, count]) => ({
        value: value === 'null' ? null : value,
        count,
        percentage: (count / count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      field,
      count,
      nullCount,
      nullPercentage,
      missingCount,
      missingPercentage,
      uniqueCount,
      uniquePercentage,
      dataType,
      min,
      max,
      avg,
      median,
      stdDev,
      minLength,
      maxLength,
      avgLength,
      distribution,
      topValues
    };
  }
  
  /**
   * Determine data type of values
   */
  private determineDataType(values: any[]): string {
    if (values.length === 0) {
      return 'unknown';
    }
    
    // Check if all values are numbers
    if (values.every(value => typeof value === 'number' || !isNaN(Number(value)))) {
      return 'number';
    }
    
    // Check if all values are booleans
    if (values.every(value => typeof value === 'boolean' || value === 'true' || value === 'false')) {
      return 'boolean';
    }
    
    // Check if all values are dates
    if (values.every(value => value instanceof Date || !isNaN(Date.parse(String(value))))) {
      return 'date';
    }
    
    // Check if all values are arrays
    if (values.every(value => Array.isArray(value))) {
      return 'array';
    }
    
    // Check if all values are objects
    if (values.every(value => typeof value === 'object' && !Array.isArray(value) && value !== null)) {
      return 'object';
    }
    
    // Default to string
    return 'string';
  }
  
  /**
   * Check for null values
   */
  private checkNullValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const nullThreshold = options.nullThreshold || 0.1; // 10%
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      if (stats.nullPercentage > nullThreshold * 100) {
        // Determine severity based on null percentage
        let severity: DataQualityIssueSeverity;
        
        if (stats.nullPercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (stats.nullPercentage >= 25) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (stats.nullPercentage >= 10) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        issues.push({
          field,
          type: 'null_values',
          description: `Field contains ${stats.nullPercentage.toFixed(2)}% null values`,
          severity,
          recordCount: stats.nullCount,
          percentage: stats.nullPercentage,
          suggestion: 'Consider filling null values with defaults or removing records with null values'
        });
      }
    }
  }
  
  /**
   * Check for missing values
   */
  private checkMissingValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    for (const field of fields) {
      const stats = fieldStats[field];
      
      if (stats.missingPercentage > 0) {
        // Determine severity based on missing percentage
        let severity: DataQualityIssueSeverity;
        
        if (stats.missingPercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (stats.missingPercentage >= 25) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (stats.missingPercentage >= 10) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        // Find example records with missing values
        const examples = data
          .filter(record => 
            record[field] === '' || 
            (Array.isArray(record[field]) && record[field].length === 0) ||
            (typeof record[field] === 'object' && record[field] !== null && Object.keys(record[field]).length === 0)
          )
          .slice(0, options.maxExamples || 5);
        
        issues.push({
          field,
          type: 'missing_values',
          description: `Field contains ${stats.missingPercentage.toFixed(2)}% missing values (empty strings, empty arrays, or empty objects)`,
          severity,
          recordCount: stats.missingCount,
          percentage: stats.missingPercentage,
          examples,
          suggestion: 'Consider filling missing values with defaults or removing records with missing values'
        });
      }
    }
  }
  
  /**
   * Check for duplicate values
   */
  private checkDuplicateValues(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const duplicateThreshold = options.duplicateThreshold || 0.05; // 5%
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip fields with all unique values
      if (stats.uniqueCount === stats.count - stats.nullCount) {
        continue;
      }
      
      // Count duplicates
      const duplicateCount = stats.count - stats.nullCount - stats.uniqueCount;
      const duplicatePercentage = (duplicateCount / (stats.count - stats.nullCount)) * 100;
      
      if (duplicatePercentage > duplicateThreshold * 100) {
        // Determine severity based on duplicate percentage
        let severity: DataQualityIssueSeverity;
        
        if (duplicatePercentage >= 50) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else if (duplicatePercentage >= 25) {
          severity = DataQualityIssueSeverity.LOW;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        // Find the most common duplicated values
        const duplicateValues = Object.entries(stats.distribution || {})
          .filter(([value, count]) => value !== 'null' && count > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count }));
        
        issues.push({
          field,
          type: 'duplicate_values',
          description: `Field contains ${duplicatePercentage.toFixed(2)}% duplicate values`,
          severity,
          recordCount: duplicateCount,
          percentage: duplicatePercentage,
          examples: duplicateValues.map(dv => dv.value),
          suggestion: 'Consider deduplicating records or checking for data entry errors'
        });
      }
    }
  }
  
  /**
   * Check for outliers
   */
  private checkOutliers(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const outlierStdDevs = options.outlierStdDevs || 3;
    
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip non-numeric fields
      if (stats.dataType !== 'number' || stats.min === undefined || stats.max === undefined || stats.avg === undefined || stats.stdDev === undefined) {
        continue;
      }
      
      // Calculate outlier thresholds
      const lowerThreshold = stats.avg - (outlierStdDevs * stats.stdDev);
      const upperThreshold = stats.avg + (outlierStdDevs * stats.stdDev);
      
      // Find outliers
      const outliers = data.filter(record => {
        const value = record[field];
        return value !== null && value !== undefined && (value < lowerThreshold || value > upperThreshold);
      });
      
      if (outliers.length > 0) {
        const outlierPercentage = (outliers.length / stats.count) * 100;
        
        // Determine severity based on outlier percentage
        let severity: DataQualityIssueSeverity;
        
        if (outlierPercentage >= 10) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (outlierPercentage >= 5) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        issues.push({
          field,
          type: 'outliers',
          description: `Field contains ${outliers.length} outliers (${outlierPercentage.toFixed(2)}% of values)`,
          severity,
          recordCount: outliers.length,
          percentage: outlierPercentage,
          examples: outliers.map(record => record[field]).slice(0, options.maxExamples || 5),
          suggestion: 'Check for data entry errors or consider normalizing the data'
        });
      }
    }
  }
  
  /**
   * Check for inconsistent formats
   */
  private checkFormats(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    for (const field of fields) {
      const stats = fieldStats[field];
      
      // Skip non-string fields
      if (stats.dataType !== 'string') {
        continue;
      }
      
      // Get expected pattern if specified
      const expectedPattern = options.expectedPatterns?.[field];
      
      // Check string patterns
      const nonNullValues = data
        .filter(record => record[field] !== null && record[field] !== undefined)
        .map(record => String(record[field]));
      
      // Detect patterns
      const patterns: Record<string, number> = {};
      
      for (const value of nonNullValues) {
        const pattern = this.detectPattern(value);
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
      
      // Store pattern distribution
      stats.patternDistribution = patterns;
      
      // Check if there are multiple patterns
      const patternCount = Object.keys(patterns).length;
      
      if (patternCount > 1) {
        // If there's an expected pattern, check against it
        if (expectedPattern) {
          const invalidValues = nonNullValues.filter(value => !expectedPattern.test(value));
          
          if (invalidValues.length > 0) {
            const invalidPercentage = (invalidValues.length / nonNullValues.length) * 100;
            
            // Determine severity based on invalid percentage
            let severity: DataQualityIssueSeverity;
            
            if (invalidPercentage >= 50) {
              severity = DataQualityIssueSeverity.CRITICAL;
            } else if (invalidPercentage >= 25) {
              severity = DataQualityIssueSeverity.HIGH;
            } else if (invalidPercentage >= 10) {
              severity = DataQualityIssueSeverity.MEDIUM;
            } else {
              severity = DataQualityIssueSeverity.LOW;
            }
            
            issues.push({
              field,
              type: 'invalid_format',
              description: `Field contains ${invalidValues.length} values (${invalidPercentage.toFixed(2)}%) that don't match the expected pattern`,
              severity,
              recordCount: invalidValues.length,
              percentage: invalidPercentage,
              examples: invalidValues.slice(0, options.maxExamples || 5),
              suggestion: 'Standardize data formats or validate data entry'
            });
          }
        } else {
          // If no expected pattern, just flag inconsistent formats
          const mainPattern = Object.entries(patterns)
            .sort((a, b) => b[1] - a[1])[0][0];
          
          const inconsistentValues = nonNullValues.filter(value => 
            this.detectPattern(value) !== mainPattern
          );
          
          if (inconsistentValues.length > 0) {
            const inconsistentPercentage = (inconsistentValues.length / nonNullValues.length) * 100;
            
            // Determine severity based on inconsistent percentage
            let severity: DataQualityIssueSeverity;
            
            if (inconsistentPercentage >= 30) {
              severity = DataQualityIssueSeverity.MEDIUM;
            } else {
              severity = DataQualityIssueSeverity.LOW;
            }
            
            issues.push({
              field,
              type: 'inconsistent_format',
              description: `Field contains ${patternCount} different formats`,
              severity,
              recordCount: inconsistentValues.length,
              percentage: inconsistentPercentage,
              examples: inconsistentValues.slice(0, options.maxExamples || 5),
              suggestion: 'Standardize data formats or validate data entry'
            });
          }
        }
      }
    }
  }
  
  /**
   * Check for expected data types
   */
  private checkExpectedTypes(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const expectedTypes = options.expectedTypes || {};
    
    for (const field of Object.keys(expectedTypes)) {
      // Skip fields not in the dataset
      if (!fields.includes(field)) {
        continue;
      }
      
      const stats = fieldStats[field];
      const expectedType = expectedTypes[field];
      
      if (stats.dataType !== expectedType) {
        // Find values with the wrong type
        const wrongTypeValues = data
          .filter(record => {
            const value = record[field];
            
            if (value === null || value === undefined) {
              return false;
            }
            
            switch (expectedType) {
              case 'number':
                return typeof value !== 'number' && isNaN(Number(value));
                
              case 'boolean':
                return typeof value !== 'boolean' && value !== 'true' && value !== 'false';
                
              case 'date':
                return !(value instanceof Date) && isNaN(Date.parse(String(value)));
                
              case 'array':
                return !Array.isArray(value);
                
              case 'object':
                return typeof value !== 'object' || Array.isArray(value) || value === null;
                
              case 'string':
                return typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean';
                
              default:
                return true;
            }
          })
          .map(record => record[field]);
        
        const wrongTypeCount = wrongTypeValues.length;
        const wrongTypePercentage = (wrongTypeCount / stats.count) * 100;
        
        if (wrongTypeCount > 0) {
          // Determine severity based on wrong type percentage
          let severity: DataQualityIssueSeverity;
          
          if (wrongTypePercentage >= 50) {
            severity = DataQualityIssueSeverity.CRITICAL;
          } else if (wrongTypePercentage >= 25) {
            severity = DataQualityIssueSeverity.HIGH;
          } else if (wrongTypePercentage >= 10) {
            severity = DataQualityIssueSeverity.MEDIUM;
          } else {
            severity = DataQualityIssueSeverity.LOW;
          }
          
          issues.push({
            field,
            type: 'wrong_type',
            description: `Field has type ${stats.dataType} but expected ${expectedType}`,
            severity,
            recordCount: wrongTypeCount,
            percentage: wrongTypePercentage,
            examples: wrongTypeValues.slice(0, options.maxExamples || 5),
            suggestion: `Convert values to ${expectedType} type`
          });
        }
      }
    }
  }
  
  /**
   * Check for expected value ranges
   */
  private checkExpectedRanges(
    data: any[],
    fields: string[],
    fieldStats: Record<string, FieldStatistics>,
    issues: DataQualityIssue[],
    options: DataQualityAnalysisOptions
  ): void {
    const expectedRanges = options.expectedRanges || {};
    
    for (const field of Object.keys(expectedRanges)) {
      // Skip fields not in the dataset
      if (!fields.includes(field)) {
        continue;
      }
      
      const stats = fieldStats[field];
      const range = expectedRanges[field];
      
      // Skip non-numeric fields
      if (stats.dataType !== 'number') {
        continue;
      }
      
      // Find out-of-range values
      const outOfRangeValues = data
        .filter(record => {
          const value = record[field];
          
          if (value === null || value === undefined || isNaN(Number(value))) {
            return false;
          }
          
          const numValue = Number(value);
          
          if (range.min !== undefined && numValue < range.min) {
            return true;
          }
          
          if (range.max !== undefined && numValue > range.max) {
            return true;
          }
          
          return false;
        })
        .map(record => record[field]);
      
      const outOfRangeCount = outOfRangeValues.length;
      const outOfRangePercentage = (outOfRangeCount / stats.count) * 100;
      
      if (outOfRangeCount > 0) {
        // Determine severity based on out-of-range percentage
        let severity: DataQualityIssueSeverity;
        
        if (outOfRangePercentage >= 25) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (outOfRangePercentage >= 10) {
          severity = DataQualityIssueSeverity.HIGH;
        } else if (outOfRangePercentage >= 5) {
          severity = DataQualityIssueSeverity.MEDIUM;
        } else {
          severity = DataQualityIssueSeverity.LOW;
        }
        
        // Create description
        let description = `Field contains values outside expected range`;
        
        if (range.min !== undefined && range.max !== undefined) {
          description = `Field contains values outside expected range [${range.min}, ${range.max}]`;
        } else if (range.min !== undefined) {
          description = `Field contains values below expected minimum ${range.min}`;
        } else if (range.max !== undefined) {
          description = `Field contains values above expected maximum ${range.max}`;
        }
        
        issues.push({
          field,
          type: 'out_of_range',
          description,
          severity,
          recordCount: outOfRangeCount,
          percentage: outOfRangePercentage,
          examples: outOfRangeValues.slice(0, options.maxExamples || 5),
          suggestion: 'Validate data entry or adjust expected range'
        });
      }
    }
  }
  
  /**
   * Detect pattern in a string
   */
  private detectPattern(value: string): string {
    if (!value) {
      return 'empty';
    }
    
    // Check for common formats
    
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }
    
    // URL
    if (/^https?:\/\/[^\s]+$/.test(value)) {
      return 'url';
    }
    
    // Date (common formats)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'date-iso';
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return 'date-mdy';
    }
    
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
      return 'date-dmy-dot';
    }
    
    // Phone number
    if (/^\+?\d{10,15}$/.test(value)) {
      return 'phone-digits';
    }
    
    if (/^\+?\d{1,4}[\s-]\d{3,4}[\s-]\d{3,4}[\s-]?\d{0,4}$/.test(value)) {
      return 'phone-formatted';
    }
    
    // ZIP/Postal code
    if (/^\d{5}(-\d{4})?$/.test(value)) {
      return 'zip-us';
    }
    
    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number';
    }
    
    // Integer
    if (/^-?\d+$/.test(value)) {
      return 'integer';
    }
    
    // Currency
    if (/^[£$€¥]\s?\d+(\.\d{2})?$/.test(value) || /^\d+(\.\d{2})?\s?[£$€¥]$/.test(value)) {
      return 'currency';
    }
    
    // Boolean
    if (/^(true|false|yes|no|0|1)$/i.test(value)) {
      return 'boolean';
    }
    
    // Identifier (UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'uuid';
    }
    
    // Alpha only
    if (/^[A-Za-z]+$/.test(value)) {
      return 'alpha';
    }
    
    // Alphanumeric
    if (/^[A-Za-z0-9]+$/.test(value)) {
      return 'alphanumeric';
    }
    
    // Default pattern (character types)
    let pattern = '';
    
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      
      if (/[A-Za-z]/.test(char)) {
        pattern += 'a';
      } else if (/\d/.test(char)) {
        pattern += '9';
      } else {
        pattern += char;
      }
    }
    
    // If the pattern is too long, summarize it
    if (pattern.length > 20) {
      const counts: Record<string, number> = {};
      
      for (const char of pattern) {
        counts[char] = (counts[char] || 0) + 1;
      }
      
      pattern = Object.entries(counts)
        .map(([char, count]) => `${char}(${count})`)
        .join('');
    }
    
    return pattern;
  }
  
  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(fieldStats: Record<string, FieldStatistics>): number {
    if (Object.keys(fieldStats).length === 0) {
      return 100;
    }
    
    let totalScore = 0;
    
    for (const field in fieldStats) {
      const stats = fieldStats[field];
      const completeness = 100 - (stats.nullPercentage + stats.missingPercentage);
      totalScore += completeness;
    }
    
    return totalScore / Object.keys(fieldStats).length;
  }
  
  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(issues: DataQualityIssue[]): number {
    // Start with a perfect score
    let score = 100;
    
    // Subtract points for issues based on their severity
    for (const issue of issues) {
      if (issue.type === 'wrong_type' || issue.type === 'out_of_range' || issue.type === 'outliers') {
        switch (issue.severity) {
          case DataQualityIssueSeverity.CRITICAL:
            score -= 25 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.HIGH:
            score -= 15 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.MEDIUM:
            score -= 10 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.LOW:
            score -= 5 * (issue.percentage / 100);
            break;
        }
      }
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(issues: DataQualityIssue[]): number {
    // Start with a perfect score
    let score = 100;
    
    // Subtract points for issues based on their severity
    for (const issue of issues) {
      if (issue.type === 'inconsistent_format' || issue.type === 'invalid_format') {
        switch (issue.severity) {
          case DataQualityIssueSeverity.CRITICAL:
            score -= 25 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.HIGH:
            score -= 15 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.MEDIUM:
            score -= 10 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.LOW:
            score -= 5 * (issue.percentage / 100);
            break;
        }
      }
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate uniqueness score
   */
  private calculateUniquenessScore(fieldStats: Record<string, FieldStatistics>, issues: DataQualityIssue[]): number {
    // Two components: field uniqueness and lack of duplicates
    
    // First component: average uniqueness of fields
    let totalUniquePercentage = 0;
    let fieldCount = 0;
    
    for (const field in fieldStats) {
      const stats = fieldStats[field];
      
      // Skip fields with no data
      if (stats.count - stats.nullCount <= 0) {
        continue;
      }
      
      totalUniquePercentage += stats.uniquePercentage;
      fieldCount++;
    }
    
    const fieldUniquenessScore = fieldCount === 0 ? 100 : totalUniquePercentage / fieldCount;
    
    // Second component: deduct for duplicate issues
    let duplicateDeduction = 0;
    
    for (const issue of issues) {
      if (issue.type === 'duplicate_values') {
        switch (issue.severity) {
          case DataQualityIssueSeverity.CRITICAL:
            duplicateDeduction += 25 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.HIGH:
            duplicateDeduction += 15 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.MEDIUM:
            duplicateDeduction += 10 * (issue.percentage / 100);
            break;
            
          case DataQualityIssueSeverity.LOW:
            duplicateDeduction += 5 * (issue.percentage / 100);
            break;
        }
      }
    }
    
    // Combine both components
    const score = (fieldUniquenessScore * 0.7) + ((100 - duplicateDeduction) * 0.3);
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate a summary of the analysis
   */
  private generateSummary(recordCount: number, fieldCount: number, issues: DataQualityIssue[], qualityScore: number): string {
    // Count issues by severity
    const criticalIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL).length;
    const highIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.HIGH).length;
    const mediumIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.MEDIUM).length;
    const lowIssues = issues.filter(issue => issue.severity === DataQualityIssueSeverity.LOW).length;
    
    // Generate quality rating
    let qualityRating: string;
    
    if (qualityScore >= 90) {
      qualityRating = 'Excellent';
    } else if (qualityScore >= 80) {
      qualityRating = 'Good';
    } else if (qualityScore >= 70) {
      qualityRating = 'Fair';
    } else if (qualityScore >= 60) {
      qualityRating = 'Poor';
    } else {
      qualityRating = 'Very Poor';
    }
    
    // Build summary
    let summary = `Analyzed ${recordCount} records across ${fieldCount} fields.\n`;
    summary += `Overall data quality score: ${qualityScore.toFixed(2)} (${qualityRating}).\n`;
    
    if (issues.length > 0) {
      summary += `Found ${issues.length} quality issues:\n`;
      
      if (criticalIssues > 0) {
        summary += `- ${criticalIssues} critical issues\n`;
      }
      
      if (highIssues > 0) {
        summary += `- ${highIssues} high-severity issues\n`;
      }
      
      if (mediumIssues > 0) {
        summary += `- ${mediumIssues} medium-severity issues\n`;
      }
      
      if (lowIssues > 0) {
        summary += `- ${lowIssues} low-severity issues\n`;
      }
    } else {
      summary += 'No quality issues found.';
    }
    
    return summary;
  }
  
  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: DataQualityIssue[], fieldStats: Record<string, FieldStatistics>): string[] {
    const recommendations: string[] = [];
    
    // Skip if no issues
    if (issues.length === 0) {
      recommendations.push('No data quality issues found. The dataset is in good condition.');
      return recommendations;
    }
    
    // Group issues by type
    const issuesByType: Record<string, DataQualityIssue[]> = {};
    
    for (const issue of issues) {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      
      issuesByType[issue.type].push(issue);
    }
    
    // Generate recommendations for each issue type
    if (issuesByType['null_values']) {
      const nullIssues = issuesByType['null_values'];
      const criticalNullIssues = nullIssues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL || issue.severity === DataQualityIssueSeverity.HIGH);
      
      if (criticalNullIssues.length > 0) {
        const fieldNames = criticalNullIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Address critical null value issues in fields: ${fieldNames}. Consider using data imputation techniques or removing records with null values.`);
      } else if (nullIssues.length > 0) {
        recommendations.push(`Review and address null values in the dataset. Consider using default values or data imputation techniques.`);
      }
    }
    
    if (issuesByType['missing_values']) {
      const missingIssues = issuesByType['missing_values'];
      const criticalMissingIssues = missingIssues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL || issue.severity === DataQualityIssueSeverity.HIGH);
      
      if (criticalMissingIssues.length > 0) {
        const fieldNames = criticalMissingIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Address critical missing value issues in fields: ${fieldNames}. Consider using default values or removing records with missing values.`);
      } else if (missingIssues.length > 0) {
        recommendations.push(`Review and address missing values in the dataset. Consider validating data entry or implementing required field constraints.`);
      }
    }
    
    if (issuesByType['duplicate_values']) {
      recommendations.push(`Review potential duplicate records in the dataset. Consider implementing deduplication strategies or unique constraints.`);
    }
    
    if (issuesByType['outliers']) {
      const outlierIssues = issuesByType['outliers'];
      
      if (outlierIssues.length > 0) {
        const fieldNames = outlierIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Review outliers in fields: ${fieldNames}. Check for data entry errors or consider applying normalization techniques.`);
      }
    }
    
    if (issuesByType['inconsistent_format'] || issuesByType['invalid_format']) {
      const formatIssues = [...(issuesByType['inconsistent_format'] || []), ...(issuesByType['invalid_format'] || [])];
      
      if (formatIssues.length > 0) {
        const fieldNames = formatIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Standardize formats in fields: ${fieldNames}. Implement data validation rules or format normalization in your ETL pipeline.`);
      }
    }
    
    if (issuesByType['wrong_type']) {
      const typeIssues = issuesByType['wrong_type'];
      
      if (typeIssues.length > 0) {
        const fieldNames = typeIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Fix data type issues in fields: ${fieldNames}. Ensure consistent data types throughout the dataset.`);
      }
    }
    
    if (issuesByType['out_of_range']) {
      const rangeIssues = issuesByType['out_of_range'];
      
      if (rangeIssues.length > 0) {
        const fieldNames = rangeIssues.map(issue => issue.field).join(', ');
        recommendations.push(`Address out-of-range values in fields: ${fieldNames}. Implement value range validation or normalization.`);
      }
    }
    
    // Add general recommendations
    recommendations.push(`Implement automated data quality checks in your ETL pipeline to catch issues early.`);
    
    if (issues.filter(issue => issue.severity === DataQualityIssueSeverity.CRITICAL || issue.severity === DataQualityIssueSeverity.HIGH).length > 0) {
      recommendations.push(`Consider a data quality initiative to address high-severity issues before proceeding with analysis.`);
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const dataQualityService = new DataQualityService();