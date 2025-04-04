import { TransformationRule, TransformationType } from './ETLTypes';

/**
 * Error during transformation
 */
export interface TransformationError {
  rule: TransformationRule;
  error: string;
  data?: any;
}

/**
 * Result of a transformation
 */
export interface TransformResult {
  data: any[];
  filteredCount: number;
  transformedCount: number;
  addedCount: number;
  errors: TransformationError[];
}

/**
 * Service for applying data transformations
 */
class TransformationService {
  constructor() {
    console.log('Transformation service initialized');
  }
  
  /**
   * Apply a series of transformations to data
   */
  async applyTransformations(data: any[], rules: TransformationRule[]): Promise<TransformResult> {
    console.log(`Applying ${rules.length} transformation rules to ${data.length} records`);
    
    let currentData = [...data];
    let filteredCount = 0;
    let transformedCount = 0;
    let addedCount = 0;
    const errors: TransformationError[] = [];
    
    // Sort rules by order if available
    const sortedRules = [...rules].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    });
    
    // Apply each rule in order
    for (const rule of sortedRules) {
      if (!rule.enabled) {
        console.log(`Skipping disabled rule: ${rule.name}`);
        continue;
      }
      
      try {
        console.log(`Applying rule: ${rule.name} (${rule.type})`);
        
        const initialLength = currentData.length;
        
        switch (rule.type) {
          case TransformationType.FILTER:
            currentData = this.applyFilter(currentData, rule);
            filteredCount += initialLength - currentData.length;
            break;
            
          case TransformationType.MAP:
            currentData = this.applyMap(currentData, rule);
            transformedCount += currentData.length;
            break;
            
          case TransformationType.AGGREGATE:
            currentData = this.applyAggregate(currentData, rule);
            transformedCount += currentData.length;
            addedCount += currentData.length - initialLength;
            break;
            
          case TransformationType.JOIN:
            currentData = this.applyJoin(currentData, rule);
            transformedCount += currentData.length;
            addedCount += currentData.length - initialLength;
            break;
            
          case TransformationType.SORT:
            currentData = this.applySort(currentData, rule);
            transformedCount += currentData.length;
            break;
            
          case TransformationType.VALIDATE:
            currentData = this.applyValidate(currentData, rule);
            filteredCount += initialLength - currentData.length;
            break;
            
          case TransformationType.DEDUPLICATE:
            currentData = this.applyDeduplicate(currentData, rule);
            filteredCount += initialLength - currentData.length;
            break;
            
          case TransformationType.CUSTOM:
            currentData = this.applyCustomTransform(currentData, rule);
            transformedCount += currentData.length;
            break;
            
          default:
            throw new Error(`Unsupported transformation type: ${rule.type}`);
        }
        
        console.log(`Rule "${rule.name}" applied, records: ${initialLength} -> ${currentData.length}`);
      } catch (error) {
        console.error(`Error applying rule "${rule.name}":`, error);
        
        errors.push({
          rule,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return {
      data: currentData,
      filteredCount,
      transformedCount,
      addedCount,
      errors
    };
  }
  
  /**
   * Apply a filter transformation
   */
  private applyFilter(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.conditions || !Array.isArray(rule.config.conditions)) {
      throw new Error('Filter rule requires conditions array');
    }
    
    return data.filter(item => {
      // Apply all conditions (AND logic by default)
      return rule.config.conditions.every(condition => {
        const { field, operator, value } = condition;
        
        if (!field || !operator) {
          return true; // Skip invalid conditions
        }
        
        const fieldValue = item[field];
        
        switch (operator) {
          case 'eq':
            return fieldValue === value;
          case 'ne':
            return fieldValue !== value;
          case 'gt':
            return fieldValue > value;
          case 'gte':
            return fieldValue >= value;
          case 'lt':
            return fieldValue < value;
          case 'lte':
            return fieldValue <= value;
          case 'contains':
            return String(fieldValue).includes(String(value));
          case 'starts_with':
            return String(fieldValue).startsWith(String(value));
          case 'ends_with':
            return String(fieldValue).endsWith(String(value));
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'not_in':
            return !Array.isArray(value) || !value.includes(fieldValue);
          case 'is_null':
            return fieldValue === null || fieldValue === undefined;
          case 'is_not_null':
            return fieldValue !== null && fieldValue !== undefined;
          case 'regex':
            try {
              const regex = new RegExp(value);
              return regex.test(String(fieldValue));
            } catch (error) {
              console.error('Invalid regex:', error);
              return false;
            }
          default:
            console.warn(`Unknown operator: ${operator}`);
            return true;
        }
      });
    });
  }
  
  /**
   * Apply a map transformation
   */
  private applyMap(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.mappings || !Array.isArray(rule.config.mappings)) {
      throw new Error('Map rule requires mappings array');
    }
    
    return data.map(item => {
      const result = rule.config.includeOriginal ? { ...item } : {};
      
      // Apply all field mappings
      for (const mapping of rule.config.mappings) {
        const { source, target, transform } = mapping;
        
        // Get the source value
        let value = source === '*' ? item : item[source];
        
        // Apply transformation if specified
        if (transform) {
          try {
            switch (transform) {
              case 'to_string':
                value = String(value);
                break;
              case 'to_number':
                value = Number(value);
                break;
              case 'to_boolean':
                value = Boolean(value);
                break;
              case 'to_date':
                value = new Date(value);
                break;
              case 'to_upper':
                value = String(value).toUpperCase();
                break;
              case 'to_lower':
                value = String(value).toLowerCase();
                break;
              case 'trim':
                value = String(value).trim();
                break;
              default:
                // Check if it's a custom function
                if (typeof transform === 'function') {
                  value = transform(value, item);
                } else if (typeof transform === 'string' && transform.includes('return')) {
                  // Handle inline function strings
                  // eslint-disable-next-line no-new-func
                  const customFn = new Function('value', 'record', transform);
                  value = customFn(value, item);
                }
            }
          } catch (error) {
            console.error(`Error applying transform "${transform}":`, error);
          }
        }
        
        // Set the target value
        if (target === '*') {
          // Special case: overwrite entire record
          if (typeof value === 'object' && value !== null) {
            Object.assign(result, value);
          }
        } else {
          result[target] = value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply an aggregate transformation
   */
  private applyAggregate(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.groupBy || !rule.config.aggregations) {
      throw new Error('Aggregate rule requires groupBy and aggregations');
    }
    
    const groupBy = Array.isArray(rule.config.groupBy) 
      ? rule.config.groupBy 
      : [rule.config.groupBy];
      
    const aggregations = rule.config.aggregations;
    
    // Group the data
    const groups = new Map<string, any[]>();
    
    for (const item of data) {
      // Create a group key from the groupBy fields
      const key = groupBy.map(field => JSON.stringify(item[field])).join('|');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)?.push(item);
    }
    
    // Apply aggregations to each group
    const results: any[] = [];
    
    for (const [key, items] of groups) {
      const result: any = {};
      
      // Add the group by fields to the result
      groupBy.forEach(field => {
        result[field] = items[0][field];
      });
      
      // Apply each aggregation
      for (const [targetField, agg] of Object.entries(aggregations)) {
        const { field, function: aggFunction } = agg as { field: string, function: string };
        
        switch (aggFunction) {
          case 'count':
            result[targetField] = items.length;
            break;
          case 'sum':
            result[targetField] = items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
            break;
          case 'avg':
            result[targetField] = items.reduce((sum, item) => sum + Number(item[field] || 0), 0) / items.length;
            break;
          case 'min':
            result[targetField] = Math.min(...items.map(item => Number(item[field] || 0)));
            break;
          case 'max':
            result[targetField] = Math.max(...items.map(item => Number(item[field] || 0)));
            break;
          case 'first':
            result[targetField] = items[0][field];
            break;
          case 'last':
            result[targetField] = items[items.length - 1][field];
            break;
          case 'array_agg':
            result[targetField] = items.map(item => item[field]);
            break;
          case 'object_agg':
            result[targetField] = items.reduce((obj, item) => {
              obj[item[field]] = item;
              return obj;
            }, {} as Record<string, any>);
            break;
          default:
            console.warn(`Unknown aggregation function: ${aggFunction}`);
            result[targetField] = null;
        }
      }
      
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Apply a join transformation
   */
  private applyJoin(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.rightData || !rule.config.leftKey || !rule.config.rightKey) {
      throw new Error('Join rule requires rightData, leftKey, and rightKey');
    }
    
    const leftKey = rule.config.leftKey;
    const rightKey = rule.config.rightKey;
    const rightData = rule.config.rightData;
    const joinType = rule.config.joinType || 'inner';
    
    // Create an index of the right data for faster lookups
    const rightIndex = new Map<string, any[]>();
    
    for (const rightItem of rightData) {
      const key = String(rightItem[rightKey]);
      
      if (!rightIndex.has(key)) {
        rightIndex.set(key, []);
      }
      
      rightIndex.get(key)?.push(rightItem);
    }
    
    // Perform the join
    let results: any[] = [];
    
    switch (joinType) {
      case 'inner':
        // Only include records that match
        for (const leftItem of data) {
          const key = String(leftItem[leftKey]);
          const rightItems = rightIndex.get(key) || [];
          
          for (const rightItem of rightItems) {
            results.push({
              ...leftItem,
              ...rightItem,
              __joinType: 'inner'
            });
          }
        }
        break;
        
      case 'left':
        // Include all records from left, with nulls for right when no match
        for (const leftItem of data) {
          const key = String(leftItem[leftKey]);
          const rightItems = rightIndex.get(key) || [];
          
          if (rightItems.length > 0) {
            for (const rightItem of rightItems) {
              results.push({
                ...leftItem,
                ...rightItem,
                __joinType: 'left'
              });
            }
          } else {
            // No matching right records, include left only
            results.push({
              ...leftItem,
              __joinType: 'left_only'
            });
          }
        }
        break;
        
      case 'right':
        // Include all records from right, with nulls for left when no match
        for (const rightItem of rightData) {
          const key = String(rightItem[rightKey]);
          const leftItems = data.filter(item => String(item[leftKey]) === key);
          
          if (leftItems.length > 0) {
            for (const leftItem of leftItems) {
              results.push({
                ...leftItem,
                ...rightItem,
                __joinType: 'right'
              });
            }
          } else {
            // No matching left records, include right only
            results.push({
              ...rightItem,
              __joinType: 'right_only'
            });
          }
        }
        break;
        
      case 'full':
        // Include all records from both sides, with nulls when no match
        // First, do a left join
        for (const leftItem of data) {
          const key = String(leftItem[leftKey]);
          const rightItems = rightIndex.get(key) || [];
          
          if (rightItems.length > 0) {
            for (const rightItem of rightItems) {
              results.push({
                ...leftItem,
                ...rightItem,
                __joinType: 'full'
              });
            }
          } else {
            // No matching right records, include left only
            results.push({
              ...leftItem,
              __joinType: 'left_only'
            });
          }
        }
        
        // Then, add right-only records
        const leftKeys = new Set(data.map(item => String(item[leftKey])));
        
        for (const rightItem of rightData) {
          const key = String(rightItem[rightKey]);
          
          if (!leftKeys.has(key)) {
            results.push({
              ...rightItem,
              __joinType: 'right_only'
            });
          }
        }
        break;
        
      default:
        throw new Error(`Unknown join type: ${joinType}`);
    }
    
    // Apply field selection or renaming if specified
    if (rule.config.select) {
      results = results.map(item => {
        const result: Record<string, any> = {};
        
        for (const [targetField, sourceField] of Object.entries(rule.config.select)) {
          result[targetField] = item[sourceField];
        }
        
        return result;
      });
    }
    
    // Remove the __joinType field if not needed
    if (!rule.config.includeJoinType) {
      results = results.map(({ __joinType, ...rest }) => rest);
    }
    
    return results;
  }
  
  /**
   * Apply a sort transformation
   */
  private applySort(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.sortBy) {
      throw new Error('Sort rule requires sortBy field');
    }
    
    const sortFields = Array.isArray(rule.config.sortBy) 
      ? rule.config.sortBy 
      : [rule.config.sortBy];
    
    return [...data].sort((a, b) => {
      for (const sort of sortFields) {
        const field = typeof sort === 'string' ? sort : sort.field;
        const direction = typeof sort === 'string' ? 'asc' : (sort.direction || 'asc');
        
        const aValue = a[field];
        const bValue = b[field];
        
        // Handle null/undefined values
        if (aValue === undefined || aValue === null) {
          if (bValue === undefined || bValue === null) {
            continue; // Both null, move to next sort field
          }
          return direction === 'asc' ? -1 : 1; // Nulls first or last
        }
        
        if (bValue === undefined || bValue === null) {
          return direction === 'asc' ? 1 : -1; // Nulls first or last
        }
        
        // Compare based on value type
        if (typeof aValue !== typeof bValue) {
          return String(aValue).localeCompare(String(bValue)) * (direction === 'asc' ? 1 : -1);
        }
        
        if (typeof aValue === 'string') {
          const result = aValue.localeCompare(bValue);
          if (result !== 0) {
            return result * (direction === 'asc' ? 1 : -1);
          }
        } else if (typeof aValue === 'number') {
          if (aValue !== bValue) {
            return (aValue - bValue) * (direction === 'asc' ? 1 : -1);
          }
        } else if (aValue instanceof Date && bValue instanceof Date) {
          const result = aValue.getTime() - bValue.getTime();
          if (result !== 0) {
            return result * (direction === 'asc' ? 1 : -1);
          }
        } else {
          // For other types, convert to string and compare
          const result = String(aValue).localeCompare(String(bValue));
          if (result !== 0) {
            return result * (direction === 'asc' ? 1 : -1);
          }
        }
      }
      
      return 0; // All sort fields are equal
    });
  }
  
  /**
   * Apply a validation transformation (filters out invalid data)
   */
  private applyValidate(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.validations || !Array.isArray(rule.config.validations)) {
      throw new Error('Validate rule requires validations array');
    }
    
    const stopOnFirstError = !!rule.config.stopOnFirstError;
    const logErrors = rule.config.logErrors !== false;
    
    return data.filter(item => {
      const errors: any[] = [];
      
      // Check each validation rule
      for (const validation of rule.config.validations) {
        const { field, rules } = validation;
        
        if (!field || !rules || !Array.isArray(rules)) {
          continue;
        }
        
        const value = item[field];
        
        for (const rule of rules) {
          const { type, message } = rule;
          
          let isValid = true;
          
          switch (type) {
            case 'required':
              isValid = value !== undefined && value !== null && value !== '';
              break;
              
            case 'min_length':
              isValid = !value || String(value).length >= rule.min;
              break;
              
            case 'max_length':
              isValid = !value || String(value).length <= rule.max;
              break;
              
            case 'min':
              isValid = !value || Number(value) >= rule.min;
              break;
              
            case 'max':
              isValid = !value || Number(value) <= rule.max;
              break;
              
            case 'pattern':
              try {
                const regex = new RegExp(rule.pattern);
                isValid = !value || regex.test(String(value));
              } catch (error) {
                console.error('Invalid regex pattern:', error);
                isValid = false;
              }
              break;
              
            case 'email':
              // Simple email validation
              isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
              break;
              
            case 'url':
              // Simple URL validation
              isValid = !value || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(String(value));
              break;
              
            case 'in':
              isValid = !value || (Array.isArray(rule.values) && rule.values.includes(value));
              break;
              
            case 'not_in':
              isValid = !value || !(Array.isArray(rule.values) && rule.values.includes(value));
              break;
              
            case 'custom':
              if (typeof rule.validate === 'function') {
                isValid = rule.validate(value, item);
              } else if (typeof rule.validate === 'string' && rule.validate.includes('return')) {
                try {
                  // eslint-disable-next-line no-new-func
                  const validateFn = new Function('value', 'record', rule.validate);
                  isValid = validateFn(value, item);
                } catch (error) {
                  console.error('Error in custom validation function:', error);
                  isValid = false;
                }
              }
              break;
              
            default:
              console.warn(`Unknown validation type: ${type}`);
          }
          
          if (!isValid) {
            const errorMessage = message || `Validation failed for ${field}: ${type}`;
            
            errors.push({
              field,
              type,
              message: errorMessage
            });
            
            if (stopOnFirstError) {
              break;
            }
          }
        }
        
        if (errors.length > 0 && stopOnFirstError) {
          break;
        }
      }
      
      // Record is valid if no errors
      const isValid = errors.length === 0;
      
      if (!isValid && logErrors) {
        console.warn('Validation errors:', errors);
        
        // Add validation errors to the record if needed
        if (rule.config.addErrorsToRecord) {
          item.__validationErrors = errors;
        }
      }
      
      return isValid;
    });
  }
  
  /**
   * Apply a deduplication transformation
   */
  private applyDeduplicate(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.fields || !Array.isArray(rule.config.fields)) {
      throw new Error('Deduplicate rule requires fields array');
    }
    
    const fields = rule.config.fields;
    const keepFirst = rule.config.strategy !== 'last';
    const seen = new Set<string>();
    const result: any[] = [];
    
    // Process records in the appropriate order
    const records = keepFirst ? data : [...data].reverse();
    
    for (const record of records) {
      // Create a unique key based on the specified fields
      const key = fields
        .map(field => {
          const value = record[field];
          return value === undefined || value === null ? '' : String(value);
        })
        .join('|');
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(record);
      }
    }
    
    // Restore the original order if needed
    return keepFirst ? result : result.reverse();
  }
  
  /**
   * Apply a custom transformation
   */
  private applyCustomTransform(data: any[], rule: TransformationRule): any[] {
    if (!rule.config.transform) {
      throw new Error('Custom rule requires transform function');
    }
    
    // Handle different types of custom transforms
    if (typeof rule.config.transform === 'function') {
      // Direct function reference
      return rule.config.transform(data, rule.config);
    } else if (typeof rule.config.transform === 'string') {
      try {
        // String containing a function body
        // eslint-disable-next-line no-new-func
        const transformFn = new Function('data', 'config', rule.config.transform);
        return transformFn(data, rule.config);
      } catch (error) {
        console.error('Error in custom transform function:', error);
        throw new Error(`Custom transform error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      throw new Error('Custom transform must be a function or string');
    }
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();