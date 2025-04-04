/**
 * Data Quality Service
 * 
 * Provides functionality for assessing and improving data quality
 */

/**
 * Data quality issue enum
 */
export enum DataQualityIssueType {
  MISSING_VALUE = 'missing_value',
  INVALID_FORMAT = 'invalid_format',
  OUT_OF_RANGE = 'out_of_range',
  INCONSISTENT_VALUE = 'inconsistent_value',
  DUPLICATE_RECORD = 'duplicate_record',
  OUTLIER = 'outlier',
  CUSTOM = 'custom'
}

/**
 * Data quality issue severity enum
 */
export enum DataQualitySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  id: string;
  type: DataQualityIssueType;
  field?: string;
  recordIndex?: number;
  recordId?: string | number;
  message: string;
  severity: DataQualitySeverity;
  details?: any;
  suggestion?: string;
}

/**
 * Field statistics interface
 */
export interface FieldStatistics {
  field: string;
  count: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniqueness: number;
  patterns: Map<string, number>;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
  histogram?: any[];
  commonValues?: [any, number][];
  dataType: string;
  formats: Map<string, number>;
  formatConsistency: number;
}

/**
 * Data quality analysis result interface
 */
export interface DataQualityAnalysisResult {
  recordCount: number;
  fieldCount: number;
  completeness: number;
  uniqueness: number;
  consistency: number;
  accuracy: number;
  validity: number;
  overallScore: number;
  fieldStats: Map<string, FieldStatistics>;
  issues: DataQualityIssue[];
  suggestions: string[];
  timestamp: Date;
}

/**
 * Data quality rule interface
 */
export interface DataQualityRule {
  id: string;
  name: string;
  field?: string;
  type: DataQualityIssueType;
  severity: DataQualitySeverity;
  condition: (value: any, record: any, stats?: FieldStatistics) => boolean;
  message: string;
  suggestion?: string;
  enabled: boolean;
}

/**
 * Data quality service class
 */
class DataQualityService {
  private rules: DataQualityRule[] = [];
  private nextRuleId = 1;
  
  constructor() {
    console.log('Data quality service initialized');
    this.initializeDefaultRules();
  }
  
  /**
   * Analyze data quality
   */
  analyzeDataQuality(data: any[], options: {
    fields?: string[];
    enabledRules?: boolean;
    customRules?: DataQualityRule[];
    generateSuggestions?: boolean;
    computeStatistics?: boolean;
  } = {}): DataQualityAnalysisResult {
    if (!data || data.length === 0) {
      return {
        recordCount: 0,
        fieldCount: 0,
        completeness: 0,
        uniqueness: 0,
        consistency: 0,
        accuracy: 0,
        validity: 0,
        overallScore: 0,
        fieldStats: new Map(),
        issues: [],
        suggestions: [],
        timestamp: new Date()
      };
    }
    
    console.log(`Analyzing data quality for ${data.length} records`);
    
    // Identify all fields if not specified
    const fields = options.fields || this.identifyFields(data);
    
    // Compute statistics for each field
    const fieldStats = this.computeFieldStatistics(data, fields);
    
    // Identify issues based on rules
    const activeRules = [
      ...(options.enabledRules !== false ? this.rules.filter(rule => rule.enabled) : []),
      ...(options.customRules || [])
    ];
    
    const issues = this.identifyIssues(data, activeRules, fieldStats);
    
    // Calculate quality scores
    const qualityScores = this.calculateQualityScores(data, fieldStats, issues);
    
    // Generate suggestions
    const suggestions = options.generateSuggestions !== false
      ? this.generateSuggestions(issues, fieldStats)
      : [];
    
    const overallScore = (
      qualityScores.completeness +
      qualityScores.uniqueness +
      qualityScores.consistency +
      qualityScores.accuracy +
      qualityScores.validity
    ) / 5;
    
    console.log(`Data quality analysis complete. Overall score: ${(overallScore * 100).toFixed(2)}%`);
    
    return {
      recordCount: data.length,
      fieldCount: fields.length,
      ...qualityScores,
      overallScore,
      fieldStats,
      issues,
      suggestions,
      timestamp: new Date()
    };
  }
  
  /**
   * Add a new data quality rule
   */
  addRule(rule: Omit<DataQualityRule, 'id'>): DataQualityRule {
    const newRule: DataQualityRule = {
      id: `rule-${this.nextRuleId++}`,
      ...rule
    };
    
    this.rules.push(newRule);
    return newRule;
  }
  
  /**
   * Get all data quality rules
   */
  getRules(): DataQualityRule[] {
    return [...this.rules];
  }
  
  /**
   * Remove a data quality rule
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    return this.rules.length !== initialLength;
  }
  
  /**
   * Enable or disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(rule => rule.id === ruleId);
    
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    
    return false;
  }
  
  /**
   * Identify fields in the data
   */
  private identifyFields(data: any[]): string[] {
    const fieldSet = new Set<string>();
    
    // Collect fields from all records
    for (const record of data) {
      if (record && typeof record === 'object') {
        for (const field of Object.keys(record)) {
          fieldSet.add(field);
        }
      }
    }
    
    return Array.from(fieldSet);
  }
  
  /**
   * Compute statistics for each field
   */
  private computeFieldStatistics(data: any[], fields: string[]): Map<string, FieldStatistics> {
    const fieldStats = new Map<string, FieldStatistics>();
    
    for (const field of fields) {
      // Extract values for this field
      const values = data.map(record => record[field]);
      
      // Count records
      const count = values.length;
      
      // Count null/undefined values
      const nullCount = values.filter(v => v === null || v === undefined).length;
      const nullPercentage = nullCount / count;
      
      // Count unique values
      const uniqueValues = new Set(values.map(v => 
        v !== null && v !== undefined ? JSON.stringify(v) : null
      ));
      const uniqueCount = uniqueValues.size;
      const uniqueness = uniqueCount / count;
      
      // Determine data type
      const nonNullValues = values.filter(v => v !== null && v !== undefined);
      let dataType = 'unknown';
      
      if (nonNullValues.length > 0) {
        const types = new Map<string, number>();
        
        for (const value of nonNullValues) {
          const type = typeof value;
          types.set(type, (types.get(type) || 0) + 1);
        }
        
        // Find the most common type
        let maxCount = 0;
        for (const [type, typeCount] of types) {
          if (typeCount > maxCount) {
            maxCount = typeCount;
            dataType = type;
          }
        }
        
        // Special case for dates
        if (dataType === 'string') {
          // Check if values parse as dates
          const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(v))).length;
          if (dateCount / nonNullValues.length > 0.8) {
            dataType = 'date';
          }
        } else if (dataType === 'object') {
          // Check if values are arrays or specific object types
          const arrayCount = nonNullValues.filter(v => Array.isArray(v)).length;
          if (arrayCount / nonNullValues.length > 0.8) {
            dataType = 'array';
          }
        }
      }
      
      // Analyze patterns and formats
      const patterns = new Map<string, number>();
      const formats = new Map<string, number>();
      
      for (const value of nonNullValues) {
        const pattern = this.detectPattern(value);
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        
        const format = this.detectFormat(value, dataType);
        formats.set(format, (formats.get(format) || 0) + 1);
      }
      
      // Calculate format consistency
      const formatConsistency = nonNullValues.length > 0
        ? Math.max(...Array.from(formats.values())) / nonNullValues.length
        : 1;
      
      // Calculate numeric statistics if applicable
      let min, max, mean, median, mode, stdDev, histogram;
      
      if ((dataType === 'number' || dataType === 'date') && nonNullValues.length > 0) {
        if (dataType === 'date') {
          // Convert dates to timestamps for calculations
          const timestamps = nonNullValues.map(v => new Date(v).getTime());
          min = new Date(Math.min(...timestamps));
          max = new Date(Math.max(...timestamps));
        } else {
          // Regular numeric calculations
          const numbers = nonNullValues.map(Number);
          min = Math.min(...numbers);
          max = Math.max(...numbers);
          mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
          
          // Sort for median
          const sorted = [...numbers].sort((a, b) => a - b);
          median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
          
          // Calculate standard deviation
          const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
          stdDev = Math.sqrt(variance);
          
          // Create histogram (10 bins)
          if (max > min) {
            const binSize = (max - min) / 10;
            histogram = Array(10).fill(0);
            
            for (const num of numbers) {
              const binIndex = Math.min(Math.floor((num - min) / binSize), 9);
              histogram[binIndex]++;
            }
          }
        }
      }
      
      // Find common values
      const valueCounts = new Map<string, number>();
      
      for (const value of values) {
        const key = value !== null && value !== undefined ? JSON.stringify(value) : 'null';
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
      }
      
      const commonValues = Array.from(valueCounts.entries())
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, count]) => [key === 'null' ? null : JSON.parse(key), count]);
      
      // Store field statistics
      fieldStats.set(field, {
        field,
        count,
        nullCount,
        nullPercentage,
        uniqueCount,
        uniqueness,
        patterns,
        min,
        max,
        mean,
        median,
        stdDev,
        histogram,
        commonValues,
        dataType,
        formats,
        formatConsistency,
        mode: commonValues.length > 0 ? commonValues[0][0] : undefined
      });
    }
    
    return fieldStats;
  }
  
  /**
   * Identify issues based on rules
   */
  private identifyIssues(
    data: any[],
    rules: DataQualityRule[],
    fieldStats: Map<string, FieldStatistics>
  ): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    for (let recordIndex = 0; recordIndex < data.length; recordIndex++) {
      const record = data[recordIndex];
      
      if (!record || typeof record !== 'object') {
        continue;
      }
      
      const recordId = record.id || record._id || recordIndex;
      
      // Apply each rule
      for (const rule of rules) {
        try {
          // Skip field-specific rules if the field doesn't match
          if (rule.field && (!record.hasOwnProperty(rule.field) || record[rule.field] === undefined)) {
            continue;
          }
          
          const value = rule.field ? record[rule.field] : record;
          const stats = rule.field ? fieldStats.get(rule.field) : undefined;
          
          if (rule.condition(value, record, stats)) {
            issues.push({
              id: `issue-${issues.length + 1}`,
              type: rule.type,
              field: rule.field,
              recordIndex,
              recordId,
              message: rule.message,
              severity: rule.severity,
              suggestion: rule.suggestion
            });
          }
        } catch (error) {
          console.error(`Error applying rule ${rule.name}:`, error);
        }
      }
    }
    
    // Add dataset-level issues
    
    // Check for inconsistent field counts
    const fieldCounts = data.map(record => Object.keys(record).length);
    const inconsistentCount = fieldCounts.filter(count => count !== fieldCounts[0]).length;
    
    if (inconsistentCount > 0) {
      issues.push({
        id: `issue-${issues.length + 1}`,
        type: DataQualityIssueType.INCONSISTENT_VALUE,
        message: `${inconsistentCount} records have different field counts`,
        severity: DataQualitySeverity.WARNING,
        suggestion: 'Check for missing fields in these records or normalize the schema'
      });
    }
    
    // Check for low completeness fields
    for (const [field, stats] of fieldStats) {
      if (stats.nullPercentage > 0.2) {
        issues.push({
          id: `issue-${issues.length + 1}`,
          type: DataQualityIssueType.MISSING_VALUE,
          field,
          message: `Field '${field}' is missing in ${stats.nullCount} records (${(stats.nullPercentage * 100).toFixed(1)}%)`,
          severity: stats.nullPercentage > 0.5 ? DataQualitySeverity.ERROR : DataQualitySeverity.WARNING,
          suggestion: 'Consider adding default values or making this field required'
        });
      }
    }
    
    // Check for low format consistency
    for (const [field, stats] of fieldStats) {
      if (stats.formatConsistency < 0.8 && stats.nullPercentage < 0.5) {
        issues.push({
          id: `issue-${issues.length + 1}`,
          type: DataQualityIssueType.INCONSISTENT_VALUE,
          field,
          message: `Field '${field}' has inconsistent formats (${(stats.formatConsistency * 100).toFixed(1)}% consistency)`,
          severity: DataQualitySeverity.WARNING,
          suggestion: 'Standardize the format of this field'
        });
      }
    }
    
    // Check for duplicate records
    const duplicateCount = this.countDuplicateRecords(data);
    
    if (duplicateCount > 0) {
      issues.push({
        id: `issue-${issues.length + 1}`,
        type: DataQualityIssueType.DUPLICATE_RECORD,
        message: `${duplicateCount} duplicate records found`,
        severity: duplicateCount > data.length * 0.05 ? DataQualitySeverity.ERROR : DataQualitySeverity.WARNING,
        suggestion: 'Remove duplicate records or add unique constraints'
      });
    }
    
    return issues;
  }
  
  /**
   * Calculate quality scores
   */
  private calculateQualityScores(
    data: any[],
    fieldStats: Map<string, FieldStatistics>,
    issues: DataQualityIssue[]
  ): {
    completeness: number;
    uniqueness: number;
    consistency: number;
    accuracy: number;
    validity: number;
  } {
    // Completeness: percentage of non-null values
    const totalFields = data.length * fieldStats.size;
    const nullCounts = Array.from(fieldStats.values()).reduce((sum, stats) => sum + stats.nullCount, 0);
    const completeness = 1 - (nullCounts / totalFields);
    
    // Uniqueness: average uniqueness across fields
    const uniqueness = Array.from(fieldStats.values())
      .filter(stats => stats.uniqueness !== undefined)
      .reduce((sum, stats) => sum + stats.uniqueness, 0) / fieldStats.size;
    
    // Consistency: average format consistency
    const consistency = Array.from(fieldStats.values())
      .filter(stats => stats.formatConsistency !== undefined)
      .reduce((sum, stats) => sum + stats.formatConsistency, 0) / fieldStats.size;
    
    // Count issues by type for validity and accuracy
    const validityIssues = issues.filter(issue => 
      issue.type === DataQualityIssueType.INVALID_FORMAT || 
      issue.type === DataQualityIssueType.OUT_OF_RANGE
    ).length;
    
    const accuracyIssues = issues.filter(issue => 
      issue.type === DataQualityIssueType.INCONSISTENT_VALUE || 
      issue.type === DataQualityIssueType.OUTLIER
    ).length;
    
    // Validity: percentage of records without format issues
    const validity = Math.max(0, 1 - (validityIssues / data.length));
    
    // Accuracy: percentage of records without value issues
    const accuracy = Math.max(0, 1 - (accuracyIssues / data.length));
    
    return {
      completeness,
      uniqueness,
      consistency,
      accuracy,
      validity
    };
  }
  
  /**
   * Generate suggestions based on issues
   */
  private generateSuggestions(
    issues: DataQualityIssue[],
    fieldStats: Map<string, FieldStatistics>
  ): string[] {
    const suggestions: string[] = [];
    
    // Group issues by field and type
    const issuesByField = new Map<string | undefined, DataQualityIssue[]>();
    
    for (const issue of issues) {
      const key = issue.field || '_global_';
      
      if (!issuesByField.has(key)) {
        issuesByField.set(key, []);
      }
      
      issuesByField.get(key)!.push(issue);
    }
    
    // Generate suggestions for each field
    for (const [field, fieldIssues] of issuesByField) {
      if (field === '_global_') {
        // Dataset-level suggestions
        if (fieldIssues.some(issue => issue.type === DataQualityIssueType.DUPLICATE_RECORD)) {
          suggestions.push('Add unique constraints or a deduplication process to prevent duplicate records');
        }
      } else {
        // Field-level suggestions
        const stats = fieldStats.get(field);
        
        if (!stats) continue;
        
        // Missing value suggestions
        if (fieldIssues.some(issue => issue.type === DataQualityIssueType.MISSING_VALUE)) {
          if (stats.nullPercentage > 0.8) {
            suggestions.push(`Consider removing field '${field}' as it's mostly empty (${(stats.nullPercentage * 100).toFixed(1)}% null)`);
          } else if (stats.nullPercentage > 0.2) {
            suggestions.push(`Add default values for field '${field}' (${stats.nullCount} null values)`);
          }
        }
        
        // Format inconsistency suggestions
        if (fieldIssues.some(issue => issue.type === DataQualityIssueType.INCONSISTENT_VALUE)) {
          suggestions.push(`Standardize the format of field '${field}' (current consistency: ${(stats.formatConsistency * 100).toFixed(1)}%)`);
        }
        
        // Value range suggestions
        if (fieldIssues.some(issue => issue.type === DataQualityIssueType.OUT_OF_RANGE)) {
          suggestions.push(`Add validation constraints for field '${field}' (found values outside expected range)`);
        }
        
        // Invalid format suggestions
        if (fieldIssues.some(issue => issue.type === DataQualityIssueType.INVALID_FORMAT)) {
          suggestions.push(`Fix format inconsistencies in field '${field}' or add format validation`);
        }
      }
    }
    
    // Add general suggestions based on quality scores
    const fieldNamesWithLowCompleteness = Array.from(fieldStats.entries())
      .filter(([_, stats]) => stats.nullPercentage > 0.5)
      .map(([field, _]) => field);
    
    if (fieldNamesWithLowCompleteness.length > 0) {
      suggestions.push(`Consider making these fields optional or removing them: ${fieldNamesWithLowCompleteness.join(', ')}`);
    }
    
    return [...new Set(suggestions)]; // Remove duplicates
  }
  
  /**
   * Count duplicate records in the dataset
   */
  private countDuplicateRecords(data: any[]): number {
    // Create a simple hash for each record
    const recordHashes = new Map<string, number>();
    
    for (const record of data) {
      // Skip non-object records
      if (!record || typeof record !== 'object') {
        continue;
      }
      
      // Create a sorted JSON string as a hash
      const hash = JSON.stringify(
        Object.entries(record)
          .filter(([key, _]) => !key.startsWith('_') && key !== 'id')
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      );
      
      recordHashes.set(hash, (recordHashes.get(hash) || 0) + 1);
    }
    
    // Count records that appear more than once
    return Array.from(recordHashes.values()).reduce((count, occurrences) => {
      return count + (occurrences > 1 ? occurrences - 1 : 0);
    }, 0);
  }
  
  /**
   * Detect pattern of a value
   */
  private detectPattern(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    const type = typeof value;
    
    switch (type) {
      case 'string':
        if (value.length === 0) return 'empty_string';
        if (!isNaN(Date.parse(value))) return 'date_string';
        if (/^\d+$/.test(value)) return 'numeric_string';
        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return 'email';
        if (/^https?:\/\//.test(value)) return 'url';
        if (value.length < 10) return 'short_string';
        if (value.length > 100) return 'long_string';
        return 'string';
        
      case 'number':
        if (Number.isInteger(value)) {
          if (value === 0) return 'zero';
          if (value === 1) return 'one';
          if (value < 0) return 'negative_integer';
          return 'positive_integer';
        }
        if (value === 0.0) return 'zero_float';
        if (value < 0) return 'negative_float';
        return 'positive_float';
        
      case 'boolean':
        return value ? 'true' : 'false';
        
      case 'object':
        if (Array.isArray(value)) {
          if (value.length === 0) return 'empty_array';
          return `array[${value.length}]`;
        }
        if (value instanceof Date) return 'date';
        return 'object';
        
      default:
        return type;
    }
  }
  
  /**
   * Detect format of a value
   */
  private detectFormat(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    switch (dataType) {
      case 'string':
        const str = String(value);
        // Detect date formats
        if (!isNaN(Date.parse(str))) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'yyyy-mm-dd';
          if (/^\d{4}\/\d{2}\/\d{2}$/.test(str)) return 'yyyy/mm/dd';
          if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return 'mm-dd-yyyy';
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 'mm/dd/yyyy';
          if (/^\d{2}-\d{2}-\d{2}$/.test(str)) return 'yy-mm-dd';
          return 'date_string';
        }
        
        // Detect common string formats
        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(str)) return 'email';
        if (/^https?:\/\//.test(str)) return 'url';
        if (/^\d+$/.test(str)) return 'numeric_string';
        if (/^[A-Za-z0-9_-]+$/.test(str)) return 'alphanumeric';
        if (/^[A-Za-z]+$/.test(str)) return 'alphabetic';
        if (/^[A-Za-z\s]+$/.test(str)) return 'text';
        return 'string';
        
      case 'number':
        if (Number.isInteger(value)) return 'integer';
        return 'float';
        
      case 'boolean':
        return 'boolean';
        
      case 'date':
        return 'date';
        
      case 'object':
        if (Array.isArray(value)) return 'array';
        return 'object';
        
      default:
        return dataType;
    }
  }
  
  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    // Missing values rule
    this.addRule({
      name: 'Required Field Check',
      field: undefined, // Applied to specified fields in the analysis
      type: DataQualityIssueType.MISSING_VALUE,
      severity: DataQualitySeverity.WARNING,
      condition: (value) => value === null || value === undefined,
      message: 'Required field has missing value',
      suggestion: 'Add a default value or make sure this field is always populated',
      enabled: true
    });
    
    // Email format rule
    this.addRule({
      name: 'Email Format Check',
      field: undefined, // Applied to fields that appear to contain emails
      type: DataQualityIssueType.INVALID_FORMAT,
      severity: DataQualitySeverity.ERROR,
      condition: (value, _, stats) => {
        if (value === null || value === undefined || typeof value !== 'string') return false;
        // Only apply to fields that are likely email fields
        if (stats && stats.formats && 
            stats.formats.has('email') && 
            stats.formats.get('email')! > 0) {
          return !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
        }
        return false;
      },
      message: 'Invalid email format',
      suggestion: 'Validate email addresses before storing them',
      enabled: true
    });
    
    // Numeric range rule
    this.addRule({
      name: 'Numeric Range Check',
      field: undefined, // Applied to numeric fields
      type: DataQualityIssueType.OUT_OF_RANGE,
      severity: DataQualitySeverity.WARNING,
      condition: (value, _, stats) => {
        if (value === null || value === undefined || typeof value !== 'number') return false;
        if (!stats || stats.dataType !== 'number') return false;
        
        if (stats.mean !== undefined && stats.stdDev !== undefined) {
          // Check for outliers (more than 3 standard deviations from the mean)
          return Math.abs(value - stats.mean) > 3 * stats.stdDev;
        }
        
        return false;
      },
      message: 'Value is outside the expected range',
      suggestion: 'Check for data entry errors or add validation constraints',
      enabled: true
    });
    
    // Date format consistency rule
    this.addRule({
      name: 'Date Format Consistency Check',
      field: undefined, // Applied to date fields
      type: DataQualityIssueType.INCONSISTENT_VALUE,
      severity: DataQualitySeverity.WARNING,
      condition: (value, _, stats) => {
        if (value === null || value === undefined) return false;
        if (!stats || stats.dataType !== 'date') return false;
        
        if (typeof value === 'string' && !isNaN(Date.parse(value))) {
          // Check if the date format is consistent with the most common format
          const format = this.detectFormat(value, 'string');
          
          if (stats.formats && stats.formats.size > 0) {
            let mostCommonFormat = '';
            let maxCount = 0;
            
            for (const [fmt, count] of stats.formats) {
              if (count > maxCount) {
                maxCount = count;
                mostCommonFormat = fmt;
              }
            }
            
            return format !== mostCommonFormat;
          }
        }
        
        return false;
      },
      message: 'Date format is inconsistent with other dates in this field',
      suggestion: 'Standardize date formats across all records',
      enabled: true
    });
  }
}

// Export a singleton instance
export const dataQualityService = new DataQualityService();