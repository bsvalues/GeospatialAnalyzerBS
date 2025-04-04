import { TransformationRule, TransformationType } from './ETLTypes';

/**
 * TransformationService handles the application of transformations to data
 */
class TransformationService {
  /**
   * Apply a transformation to data
   */
  async applyTransformation(transformation: TransformationRule, data: any[]): Promise<any[]> {
    console.log(`Applying transformation: ${transformation.name} (${transformation.type})`);
    
    if (!transformation.enabled) {
      console.log(`Transformation ${transformation.name} is disabled, skipping`);
      return data;
    }
    
    if (!data || data.length === 0) {
      console.log(`No data to transform for ${transformation.name}`);
      return [];
    }
    
    // Apply transformation based on type
    switch (transformation.type) {
      case TransformationType.FILTER:
        return this.applyFilter(transformation, data);
      
      case TransformationType.MAP:
        return this.applyMap(transformation, data);
      
      case TransformationType.AGGREGATE:
        return this.applyAggregate(transformation, data);
      
      case TransformationType.JOIN:
        // Join requires a second data source, not implemented in this example
        console.warn('Join transformation not fully implemented');
        return data;
      
      case TransformationType.SORT:
        return this.applySort(transformation, data);
      
      case TransformationType.GROUP:
        return this.applyGroup(transformation, data);
      
      case TransformationType.VALIDATE:
        return this.applyValidate(transformation, data);
      
      case TransformationType.DEDUPLICATE:
        return this.applyDeduplicate(transformation, data);
      
      case TransformationType.CUSTOM:
        return this.applyCustom(transformation, data);
      
      default:
        console.warn(`Unknown transformation type: ${transformation.type}`);
        return data;
    }
  }
  
  /**
   * Apply a filter transformation
   */
  private applyFilter(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.conditions || !Array.isArray(config.conditions)) {
      console.warn(`Invalid filter configuration for ${transformation.name}`);
      return data;
    }
    
    return data.filter(item => {
      // If no conditions, include all items
      if (config.conditions.length === 0) {
        return true;
      }
      
      // Apply all conditions (AND logic)
      return config.conditions.every(condition => {
        const { field, operator, value } = condition;
        
        if (!field || !operator) {
          return true;
        }
        
        const fieldValue = item[field];
        
        switch (operator) {
          case 'equals':
            return fieldValue === value;
          
          case 'notEquals':
            return fieldValue !== value;
          
          case 'contains':
            return typeof fieldValue === 'string' && fieldValue.includes(value);
          
          case 'notContains':
            return typeof fieldValue === 'string' && !fieldValue.includes(value);
          
          case 'startsWith':
            return typeof fieldValue === 'string' && fieldValue.startsWith(value);
          
          case 'endsWith':
            return typeof fieldValue === 'string' && fieldValue.endsWith(value);
          
          case 'greaterThan':
            return fieldValue > value;
          
          case 'greaterThanOrEquals':
            return fieldValue >= value;
          
          case 'lessThan':
            return fieldValue < value;
          
          case 'lessThanOrEquals':
            return fieldValue <= value;
          
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          
          case 'notIn':
            return Array.isArray(value) && !value.includes(fieldValue);
          
          case 'exists':
            return fieldValue !== undefined && fieldValue !== null;
          
          case 'notExists':
            return fieldValue === undefined || fieldValue === null;
          
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
  private applyMap(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.mappings || !Array.isArray(config.mappings)) {
      console.warn(`Invalid map configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result: any = {};
      
      // Include original fields if specified
      if (config.includeOriginal) {
        Object.assign(result, item);
      }
      
      // Apply mappings
      for (const mapping of config.mappings) {
        const { source, target, defaultValue, transform } = mapping;
        
        if (!target) {
          continue;
        }
        
        let value;
        
        if (source) {
          value = item[source];
        }
        
        // Use default value if source is missing or undefined
        if (value === undefined && defaultValue !== undefined) {
          value = defaultValue;
        }
        
        // Apply transformation function if provided
        if (transform && typeof transform === 'string') {
          try {
            // Create a function from the string
            // This is a security risk in a real application
            const transformFn = new Function('value', 'item', transform);
            value = transformFn(value, item);
          } catch (error) {
            console.error(`Error applying transform function for ${target}:`, error);
          }
        }
        
        result[target] = value;
      }
      
      return result;
    });
  }
  
  /**
   * Apply an aggregate transformation
   */
  private applyAggregate(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.aggregations || !Array.isArray(config.aggregations)) {
      console.warn(`Invalid aggregate configuration for ${transformation.name}`);
      return data;
    }
    
    // If no data, return empty array
    if (data.length === 0) {
      return [];
    }
    
    const result: any = {};
    
    // Apply aggregations
    for (const aggregation of config.aggregations) {
      const { field, operator, alias } = aggregation;
      
      if (!field || !operator) {
        continue;
      }
      
      const targetField = alias || `${operator}_${field}`;
      
      switch (operator) {
        case 'sum':
          result[targetField] = data.reduce((sum, item) => {
            const value = parseFloat(item[field]);
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
          break;
        
        case 'avg':
          result[targetField] = data.reduce((sum, item) => {
            const value = parseFloat(item[field]);
            return sum + (isNaN(value) ? 0 : value);
          }, 0) / data.length;
          break;
        
        case 'min':
          result[targetField] = Math.min(...data.map(item => {
            const value = parseFloat(item[field]);
            return isNaN(value) ? Infinity : value;
          }));
          break;
        
        case 'max':
          result[targetField] = Math.max(...data.map(item => {
            const value = parseFloat(item[field]);
            return isNaN(value) ? -Infinity : value;
          }));
          break;
        
        case 'count':
          result[targetField] = data.length;
          break;
        
        case 'countDistinct':
          result[targetField] = new Set(data.map(item => item[field])).size;
          break;
        
        case 'first':
          result[targetField] = data[0]?.[field];
          break;
        
        case 'last':
          result[targetField] = data[data.length - 1]?.[field];
          break;
      }
    }
    
    return [result];
  }
  
  /**
   * Apply a sort transformation
   */
  private applySort(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.sortBy || !Array.isArray(config.sortBy)) {
      console.warn(`Invalid sort configuration for ${transformation.name}`);
      return data;
    }
    
    if (config.sortBy.length === 0) {
      return data;
    }
    
    return [...data].sort((a, b) => {
      for (const sort of config.sortBy) {
        const { field, direction } = sort;
        
        if (!field) {
          continue;
        }
        
        const aValue = a[field];
        const bValue = b[field];
        
        if (aValue === bValue) {
          continue;
        }
        
        const directionMultiplier = direction?.toLowerCase() === 'desc' ? -1 : 1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * directionMultiplier;
        }
        
        return (aValue < bValue ? -1 : 1) * directionMultiplier;
      }
      
      return 0;
    });
  }
  
  /**
   * Apply a group transformation
   */
  private applyGroup(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.groupBy || !Array.isArray(config.groupBy) || !config.aggregations || !Array.isArray(config.aggregations)) {
      console.warn(`Invalid group configuration for ${transformation.name}`);
      return data;
    }
    
    // If no groupBy fields, return original data
    if (config.groupBy.length === 0) {
      return data;
    }
    
    // Group data
    const groups = new Map();
    
    for (const item of data) {
      // Create group key
      const groupKey = config.groupBy.map(field => item[field]).join('|');
      
      // Get or create group
      if (!groups.has(groupKey)) {
        const group: any = {};
        
        // Add group key fields
        for (const field of config.groupBy) {
          group[field] = item[field];
        }
        
        groups.set(groupKey, {
          group,
          items: []
        });
      }
      
      // Add item to group
      groups.get(groupKey).items.push(item);
    }
    
    // Apply aggregations to each group
    return Array.from(groups.values()).map(({ group, items }) => {
      const result = { ...group };
      
      // Apply aggregations
      for (const aggregation of config.aggregations) {
        const { field, operator, alias } = aggregation;
        
        if (!field || !operator) {
          continue;
        }
        
        const targetField = alias || `${operator}_${field}`;
        
        switch (operator) {
          case 'sum':
            result[targetField] = items.reduce((sum, item) => {
              const value = parseFloat(item[field]);
              return sum + (isNaN(value) ? 0 : value);
            }, 0);
            break;
          
          case 'avg':
            result[targetField] = items.reduce((sum, item) => {
              const value = parseFloat(item[field]);
              return sum + (isNaN(value) ? 0 : value);
            }, 0) / items.length;
            break;
          
          case 'min':
            result[targetField] = Math.min(...items.map(item => {
              const value = parseFloat(item[field]);
              return isNaN(value) ? Infinity : value;
            }));
            break;
          
          case 'max':
            result[targetField] = Math.max(...items.map(item => {
              const value = parseFloat(item[field]);
              return isNaN(value) ? -Infinity : value;
            }));
            break;
          
          case 'count':
            result[targetField] = items.length;
            break;
          
          case 'countDistinct':
            result[targetField] = new Set(items.map(item => item[field])).size;
            break;
          
          case 'first':
            result[targetField] = items[0]?.[field];
            break;
          
          case 'last':
            result[targetField] = items[items.length - 1]?.[field];
            break;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a validate transformation
   */
  private applyValidate(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.validations || !Array.isArray(config.validations)) {
      console.warn(`Invalid validate configuration for ${transformation.name}`);
      return data;
    }
    
    const stopOnFirstError = config.stopOnFirstError || false;
    const logErrors = config.logErrors !== false;
    
    // If no validations, return original data
    if (config.validations.length === 0) {
      return data;
    }
    
    // Initialize error counts
    const errorCounts: Record<string, number> = {};
    
    // Filter data based on validations
    const validatedData = data.filter(item => {
      // Validate item against all validations
      for (const validation of config.validations) {
        const { field, rules } = validation;
        
        if (!field || !rules || !Array.isArray(rules)) {
          continue;
        }
        
        const value = item[field];
        
        // Check all rules
        for (const rule of rules) {
          const { type, message } = rule;
          
          let isValid = true;
          
          switch (type) {
            case 'required':
              isValid = value !== undefined && value !== null && value !== '';
              break;
            
            case 'type':
              const expectedType = rule.expectedType;
              if (expectedType === 'number') {
                isValid = typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
              } else if (expectedType === 'string') {
                isValid = typeof value === 'string';
              } else if (expectedType === 'boolean') {
                isValid = typeof value === 'boolean';
              } else if (expectedType === 'array') {
                isValid = Array.isArray(value);
              } else if (expectedType === 'object') {
                isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
              }
              break;
            
            case 'min':
              const min = rule.min;
              if (typeof value === 'number') {
                isValid = value >= min;
              } else if (typeof value === 'string') {
                isValid = value.length >= min;
              } else if (Array.isArray(value)) {
                isValid = value.length >= min;
              }
              break;
            
            case 'max':
              const max = rule.max;
              if (typeof value === 'number') {
                isValid = value <= max;
              } else if (typeof value === 'string') {
                isValid = value.length <= max;
              } else if (Array.isArray(value)) {
                isValid = value.length <= max;
              }
              break;
            
            case 'pattern':
              const pattern = rule.pattern;
              isValid = typeof value === 'string' && new RegExp(pattern).test(value);
              break;
            
            case 'custom':
              const validation = rule.validation;
              if (typeof validation === 'string') {
                try {
                  const validationFn = new Function('value', 'item', validation);
                  isValid = validationFn(value, item);
                } catch (error) {
                  console.error(`Error applying custom validation for ${field}:`, error);
                  isValid = false;
                }
              }
              break;
          }
          
          if (!isValid) {
            // Count error
            errorCounts[field] = (errorCounts[field] || 0) + 1;
            
            // Log error
            if (logErrors) {
              console.warn(`Validation error for ${field}: ${message || type}`);
            }
            
            // Stop on first error if configured
            if (stopOnFirstError) {
              return false;
            }
          }
        }
      }
      
      return true;
    });
    
    // Log summary
    for (const [field, count] of Object.entries(errorCounts)) {
      console.log(`Filtered ${count} records due to validation errors in field ${field}`);
    }
    
    return validatedData;
  }
  
  /**
   * Apply a deduplicate transformation
   */
  private applyDeduplicate(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config || {};
    const fields = config.fields || [];
    const keepFirst = config.keepFirst !== false;
    
    // If no fields specified, use all fields
    const dedupeFields = fields.length > 0 ? fields : Object.keys(data[0] || {});
    
    // If no fields, return original data
    if (dedupeFields.length === 0) {
      return data;
    }
    
    // Track seen keys
    const seen = new Set<string>();
    const result: any[] = [];
    
    // Process in original order (or reverse if keeping last)
    const itemsToProcess = keepFirst ? data : [...data].reverse();
    
    for (const item of itemsToProcess) {
      // Create key from specified fields
      const key = dedupeFields.map(field => {
        const value = item[field];
        // Handle null and undefined
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        // Convert objects and arrays to JSON
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }).join('|');
      
      // Add if not seen before
      if (!seen.has(key)) {
        result.push(item);
        seen.add(key);
      }
    }
    
    // Restore original order if keeping last
    return keepFirst ? result : result.reverse();
  }
  
  /**
   * Apply a custom transformation
   */
  private applyCustom(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.function) {
      console.warn(`Invalid custom configuration for ${transformation.name}`);
      return data;
    }
    
    try {
      // Create a function from the string
      // This is a security risk in a real application
      const customFn = new Function('data', config.function);
      return customFn(data);
    } catch (error) {
      console.error(`Error applying custom function for ${transformation.name}:`, error);
      return data;
    }
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();