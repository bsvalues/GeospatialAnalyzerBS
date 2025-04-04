import { TransformationType, FilterConfig, MapConfig, FilterOperator, FilterLogic, FilterCondition } from './ETLTypes';

/**
 * Error message type
 */
export interface ErrorMessage {
  /** Error message */
  message: string;
  
  /** Error code */
  code: string;
  
  /** Record index */
  recordIndex?: number;
  
  /** Field name */
  field?: string;
}

/**
 * Transformation result
 */
export interface TransformationResult {
  /** Whether the transformation was successful */
  success: boolean;
  
  /** Transformed data */
  data: any[];
  
  /** Error messages */
  errors: ErrorMessage[];
  
  /** Number of records processed */
  recordsProcessed: number;
  
  /** Number of records after transformation */
  resultingRecords: number;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Transformation service
 */
class TransformationService {
  /**
   * Apply a filter transformation
   */
  applyFilter(data: any[], config: FilterConfig): TransformationResult {
    const startTime = Date.now();
    const errors: ErrorMessage[] = [];
    
    try {
      // Filter data based on conditions
      const filteredData = data.filter((item, index) => {
        try {
          return this.evaluateFilterConditions(item, config.conditions, config.logic);
        } catch (error) {
          errors.push({
            message: error instanceof Error ? error.message : String(error),
            code: 'FILTER_ERROR',
            recordIndex: index
          });
          // Keep record on error
          return true;
        }
      });
      
      return {
        success: errors.length === 0,
        data: filteredData,
        errors,
        recordsProcessed: data.length,
        resultingRecords: filteredData.length,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        data: data.slice(), // Return original data on error
        errors: [
          {
            message: error instanceof Error ? error.message : String(error),
            code: 'FILTER_GENERAL_ERROR'
          }
        ],
        recordsProcessed: data.length,
        resultingRecords: data.length,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Apply a map transformation
   */
  applyMap(data: any[], config: MapConfig): TransformationResult {
    const startTime = Date.now();
    const errors: ErrorMessage[] = [];
    
    try {
      // Map data based on field mappings
      const mappedData = data.map((item, index) => {
        try {
          const result: any = config.includeOriginal ? { ...item } : {};
          
          for (const mapping of config.mappings) {
            if (item[mapping.source] !== undefined) {
              result[mapping.target] = item[mapping.source];
            } else {
              errors.push({
                message: `Source field "${mapping.source}" does not exist`,
                code: 'MAP_MISSING_SOURCE',
                recordIndex: index,
                field: mapping.source
              });
            }
          }
          
          return result;
        } catch (error) {
          errors.push({
            message: error instanceof Error ? error.message : String(error),
            code: 'MAP_ERROR',
            recordIndex: index
          });
          // Return original item on error
          return item;
        }
      });
      
      return {
        success: errors.length === 0,
        data: mappedData,
        errors,
        recordsProcessed: data.length,
        resultingRecords: mappedData.length,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        data: data.slice(), // Return original data on error
        errors: [
          {
            message: error instanceof Error ? error.message : String(error),
            code: 'MAP_GENERAL_ERROR'
          }
        ],
        recordsProcessed: data.length,
        resultingRecords: data.length,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Apply a transformation
   */
  applyTransformation(data: any[], type: TransformationType, config: any): TransformationResult {
    switch (type) {
      case TransformationType.FILTER:
        return this.applyFilter(data, config as FilterConfig);
        
      case TransformationType.MAP:
        return this.applyMap(data, config as MapConfig);
        
      // Other transformation types to be implemented
      default:
        return {
          success: false,
          data: data.slice(), // Return original data
          errors: [
            {
              message: `Transformation type "${type}" not implemented`,
              code: 'TRANSFORM_NOT_IMPLEMENTED'
            }
          ],
          recordsProcessed: data.length,
          resultingRecords: data.length,
          executionTime: 0
        };
    }
  }
  
  /**
   * Evaluate filter conditions
   */
  private evaluateFilterConditions(item: any, conditions: FilterCondition[], logic: FilterLogic): boolean {
    if (conditions.length === 0) {
      return true;
    }
    
    if (logic === 'AND') {
      return conditions.every(condition => this.evaluateFilterCondition(item, condition));
    } else {
      return conditions.some(condition => this.evaluateFilterCondition(item, condition));
    }
  }
  
  /**
   * Evaluate a single filter condition
   */
  private evaluateFilterCondition(item: any, condition: FilterCondition): boolean {
    const { field, operator, value, valueEnd } = condition;
    const fieldValue = item[field];
    
    // Handle case where field doesn't exist
    if (fieldValue === undefined) {
      return operator === FilterOperator.IS_NULL;
    }
    
    switch (operator) {
      case FilterOperator.EQUALS:
        return fieldValue === value;
        
      case FilterOperator.NOT_EQUALS:
        return fieldValue !== value;
        
      case FilterOperator.GREATER_THAN:
        return fieldValue > value;
        
      case FilterOperator.GREATER_THAN_OR_EQUALS:
        return fieldValue >= value;
        
      case FilterOperator.LESS_THAN:
        return fieldValue < value;
        
      case FilterOperator.LESS_THAN_OR_EQUALS:
        return fieldValue <= value;
        
      case FilterOperator.IN:
        return Array.isArray(value) && value.includes(fieldValue);
        
      case FilterOperator.NOT_IN:
        return Array.isArray(value) && !value.includes(fieldValue);
        
      case FilterOperator.CONTAINS:
        return String(fieldValue).includes(String(value));
        
      case FilterOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(value));
        
      case FilterOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(value));
        
      case FilterOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(value));
        
      case FilterOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
        
      case FilterOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
        
      case FilterOperator.BETWEEN:
        return fieldValue >= value && fieldValue <= (valueEnd ?? value);
        
      case FilterOperator.NOT_BETWEEN:
        return fieldValue < value || fieldValue > (valueEnd ?? value);
        
      case FilterOperator.REGEX:
        try {
          const regex = new RegExp(String(value));
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
        
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();