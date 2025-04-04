/**
 * DataValidationService.ts
 * 
 * Service for validating data in ETL pipelines and generating quality analysis reports
 */

import {
  DataQualityAnalysis,
  DataQualityIssue,
  DataQualitySeverity,
  ValidationRule,
  ValidationRuleType
} from './ETLTypes';

class DataValidationService {
  /**
   * Analyze data quality and generate a report
   */
  analyzeDataQuality(data: any[], options: {
    fieldsToAnalyze?: string[];
    strictMode?: boolean;
    minAcceptableCompleteness?: number;
    minAcceptableAccuracy?: number;
    minAcceptableConsistency?: number;
  } = {}): DataQualityAnalysis {
    const {
      fieldsToAnalyze,
      strictMode = false,
      minAcceptableCompleteness = 90,
      minAcceptableAccuracy = 90,
      minAcceptableConsistency = 90
    } = options;
    
    // Start with empty issues array
    const issues: DataQualityIssue[] = [];
    
    // If no data is provided, return a basic report
    if (!data || data.length === 0) {
      return {
        totalIssues: 0,
        completeness: 100,
        accuracy: 100,
        consistency: 100,
        issues: [],
        summary: 'No data provided for analysis'
      };
    }
    
    // Get all fields from first record or use specified fields
    const fields = fieldsToAnalyze || Object.keys(data[0] || {});
    
    // Calculate completeness (missing data)
    const completenessIssues = this.analyzeCompleteness(data, fields);
    issues.push(...completenessIssues);
    
    // Calculate accuracy (data format and type validation)
    const accuracyIssues = this.analyzeAccuracy(data, fields);
    issues.push(...accuracyIssues);
    
    // Calculate consistency (variations in values)
    const consistencyIssues = this.analyzeConsistency(data, fields);
    issues.push(...consistencyIssues);
    
    // Calculate metrics
    const totalFieldCount = fields.length * data.length;
    const completeness = 100 - (
      this.countIssuesByType(completenessIssues) / totalFieldCount * 100
    );
    
    const accuracy = 100 - (
      this.countIssuesByType(accuracyIssues) / totalFieldCount * 100
    );
    
    const consistency = 100 - (
      this.countIssuesByType(consistencyIssues) / totalFieldCount * 100
    );
    
    // Generate recommendations based on issues
    const aiRecommendations = this.generateRecommendations(
      issues,
      { completeness, accuracy, consistency }
    );
    
    // Generate summary text
    const summary = this.generateSummary(
      issues,
      { completeness, accuracy, consistency },
      { minAcceptableCompleteness, minAcceptableAccuracy, minAcceptableConsistency }
    );
    
    return {
      totalIssues: issues.length,
      completeness: Math.round(completeness * 10) / 10, // Round to 1 decimal place
      accuracy: Math.round(accuracy * 10) / 10,
      consistency: Math.round(consistency * 10) / 10,
      issues,
      summary,
      aiRecommendations
    };
  }
  
  /**
   * Validate a dataset against a set of validation rules
   */
  validateDataset(data: any[], rules: ValidationRule[]): {
    valid: boolean;
    errors: { row: number; field: string; message: string }[];
    errorCount: number;
    passRate: number;
  } {
    const errors: { row: number; field: string; message: string }[] = [];
    let validationCount = 0;
    
    // Apply each validation rule to each data record
    data.forEach((item, rowIndex) => {
      rules.forEach(rule => {
        validationCount++;
        
        const isValid = this.validateField(item, rule);
        if (!isValid) {
          errors.push({
            row: rowIndex,
            field: rule.field,
            message: rule.errorMessage || `Validation failed for field ${rule.field} (${rule.type})`
          });
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors,
      errorCount: errors.length,
      passRate: validationCount > 0 ? (1 - errors.length / validationCount) * 100 : 100
    };
  }
  
  // Helper methods for data quality analysis
  
  private analyzeCompleteness(data: any[], fields: string[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Check for null/undefined/empty values in each field
    fields.forEach(field => {
      const missingCount = data.filter(item => {
        const value = item[field];
        return value === null || value === undefined || value === '' || 
               (typeof value === 'string' && value.trim() === '');
      }).length;
      
      const missingPercentage = (missingCount / data.length) * 100;
      
      // Determine severity based on percentage of missing values
      let severity: DataQualitySeverity = DataQualitySeverity.LOW;
      if (missingPercentage > 10) {
        severity = DataQualitySeverity.MEDIUM;
      }
      if (missingPercentage > 25) {
        severity = DataQualitySeverity.HIGH;
      }
      
      // Only add as an issue if there are missing values
      if (missingCount > 0) {
        issues.push({
          field,
          issue: `Missing data: ${missingCount} records (${missingPercentage.toFixed(1)}%)`,
          severity,
          recommendation: `Consider adding default values or making ${field} a required field.`,
          rowCount: missingCount,
          sampleValues: []
        });
      }
    });
    
    return issues;
  }
  
  private analyzeAccuracy(data: any[], fields: string[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Analyze field types and formats
    fields.forEach(field => {
      const fieldValues = data.map(item => item[field]).filter(v => v !== null && v !== undefined);
      
      if (fieldValues.length === 0) {
        return; // Skip empty fields
      }
      
      // Determine expected type from first non-null value
      const firstValue = fieldValues[0];
      const expectedType = typeof firstValue;
      
      // Type consistency check
      const typeInconsistencies = fieldValues.filter(value => typeof value !== expectedType);
      if (typeInconsistencies.length > 0) {
        const percentage = (typeInconsistencies.length / fieldValues.length) * 100;
        
        let severity: DataQualitySeverity = DataQualitySeverity.LOW;
        if (percentage > 5) severity = DataQualitySeverity.MEDIUM;
        if (percentage > 15) severity = DataQualitySeverity.HIGH;
        
        issues.push({
          field,
          issue: `Type inconsistency: ${typeInconsistencies.length} values are not ${expectedType} (${percentage.toFixed(1)}%)`,
          severity,
          recommendation: `Consider standardizing the data type for ${field} to ${expectedType}.`,
          rowCount: typeInconsistencies.length,
          sampleValues: typeInconsistencies.slice(0, 5).map(v => String(v))
        });
      }
      
      // Date format check
      if (expectedType === 'string' && this.looksLikeDate(firstValue)) {
        const invalidDates = fieldValues.filter(v => !this.isValidDate(v));
        if (invalidDates.length > 0) {
          const percentage = (invalidDates.length / fieldValues.length) * 100;
          
          let severity: DataQualitySeverity = DataQualitySeverity.LOW;
          if (percentage > 5) severity = DataQualitySeverity.MEDIUM;
          if (percentage > 15) severity = DataQualitySeverity.HIGH;
          
          issues.push({
            field,
            issue: `Invalid date format: ${invalidDates.length} values (${percentage.toFixed(1)}%)`,
            severity,
            recommendation: `Standardize date format in ${field}. Valid date format example: ${firstValue}.`,
            rowCount: invalidDates.length,
            sampleValues: invalidDates.slice(0, 5).map(v => String(v))
          });
        }
      }
      
      // Numeric range check
      if (expectedType === 'number') {
        const outliers = this.findOutliers(fieldValues);
        if (outliers.length > 0) {
          const percentage = (outliers.length / fieldValues.length) * 100;
          
          let severity: DataQualitySeverity = DataQualitySeverity.LOW;
          if (percentage > 3) severity = DataQualitySeverity.MEDIUM;
          if (percentage > 10) severity = DataQualitySeverity.HIGH;
          
          issues.push({
            field,
            issue: `Potential outliers: ${outliers.length} values (${percentage.toFixed(1)}%)`,
            severity,
            recommendation: `Verify that outlier values in ${field} are accurate.`,
            rowCount: outliers.length,
            sampleValues: outliers.slice(0, 5).map(v => String(v))
          });
        }
      }
    });
    
    return issues;
  }
  
  private analyzeConsistency(data: any[], fields: string[]): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Check for case inconsistency in string fields
    fields.forEach(field => {
      const fieldValues = data.map(item => item[field])
        .filter(v => v !== null && v !== undefined && typeof v === 'string');
      
      if (fieldValues.length < 5) {
        return; // Skip fields with few values
      }
      
      // Case consistency check for text fields
      const lowerCase = fieldValues.filter(v => v === v.toLowerCase());
      const upperCase = fieldValues.filter(v => v === v.toUpperCase());
      const mixedCase = fieldValues.filter(v => v !== v.toLowerCase() && v !== v.toUpperCase());
      
      if (
        lowerCase.length > 0 && upperCase.length > 0 && 
        (lowerCase.length + upperCase.length) / fieldValues.length < 0.9
      ) {
        let severity: DataQualitySeverity = DataQualitySeverity.LOW;
        if (mixedCase.length > fieldValues.length * 0.2) severity = DataQualitySeverity.MEDIUM;
        if (mixedCase.length > fieldValues.length * 0.4) severity = DataQualitySeverity.HIGH;
        
        issues.push({
          field,
          issue: `Case inconsistency: Mixed case styles (${lowerCase.length} lowercase, ${upperCase.length} uppercase, ${mixedCase.length} mixed)`,
          severity,
          recommendation: `Standardize case format for ${field}, preferably to ${lowerCase.length > upperCase.length ? 'lowercase' : 'uppercase'}.`,
          rowCount: fieldValues.length,
          sampleValues: [
            ...lowerCase.slice(0, 2),
            ...upperCase.slice(0, 2),
            ...mixedCase.slice(0, 2)
          ]
        });
      }
      
      // Value format consistency for common patterns (emails, phone numbers, etc.)
      if (this.looksLikeEmail(fieldValues[0])) {
        const invalidEmails = fieldValues.filter(v => !this.isValidEmail(v));
        if (invalidEmails.length > 0) {
          const percentage = (invalidEmails.length / fieldValues.length) * 100;
          
          let severity: DataQualitySeverity = DataQualitySeverity.LOW;
          if (percentage > 5) severity = DataQualitySeverity.MEDIUM;
          if (percentage > 15) severity = DataQualitySeverity.HIGH;
          
          issues.push({
            field,
            issue: `Invalid email format: ${invalidEmails.length} values (${percentage.toFixed(1)}%)`,
            severity,
            recommendation: `Standardize email format in ${field}.`,
            rowCount: invalidEmails.length,
            sampleValues: invalidEmails.slice(0, 5)
          });
        }
      }
    });
    
    return issues;
  }
  
  // Helper methods
  
  private countIssuesByType(issues: DataQualityIssue[]): number {
    return issues.reduce((sum, issue) => sum + (issue.rowCount || 0), 0);
  }
  
  private generateSummary(
    issues: DataQualityIssue[],
    metrics: { completeness: number; accuracy: number; consistency: number },
    thresholds: { minAcceptableCompleteness: number; minAcceptableAccuracy: number; minAcceptableConsistency: number }
  ): string {
    const { completeness, accuracy, consistency } = metrics;
    const { minAcceptableCompleteness, minAcceptableAccuracy, minAcceptableConsistency } = thresholds;
    
    const highSeverityCount = issues.filter(i => i.severity === DataQualitySeverity.HIGH).length;
    const mediumSeverityCount = issues.filter(i => i.severity === DataQualitySeverity.MEDIUM).length;
    const lowSeverityCount = issues.filter(i => i.severity === DataQualitySeverity.LOW).length;
    
    let qualityLevel = '';
    if (completeness >= 98 && accuracy >= 98 && consistency >= 98) {
      qualityLevel = 'Excellent';
    } else if (completeness >= 90 && accuracy >= 90 && consistency >= 90) {
      qualityLevel = 'Good';
    } else if (completeness >= 80 && accuracy >= 80 && consistency >= 80) {
      qualityLevel = 'Fair';
    } else {
      qualityLevel = 'Poor';
    }
    
    let summary = `Data Quality Analysis: ${qualityLevel} quality data.\n\n`;
    summary += `Found ${issues.length} issues (${highSeverityCount} high, ${mediumSeverityCount} medium, ${lowSeverityCount} low severity).\n`;
    summary += `Completeness: ${completeness.toFixed(1)}% (threshold: ${minAcceptableCompleteness}%)\n`;
    summary += `Accuracy: ${accuracy.toFixed(1)}% (threshold: ${minAcceptableAccuracy}%)\n`;
    summary += `Consistency: ${consistency.toFixed(1)}% (threshold: ${minAcceptableConsistency}%)\n\n`;
    
    if (completeness < minAcceptableCompleteness) {
      summary += `⚠️ Completeness is below the acceptable threshold. Focus on fixing missing data issues.\n`;
    }
    
    if (accuracy < minAcceptableAccuracy) {
      summary += `⚠️ Accuracy is below the acceptable threshold. Address data format and type issues.\n`;
    }
    
    if (consistency < minAcceptableConsistency) {
      summary += `⚠️ Consistency is below the acceptable threshold. Standardize data formats and values.\n`;
    }
    
    return summary;
  }
  
  private generateRecommendations(
    issues: DataQualityIssue[],
    metrics: { completeness: number; accuracy: number; consistency: number }
  ): string[] {
    const recommendations: string[] = [];
    const { completeness, accuracy, consistency } = metrics;
    
    // Add general recommendations based on metrics
    if (completeness < 90) {
      recommendations.push(
        'Implement stricter validation on data input to prevent missing values.',
        'Consider making critical fields required in forms and data entry points.'
      );
    }
    
    if (accuracy < 90) {
      recommendations.push(
        'Add type validation for numeric and date fields.',
        'Implement format validation for specialized fields like emails and phone numbers.'
      );
    }
    
    if (consistency < 90) {
      recommendations.push(
        'Standardize text case (upper/lower) across string fields.',
        'Normalize date formats to a single standard.'
      );
    }
    
    // Add specific recommendations based on high severity issues
    const highSeverityIssues = issues.filter(i => i.severity === DataQualitySeverity.HIGH);
    
    // Use a different approach than Set to create a unique array of fields
    const uniqueFields = highSeverityIssues
      .map(i => i.field)
      .filter((field, index, self) => self.indexOf(field) === index);
    
    if (uniqueFields.length > 0) {
      recommendations.push(
        `Prioritize fixing issues in these fields: ${uniqueFields.join(', ')}.`
      );
    }
    
    return recommendations;
  }
  
  // Validation helpers
  
  private validateField(item: any, rule: ValidationRule): boolean {
    const value = item[rule.field];
    
    switch (rule.type) {
      case ValidationRuleType.NOT_NULL:
        return value !== null && value !== undefined;
        
      case ValidationRuleType.MIN_VALUE:
        return typeof value === 'number' && value >= rule.parameters;
        
      case ValidationRuleType.MAX_VALUE:
        return typeof value === 'number' && value <= rule.parameters;
        
      case ValidationRuleType.REGEX:
        return typeof value === 'string' && new RegExp(rule.parameters).test(value);
        
      case ValidationRuleType.UNIQUENESS:
        // Uniqueness can't be validated on a single record
        return true;
        
      case ValidationRuleType.DATE_FORMAT:
        if (typeof value !== 'string') return false;
        return this.isValidDate(value);
        
      case ValidationRuleType.ENUM:
        return Array.isArray(rule.parameters) && rule.parameters.includes(value);
        
      case ValidationRuleType.CUSTOM:
        if (typeof rule.parameters !== 'string') return true;
        try {
          const validationFn = new Function('value', rule.parameters);
          return validationFn(value);
        } catch (error) {
          console.error('Error executing custom validation:', error);
          return false;
        }
        
      default:
        return true;
    }
  }
  
  // Utility functions
  
  private looksLikeDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Check for common date separators
    return (
      value.includes('-') || 
      value.includes('/') || 
      value.includes('.') ||
      !isNaN(Date.parse(value))
    );
  }
  
  private isValidDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  private looksLikeEmail(value: any): boolean {
    if (typeof value !== 'string') return false;
    return value.includes('@') && value.includes('.');
  }
  
  private isValidEmail(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  private findOutliers(values: number[]): number[] {
    if (values.length < 5) return [];
    
    // Calculate quartiles and IQR
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // Return values outside the bounds
    return values.filter(v => v < lowerBound || v > upperBound);
  }
}

// Export a singleton instance
export const dataValidationService = new DataValidationService();