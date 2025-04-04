import { DataQualityAnalysis, DataQualityIssue, DataQualitySeverity } from './ETLTypes';

/**
 * DataQualityService provides functionality for analyzing and improving data quality
 */
class DataQualityService {
  /**
   * Analyze data quality
   * 
   * @param data The data to analyze
   * @param options Configuration options for analysis
   * @returns A data quality analysis report
   */
  analyzeQuality(data: any[], options: DataQualityAnalysisOptions = {}): DataQualityAnalysis {
    if (!data || data.length === 0) {
      return {
        totalIssues: 0,
        completeness: 100,
        accuracy: 100,
        consistency: 100,
        issues: [],
        summary: "No data to analyze"
      };
    }

    console.log(`Analyzing data quality for ${data.length} records`);
    
    // Extract all field names from the dataset
    const fields = this.extractFields(data);
    
    // Analyze completeness (missing values)
    const completenessIssues = this.analyzeCompleteness(data, fields, options);
    
    // Analyze accuracy (data within expected ranges/formats)
    const accuracyIssues = this.analyzeAccuracy(data, fields, options);
    
    // Analyze consistency (data follows expected patterns)
    const consistencyIssues = this.analyzeConsistency(data, fields, options);
    
    // Combine all issues
    const allIssues = [
      ...completenessIssues,
      ...accuracyIssues,
      ...consistencyIssues
    ];
    
    // Calculate metrics
    const completenessStat = this.calculateCompleteness(data, fields);
    const accuracyStat = 100 - (accuracyIssues.length / (data.length * fields.length) * 100);
    const consistencyStat = 100 - (consistencyIssues.length / (data.length * fields.length) * 100);
    
    // Generate summary
    const summary = this.generateSummary(data, allIssues, completenessStat, accuracyStat, consistencyStat);
    
    // Generate AI recommendations if enabled
    const aiRecommendations = options.generateRecommendations ? 
      this.generateRecommendations(data, allIssues) : undefined;
    
    return {
      totalIssues: allIssues.length,
      completeness: Math.round(completenessStat * 10) / 10,
      accuracy: Math.round(accuracyStat * 10) / 10,
      consistency: Math.round(consistencyStat * 10) / 10,
      issues: allIssues,
      summary,
      aiRecommendations
    };
  }
  
  /**
   * Extract all unique field names from the dataset
   */
  private extractFields(data: any[]): string[] {
    const fieldSet = new Set<string>();
    
    for (const item of data) {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => fieldSet.add(key));
      }
    }
    
    return Array.from(fieldSet);
  }
  
  /**
   * Analyze data completeness (missing values)
   */
  private analyzeCompleteness(data: any[], fields: string[], options: DataQualityAnalysisOptions): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const fieldMissingCounts: Record<string, number> = {};
    
    // Count missing values for each field
    for (const field of fields) {
      let missingCount = 0;
      
      for (const item of data) {
        const value = item[field];
        
        if (value === undefined || value === null || value === '') {
          missingCount++;
        }
      }
      
      fieldMissingCounts[field] = missingCount;
      
      // If a significant percentage of values are missing, add an issue
      const missingPercentage = (missingCount / data.length) * 100;
      const requiredThreshold = options.requiredThreshold || 90;
      
      if (missingPercentage > 0) {
        const severity = this.getMissingSeverity(missingPercentage, requiredThreshold);
        
        if (severity) {
          issues.push({
            field,
            issue: `${missingCount} missing values (${Math.round(missingPercentage)}%)`,
            severity,
            recommendation: this.getCompletenessRecommendation(field, missingPercentage),
            affectedRecords: missingCount
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Determine the severity of missing values
   */
  private getMissingSeverity(percentage: number, requiredThreshold: number): DataQualitySeverity | null {
    if (percentage >= 50) {
      return DataQualitySeverity.HIGH;
    } else if (percentage >= 20) {
      return DataQualitySeverity.MEDIUM;
    } else if (percentage > 0 && percentage > (100 - requiredThreshold)) {
      return DataQualitySeverity.LOW;
    }
    
    return null;
  }
  
  /**
   * Get a recommendation for improving completeness
   */
  private getCompletenessRecommendation(field: string, missingPercentage: number): string {
    if (missingPercentage >= 80) {
      return `Consider dropping the ${field} field or finding another data source.`;
    } else if (missingPercentage >= 50) {
      return `Use 'Fill Null' transformation with a suitable default value or imputation method for ${field}.`;
    } else {
      return `Add a data validation rule for ${field} to ensure values are provided.`;
    }
  }
  
  /**
   * Analyze data accuracy (data within expected ranges/formats)
   */
  private analyzeAccuracy(data: any[], fields: string[], options: DataQualityAnalysisOptions): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const { dataTypeValidations = {}, valueRangeValidations = {} } = options;
    
    // Validate data types
    for (const [field, expectedType] of Object.entries(dataTypeValidations)) {
      if (!fields.includes(field)) continue;
      
      let invalidCount = 0;
      
      for (const item of data) {
        const value = item[field];
        
        if (value === undefined || value === null || value === '') {
          continue; // Skip missing values, those are handled by completeness
        }
        
        if (!this.validateDataType(value, expectedType)) {
          invalidCount++;
        }
      }
      
      // If there are invalid values, add an issue
      if (invalidCount > 0) {
        const percentage = (invalidCount / data.length) * 100;
        
        issues.push({
          field,
          issue: `${invalidCount} values with incorrect data type (${Math.round(percentage)}%)`,
          severity: this.getAccuracySeverity(percentage),
          recommendation: `Use 'Cast Type' transformation to convert ${field} to ${expectedType}.`,
          affectedRecords: invalidCount
        });
      }
    }
    
    // Validate value ranges
    for (const [field, range] of Object.entries(valueRangeValidations)) {
      if (!fields.includes(field)) continue;
      
      let outOfRangeCount = 0;
      
      for (const item of data) {
        const value = item[field];
        
        if (value === undefined || value === null || value === '') {
          continue; // Skip missing values, those are handled by completeness
        }
        
        if (!this.validateValueRange(value, range)) {
          outOfRangeCount++;
        }
      }
      
      // If there are out-of-range values, add an issue
      if (outOfRangeCount > 0) {
        const percentage = (outOfRangeCount / data.length) * 100;
        const { min, max } = range;
        
        issues.push({
          field,
          issue: `${outOfRangeCount} values outside expected range [${min}, ${max}] (${Math.round(percentage)}%)`,
          severity: this.getAccuracySeverity(percentage),
          recommendation: `Use 'Filter' transformation to exclude out-of-range values for ${field}.`,
          affectedRecords: outOfRangeCount
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validate a value's data type
   */
  private validateDataType(value: any, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      
      case 'boolean':
        return typeof value === 'boolean';
      
      case 'date':
        return value instanceof Date && !isNaN(value.getTime());
      
      case 'array':
        return Array.isArray(value);
      
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      
      default:
        return true; // Unknown type, assume valid
    }
  }
  
  /**
   * Validate a value against a range
   */
  private validateValueRange(value: any, range: { min?: any, max?: any }): boolean {
    const { min, max } = range;
    
    // If no range specified, all values are valid
    if (min === undefined && max === undefined) {
      return true;
    }
    
    // For dates
    if (value instanceof Date) {
      const timestamp = value.getTime();
      const minTimestamp = min instanceof Date ? min.getTime() : min;
      const maxTimestamp = max instanceof Date ? max.getTime() : max;
      
      if (minTimestamp !== undefined && timestamp < minTimestamp) {
        return false;
      }
      
      if (maxTimestamp !== undefined && timestamp > maxTimestamp) {
        return false;
      }
      
      return true;
    }
    
    // For numbers and strings
    if (min !== undefined && value < min) {
      return false;
    }
    
    if (max !== undefined && value > max) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Determine the severity of accuracy issues
   */
  private getAccuracySeverity(percentage: number): DataQualitySeverity {
    if (percentage >= 20) {
      return DataQualitySeverity.HIGH;
    } else if (percentage >= 5) {
      return DataQualitySeverity.MEDIUM;
    } else {
      return DataQualitySeverity.LOW;
    }
  }
  
  /**
   * Analyze data consistency (data follows expected patterns)
   */
  private analyzeConsistency(data: any[], fields: string[], options: DataQualityAnalysisOptions): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const { patternValidations = {}, uniqueConstraints = [] } = options;
    
    // Validate patterns
    for (const [field, pattern] of Object.entries(patternValidations)) {
      if (!fields.includes(field)) continue;
      
      let invalidCount = 0;
      
      for (const item of data) {
        const value = item[field];
        
        if (value === undefined || value === null || value === '') {
          continue; // Skip missing values, those are handled by completeness
        }
        
        if (typeof value === 'string' && !this.validatePattern(value, pattern)) {
          invalidCount++;
        }
      }
      
      // If there are invalid values, add an issue
      if (invalidCount > 0) {
        const percentage = (invalidCount / data.length) * 100;
        
        issues.push({
          field,
          issue: `${invalidCount} values don't match expected pattern (${Math.round(percentage)}%)`,
          severity: this.getConsistencySeverity(percentage),
          recommendation: `Use 'Replace Value' transformation with a regex to fix the format of ${field}.`,
          affectedRecords: invalidCount
        });
      }
    }
    
    // Validate unique constraints
    for (const constraint of uniqueConstraints) {
      const constraintFields = Array.isArray(constraint) ? constraint : [constraint];
      const validFields = constraintFields.filter(field => fields.includes(field));
      
      if (validFields.length === 0) continue;
      
      const valueSet = new Set<string>();
      let duplicateCount = 0;
      
      for (const item of data) {
        // Create a composite key from all constraint fields
        const key = validFields.map(field => {
          const value = item[field];
          if (value === undefined || value === null) return '';
          return String(value);
        }).join('|');
        
        if (valueSet.has(key)) {
          duplicateCount++;
        } else {
          valueSet.add(key);
        }
      }
      
      // If there are duplicates, add an issue
      if (duplicateCount > 0) {
        const percentage = (duplicateCount / data.length) * 100;
        const fieldNames = validFields.join(', ');
        
        issues.push({
          field: fieldNames,
          issue: `${duplicateCount} duplicate values (${Math.round(percentage)}%)`,
          severity: this.getConsistencySeverity(percentage),
          recommendation: `Use 'Deduplicate' transformation to remove duplicates based on ${fieldNames}.`,
          affectedRecords: duplicateCount
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Validate a value against a pattern
   */
  private validatePattern(value: string, pattern: string | RegExp): boolean {
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      return regex.test(value);
    } catch (error) {
      console.error(`Error validating pattern: ${error}`);
      return true; // In case of error, assume valid
    }
  }
  
  /**
   * Determine the severity of consistency issues
   */
  private getConsistencySeverity(percentage: number): DataQualitySeverity {
    if (percentage >= 10) {
      return DataQualitySeverity.HIGH;
    } else if (percentage >= 2) {
      return DataQualitySeverity.MEDIUM;
    } else {
      return DataQualitySeverity.LOW;
    }
  }
  
  /**
   * Calculate overall completeness
   */
  private calculateCompleteness(data: any[], fields: string[]): number {
    if (data.length === 0 || fields.length === 0) {
      return 100;
    }
    
    let totalFields = data.length * fields.length;
    let missingValues = 0;
    
    for (const item of data) {
      for (const field of fields) {
        const value = item[field];
        
        if (value === undefined || value === null || value === '') {
          missingValues++;
        }
      }
    }
    
    return 100 - (missingValues / totalFields * 100);
  }
  
  /**
   * Generate a summary of data quality issues
   */
  private generateSummary(
    data: any[], 
    issues: DataQualityIssue[], 
    completeness: number, 
    accuracy: number, 
    consistency: number
  ): string {
    const fieldCount = this.extractFields(data).length;
    const highIssues = issues.filter(i => i.severity === DataQualitySeverity.HIGH).length;
    const mediumIssues = issues.filter(i => i.severity === DataQualitySeverity.MEDIUM).length;
    const lowIssues = issues.filter(i => i.severity === DataQualitySeverity.LOW).length;
    
    let summary = `Analyzed ${data.length} records with ${fieldCount} fields.\n`;
    
    if (issues.length === 0) {
      return summary + 'No data quality issues detected.';
    }
    
    summary += `Found ${issues.length} data quality issues: ` +
      `${highIssues} high severity, ${mediumIssues} medium severity, ${lowIssues} low severity.\n`;
    
    summary += `Data quality metrics: ${Math.round(completeness)}% completeness, ` +
      `${Math.round(accuracy)}% accuracy, ${Math.round(consistency)}% consistency.`;
    
    return summary;
  }
  
  /**
   * Generate AI-powered recommendations for improving data quality
   */
  private generateRecommendations(data: any[], issues: DataQualityIssue[]): string[] {
    if (issues.length === 0) {
      return ['Data quality is good, no specific recommendations needed.'];
    }
    
    const recommendations: string[] = [];
    
    // Group issues by severity
    const highIssues = issues.filter(i => i.severity === DataQualitySeverity.HIGH);
    const mediumIssues = issues.filter(i => i.severity === DataQualitySeverity.MEDIUM);
    
    // Prioritize fixing high-severity issues
    if (highIssues.length > 0) {
      recommendations.push(`Address ${highIssues.length} high-severity issues first, focusing on fields: ${highIssues.map(i => i.field).join(', ')}`);
      
      // Add specific recommendations for top issues
      for (let i = 0; i < Math.min(3, highIssues.length); i++) {
        recommendations.push(`- ${highIssues[i].field}: ${highIssues[i].recommendation}`);
      }
    }
    
    // Then address medium-severity issues
    if (mediumIssues.length > 0) {
      recommendations.push(`Next, fix ${mediumIssues.length} medium-severity issues, focusing on fields: ${mediumIssues.map(i => i.field).join(', ')}`);
      
      // Add specific recommendations for top issues
      for (let i = 0; i < Math.min(2, mediumIssues.length); i++) {
        recommendations.push(`- ${mediumIssues[i].field}: ${mediumIssues[i].recommendation}`);
      }
    }
    
    // Generic recommendations based on issue types
    const missingValuesIssues = issues.filter(i => i.issue.includes('missing values'));
    const incorrectTypeIssues = issues.filter(i => i.issue.includes('incorrect data type'));
    const outOfRangeIssues = issues.filter(i => i.issue.includes('outside expected range'));
    const patternIssues = issues.filter(i => i.issue.includes('don\'t match expected pattern'));
    const duplicateIssues = issues.filter(i => i.issue.includes('duplicate values'));
    
    if (missingValuesIssues.length > 0) {
      recommendations.push('Create a data collection strategy to reduce missing values in future datasets.');
    }
    
    if (incorrectTypeIssues.length > 0) {
      recommendations.push('Implement consistent data type validation at the point of data entry.');
    }
    
    if (outOfRangeIssues.length > 0) {
      recommendations.push('Add input validation rules to prevent out-of-range values.');
    }
    
    if (patternIssues.length > 0) {
      recommendations.push('Standardize data formats and provide input templates where applicable.');
    }
    
    if (duplicateIssues.length > 0) {
      recommendations.push('Add uniqueness constraints to your database schema.');
    }
    
    return recommendations;
  }
  
  /**
   * Apply recommended fixes automatically
   */
  applyAutoFixes(data: any[], analysis: DataQualityAnalysis, options: AutoFixOptions = {}): any[] {
    if (!data || data.length === 0 || !analysis.issues || analysis.issues.length === 0) {
      return [...data];
    }
    
    const { 
      fixCompleteness = true, 
      fixDataTypes = true, 
      fixDuplicates = true,
      defaultStringValue = '',
      defaultNumberValue = 0,
      defaultBooleanValue = false,
      defaultDateValue = new Date()
    } = options;
    
    let result = [...data];
    
    // Fix completeness issues
    if (fixCompleteness) {
      const completenessIssues = analysis.issues.filter(issue => issue.issue.includes('missing values'));
      
      for (const issue of completenessIssues) {
        const { field } = issue;
        const dataType = this.inferDataType(result, field);
        
        let defaultValue: any;
        switch (dataType) {
          case 'number': defaultValue = defaultNumberValue; break;
          case 'boolean': defaultValue = defaultBooleanValue; break;
          case 'date': defaultValue = defaultDateValue; break;
          default: defaultValue = defaultStringValue;
        }
        
        // Fill missing values
        result = result.map(item => {
          const value = item[field];
          
          if (value === undefined || value === null || value === '') {
            return { ...item, [field]: defaultValue };
          }
          
          return item;
        });
      }
    }
    
    // Fix data type issues
    if (fixDataTypes) {
      const dataTypeIssues = analysis.issues.filter(issue => issue.issue.includes('incorrect data type'));
      
      for (const issue of dataTypeIssues) {
        const { field } = issue;
        const dataType = this.inferDataType(result, field);
        
        // Convert to correct data type
        result = result.map(item => {
          const value = item[field];
          
          if (value === undefined || value === null || value === '') {
            return item;
          }
          
          let convertedValue: any;
          switch (dataType) {
            case 'number':
              convertedValue = Number(value);
              if (isNaN(convertedValue)) convertedValue = defaultNumberValue;
              break;
            
            case 'boolean':
              if (typeof value === 'string') {
                convertedValue = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
              } else {
                convertedValue = Boolean(value);
              }
              break;
            
            case 'date':
              try {
                convertedValue = new Date(value);
                if (isNaN(convertedValue.getTime())) convertedValue = defaultDateValue;
              } catch (error) {
                convertedValue = defaultDateValue;
              }
              break;
            
            default:
              convertedValue = String(value);
          }
          
          return { ...item, [field]: convertedValue };
        });
      }
    }
    
    // Fix duplicates
    if (fixDuplicates) {
      const duplicateIssues = analysis.issues.filter(issue => issue.issue.includes('duplicate values'));
      
      for (const issue of duplicateIssues) {
        const fields = issue.field.split(', ');
        
        // Remove duplicates
        const seen = new Set<string>();
        result = result.filter(item => {
          const key = fields.map(field => {
            const value = item[field];
            if (value === undefined || value === null) return '';
            return String(value);
          }).join('|');
          
          if (seen.has(key)) {
            return false;
          } else {
            seen.add(key);
            return true;
          }
        });
      }
    }
    
    return result;
  }
  
  /**
   * Infer the data type of a field
   */
  private inferDataType(data: any[], field: string): string {
    // Default to string
    if (!data || data.length === 0) {
      return 'string';
    }
    
    // Get all non-null values
    const values = data
      .map(item => item[field])
      .filter(value => value !== undefined && value !== null && value !== '');
    
    if (values.length === 0) {
      return 'string';
    }
    
    // Check data types
    const types = values.map(value => {
      if (typeof value === 'number') return 'number';
      if (typeof value === 'boolean') return 'boolean';
      if (value instanceof Date) return 'date';
      if (typeof value === 'string') {
        // Try to infer number
        if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
        
        // Try to infer date
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) return 'date';
        } catch (error) {
          // Not a date
        }
        
        // Try to infer boolean
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === 'false' || lowerValue === 'yes' || lowerValue === 'no' || lowerValue === '1' || lowerValue === '0') {
          return 'boolean';
        }
      }
      
      return 'string';
    });
    
    // Count type frequencies
    const typeCounts: Record<string, number> = {};
    for (const type of types) {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    // Find the most common type
    let mostCommonType = 'string';
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        mostCommonType = type;
        maxCount = count;
      }
    }
    
    return mostCommonType;
  }
}

/**
 * Options for data quality analysis
 */
export interface DataQualityAnalysisOptions {
  // General options
  requiredThreshold?: number; // Percentage of completeness required (default: 90)
  generateRecommendations?: boolean; // Whether to generate AI recommendations
  
  // Validation options
  dataTypeValidations?: Record<string, string>; // Field -> expected data type
  valueRangeValidations?: Record<string, { min?: any, max?: any }>; // Field -> value range
  patternValidations?: Record<string, string | RegExp>; // Field -> regex pattern
  uniqueConstraints?: Array<string | string[]>; // Fields that should be unique
}

/**
 * Options for auto-fixing data quality issues
 */
export interface AutoFixOptions {
  fixCompleteness?: boolean;
  fixDataTypes?: boolean;
  fixDuplicates?: boolean;
  defaultStringValue?: string;
  defaultNumberValue?: number;
  defaultBooleanValue?: boolean;
  defaultDateValue?: Date;
}

// Export a singleton instance
export const dataQualityService = new DataQualityService();