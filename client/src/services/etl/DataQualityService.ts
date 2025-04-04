import {
  DataQualityIssue,
  DataQualityIssueType,
  DataQualityIssueSeverity,
  DataQualityAnalysisResult,
  FieldStatistics
} from './ETLTypes';

/**
 * Data quality issue detection options interface
 */
export interface DataQualityDetectionOptions {
  missingValues?: {
    enabled: boolean;
    thresholdPercentage?: number;
    excludeFields?: string[];
  };
  outliers?: {
    enabled: boolean;
    method: 'zscore' | 'iqr' | 'percentile';
    threshold?: number;
    fields?: string[];
  };
  invalidFormats?: {
    enabled: boolean;
    patterns?: Record<string, RegExp | string>;
    fields?: Record<string, string[]>;
  };
  duplicates?: {
    enabled: boolean;
    fields?: string[];
    composite?: string[][];
  };
  inconsistentValues?: {
    enabled: boolean;
    fieldSets?: string[][];
  };
  rangeValidation?: {
    enabled: boolean;
    ranges?: Record<string, { min?: number; max?: number }>;
  };
}

/**
 * Data quality analysis options interface
 */
export interface DataQualityAnalysisOptions extends DataQualityDetectionOptions {
  calculateStatistics?: boolean;
  samples?: number;
  severityLevels?: {
    high?: number;
    medium?: number;
    low?: number;
  };
  scoreWeights?: {
    completeness?: number;
    validity?: number;
    consistency?: number;
  };
}

/**
 * DataQualityService class
 */
class DataQualityService {
  private nextIssueId = 1;
  
  private defaultOptions: DataQualityAnalysisOptions = {
    missingValues: {
      enabled: true,
      thresholdPercentage: 5,
      excludeFields: []
    },
    outliers: {
      enabled: true,
      method: 'zscore',
      threshold: 3,
      fields: []
    },
    invalidFormats: {
      enabled: true,
      patterns: {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        phone: /^\+?[0-9]{10,15}$/,
        url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/,
        zipcode: /^\d{5}(-\d{4})?$/,
        date: /^\d{4}-\d{2}-\d{2}$/,
        time: /^\d{2}:\d{2}(:\d{2})?$/
      },
      fields: {}
    },
    duplicates: {
      enabled: true,
      fields: [],
      composite: []
    },
    inconsistentValues: {
      enabled: true,
      fieldSets: []
    },
    rangeValidation: {
      enabled: true,
      ranges: {}
    },
    calculateStatistics: true,
    samples: 5,
    severityLevels: {
      high: 10,
      medium: 5,
      low: 1
    },
    scoreWeights: {
      completeness: 0.4,
      validity: 0.4,
      consistency: 0.2
    }
  };
  
  constructor() {
    console.log('DataQualityService initialized');
  }
  
  /**
   * Analyze data quality
   */
  async analyzeDataQuality(
    data: any[],
    options: Partial<DataQualityAnalysisOptions> = {}
  ): Promise<DataQualityAnalysisResult> {
    if (!data || data.length === 0) {
      throw new Error('Cannot analyze empty dataset');
    }
    
    const mergedOptions = this.mergeOptions(options);
    
    // Initialize the result
    const result: DataQualityAnalysisResult = {
      datasetSize: data.length,
      fieldCount: Object.keys(data[0]).length,
      issueCount: 0,
      issuesBySeverity: {
        [DataQualityIssueSeverity.INFO]: 0,
        [DataQualityIssueSeverity.WARNING]: 0,
        [DataQualityIssueSeverity.ERROR]: 0,
        [DataQualityIssueSeverity.CRITICAL]: 0
      },
      issuesByType: {
        [DataQualityIssueType.MISSING_VALUE]: 0,
        [DataQualityIssueType.INVALID_FORMAT]: 0,
        [DataQualityIssueType.OUT_OF_RANGE]: 0,
        [DataQualityIssueType.DUPLICATE_VALUE]: 0,
        [DataQualityIssueType.INCONSISTENT_VALUE]: 0,
        [DataQualityIssueType.OUTLIER]: 0
      },
      issuesByField: {},
      fieldStatistics: {},
      qualityScore: 100,
      completenessScore: 100,
      validityScore: 100,
      consistencyScore: 100,
      timestamp: new Date()
    };
    
    try {
      // Calculate field statistics
      if (mergedOptions.calculateStatistics) {
        result.fieldStatistics = this.calculateFieldStatistics(data);
      }
      
      // Detect issues
      const issuesByField = new Map<string | undefined, DataQualityIssue[]>();
      
      // Detect missing values
      if (mergedOptions.missingValues?.enabled) {
        const missingIssues = await this.detectMissingValues(data, mergedOptions);
        this.addIssuesToMap(issuesByField, missingIssues);
        result.issueCount += missingIssues.length;
        result.issuesByType[DataQualityIssueType.MISSING_VALUE] = missingIssues.length;
        
        for (const issue of missingIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Detect outliers
      if (mergedOptions.outliers?.enabled) {
        const outlierIssues = await this.detectOutliers(data, mergedOptions);
        this.addIssuesToMap(issuesByField, outlierIssues);
        result.issueCount += outlierIssues.length;
        result.issuesByType[DataQualityIssueType.OUTLIER] = outlierIssues.length;
        
        for (const issue of outlierIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Detect invalid formats
      if (mergedOptions.invalidFormats?.enabled) {
        const formatIssues = await this.detectInvalidFormats(data, mergedOptions);
        this.addIssuesToMap(issuesByField, formatIssues);
        result.issueCount += formatIssues.length;
        result.issuesByType[DataQualityIssueType.INVALID_FORMAT] = formatIssues.length;
        
        for (const issue of formatIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Detect duplicates
      if (mergedOptions.duplicates?.enabled) {
        const duplicateIssues = await this.detectDuplicates(data, mergedOptions);
        this.addIssuesToMap(issuesByField, duplicateIssues);
        result.issueCount += duplicateIssues.length;
        result.issuesByType[DataQualityIssueType.DUPLICATE_VALUE] = duplicateIssues.length;
        
        for (const issue of duplicateIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Detect inconsistent values
      if (mergedOptions.inconsistentValues?.enabled) {
        const inconsistentIssues = await this.detectInconsistentValues(data, mergedOptions);
        this.addIssuesToMap(issuesByField, inconsistentIssues);
        result.issueCount += inconsistentIssues.length;
        result.issuesByType[DataQualityIssueType.INCONSISTENT_VALUE] = inconsistentIssues.length;
        
        for (const issue of inconsistentIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Detect out-of-range values
      if (mergedOptions.rangeValidation?.enabled) {
        const rangeIssues = await this.detectOutOfRangeValues(data, mergedOptions);
        this.addIssuesToMap(issuesByField, rangeIssues);
        result.issueCount += rangeIssues.length;
        result.issuesByType[DataQualityIssueType.OUT_OF_RANGE] = rangeIssues.length;
        
        for (const issue of rangeIssues) {
          result.issuesBySeverity[issue.severity]++;
        }
      }
      
      // Convert the issues map to a record for the result
      for (const [field, issues] of issuesByField) {
        result.issuesByField[field || '__global__'] = issues;
      }
      
      // Calculate quality scores
      const scores = this.calculateQualityScores(result, mergedOptions);
      result.completenessScore = scores.completenessScore;
      result.validityScore = scores.validityScore;
      result.consistencyScore = scores.consistencyScore;
      result.qualityScore = scores.qualityScore;
    } catch (error) {
      console.error('Error analyzing data quality:', error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
    
    return result;
  }
  
  /**
   * Merge options with defaults
   */
  private mergeOptions(
    options: Partial<DataQualityAnalysisOptions>
  ): DataQualityAnalysisOptions {
    const mergedOptions: DataQualityAnalysisOptions = {
      ...this.defaultOptions
    };
    
    // Merge top-level options
    if (options.calculateStatistics !== undefined) {
      mergedOptions.calculateStatistics = options.calculateStatistics;
    }
    
    if (options.samples !== undefined) {
      mergedOptions.samples = options.samples;
    }
    
    // Merge missing values options
    if (options.missingValues) {
      mergedOptions.missingValues = {
        ...mergedOptions.missingValues,
        ...options.missingValues
      };
    }
    
    // Merge outliers options
    if (options.outliers) {
      mergedOptions.outliers = {
        ...mergedOptions.outliers,
        ...options.outliers
      };
    }
    
    // Merge invalid formats options
    if (options.invalidFormats) {
      const patterns = {
        ...mergedOptions.invalidFormats?.patterns,
        ...options.invalidFormats.patterns
      };
      
      const fields = {
        ...mergedOptions.invalidFormats?.fields,
        ...options.invalidFormats.fields
      };
      
      mergedOptions.invalidFormats = {
        ...mergedOptions.invalidFormats,
        ...options.invalidFormats,
        patterns,
        fields
      };
    }
    
    // Merge duplicates options
    if (options.duplicates) {
      mergedOptions.duplicates = {
        ...mergedOptions.duplicates,
        ...options.duplicates
      };
    }
    
    // Merge inconsistent values options
    if (options.inconsistentValues) {
      mergedOptions.inconsistentValues = {
        ...mergedOptions.inconsistentValues,
        ...options.inconsistentValues
      };
    }
    
    // Merge range validation options
    if (options.rangeValidation) {
      const ranges = {
        ...mergedOptions.rangeValidation?.ranges,
        ...options.rangeValidation.ranges
      };
      
      mergedOptions.rangeValidation = {
        ...mergedOptions.rangeValidation,
        ...options.rangeValidation,
        ranges
      };
    }
    
    // Merge severity levels
    if (options.severityLevels) {
      mergedOptions.severityLevels = {
        ...mergedOptions.severityLevels,
        ...options.severityLevels
      };
    }
    
    // Merge score weights
    if (options.scoreWeights) {
      mergedOptions.scoreWeights = {
        ...mergedOptions.scoreWeights,
        ...options.scoreWeights
      };
    }
    
    return mergedOptions;
  }
  
  /**
   * Calculate statistics for each field in the dataset
   */
  private calculateFieldStatistics(data: any[]): Record<string, FieldStatistics> {
    const fieldStats = new Map<string, FieldStatistics>();
    
    // Get all field names from the first row
    const fieldNames = Object.keys(data[0]);
    
    // Initialize statistics for each field
    for (const field of fieldNames) {
      fieldStats.set(field, {
        fieldName: field,
        dataType: 'unknown',
        count: data.length,
        distinctCount: 0,
        nullCount: 0,
        emptyCount: 0,
        min: undefined,
        max: undefined,
        mean: undefined,
        median: undefined,
        stdDev: undefined,
        patternAnalysis: {
          patterns: [],
          examples: {}
        },
        createdAt: new Date()
      });
    }
    
    // Extract values for each field
    const fieldValues: Record<string, any[]> = {};
    for (const field of fieldNames) {
      fieldValues[field] = data.map(row => row[field]);
    }
    
    // Calculate statistics for each field
    for (const field of fieldNames) {
      const values = fieldValues[field];
      const stat = fieldStats.get(field)!;
      
      // Count null and empty values
      const nullCount = values.filter(v => v === null || v === undefined).length;
      const emptyCount = values.filter(v => v === '' || (Array.isArray(v) && v.length === 0)).length;
      
      stat.nullCount = nullCount;
      stat.emptyCount = emptyCount;
      
      // Determine data type
      const nonNullValues = values.filter(v => v !== null && v !== undefined);
      if (nonNullValues.length > 0) {
        stat.dataType = this.determineDataType(nonNullValues);
      }
      
      // Calculate distinct count
      const distinctValues = new Set();
      for (const val of nonNullValues) {
        distinctValues.add(this.getValueKey(val));
      }
      stat.distinctCount = distinctValues.size;
      
      // Calculate additional statistics for numeric fields
      if (stat.dataType === 'number') {
        const numericValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));
        
        if (numericValues.length > 0) {
          // Min, max
          stat.min = Math.min(...numericValues);
          stat.max = Math.max(...numericValues);
          
          // Mean
          const sum = numericValues.reduce((a, b) => a + b, 0);
          stat.mean = sum / numericValues.length;
          
          // Median
          const sorted = [...numericValues].sort((a, b) => a - b);
          stat.median = this.calculateMedian(sorted);
          
          // Standard deviation
          const squareDiffs = numericValues.map(value => {
            const diff = value - stat.mean!;
            return diff * diff;
          });
          const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numericValues.length;
          stat.stdDev = Math.sqrt(avgSquareDiff);
          
          // Percentiles
          stat.percentiles = {
            '25': this.calculatePercentile(sorted, 25),
            '50': this.calculatePercentile(sorted, 50),
            '75': this.calculatePercentile(sorted, 75),
            '90': this.calculatePercentile(sorted, 90),
            '95': this.calculatePercentile(sorted, 95),
            '99': this.calculatePercentile(sorted, 99)
          };
          
          // Histogram
          const binCount = Math.min(10, Math.ceil(Math.sqrt(numericValues.length)));
          const binWidth = (stat.max - stat.min) / binCount;
          const histogram: [number, number][] = [];
          
          for (let i = 0; i < binCount; i++) {
            const binStart = stat.min + i * binWidth;
            const binEnd = binStart + binWidth;
            const count = numericValues.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;
            histogram.push([binStart, count]);
          }
          
          stat.histogram = histogram;
        }
      }
      
      // Calculate common and rare values (for non-numeric fields or numeric fields with low cardinality)
      if (stat.dataType !== 'number' || stat.distinctCount <= 100) {
        const valueCounts = new Map<string, number>();
        
        for (const val of nonNullValues) {
          const key = this.getValueKey(val);
          valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
        }
        
        // Convert to array and sort by count
        const valueCountsArray = Array.from(valueCounts.entries())
          .map(([key, count]) => [this.parseValueKey(key), count] as [any, number]);
        
        // Most common values
        stat.mostCommonValues = [...valueCountsArray]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        // Least common values
        stat.leastCommonValues = [...valueCountsArray]
          .sort((a, b) => a[1] - b[1])
          .slice(0, 10);
      }
      
      // Pattern analysis for string fields
      if (stat.dataType === 'string') {
        const patternCounts = new Map<string, number>();
        const patternExamples: Record<string, string[]> = {};
        
        for (const val of nonNullValues) {
          if (typeof val === 'string') {
            const pattern = this.generatePattern(val);
            patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
            
            if (!patternExamples[pattern]) {
              patternExamples[pattern] = [];
            }
            
            if (patternExamples[pattern].length < 3) {
              patternExamples[pattern].push(val);
            }
          }
        }
        
        // Convert to array and sort by count
        stat.patternAnalysis!.patterns = Array.from(patternCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        stat.patternAnalysis!.examples = patternExamples;
      }
    }
    
    // Convert the map to a record
    const result: Record<string, FieldStatistics> = {};
    for (const [field, stats] of fieldStats) {
      result[field] = stats;
    }
    
    return result;
  }
  
  /**
   * Detect missing values in the dataset
   */
  private async detectMissingValues(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.missingValues?.enabled) {
      return issues;
    }
    
    const excludeFields = options.missingValues.excludeFields || [];
    
    // Get all field names from the first row
    const fieldNames = Object.keys(data[0]).filter(field => !excludeFields.includes(field));
    
    // Check each field for missing values
    for (const field of fieldNames) {
      let missingCount = 0;
      const examples: any[] = [];
      
      // Count null, undefined, or empty string values
      for (let i = 0; i < data.length; i++) {
        const value = data[i][field];
        const isMissing = value === null || value === undefined || value === '';
        
        if (isMissing) {
          missingCount++;
          if (examples.length < (options.samples || 5)) {
            examples.push({ index: i, row: data[i] });
          }
        }
      }
      
      // Calculate the percentage of missing values
      const missingPercentage = (missingCount / data.length) * 100;
      
      // Check if the percentage exceeds the threshold
      if (missingPercentage > (options.missingValues.thresholdPercentage || 5)) {
        // Determine severity based on percentage
        let severity: DataQualityIssueSeverity;
        if (missingPercentage >= 50) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (missingPercentage >= 20) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (missingPercentage >= 10) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `missing-${this.nextIssueId++}`,
          type: DataQualityIssueType.MISSING_VALUE,
          severity,
          field,
          description: `Field "${field}" has ${missingPercentage.toFixed(2)}% missing values (${missingCount} out of ${data.length})`,
          affectedRows: missingCount,
          affectedRowsPercentage: missingPercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Detect outliers in the dataset
   */
  private async detectOutliers(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.outliers?.enabled) {
      return issues;
    }
    
    const method = options.outliers.method || 'zscore';
    const threshold = options.outliers.threshold || 3;
    const targetFields = options.outliers.fields;
    
    // Get all numeric field names
    const numericFields = Object.keys(data[0]).filter(field => {
      // Skip if there are specific target fields and this isn't one of them
      if (targetFields && targetFields.length > 0 && !targetFields.includes(field)) {
        return false;
      }
      
      // Check if the field contains numeric values
      const values = data.map(row => row[field]).filter(v => v !== null && v !== undefined);
      return values.length > 0 && values.every(v => typeof v === 'number' || !isNaN(Number(v)));
    });
    
    // Detect outliers in each numeric field
    for (const field of numericFields) {
      // Extract values for this field, converting to numbers
      const values = data
        .map((row, index) => ({ value: Number(row[field]), index, row }))
        .filter(item => !isNaN(item.value));
      
      if (values.length === 0) {
        continue;
      }
      
      // Find outliers based on the selected method
      let outliers: { value: number; index: number; row: any }[] = [];
      
      if (method === 'zscore') {
        // Calculate mean and standard deviation
        const sum = values.reduce((acc, curr) => acc + curr.value, 0);
        const mean = sum / values.length;
        
        const squaredDiffs = values.map(item => (item.value - mean) ** 2);
        const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Find values with z-scores exceeding the threshold
        outliers = values.filter(item => {
          const zScore = Math.abs((item.value - mean) / stdDev);
          return zScore > threshold;
        });
      } else if (method === 'iqr') {
        // Sort values
        const sortedValues = [...values].sort((a, b) => a.value - b.value);
        
        // Calculate quartiles
        const q1Index = Math.floor(sortedValues.length * 0.25);
        const q3Index = Math.floor(sortedValues.length * 0.75);
        
        const q1 = sortedValues[q1Index].value;
        const q3 = sortedValues[q3Index].value;
        
        // Calculate IQR and fences
        const iqr = q3 - q1;
        const lowerFence = q1 - threshold * iqr;
        const upperFence = q3 + threshold * iqr;
        
        // Find values outside the fences
        outliers = values.filter(item => item.value < lowerFence || item.value > upperFence);
      } else if (method === 'percentile') {
        // Sort values
        const sortedValues = [...values].sort((a, b) => a.value - b.value);
        
        // Calculate percentiles
        const lowerPercentile = 0.5 - threshold / 20; // e.g., threshold of 4.5 gives 0.275
        const upperPercentile = 0.5 + threshold / 20; // e.g., threshold of 4.5 gives 0.725
        
        const lowerIndex = Math.max(0, Math.floor(sortedValues.length * lowerPercentile));
        const upperIndex = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * upperPercentile));
        
        const lowerValue = sortedValues[lowerIndex].value;
        const upperValue = sortedValues[upperIndex].value;
        
        // Find values outside the percentile range
        outliers = values.filter(item => item.value < lowerValue || item.value > upperValue);
      }
      
      // If outliers were found, create an issue
      if (outliers.length > 0) {
        // Limit the examples to the sample size
        const examples = outliers.slice(0, options.samples || 5).map(item => ({
          index: item.index,
          value: item.value,
          row: item.row
        }));
        
        // Calculate the percentage of outliers
        const outlierPercentage = (outliers.length / values.length) * 100;
        
        // Determine severity based on percentage
        let severity: DataQualityIssueSeverity;
        if (outlierPercentage >= 10) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (outlierPercentage >= 5) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `outlier-${this.nextIssueId++}`,
          type: DataQualityIssueType.OUTLIER,
          severity,
          field,
          description: `Field "${field}" has ${outliers.length} outliers (${outlierPercentage.toFixed(2)}% of non-null values) using the ${method} method with threshold ${threshold}`,
          affectedRows: outliers.length,
          affectedRowsPercentage: outlierPercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Detect invalid format values in the dataset
   */
  private async detectInvalidFormats(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.invalidFormats?.enabled) {
      return issues;
    }
    
    const patterns = options.invalidFormats.patterns || {};
    const fieldPatterns = options.invalidFormats.fields || {};
    
    // For each field-pattern mapping
    for (const [patternName, fields] of Object.entries(fieldPatterns)) {
      const pattern = patterns[patternName];
      
      if (!pattern) {
        continue;
      }
      
      for (const field of fields) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const invalidValues: { index: number; value: string; row: any }[] = [];
        
        // Validate each value against the pattern
        for (let i = 0; i < data.length; i++) {
          const value = data[i][field];
          
          // Skip null or non-string values
          if (value === null || value === undefined || typeof value !== 'string') {
            continue;
          }
          
          // Check if the value matches the pattern
          if (!regex.test(value)) {
            invalidValues.push({ index: i, value, row: data[i] });
          }
        }
        
        // If invalid values were found, create an issue
        if (invalidValues.length > 0) {
          // Limit the examples to the sample size
          const examples = invalidValues.slice(0, options.samples || 5);
          
          // Calculate the percentage of invalid values
          const nonNullCount = data.filter(row => 
            row[field] !== null && row[field] !== undefined && typeof row[field] === 'string'
          ).length;
          const invalidPercentage = (invalidValues.length / nonNullCount) * 100;
          
          // Determine severity based on percentage
          let severity: DataQualityIssueSeverity;
          if (invalidPercentage >= 20) {
            severity = DataQualityIssueSeverity.ERROR;
          } else if (invalidPercentage >= 10) {
            severity = DataQualityIssueSeverity.WARNING;
          } else {
            severity = DataQualityIssueSeverity.INFO;
          }
          
          // Create the issue
          const issue: DataQualityIssue = {
            id: `format-${this.nextIssueId++}`,
            type: DataQualityIssueType.INVALID_FORMAT,
            severity,
            field,
            description: `Field "${field}" has ${invalidValues.length} values (${invalidPercentage.toFixed(2)}% of non-null values) that don't match the ${patternName} pattern`,
            affectedRows: invalidValues.length,
            affectedRowsPercentage: invalidPercentage,
            examples,
            createdAt: new Date()
          };
          
          issues.push(issue);
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Detect duplicate values in the dataset
   */
  private async detectDuplicates(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.duplicates?.enabled) {
      return issues;
    }
    
    // Check individual fields
    const fields = options.duplicates.fields || [];
    for (const field of fields) {
      const valueMap = new Map<string, number[]>();
      
      // Count occurrences of each value
      for (let i = 0; i < data.length; i++) {
        const value = data[i][field];
        
        // Skip null values
        if (value === null || value === undefined) {
          continue;
        }
        
        const key = this.getValueKey(value);
        if (!valueMap.has(key)) {
          valueMap.set(key, []);
        }
        valueMap.get(key)!.push(i);
      }
      
      // Find duplicates
      const duplicates = Array.from(valueMap.entries())
        .filter(([_, indices]) => indices.length > 1);
      
      if (duplicates.length > 0) {
        // Calculate the total number of duplicate values
        const totalDuplicates = duplicates.reduce(
          (total, [_, indices]) => total + indices.length - 1,
          0
        );
        
        // Generate examples from different duplicate sets
        const examples: { index: number; value: any; row: any }[] = [];
        for (const [valueKey, indices] of duplicates.slice(0, Math.min(duplicates.length, 3))) {
          // Take up to 2 examples from each duplicate set
          for (const index of indices.slice(0, 2)) {
            if (examples.length < (options.samples || 5)) {
              examples.push({
                index,
                value: data[index][field],
                row: data[index]
              });
            }
          }
          
          if (examples.length >= (options.samples || 5)) {
            break;
          }
        }
        
        // Calculate the percentage of duplicate values
        const nonNullCount = data.filter(row => row[field] !== null && row[field] !== undefined).length;
        const duplicatePercentage = (totalDuplicates / nonNullCount) * 100;
        
        // Determine severity based on percentage and field context
        let severity: DataQualityIssueSeverity;
        if (duplicatePercentage >= 30) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (duplicatePercentage >= 15) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `duplicate-${this.nextIssueId++}`,
          type: DataQualityIssueType.DUPLICATE_VALUE,
          severity,
          field,
          description: `Field "${field}" has ${duplicates.length} values with duplicates, affecting ${totalDuplicates} rows (${duplicatePercentage.toFixed(2)}% of non-null values)`,
          affectedRows: totalDuplicates,
          affectedRowsPercentage: duplicatePercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    // Check composite key duplicates
    const compositeSets = options.duplicates.composite || [];
    for (const compositeFields of compositeSets) {
      const valueMap = new Map<string, number[]>();
      
      // Create composite keys and count occurrences
      for (let i = 0; i < data.length; i++) {
        const compositeKey = compositeFields.map(field => {
          const value = data[i][field];
          return value === null || value === undefined ? 'NULL' : this.getValueKey(value);
        }).join('|');
        
        if (!valueMap.has(compositeKey)) {
          valueMap.set(compositeKey, []);
        }
        valueMap.get(compositeKey)!.push(i);
      }
      
      // Find duplicates
      const duplicates = Array.from(valueMap.entries())
        .filter(([_, indices]) => indices.length > 1);
      
      if (duplicates.length > 0) {
        // Calculate the total number of duplicate values
        const totalDuplicates = duplicates.reduce(
          (total, [_, indices]) => total + indices.length - 1,
          0
        );
        
        // Generate examples from different duplicate sets
        const examples: { index: number; values: Record<string, any>; row: any }[] = [];
        for (const [_, indices] of duplicates.slice(0, Math.min(duplicates.length, 3))) {
          // Take up to 2 examples from each duplicate set
          for (const index of indices.slice(0, 2)) {
            if (examples.length < (options.samples || 5)) {
              const values: Record<string, any> = {};
              for (const field of compositeFields) {
                values[field] = data[index][field];
              }
              
              examples.push({
                index,
                values,
                row: data[index]
              });
            }
          }
          
          if (examples.length >= (options.samples || 5)) {
            break;
          }
        }
        
        // Calculate the percentage of duplicate values
        const duplicatePercentage = (totalDuplicates / data.length) * 100;
        
        // Determine severity based on percentage
        let severity: DataQualityIssueSeverity;
        if (duplicatePercentage >= 10) {
          severity = DataQualityIssueSeverity.CRITICAL;
        } else if (duplicatePercentage >= 5) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (duplicatePercentage >= 1) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `composite-duplicate-${this.nextIssueId++}`,
          type: DataQualityIssueType.DUPLICATE_VALUE,
          severity,
          field: compositeFields.join(', '),
          description: `Composite key "${compositeFields.join(', ')}" has ${duplicates.length} values with duplicates, affecting ${totalDuplicates} rows (${duplicatePercentage.toFixed(2)}%)`,
          affectedRows: totalDuplicates,
          affectedRowsPercentage: duplicatePercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Detect inconsistent values in the dataset
   */
  private async detectInconsistentValues(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.inconsistentValues?.enabled) {
      return issues;
    }
    
    const fieldSets = options.inconsistentValues.fieldSets || [];
    
    for (const fields of fieldSets) {
      // Skip if there are fewer than 2 fields in the set
      if (fields.length < 2) {
        continue;
      }
      
      const inconsistencies: number[] = [];
      
      // Check for inconsistencies in each row
      for (let i = 0; i < data.length; i++) {
        let hasInconsistency = false;
        
        // Simple consistency checks based on field names and values
        // This is a basic implementation that can be extended with domain-specific logic
        
        // Example: check if fields with "total" are sum of fields with "subtotal" or similar pattern
        const totalFields = fields.filter(f => f.toLowerCase().includes('total'));
        const subFields = fields.filter(f => !f.toLowerCase().includes('total'));
        
        if (totalFields.length === 1 && subFields.length > 0) {
          const totalValue = parseFloat(data[i][totalFields[0]]);
          
          if (!isNaN(totalValue)) {
            const subValues = subFields.map(f => parseFloat(data[i][f])).filter(v => !isNaN(v));
            const subTotal = subValues.reduce((sum, val) => sum + val, 0);
            
            // Allow for small floating point differences
            if (Math.abs(totalValue - subTotal) > 0.01) {
              hasInconsistency = true;
            }
          }
        }
        
        // Example: check if date fields are in chronological order
        const dateFields = fields.filter(f => 
          f.toLowerCase().includes('date') || 
          f.toLowerCase().includes('time') ||
          f.toLowerCase().includes('start') ||
          f.toLowerCase().includes('end')
        );
        
        if (dateFields.length >= 2) {
          const dateValues = dateFields.map(f => new Date(data[i][f]));
          
          for (let j = 0; j < dateValues.length - 1; j++) {
            const date1 = dateValues[j];
            const date2 = dateValues[j + 1];
            
            if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
              // For fields containing "start" and "end"
              if (
                (dateFields[j].toLowerCase().includes('start') && dateFields[j + 1].toLowerCase().includes('end')) ||
                (dateFields[j].toLowerCase().includes('begin') && dateFields[j + 1].toLowerCase().includes('end'))
              ) {
                if (date1 > date2) {
                  hasInconsistency = true;
                  break;
                }
              }
            }
          }
        }
        
        if (hasInconsistency) {
          inconsistencies.push(i);
        }
      }
      
      // If inconsistencies were found, create an issue
      if (inconsistencies.length > 0) {
        // Generate examples
        const examples = inconsistencies.slice(0, options.samples || 5).map(index => ({
          index,
          values: fields.reduce((obj, field) => ({ ...obj, [field]: data[index][field] }), {}),
          row: data[index]
        }));
        
        // Calculate the percentage of inconsistent values
        const inconsistentPercentage = (inconsistencies.length / data.length) * 100;
        
        // Determine severity based on percentage
        let severity: DataQualityIssueSeverity;
        if (inconsistentPercentage >= 10) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (inconsistentPercentage >= 5) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `inconsistent-${this.nextIssueId++}`,
          type: DataQualityIssueType.INCONSISTENT_VALUE,
          severity,
          field: fields.join(', '),
          description: `Fields "${fields.join(', ')}" have inconsistent values in ${inconsistencies.length} rows (${inconsistentPercentage.toFixed(2)}%)`,
          affectedRows: inconsistencies.length,
          affectedRowsPercentage: inconsistentPercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Detect out-of-range values in the dataset
   */
  private async detectOutOfRangeValues(
    data: any[],
    options: DataQualityAnalysisOptions
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    if (!options.rangeValidation?.enabled) {
      return issues;
    }
    
    const ranges = options.rangeValidation.ranges || {};
    
    for (const [field, range] of Object.entries(ranges)) {
      const outOfRangeIndices: number[] = [];
      
      // Check each value against the range
      for (let i = 0; i < data.length; i++) {
        const value = parseFloat(data[i][field]);
        
        // Skip non-numeric values
        if (isNaN(value)) {
          continue;
        }
        
        // Check if the value is out of range
        if (
          (range.min !== undefined && value < range.min) || 
          (range.max !== undefined && value > range.max)
        ) {
          outOfRangeIndices.push(i);
        }
      }
      
      // If out-of-range values were found, create an issue
      if (outOfRangeIndices.length > 0) {
        // Generate examples
        const examples = outOfRangeIndices.slice(0, options.samples || 5).map(index => ({
          index,
          value: data[index][field],
          row: data[index]
        }));
        
        // Calculate the percentage of out-of-range values
        const numericCount = data.filter(row => !isNaN(parseFloat(row[field]))).length;
        const outOfRangePercentage = (outOfRangeIndices.length / numericCount) * 100;
        
        // Determine severity based on percentage
        let severity: DataQualityIssueSeverity;
        if (outOfRangePercentage >= 20) {
          severity = DataQualityIssueSeverity.ERROR;
        } else if (outOfRangePercentage >= 10) {
          severity = DataQualityIssueSeverity.WARNING;
        } else {
          severity = DataQualityIssueSeverity.INFO;
        }
        
        // Create a description with the range
        let rangeDescription = '';
        if (range.min !== undefined && range.max !== undefined) {
          rangeDescription = `[${range.min}, ${range.max}]`;
        } else if (range.min !== undefined) {
          rangeDescription = `>= ${range.min}`;
        } else if (range.max !== undefined) {
          rangeDescription = `<= ${range.max}`;
        }
        
        // Create the issue
        const issue: DataQualityIssue = {
          id: `range-${this.nextIssueId++}`,
          type: DataQualityIssueType.OUT_OF_RANGE,
          severity,
          field,
          description: `Field "${field}" has ${outOfRangeIndices.length} values (${outOfRangePercentage.toFixed(2)}% of numeric values) outside the expected range ${rangeDescription}`,
          affectedRows: outOfRangeIndices.length,
          affectedRowsPercentage: outOfRangePercentage,
          examples,
          createdAt: new Date()
        };
        
        issues.push(issue);
      }
    }
    
    return issues;
  }
  
  /**
   * Calculate quality scores
   */
  private calculateQualityScores(
    result: DataQualityAnalysisResult,
    options: DataQualityAnalysisOptions
  ): {
    completenessScore: number;
    validityScore: number;
    consistencyScore: number;
    qualityScore: number;
  } {
    const weights = options.scoreWeights || {
      completeness: 0.4,
      validity: 0.4,
      consistency: 0.2
    };
    
    // Calculate completeness score based on missing value issues
    const missingValueIssueCount = result.issuesByType[DataQualityIssueType.MISSING_VALUE] || 0;
    const completenessScore = Math.max(0, 100 - (missingValueIssueCount * 5));
    
    // Calculate validity score based on invalid format and out-of-range issues
    const invalidFormatIssueCount = result.issuesByType[DataQualityIssueType.INVALID_FORMAT] || 0;
    const outOfRangeIssueCount = result.issuesByType[DataQualityIssueType.OUT_OF_RANGE] || 0;
    const validityScore = Math.max(0, 100 - ((invalidFormatIssueCount + outOfRangeIssueCount) * 5));
    
    // Calculate consistency score based on duplicates and inconsistent values
    const duplicateIssueCount = result.issuesByType[DataQualityIssueType.DUPLICATE_VALUE] || 0;
    const inconsistentIssueCount = result.issuesByType[DataQualityIssueType.INCONSISTENT_VALUE] || 0;
    const outlierIssueCount = result.issuesByType[DataQualityIssueType.OUTLIER] || 0;
    const consistencyScore = Math.max(0, 100 - ((duplicateIssueCount + inconsistentIssueCount + outlierIssueCount) * 5));
    
    // Calculate the weighted overall quality score
    const qualityScore = 
      (completenessScore * weights.completeness) +
      (validityScore * weights.validity) +
      (consistencyScore * weights.consistency);
    
    return {
      completenessScore,
      validityScore,
      consistencyScore,
      qualityScore
    };
  }
  
  /**
   * Determine the data type of a field
   */
  private determineDataType(values: any[]): string {
    // Count the number of values of each type
    const typeCounts = new Map<string, number>();
    
    for (const value of values) {
      let type: string;
      
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'number' || !isNaN(Number(value))) {
        type = 'number';
      } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
        type = 'boolean';
      } else if (typeof value === 'object' && value instanceof Date) {
        type = 'date';
      } else if (typeof value === 'string' && !isNaN(Date.parse(value))) {
        // Check if the string is a valid date
        type = 'date';
      } else if (typeof value === 'object') {
        type = 'object';
      } else {
        type = 'string';
      }
      
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }
    
    // Find the most common type
    let maxCount = 0;
    let dataType = 'unknown';
    
    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dataType = type;
      }
    }
    
    return dataType;
  }
  
  /**
   * Generate a pattern string for a value
   */
  private generatePattern(value: string): string {
    // Replace characters with pattern tokens
    let pattern = '';
    
    for (let i = 0; i < value.length; i++) {
      const char = value.charAt(i);
      
      if (/[A-Z]/.test(char)) {
        pattern += 'A';
      } else if (/[a-z]/.test(char)) {
        pattern += 'a';
      } else if (/[0-9]/.test(char)) {
        pattern += '9';
      } else {
        pattern += char;
      }
    }
    
    return pattern;
  }
  
  /**
   * Calculate the median of a sorted array
   */
  private calculateMedian(sortedValues: number[]): number {
    const mid = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    } else {
      return sortedValues[mid];
    }
  }
  
  /**
   * Calculate a percentile value
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }
  
  /**
   * Get a string key for a value
   */
  private getValueKey(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  }
  
  /**
   * Parse a string key back to a value
   */
  private parseValueKey(key: string): any {
    if (key === 'null') {
      return null;
    }
    
    try {
      return JSON.parse(key);
    } catch (e) {
      return key;
    }
  }
  
  /**
   * Add issues to a map grouped by field
   */
  private addIssuesToMap(issueMap: Map<string | undefined, DataQualityIssue[]>, issues: DataQualityIssue[]): void {
    for (const issue of issues) {
      if (!issueMap.has(issue.field)) {
        issueMap.set(issue.field, []);
      }
      
      issueMap.get(issue.field)!.push(issue);
    }
  }
}

// Export a singleton instance
export const dataQualityService = new DataQualityService();