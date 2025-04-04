/**
 * Data quality analysis result interface
 */
export interface DataQualityAnalysis {
  completeness: number;
  accuracy: number;
  consistency: number;
  overall: number;
  issueCount: number;
  issues: DataQualityIssue[];
  summary: string;
  metadata: Record<string, any>;
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  field: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  count: number;
  examples: any[];
  suggestedFix?: string;
}

/**
 * Field statistics interface
 */
interface FieldStatistics {
  name: string;
  count: number;
  nullCount: number;
  emptyCount: number;
  uniqueCount: number;
  minValue?: any;
  maxValue?: any;
  avgValue?: any;
  type: string;
  values: Map<any, number>;
  patterns: Map<string, number>;
  issues: DataQualityIssue[];
}

/**
 * Data quality service for analyzing data quality
 */
class DataQualityService {
  constructor() {
    // Default constructor
  }
  
  /**
   * Analyze the quality of a dataset
   */
  analyzeQuality(data: any[]): DataQualityAnalysis {
    console.log(`Analyzing quality of ${data.length} records`);
    
    if (data.length === 0) {
      return this.emptyAnalysis();
    }
    
    // Calculate field statistics
    const fieldStats = this.calculateFieldStatistics(data);
    
    // Check for quality issues
    this.checkQualityIssues(data, fieldStats);
    
    // Collect all issues
    const issues: DataQualityIssue[] = [];
    for (const stats of fieldStats.values()) {
      issues.push(...stats.issues);
    }
    
    // Calculate quality scores
    const completenessScore = this.calculateCompletenessScore(fieldStats);
    const accuracyScore = this.calculateAccuracyScore(fieldStats);
    const consistencyScore = this.calculateConsistencyScore(fieldStats);
    const overallScore = (completenessScore + accuracyScore + consistencyScore) / 3;
    
    // Generate summary
    const summary = this.generateSummary(fieldStats, issues);
    
    // Create metadata
    const metadata = this.generateMetadata(fieldStats);
    
    return {
      completeness: completenessScore,
      accuracy: accuracyScore,
      consistency: consistencyScore,
      overall: overallScore,
      issueCount: issues.length,
      issues,
      summary,
      metadata
    };
  }
  
  /**
   * Calculate statistics for each field in the dataset
   */
  private calculateFieldStatistics(data: any[]): Map<string, FieldStatistics> {
    const fieldStats = new Map<string, FieldStatistics>();
    
    // Initialize field statistics
    const firstRecord = data[0];
    for (const field of Object.keys(firstRecord)) {
      fieldStats.set(field, {
        name: field,
        count: 0,
        nullCount: 0,
        emptyCount: 0,
        uniqueCount: 0,
        type: 'unknown',
        values: new Map<any, number>(),
        patterns: new Map<string, number>(),
        issues: []
      });
    }
    
    // Process each record
    for (const record of data) {
      for (const [field, value] of Object.entries(record)) {
        const stats = fieldStats.get(field);
        
        if (!stats) {
          continue;
        }
        
        stats.count++;
        
        // Check for null/undefined values
        if (value === null || value === undefined) {
          stats.nullCount++;
          continue;
        }
        
        // Check for empty strings
        if (typeof value === 'string' && value.trim() === '') {
          stats.emptyCount++;
        }
        
        // Determine field type
        if (stats.type === 'unknown') {
          stats.type = this.determineType(value);
        } else if (stats.type !== 'mixed' && stats.type !== this.determineType(value)) {
          stats.type = 'mixed';
        }
        
        // Track unique values
        const valueKey = JSON.stringify(value);
        const currentCount = stats.values.get(valueKey) || 0;
        stats.values.set(valueKey, currentCount + 1);
        
        // Track patterns for strings
        if (typeof value === 'string') {
          const pattern = this.extractPattern(value);
          const patternCount = stats.patterns.get(pattern) || 0;
          stats.patterns.set(pattern, patternCount + 1);
        }
        
        // Track min/max/avg for numeric values
        if (typeof value === 'number') {
          if (stats.minValue === undefined || value < stats.minValue) {
            stats.minValue = value;
          }
          if (stats.maxValue === undefined || value > stats.maxValue) {
            stats.maxValue = value;
          }
          stats.avgValue = (stats.avgValue || 0) + (value / data.length);
        }
      }
    }
    
    // Calculate unique counts
    for (const stats of fieldStats.values()) {
      stats.uniqueCount = stats.values.size;
    }
    
    return fieldStats;
  }
  
  /**
   * Check for quality issues in the dataset
   */
  private checkQualityIssues(data: any[], fieldStats: Map<string, FieldStatistics>): void {
    // Check for issues in each field
    for (const stats of fieldStats.values()) {
      // Check for missing values
      const missingRatio = (stats.nullCount + stats.emptyCount) / Math.max(1, stats.count);
      if (missingRatio > 0) {
        let severity: 'low' | 'medium' | 'high' | 'critical';
        
        if (missingRatio >= 0.5) {
          severity = 'critical';
        } else if (missingRatio >= 0.25) {
          severity = 'high';
        } else if (missingRatio >= 0.1) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        
        stats.issues.push({
          field: stats.name,
          type: 'missing_values',
          severity,
          message: `Field has ${Math.round(missingRatio * 100)}% missing values (${stats.nullCount} null, ${stats.emptyCount} empty)`,
          count: stats.nullCount + stats.emptyCount,
          examples: [],
          suggestedFix: 'Consider using a fill_null transformation or filtering out records with missing values'
        });
      }
      
      // Check for type inconsistencies
      if (stats.type === 'mixed') {
        stats.issues.push({
          field: stats.name,
          type: 'inconsistent_types',
          severity: 'high',
          message: 'Field has inconsistent data types',
          count: stats.count,
          examples: this.findTypeMixExamples(data, stats.name),
          suggestedFix: 'Consider using a cast_type transformation to standardize the data type'
        });
      }
      
      // Check for high cardinality
      if (stats.uniqueCount === stats.count && stats.count > 50) {
        stats.issues.push({
          field: stats.name,
          type: 'high_cardinality',
          severity: 'medium',
          message: `Field has ${stats.uniqueCount} unique values in ${stats.count} records`,
          count: stats.uniqueCount,
          examples: [],
          suggestedFix: 'Consider grouping values or using this field as an identifier'
        });
      }
      
      // Check for low cardinality
      if (stats.uniqueCount === 1 && stats.count > 1) {
        stats.issues.push({
          field: stats.name,
          type: 'low_cardinality',
          severity: 'medium',
          message: 'Field has only one unique value',
          count: stats.count,
          examples: [{ value: this.getFirstKey(stats.values) }],
          suggestedFix: 'Consider removing this field if it provides no differentiating information'
        });
      }
      
      // Check for numeric outliers
      if (stats.type === 'number' && stats.count > 10) {
        const outliers = this.findNumericOutliers(data, stats.name);
        if (outliers.length > 0) {
          stats.issues.push({
            field: stats.name,
            type: 'numeric_outliers',
            severity: 'medium',
            message: `Field has ${outliers.length} numeric outliers`,
            count: outliers.length,
            examples: outliers.slice(0, 3).map(value => ({ value })),
            suggestedFix: 'Consider using a filter transformation to remove outliers or standardize the data'
          });
        }
      }
      
      // Check for pattern inconsistencies
      if (stats.type === 'string' && stats.patterns.size > 1) {
        const mainPattern = this.getMainPattern(stats.patterns);
        const nonConformingCount = stats.count - (stats.patterns.get(mainPattern) || 0);
        
        if (nonConformingCount > 0 && (nonConformingCount / stats.count) > 0.1) {
          stats.issues.push({
            field: stats.name,
            type: 'inconsistent_patterns',
            severity: 'medium',
            message: `Field has ${nonConformingCount} values not conforming to the main pattern`,
            count: nonConformingCount,
            examples: this.findPatternMismatches(data, stats.name, mainPattern),
            suggestedFix: 'Consider using a standardize transformation to normalize the format'
          });
        }
      }
      
      // Check for potential duplicates
      if (stats.uniqueCount < stats.count && (stats.uniqueCount / stats.count) < 0.9) {
        const duplicateValues = Array.from(stats.values.entries())
          .filter(([_, count]) => count > 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([value]) => JSON.parse(value));
          
        stats.issues.push({
          field: stats.name,
          type: 'duplicate_values',
          severity: 'low',
          message: `Field has duplicate values (${stats.count - stats.uniqueCount} duplicates)`,
          count: stats.count - stats.uniqueCount,
          examples: duplicateValues.map(value => ({ value })),
          suggestedFix: 'Consider using a deduplicate transformation if these should be unique'
        });
      }
    }
    
    // Check for record-level issues
    this.checkRecordLevelIssues(data, fieldStats);
  }
  
  /**
   * Check for issues affecting multiple fields or entire records
   */
  private checkRecordLevelIssues(data: any[], fieldStats: Map<string, FieldStatistics>): void {
    const keyFields = Array.from(fieldStats.values())
      .filter(stats => stats.uniqueCount === stats.count && stats.count > 0)
      .map(stats => stats.name);
      
    if (keyFields.length > 0) {
      // Add a note about potential key fields
      const firstField = fieldStats.get(keyFields[0]);
      if (firstField) {
        firstField.issues.push({
          field: firstField.name,
          type: 'potential_key',
          severity: 'low',
          message: `Field is a potential unique identifier (${keyFields.length} potential key fields found)`,
          count: firstField.count,
          examples: [],
          suggestedFix: 'Consider designating this field as a primary key or identifier'
        });
      }
    }
    
    // Check for duplicate records
    if (data.length > 1) {
      try {
        const recordHashes = new Map<string, number>();
        let duplicateCount = 0;
        
        for (const record of data) {
          // Create a hash of the record excluding any likely key fields
          const recordHash = JSON.stringify(
            Object.fromEntries(
              Object.entries(record)
                .filter(([key]) => !keyFields.includes(key))
            )
          );
          
          const count = (recordHashes.get(recordHash) || 0) + 1;
          recordHashes.set(recordHash, count);
          
          if (count === 2) {
            duplicateCount++;
          }
        }
        
        if (duplicateCount > 0) {
          // Add a dataset-level issue
          // In a real implementation, we'd add this to a dataset-level issues array
          const field = Array.from(fieldStats.keys())[0];
          const stats = fieldStats.get(field);
          
          if (stats) {
            stats.issues.push({
              field: '_dataset_',
              type: 'duplicate_records',
              severity: 'medium',
              message: `Dataset contains ${duplicateCount} potential duplicate records`,
              count: duplicateCount,
              examples: [],
              suggestedFix: 'Consider using a deduplicate transformation at the record level'
            });
          }
        }
      } catch (error) {
        console.warn('Error checking for duplicate records:', error);
      }
    }
  }
  
  /**
   * Calculate completeness score
   */
  private calculateCompletenessScore(fieldStats: Map<string, FieldStatistics>): number {
    let totalFields = 0;
    let totalCompleteness = 0;
    
    for (const stats of fieldStats.values()) {
      const fieldCompleteness = 1 - ((stats.nullCount + stats.emptyCount) / Math.max(1, stats.count));
      totalCompleteness += fieldCompleteness;
      totalFields++;
    }
    
    return totalFields > 0 ? totalCompleteness / totalFields : 1;
  }
  
  /**
   * Calculate accuracy score
   */
  private calculateAccuracyScore(fieldStats: Map<string, FieldStatistics>): number {
    let totalFields = 0;
    let totalAccuracy = 0;
    
    for (const stats of fieldStats.values()) {
      // Start with perfect accuracy
      let fieldAccuracy = 1;
      
      // Reduce score for type inconsistencies
      if (stats.type === 'mixed') {
        fieldAccuracy *= 0.7;
      }
      
      // Reduce score for pattern inconsistencies
      if (stats.type === 'string' && stats.patterns.size > 1) {
        const mainPattern = this.getMainPattern(stats.patterns);
        const conformingCount = stats.patterns.get(mainPattern) || 0;
        const patternConsistency = conformingCount / Math.max(1, stats.count - stats.nullCount - stats.emptyCount);
        fieldAccuracy *= patternConsistency;
      }
      
      // Reduce score for outliers
      const outlierIssue = stats.issues.find(issue => issue.type === 'numeric_outliers');
      if (outlierIssue) {
        fieldAccuracy *= 1 - (outlierIssue.count / stats.count);
      }
      
      totalAccuracy += fieldAccuracy;
      totalFields++;
    }
    
    return totalFields > 0 ? totalAccuracy / totalFields : 1;
  }
  
  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(fieldStats: Map<string, FieldStatistics>): number {
    let totalFields = 0;
    let totalConsistency = 0;
    
    for (const stats of fieldStats.values()) {
      // Start with perfect consistency
      let fieldConsistency = 1;
      
      // Reduce score for mixed types
      if (stats.type === 'mixed') {
        fieldConsistency *= 0.5;
      }
      
      // Reduce score for inconsistent patterns
      const patternIssue = stats.issues.find(issue => issue.type === 'inconsistent_patterns');
      if (patternIssue) {
        fieldConsistency *= 0.8;
      }
      
      totalConsistency += fieldConsistency;
      totalFields++;
    }
    
    return totalFields > 0 ? totalConsistency / totalFields : 1;
  }
  
  /**
   * Generate a summary of the data quality analysis
   */
  private generateSummary(fieldStats: Map<string, FieldStatistics>, issues: DataQualityIssue[]): string {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;
    const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
    const lowIssues = issues.filter(issue => issue.severity === 'low').length;
    
    let summary = `Data quality analysis found ${issues.length} issues: `;
    
    if (criticalIssues > 0) {
      summary += `${criticalIssues} critical, `;
    }
    
    if (highIssues > 0) {
      summary += `${highIssues} high, `;
    }
    
    if (mediumIssues > 0) {
      summary += `${mediumIssues} medium, `;
    }
    
    if (lowIssues > 0) {
      summary += `${lowIssues} low `;
    }
    
    summary = summary.replace(/, $/, '');
    
    // Add information about fields with most issues
    const fieldsWithIssues = new Map<string, number>();
    for (const issue of issues) {
      const count = fieldsWithIssues.get(issue.field) || 0;
      fieldsWithIssues.set(issue.field, count + 1);
    }
    
    const mostProblematicFields = Array.from(fieldsWithIssues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([field, count]) => `${field} (${count})`);
    
    if (mostProblematicFields.length > 0) {
      summary += `. Most problematic fields: ${mostProblematicFields.join(', ')}`;
    }
    
    return summary;
  }
  
  /**
   * Generate metadata for the data quality analysis
   */
  private generateMetadata(fieldStats: Map<string, FieldStatistics>): Record<string, any> {
    const metadata: Record<string, any> = {
      fieldCount: fieldStats.size,
      fieldTypes: {},
      hasImportantIssues: false
    };
    
    // Count field types
    for (const stats of fieldStats.values()) {
      metadata.fieldTypes[stats.type] = (metadata.fieldTypes[stats.type] || 0) + 1;
      
      // Check for important issues
      if (stats.issues.some(issue => issue.severity === 'critical' || issue.severity === 'high')) {
        metadata.hasImportantIssues = true;
      }
    }
    
    return metadata;
  }
  
  /**
   * Find examples of mixed types in a field
   */
  private findTypeMixExamples(data: any[], field: string): any[] {
    const examples: any[] = [];
    const seenTypes = new Set<string>();
    
    for (const record of data) {
      if (field in record) {
        const value = record[field];
        const type = this.determineType(value);
        
        if (!seenTypes.has(type) && examples.length < 3) {
          examples.push({ value, type });
          seenTypes.add(type);
        }
        
        if (seenTypes.size >= 3) {
          break;
        }
      }
    }
    
    return examples;
  }
  
  /**
   * Find numeric outliers in a field
   */
  private findNumericOutliers(data: any[], field: string): number[] {
    try {
      // Extract numeric values
      const values = data
        .filter(record => field in record && typeof record[field] === 'number')
        .map(record => record[field]);
      
      if (values.length < 5) {
        return [];
      }
      
      // Calculate quartiles and IQR
      const sorted = [...values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      
      // Define outlier bounds
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      // Find outliers
      return values.filter(value => value < lowerBound || value > upperBound);
    } catch (error) {
      console.warn(`Error finding outliers for field ${field}:`, error);
      return [];
    }
  }
  
  /**
   * Find examples of pattern mismatches
   */
  private findPatternMismatches(data: any[], field: string, mainPattern: string): any[] {
    const examples: any[] = [];
    
    for (const record of data) {
      if (field in record && typeof record[field] === 'string') {
        const value = record[field];
        const pattern = this.extractPattern(value);
        
        if (pattern !== mainPattern && examples.length < 3) {
          examples.push({ value, pattern });
        }
        
        if (examples.length >= 3) {
          break;
        }
      }
    }
    
    return examples;
  }
  
  /**
   * Determine the type of a value
   */
  private determineType(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (Array.isArray(value)) {
      return 'array';
    }
    
    if (value instanceof Date) {
      return 'date';
    }
    
    return typeof value;
  }
  
  /**
   * Extract a pattern from a string value
   */
  private extractPattern(value: string): string {
    try {
      return value
        .replace(/[a-z]/g, 'a')
        .replace(/[A-Z]/g, 'A')
        .replace(/[0-9]/g, '9')
        .substring(0, 10);
    } catch (error) {
      return 'unknown';
    }
  }
  
  /**
   * Get the first key from a Map
   */
  private getFirstKey(map: Map<any, any>): any {
    for (const key of map.keys()) {
      try {
        return JSON.parse(key);
      } catch {
        return key;
      }
    }
    return null;
  }
  
  /**
   * Get the most common pattern from a pattern Map
   */
  private getMainPattern(patterns: Map<string, number>): string {
    let mainPattern = '';
    let maxCount = 0;
    
    for (const [pattern, count] of patterns) {
      if (count > maxCount) {
        maxCount = count;
        mainPattern = pattern;
      }
    }
    
    return mainPattern;
  }
  
  /**
   * Create an empty analysis result
   */
  private emptyAnalysis(): DataQualityAnalysis {
    return {
      completeness: 1,
      accuracy: 1,
      consistency: 1,
      overall: 1,
      issueCount: 0,
      issues: [],
      summary: 'No records to analyze',
      metadata: {
        fieldCount: 0,
        fieldTypes: {},
        hasImportantIssues: false
      }
    };
  }
}

// Export a singleton instance
export const dataQualityService = new DataQualityService();