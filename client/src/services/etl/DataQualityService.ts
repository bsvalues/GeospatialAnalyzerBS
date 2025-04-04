/**
 * Data quality service
 *
 * This service analyzes data quality of datasets, identifying issues and providing
 * recommendations for improvement.
 */

/**
 * Data quality issue severity
 */
export enum DataQualityIssueSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Data quality issue
 */
export interface DataQualityIssue {
  /** Issue ID */
  id: string;
  
  /** Issue description */
  description: string;
  
  /** Field name (if applicable) */
  field?: string;
  
  /** Issue severity */
  severity: DataQualityIssueSeverity;
  
  /** Recommendation to fix the issue */
  recommendation: string;
  
  /** Number of records affected */
  affectedRecords: number;
  
  /** Percentage of records affected */
  affectedPercentage: number;
}

/**
 * Field statistics
 */
export interface FieldStatistics {
  /** Field name */
  field: string;
  
  /** Data type */
  dataType: string;
  
  /** Total records with this field */
  count: number;
  
  /** Number of null values */
  nullCount: number;
  
  /** Number of empty values (empty strings, arrays, objects) */
  emptyCount: number;
  
  /** Completion rate (percentage of non-null, non-empty values) */
  completionRate: number;
  
  /** Number of unique values */
  uniqueCount: number;
  
  /** Minimum value (for numeric fields) */
  min?: number;
  
  /** Maximum value (for numeric fields) */
  max?: number;
  
  /** Average value (for numeric fields) */
  avg?: number;
  
  /** Median value (for numeric fields) */
  median?: number;
  
  /** Standard deviation (for numeric fields) */
  stdDev?: number;
  
  /** Top 5 most frequent values with their counts */
  topValues?: { value: any; count: number }[];
}

/**
 * Data quality analysis options
 */
export interface DataQualityAnalysisOptions {
  /** Fields to analyze (if not specified, all fields will be analyzed) */
  fields?: string[];
  
  /** Minimum completion rate for fields (0-1) */
  minCompletionRate?: number;
  
  /** Maximum percentage of duplicates allowed (0-1) */
  maxDuplicatePercentage?: number;
  
  /** Set to true to generate field statistics */
  generateFieldStats?: boolean;
  
  /** Set to false to skip data consistency checks */
  checkConsistency?: boolean;
  
  /** Set to false to skip data format validation */
  validateFormats?: boolean;
  
  /** Set to true to analyze value distributions */
  analyzeDistributions?: boolean;
}

/**
 * Data quality analysis result
 */
export interface DataQualityAnalysisResult {
  /** Total number of records analyzed */
  recordCount: number;
  
  /** Total number of fields analyzed */
  fieldCount: number;
  
  /** List of identified issues */
  issues: DataQualityIssue[];
  
  /** Overall data quality score (0-100) */
  overallScore: number;
  
  /** Completeness score (0-100) */
  completenessScore: number;
  
  /** Consistency score (0-100) */
  consistencyScore: number;
  
  /** Accuracy score (0-100) */
  accuracyScore: number;
  
  /** Field statistics */
  fieldStatistics: FieldStatistics[];
  
  /** Analysis timestamp */
  timestamp: Date;
}

/**
 * Data quality service class
 */
class DataQualityService {
  /**
   * Analyze data quality of a dataset
   */
  async analyzeDataQuality(
    data: any[],
    options: DataQualityAnalysisOptions = {}
  ): Promise<DataQualityAnalysisResult> {
    const startTime = Date.now();
    const issues: DataQualityIssue[] = [];
    const nextIssueId = 1;
    
    // Default options
    const {
      fields = this.getFieldsFromData(data),
      minCompletionRate = 0.95,
      maxDuplicatePercentage = 0.05,
      generateFieldStats = true,
      checkConsistency = true,
      validateFormats = true,
      analyzeDistributions = false
    } = options;
    
    // Skip analysis if no data
    if (data.length === 0) {
      return {
        recordCount: 0,
        fieldCount: 0,
        issues: [],
        overallScore: 100,
        completenessScore: 100,
        consistencyScore: 100,
        accuracyScore: 100,
        fieldStatistics: [],
        timestamp: new Date()
      };
    }
    
    // Calculate field statistics
    const fieldStatistics = generateFieldStats
      ? this.calculateFieldStatistics(data, fields)
      : [];
    
    // Check completeness
    if (minCompletionRate > 0) {
      for (const stats of fieldStatistics) {
        if (stats.completionRate < minCompletionRate) {
          issues.push({
            id: `issue-${nextIssueId}`,
            description: `Field "${stats.field}" has low completion rate (${(stats.completionRate * 100).toFixed(1)}%)`,
            field: stats.field,
            severity: this.getCompletionRateSeverity(stats.completionRate),
            recommendation: 'Consider making this field required or providing default values',
            affectedRecords: stats.nullCount + stats.emptyCount,
            affectedPercentage: 1 - stats.completionRate
          });
        }
      }
    }
    
    // Check for duplicate records
    if (maxDuplicatePercentage < 1) {
      const { duplicateCount, duplicateRate } = this.findDuplicates(data);
      
      if (duplicateRate > maxDuplicatePercentage) {
        issues.push({
          id: `issue-${nextIssueId}`,
          description: `Dataset contains ${duplicateCount} duplicate records (${(duplicateRate * 100).toFixed(1)}%)`,
          severity: this.getDuplicateRateSeverity(duplicateRate),
          recommendation: 'Implement deduplication logic or add unique constraints',
          affectedRecords: duplicateCount,
          affectedPercentage: duplicateRate
        });
      }
    }
    
    // Check data consistency (data types)
    if (checkConsistency) {
      for (const field of fields) {
        const { inconsistentCount, inconsistentRate } = this.checkDataTypeConsistency(data, field);
        
        if (inconsistentRate > 0) {
          issues.push({
            id: `issue-${nextIssueId}`,
            description: `Field "${field}" has inconsistent data types (${(inconsistentRate * 100).toFixed(1)}% of values)`,
            field,
            severity: this.getInconsistencyRateSeverity(inconsistentRate),
            recommendation: 'Standardize data types or implement type conversion',
            affectedRecords: inconsistentCount,
            affectedPercentage: inconsistentRate
          });
        }
      }
    }
    
    // Calculate scores
    const completenessScore = this.calculateCompletenessScore(fieldStatistics);
    const consistencyScore = this.calculateConsistencyScore(issues);
    const accuracyScore = 100; // Placeholder, would require domain-specific logic
    const overallScore = (completenessScore + consistencyScore + accuracyScore) / 3;
    
    return {
      recordCount: data.length,
      fieldCount: fields.length,
      issues,
      overallScore,
      completenessScore,
      consistencyScore,
      accuracyScore,
      fieldStatistics,
      timestamp: new Date()
    };
  }
  
  /**
   * Get fields from data
   */
  private getFieldsFromData(data: any[]): string[] {
    if (data.length === 0) {
      return [];
    }
    
    // Use the first record to get field names
    const fields = new Set<string>();
    
    // Combine fields from all records
    for (const record of data) {
      if (record && typeof record === 'object') {
        Object.keys(record).forEach(key => fields.add(key));
      }
    }
    
    return Array.from(fields);
  }
  
  /**
   * Calculate field statistics
   */
  private calculateFieldStatistics(data: any[], fields: string[]): FieldStatistics[] {
    const stats: FieldStatistics[] = [];
    
    for (const field of fields) {
      const fieldValues = data.map(record => record[field]);
      const count = data.length;
      const nullCount = fieldValues.filter(value => value === null || value === undefined).length;
      const emptyCount = fieldValues.filter(
        value =>
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (value && typeof value === 'object' && Object.keys(value).length === 0)
      ).length;
      
      // Calculate completion rate
      const completionRate = (count - nullCount - emptyCount) / count;
      
      // Determine data type
      const dataType = this.determineDataType(fieldValues);
      
      // Calculate unique values
      const uniqueValues = new Set();
      for (const value of fieldValues) {
        if (value !== null && value !== undefined) {
          uniqueValues.add(JSON.stringify(value));
        }
      }
      
      const uniqueCount = uniqueValues.size;
      
      // Initialize field statistics
      const fieldStats: FieldStatistics = {
        field,
        dataType,
        count,
        nullCount,
        emptyCount,
        completionRate,
        uniqueCount
      };
      
      // Additional statistics for numeric fields
      if (dataType === 'number') {
        const numericValues = fieldValues.filter(
          value => typeof value === 'number' && !isNaN(value)
        ) as number[];
        
        if (numericValues.length > 0) {
          // Sort values for percentile calculations
          numericValues.sort((a, b) => a - b);
          
          fieldStats.min = Math.min(...numericValues);
          fieldStats.max = Math.max(...numericValues);
          fieldStats.avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          
          // Calculate median
          const mid = Math.floor(numericValues.length / 2);
          fieldStats.median =
            numericValues.length % 2 === 0
              ? (numericValues[mid - 1] + numericValues[mid]) / 2
              : numericValues[mid];
              
          // Calculate standard deviation
          const variance =
            numericValues.reduce((sum, val) => sum + Math.pow(val - fieldStats.avg!, 2), 0) /
            numericValues.length;
          fieldStats.stdDev = Math.sqrt(variance);
        }
      }
      
      // Calculate top values
      const valueCounts = new Map<string, number>();
      for (const value of fieldValues) {
        if (value !== null && value !== undefined) {
          const valueStr = JSON.stringify(value);
          valueCounts.set(valueStr, (valueCounts.get(valueStr) || 0) + 1);
        }
      }
      
      // Sort by count (descending) and take top 5
      const topValues = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([valueStr, count]) => ({
          value: JSON.parse(valueStr),
          count
        }));
      
      if (topValues.length > 0) {
        fieldStats.topValues = topValues;
      }
      
      stats.push(fieldStats);
    }
    
    return stats;
  }
  
  /**
   * Determine data type of field values
   */
  private determineDataType(values: any[]): string {
    const types = new Set<string>();
    
    for (const value of values) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        types.add('array');
      } else if (typeof value === 'object') {
        types.add('object');
      } else {
        types.add(typeof value);
      }
    }
    
    if (types.size === 0) {
      return 'unknown';
    } else if (types.size === 1) {
      return Array.from(types)[0];
    } else {
      return 'mixed';
    }
  }
  
  /**
   * Find duplicates in the dataset
   */
  private findDuplicates(data: any[]): { duplicateCount: number; duplicateRate: number } {
    const stringified = data.map(item => JSON.stringify(item));
    const uniqueCount = new Set(stringified).size;
    const duplicateCount = data.length - uniqueCount;
    const duplicateRate = duplicateCount / data.length;
    
    return { duplicateCount, duplicateRate };
  }
  
  /**
   * Check data type consistency for a field
   */
  private checkDataTypeConsistency(
    data: any[],
    field: string
  ): { inconsistentCount: number; inconsistentRate: number } {
    const types = new Map<string, number>();
    let totalNonNull = 0;
    
    for (const record of data) {
      const value = record[field];
      
      if (value === null || value === undefined) {
        continue;
      }
      
      totalNonNull++;
      let type = Array.isArray(value) ? 'array' : typeof value;
      
      // Count by type
      types.set(type, (types.get(type) || 0) + 1);
    }
    
    if (totalNonNull === 0 || types.size <= 1) {
      return { inconsistentCount: 0, inconsistentRate: 0 };
    }
    
    // Find the most common type
    let mostCommonType = '';
    let mostCommonCount = 0;
    
    for (const [type, count] of types.entries()) {
      if (count > mostCommonCount) {
        mostCommonType = type;
        mostCommonCount = count;
      }
    }
    
    // Calculate inconsistency
    const inconsistentCount = totalNonNull - mostCommonCount;
    const inconsistentRate = inconsistentCount / totalNonNull;
    
    return { inconsistentCount, inconsistentRate };
  }
  
  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(fieldStatistics: FieldStatistics[]): number {
    if (fieldStatistics.length === 0) {
      return 100;
    }
    
    const averageCompletionRate =
      fieldStatistics.reduce((sum, stats) => sum + stats.completionRate, 0) / fieldStatistics.length;
    
    return Math.round(averageCompletionRate * 100);
  }
  
  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(issues: DataQualityIssue[]): number {
    const consistencyIssues = issues.filter(
      issue => issue.description.includes('inconsistent') || issue.description.includes('duplicate')
    );
    
    if (consistencyIssues.length === 0) {
      return 100;
    }
    
    // Weight by severity
    let totalWeight = 0;
    let totalIssues = 0;
    
    for (const issue of consistencyIssues) {
      let weight = 0;
      
      switch (issue.severity) {
        case DataQualityIssueSeverity.LOW:
          weight = 0.25;
          break;
          
        case DataQualityIssueSeverity.MEDIUM:
          weight = 0.5;
          break;
          
        case DataQualityIssueSeverity.HIGH:
          weight = 0.75;
          break;
          
        case DataQualityIssueSeverity.CRITICAL:
          weight = 1;
          break;
      }
      
      totalWeight += weight * issue.affectedPercentage;
      totalIssues++;
    }
    
    const averageWeightedIssueImpact = totalWeight / totalIssues;
    
    return Math.round((1 - averageWeightedIssueImpact) * 100);
  }
  
  /**
   * Get severity for completion rate
   */
  private getCompletionRateSeverity(completionRate: number): DataQualityIssueSeverity {
    if (completionRate < 0.5) {
      return DataQualityIssueSeverity.CRITICAL;
    } else if (completionRate < 0.7) {
      return DataQualityIssueSeverity.HIGH;
    } else if (completionRate < 0.9) {
      return DataQualityIssueSeverity.MEDIUM;
    } else {
      return DataQualityIssueSeverity.LOW;
    }
  }
  
  /**
   * Get severity for duplicate rate
   */
  private getDuplicateRateSeverity(duplicateRate: number): DataQualityIssueSeverity {
    if (duplicateRate > 0.2) {
      return DataQualityIssueSeverity.CRITICAL;
    } else if (duplicateRate > 0.1) {
      return DataQualityIssueSeverity.HIGH;
    } else if (duplicateRate > 0.05) {
      return DataQualityIssueSeverity.MEDIUM;
    } else {
      return DataQualityIssueSeverity.LOW;
    }
  }
  
  /**
   * Get severity for inconsistency rate
   */
  private getInconsistencyRateSeverity(inconsistencyRate: number): DataQualityIssueSeverity {
    if (inconsistencyRate > 0.2) {
      return DataQualityIssueSeverity.CRITICAL;
    } else if (inconsistencyRate > 0.1) {
      return DataQualityIssueSeverity.HIGH;
    } else if (inconsistencyRate > 0.05) {
      return DataQualityIssueSeverity.MEDIUM;
    } else {
      return DataQualityIssueSeverity.LOW;
    }
  }
}

// Export a singleton instance
export const dataQualityService = new DataQualityService();