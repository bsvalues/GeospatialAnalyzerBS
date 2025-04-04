/**
 * TransformationService
 * 
 * This service provides functionality for applying data transformations in ETL pipelines.
 * It supports a variety of transformation types including mapping, filtering, joining,
 * enrichment, and validation operations.
 */

import { TransformationRule } from './ETLTypes';

// Transformation result interface
export interface TransformationResult {
  success: boolean;
  data: any[];
  totalRecords: number;
  transformedRecords: number;
  skippedRecords: number;
  errors: TransformationError[];
  warnings: TransformationWarning[];
  executionTimeMs: number;
}

// Transformation error interface
export interface TransformationError {
  rule: string;
  recordIndex?: number;
  field?: string;
  message: string;
  code?: string;
}

// Transformation warning interface
export interface TransformationWarning {
  rule: string;
  recordIndex?: number;
  field?: string;
  message: string;
  code?: string;
}

// Available transformation types
export type TransformationType = 
  'map' | 
  'filter' | 
  'join' | 
  'enrich' | 
  'validate' | 
  'aggregate' | 
  'split' | 
  'format' | 
  'deduplicate' | 
  'normalize' | 
  'custom';

/**
 * TransformationService class for applying data transformations
 */
export class TransformationService {
  private static instance: TransformationService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): TransformationService {
    if (!TransformationService.instance) {
      TransformationService.instance = new TransformationService();
    }
    return TransformationService.instance;
  }
  
  /**
   * Apply a transformation rule to a dataset
   * @param data The input data array
   * @param rule The transformation rule to apply
   * @returns Transformation result with transformed data
   */
  public async applyTransformation(
    data: any[], 
    rule: TransformationRule
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    
    const result: TransformationResult = {
      success: false,
      data: [],
      totalRecords: data.length,
      transformedRecords: 0,
      skippedRecords: 0,
      errors: [],
      warnings: [],
      executionTimeMs: 0
    };
    
    try {
      // Validate inputs
      if (!data || !Array.isArray(data)) {
        throw new Error('Input data must be an array');
      }
      
      if (!rule || !rule.transformationCode) {
        throw new Error('Invalid transformation rule');
      }
      
      // Apply the transformation
      const transformedData = await this.executeTransformation(data, rule);
      
      // Count transformed and skipped records
      result.transformedRecords = transformedData.length;
      result.skippedRecords = data.length - transformedData.length;
      result.data = transformedData;
      result.success = true;
      
    } catch (error: any) {
      console.error('Transformation error:', error);
      result.success = false;
      result.errors.push({
        rule: rule.name,
        message: error.message || 'Transformation failed'
      });
    } finally {
      // Calculate execution time
      result.executionTimeMs = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Apply multiple transformation rules to a dataset
   * @param data The input data array
   * @param rules The transformation rules to apply
   * @returns Transformation result with transformed data
   */
  public async applyTransformations(
    data: any[], 
    rules: TransformationRule[]
  ): Promise<TransformationResult> {
    const startTime = Date.now();
    
    const result: TransformationResult = {
      success: false,
      data: [...data], // Start with a copy of the original data
      totalRecords: data.length,
      transformedRecords: 0,
      skippedRecords: 0,
      errors: [],
      warnings: [],
      executionTimeMs: 0
    };
    
    try {
      // Validate inputs
      if (!data || !Array.isArray(data)) {
        throw new Error('Input data must be an array');
      }
      
      if (!rules || !Array.isArray(rules) || rules.length === 0) {
        throw new Error('At least one transformation rule is required');
      }
      
      // Apply each rule in sequence
      let currentData = [...data];
      let totalTransformed = 0;
      
      for (const rule of rules) {
        try {
          const ruleResult = await this.applyTransformation(currentData, rule);
          
          // Update data for the next transformation
          currentData = ruleResult.data;
          
          // Accumulate metrics
          totalTransformed += ruleResult.transformedRecords;
          
          // Add any errors or warnings
          result.errors.push(...ruleResult.errors);
          result.warnings.push(...ruleResult.warnings);
          
        } catch (ruleError: any) {
          // Log error but continue with other rules
          console.error(`Error applying rule ${rule.name}:`, ruleError);
          result.errors.push({
            rule: rule.name,
            message: ruleError.message || 'Transformation rule failed'
          });
        }
      }
      
      // Update final result
      result.data = currentData;
      result.transformedRecords = totalTransformed;
      result.skippedRecords = data.length - currentData.length;
      result.success = result.errors.length === 0;
      
    } catch (error: any) {
      console.error('Transformation chain error:', error);
      result.success = false;
      result.errors.push({
        rule: 'multiple',
        message: error.message || 'Transformation chain failed'
      });
    } finally {
      // Calculate execution time
      result.executionTimeMs = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Test a transformation rule with sample data
   * @param sampleData Sample data to test with
   * @param rule The transformation rule to test
   * @returns Test result with transformed sample data
   */
  public async testTransformation(
    sampleData: any[], 
    rule: TransformationRule
  ): Promise<TransformationResult> {
    // Limit sample size for testing
    const limitedSample = sampleData.slice(0, 100);
    
    // Apply the transformation
    return this.applyTransformation(limitedSample, rule);
  }
  
  /**
   * Execute a transformation using the rule's code
   * @param data The input data
   * @param rule The transformation rule to execute
   * @returns Transformed data
   */
  private async executeTransformation(
    data: any[], 
    rule: TransformationRule
  ): Promise<any[]> {
    try {
      // For security reasons, we should validate transformation code
      // In a production environment, consider using a sandbox or worker thread
      
      // Define safe transformation functions
      const transformFunctions = {
        // Map a field
        mapField: (rows: any[], sourceField: string, targetField: string, transformer: (val: any) => any) => {
          return rows.map(row => ({
            ...row,
            [targetField]: transformer(row[sourceField])
          }));
        },
        
        // Filter rows
        filterRows: (rows: any[], predicate: (row: any) => boolean) => {
          return rows.filter(predicate);
        },
        
        // Format a field
        formatField: (rows: any[], field: string, formatter: (val: any) => any) => {
          return rows.map(row => ({
            ...row,
            [field]: formatter(row[field])
          }));
        },
        
        // Add a constant field
        addConstantField: (rows: any[], fieldName: string, value: any) => {
          return rows.map(row => ({
            ...row,
            [fieldName]: value
          }));
        },
        
        // Combine fields
        combineFields: (rows: any[], sourceFields: string[], targetField: string, combiner: (...values: any[]) => any) => {
          return rows.map(row => ({
            ...row,
            [targetField]: combiner(...sourceFields.map(field => row[field]))
          }));
        },
        
        // Extract part of a field
        extractFromField: (rows: any[], sourceField: string, targetField: string, extractor: (val: any) => any) => {
          return rows.map(row => ({
            ...row,
            [targetField]: extractor(row[sourceField])
          }));
        },
        
        // Remove duplicates
        removeDuplicates: (rows: any[], keyFields: string[]) => {
          const seen = new Set();
          return rows.filter(row => {
            const key = keyFields.map(field => row[field]).join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        },
        
        // Fill missing values
        fillMissingValues: (rows: any[], field: string, defaultValue: any) => {
          return rows.map(row => ({
            ...row,
            [field]: row[field] === undefined || row[field] === null || row[field] === '' 
              ? defaultValue 
              : row[field]
          }));
        },
        
        // Convert data type
        convertType: (rows: any[], field: string, type: 'string' | 'number' | 'boolean' | 'date') => {
          return rows.map(row => {
            const value = row[field];
            let convertedValue: any = value;
            
            if (value !== undefined && value !== null) {
              switch (type) {
                case 'string':
                  convertedValue = String(value);
                  break;
                case 'number':
                  convertedValue = Number(value);
                  if (isNaN(convertedValue)) convertedValue = 0;
                  break;
                case 'boolean':
                  convertedValue = Boolean(value);
                  break;
                case 'date':
                  convertedValue = new Date(value);
                  if (isNaN(convertedValue.getTime())) convertedValue = null;
                  break;
              }
            }
            
            return {
              ...row,
              [field]: convertedValue
            };
          });
        },
        
        // Rename a field
        renameField: (rows: any[], oldField: string, newField: string) => {
          return rows.map(row => {
            const { [oldField]: value, ...rest } = row;
            return {
              ...rest,
              [newField]: value
            };
          });
        },
        
        // Remove fields
        removeFields: (rows: any[], fields: string[]) => {
          return rows.map(row => {
            const newRow = { ...row };
            fields.forEach(field => delete newRow[field]);
            return newRow;
          });
        }
      };
      
      // Try to load the transformation code
      // In a real implementation, we should use a more secure approach
      try {
        // Attempt to parse the transformation code and execute it
        const transformationLogic = new Function(
          'data', 
          'helpers', 
          `try { 
            ${rule.transformationCode} 
          } catch (error) { 
            console.error("Transformation execution error:", error); 
            throw error; 
          }`
        );
        
        // Execute the transformation
        return transformationLogic(data, transformFunctions);
      } catch (codeError: any) {
        console.error('Error executing transformation code:', codeError);
        throw new Error(`Transformation code execution failed: ${codeError.message}`);
      }
    } catch (error: any) {
      console.error('Transformation execution error:', error);
      throw error;
    }
  }
  
  /**
   * Generate suggestions for transformation rules
   * @param data Sample data to analyze
   * @returns Suggested transformation rules
   */
  public async suggestTransformations(data: any[]): Promise<TransformationRule[]> {
    if (!data || data.length === 0) {
      return [];
    }
    
    const suggestions: TransformationRule[] = [];
    const sampleRow = data[0];
    const fields = Object.keys(sampleRow);
    
    // Analyze each field for potential transformations
    for (const field of fields) {
      const values = data.map(row => row[field]);
      const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
      
      if (nonNullValues.length === 0) continue;
      
      // Check for missing values
      const missingCount = values.length - nonNullValues.length;
      if (missingCount > 0) {
        suggestions.push({
          id: `suggest-fill-${field}`,
          name: `Fill Missing ${field}`,
          description: `Add default values for missing ${field}`,
          dataType: 'text',
          transformationCode: `return helpers.fillMissingValues(data, "${field}", "");`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Check for inconsistent types
      const types = new Set(nonNullValues.map(val => typeof val));
      if (types.size > 1) {
        // Determine the most common type
        const typeCounts: Record<string, number> = {};
        nonNullValues.forEach(val => {
          const type = typeof val;
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        const dominantType = Object.entries(typeCounts)
          .reduce((max, [type, count]) => count > max[1] ? [type, count] : max, ['', 0])[0];
        
        if (dominantType) {
          suggestions.push({
            id: `suggest-type-${field}`,
            name: `Standardize ${field} Type`,
            description: `Convert ${field} to ${dominantType}`,
            dataType: dominantType as any,
            transformationCode: `return helpers.convertType(data, "${field}", "${dominantType}");`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      // Analyze string fields
      if (nonNullValues.every(val => typeof val === 'string')) {
        // Check for potential case normalization needs
        const caseVariations = new Set(nonNullValues.map(val => {
          const str = String(val);
          if (str === str.toUpperCase()) return 'upper';
          if (str === str.toLowerCase()) return 'lower';
          if (str[0] === str[0].toUpperCase()) return 'title';
          return 'mixed';
        }));
        
        if (caseVariations.size > 1) {
          suggestions.push({
            id: `suggest-case-${field}`,
            name: `Normalize ${field} Case`,
            description: `Standardize case for ${field}`,
            dataType: 'text',
            transformationCode: 
              `return helpers.mapField(data, "${field}", "${field}", val => String(val).toLowerCase());`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Check for potential duplicate records
    if (data.length > 1) {
      suggestions.push({
        id: `suggest-dedup-all`,
        name: `Remove Duplicate Records`,
        description: `Eliminate duplicate records based on all fields`,
        dataType: 'object',
        transformationCode: `return helpers.removeDuplicates(data, ${JSON.stringify(fields)});`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return suggestions;
  }
}

// Export singleton instance
export default TransformationService.getInstance();