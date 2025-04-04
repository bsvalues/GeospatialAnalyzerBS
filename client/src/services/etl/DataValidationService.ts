/**
 * DataValidationService
 * 
 * This service provides functionality for validating data quality and structure
 * in ETL pipelines. It allows validating data against schemas, identifying quality issues,
 * and providing recommendations for data cleaning.
 */

import { DataSource } from './ETLTypes';

// Data issue types
export type DataIssueSeverity = 'low' | 'medium' | 'high';

export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: DataIssueSeverity;
  recommendation: string;
}

export interface DataQualityAnalysisResult {
  totalIssues: number;
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  consistency: number; // 0-100%
  issues: DataQualityIssue[];
  summary: string;
  aiRecommendations?: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'unique' | 'pattern' | 'relationship';
  params?: Record<string, any>;
  message?: string;
}

/**
 * DataValidationService class for handling data quality validation
 */
export class DataValidationService {
  private static instance: DataValidationService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }
  
  /**
   * Validate data against a set of rules
   * @param data The data rows to validate
   * @param rules Validation rules to apply
   * @returns Validation result with issues found
   */
  public async validateData(
    data: any[], 
    rules: ValidationRule[]
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    
    // Apply each rule to the data
    for (const rule of rules) {
      const { field, type, params, message } = rule;
      
      switch (type) {
        case 'required':
          this.validateRequired(data, field, issues, message);
          break;
        case 'format':
          this.validateFormat(data, field, params, issues, message);
          break;
        case 'range':
          this.validateRange(data, field, params, issues, message);
          break;
        case 'unique':
          this.validateUnique(data, field, issues, message);
          break;
        case 'pattern':
          this.validatePattern(data, field, params, issues, message);
          break;
        case 'relationship':
          this.validateRelationship(data, field, params, issues, message);
          break;
      }
    }
    
    return issues;
  }
  
  /**
   * Analyze data quality and generate a comprehensive report
   * @param data The data rows to analyze
   * @param dataSource Optional data source info for context
   * @returns Detailed data quality analysis
   */
  public async analyzeDataQuality(
    data: any[], 
    dataSource?: DataSource
  ): Promise<DataQualityAnalysisResult> {
    // Initialize metrics
    let completeness = 0;
    let accuracy = 0;
    let consistency = 0;
    const issues: DataQualityIssue[] = [];
    
    // Skip empty datasets
    if (!data || data.length === 0) {
      return {
        totalIssues: 0,
        completeness: 100,
        accuracy: 100,
        consistency: 100,
        issues: [],
        summary: "No data provided for analysis."
      };
    }

    // Get all fields from the data
    const sampleRow = data[0];
    const fields = Object.keys(sampleRow);
    
    // Check completeness (missing values)
    let totalFields = fields.length * data.length;
    let missingValues = 0;
    
    data.forEach(row => {
      fields.forEach(field => {
        if (row[field] === null || row[field] === undefined || row[field] === '') {
          missingValues++;
          issues.push({
            field,
            issue: 'Missing value',
            severity: 'medium',
            recommendation: `Provide a value for ${field} or consider default values.`
          });
        }
      });
    });
    
    completeness = 100 - (missingValues / totalFields * 100);
    
    // Check data types consistency
    const fieldTypes: Record<string, Set<string>> = {};
    
    data.forEach(row => {
      fields.forEach(field => {
        if (row[field] !== null && row[field] !== undefined) {
          if (!fieldTypes[field]) {
            fieldTypes[field] = new Set();
          }
          fieldTypes[field].add(typeof row[field]);
        }
      });
    });
    
    let inconsistentFields = 0;
    
    Object.entries(fieldTypes).forEach(([field, types]) => {
      if (types.size > 1) {
        inconsistentFields++;
        issues.push({
          field,
          issue: `Inconsistent data types: ${Array.from(types).join(', ')}`,
          severity: 'high',
          recommendation: 'Standardize data types for this field across all records.'
        });
      }
    });
    
    consistency = 100 - (inconsistentFields / fields.length * 100);
    
    // Analyze data patterns for accuracy
    let potentialAccuracyIssues = 0;
    
    fields.forEach(field => {
      // Simple outlier detection for numeric fields
      const numericValues = data
        .map(row => row[field])
        .filter(value => typeof value === 'number' && !isNaN(value));
      
      if (numericValues.length > 0) {
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const stdDev = Math.sqrt(
          numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
        );
        
        const outliers = numericValues.filter(val => Math.abs(val - mean) > stdDev * 2);
        
        if (outliers.length > 0) {
          potentialAccuracyIssues++;
          issues.push({
            field,
            issue: `${outliers.length} potential outliers detected`,
            severity: 'low',
            recommendation: 'Review values that deviate significantly from the mean.'
          });
        }
      }
      
      // Date validation for date fields
      const dateValues = data
        .map(row => row[field])
        .filter(value => 
          typeof value === 'string' && 
          /^\d{4}-\d{2}-\d{2}/.test(value) && 
          !isNaN(Date.parse(value))
        );
      
      if (dateValues.length > 0 && dateValues.length !== data.length) {
        potentialAccuracyIssues++;
        issues.push({
          field,
          issue: 'Inconsistent date formats',
          severity: 'medium',
          recommendation: 'Standardize date formats to ISO format (YYYY-MM-DD).'
        });
      }
    });
    
    accuracy = 100 - (potentialAccuracyIssues / fields.length * 50); // Scale to 0-100
    accuracy = Math.max(0, Math.min(100, accuracy)); // Ensure between 0-100
    
    // Generate summary
    const summaryLines = [
      `Analyzed ${data.length} records with ${fields.length} fields.`,
      `Completeness: ${completeness.toFixed(1)}%, Consistency: ${consistency.toFixed(1)}%, Accuracy: ${accuracy.toFixed(1)}%.`,
      `Found ${issues.length} potential data quality issues.`
    ];
    
    const aiRecommendations = this.generateAIRecommendations(issues, data.length);
    
    return {
      totalIssues: issues.length,
      completeness,
      accuracy,
      consistency,
      issues,
      summary: summaryLines.join(' '),
      aiRecommendations
    };
  }
  
  /**
   * Generate smart recommendations for improving data quality
   */
  private generateAIRecommendations(issues: DataQualityIssue[], recordCount: number): string[] {
    const recommendations: string[] = [];
    
    const missingValueFields = new Set(
      issues
        .filter(issue => issue.issue === 'Missing value')
        .map(issue => issue.field)
    );
    
    const inconsistentTypeFields = new Set(
      issues
        .filter(issue => issue.issue.includes('Inconsistent data types'))
        .map(issue => issue.field)
    );
    
    const outlierFields = new Set(
      issues
        .filter(issue => issue.issue.includes('outliers detected'))
        .map(issue => issue.field)
    );
    
    // Add recommendations based on issue patterns
    if (missingValueFields.size > 0) {
      recommendations.push(
        `Consider implementing data validation rules to enforce required fields: ${Array.from(missingValueFields).join(', ')}.`
      );
    }
    
    if (inconsistentTypeFields.size > 0) {
      recommendations.push(
        `Implement data type transformations to standardize these fields: ${Array.from(inconsistentTypeFields).join(', ')}.`
      );
    }
    
    if (outlierFields.size > 0) {
      recommendations.push(
        `Review potential outliers in these fields which may indicate data entry errors: ${Array.from(outlierFields).join(', ')}.`
      );
    }
    
    // Add general recommendations
    if (recordCount > 10000) {
      recommendations.push(
        "Consider implementing incremental data validation to improve performance with large datasets."
      );
    }
    
    if (recommendations.length === 0) {
      recommendations.push(
        "No specific issues found. Continue monitoring data quality on a regular basis."
      );
    }
    
    return recommendations;
  }
  
  // Validation methods for specific rule types
  
  private validateRequired(
    data: any[], 
    field: string, 
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    data.forEach((row, index) => {
      if (row[field] === undefined || row[field] === null || row[field] === '') {
        issues.push({
          field,
          issue: customMessage || `Required field ${field} is missing at row ${index + 1}`,
          severity: 'high',
          recommendation: `Provide a value for ${field}.`
        });
      }
    });
  }
  
  private validateFormat(
    data: any[], 
    field: string, 
    params: any,
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    const { format } = params || {};
    
    if (!format) return;
    
    let validator: (value: any) => boolean;
    let formatName: string;
    
    // Define validators for common formats
    switch (format) {
      case 'email':
        validator = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        formatName = 'email address';
        break;
      case 'url':
        validator = value => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(String(value));
        formatName = 'URL';
        break;
      case 'date':
        validator = value => !isNaN(Date.parse(String(value)));
        formatName = 'date';
        break;
      case 'number':
        validator = value => !isNaN(Number(value));
        formatName = 'number';
        break;
      case 'integer':
        validator = value => Number.isInteger(Number(value));
        formatName = 'integer';
        break;
      case 'zipcode':
        validator = value => /^\d{5}(-\d{4})?$/.test(String(value));
        formatName = 'zip code';
        break;
      case 'phone':
        validator = value => /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(String(value));
        formatName = 'phone number';
        break;
      default:
        return; // Unknown format
    }
    
    data.forEach((row, index) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '' && !validator(value)) {
        issues.push({
          field,
          issue: customMessage || `Invalid ${formatName} format at row ${index + 1}: "${value}"`,
          severity: 'medium',
          recommendation: `Format ${field} as a valid ${formatName}.`
        });
      }
    });
  }
  
  private validateRange(
    data: any[], 
    field: string, 
    params: any,
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    const { min, max } = params || {};
    
    data.forEach((row, index) => {
      const value = row[field];
      
      if (value === undefined || value === null || value === '') {
        return; // Skip empty values (handled by required rule)
      }
      
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        issues.push({
          field,
          issue: `Non-numeric value in numeric field at row ${index + 1}: "${value}"`,
          severity: 'high',
          recommendation: `Ensure ${field} contains only numeric values.`
        });
        return;
      }
      
      if (min !== undefined && numValue < min) {
        issues.push({
          field,
          issue: customMessage || `Value below minimum at row ${index + 1}: ${numValue} < ${min}`,
          severity: 'medium',
          recommendation: `Ensure ${field} is at least ${min}.`
        });
      }
      
      if (max !== undefined && numValue > max) {
        issues.push({
          field,
          issue: customMessage || `Value above maximum at row ${index + 1}: ${numValue} > ${max}`,
          severity: 'medium',
          recommendation: `Ensure ${field} is at most ${max}.`
        });
      }
    });
  }
  
  private validateUnique(
    data: any[], 
    field: string, 
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    const valueMap = new Map<string, number[]>();
    
    data.forEach((row, index) => {
      const value = row[field];
      
      if (value === undefined || value === null) {
        return; // Skip null values
      }
      
      const valueStr = String(value);
      
      if (!valueMap.has(valueStr)) {
        valueMap.set(valueStr, []);
      }
      
      valueMap.get(valueStr)!.push(index);
    });
    
    valueMap.forEach((indices, value) => {
      if (indices.length > 1) {
        issues.push({
          field,
          issue: customMessage || `Duplicate value "${value}" found at rows: ${indices.map(i => i + 1).join(', ')}`,
          severity: 'medium',
          recommendation: `Ensure ${field} contains unique values.`
        });
      }
    });
  }
  
  private validatePattern(
    data: any[], 
    field: string, 
    params: any,
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    const { pattern, flags } = params || {};
    
    if (!pattern) return;
    
    try {
      const regex = new RegExp(pattern, flags);
      
      data.forEach((row, index) => {
        const value = row[field];
        
        if (value === undefined || value === null || value === '') {
          return; // Skip empty values (handled by required rule)
        }
        
        const strValue = String(value);
        
        if (!regex.test(strValue)) {
          issues.push({
            field,
            issue: customMessage || `Value doesn't match pattern at row ${index + 1}: "${strValue}"`,
            severity: 'medium',
            recommendation: `Ensure ${field} matches the required pattern.`
          });
        }
      });
    } catch (error) {
      issues.push({
        field,
        issue: `Invalid regex pattern for ${field}: ${error}`,
        severity: 'high',
        recommendation: 'Fix the regex pattern in the validation rule.'
      });
    }
  }
  
  private validateRelationship(
    data: any[], 
    field: string, 
    params: any,
    issues: DataQualityIssue[],
    customMessage?: string
  ): void {
    const { relatedField, relationship } = params || {};
    
    if (!relatedField || !relationship) return;
    
    data.forEach((row, index) => {
      const value = row[field];
      const relatedValue = row[relatedField];
      
      if (value === undefined || value === null || relatedValue === undefined || relatedValue === null) {
        return; // Skip if either value is missing
      }
      
      let isValid = false;
      
      switch (relationship) {
        case 'equal':
          isValid = value === relatedValue;
          break;
        case 'greater':
          isValid = value > relatedValue;
          break;
        case 'less':
          isValid = value < relatedValue;
          break;
        case 'greater_equal':
          isValid = value >= relatedValue;
          break;
        case 'less_equal':
          isValid = value <= relatedValue;
          break;
        default:
          return; // Unknown relationship
      }
      
      if (!isValid) {
        issues.push({
          field,
          issue: customMessage || `Relationship "${relationship}" not satisfied with ${relatedField} at row ${index + 1}`,
          severity: 'medium',
          recommendation: `Ensure ${field} is ${relationship} to ${relatedField}.`
        });
      }
    });
  }
}

// Export singleton instance
export default DataValidationService.getInstance();