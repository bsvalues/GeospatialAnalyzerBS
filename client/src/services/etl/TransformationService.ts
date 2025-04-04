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
      // Column operations
      case TransformationType.RENAME_COLUMN:
        return this.applyRenameColumn(transformation, data);
      
      case TransformationType.DROP_COLUMN:
        return this.applyDropColumn(transformation, data);
      
      case TransformationType.REORDER_COLUMNS:
        return this.applyReorderColumns(transformation, data);
      
      // Type conversions
      case TransformationType.CAST_TYPE:
        return this.applyCastType(transformation, data);
      
      case TransformationType.PARSE_DATE:
        return this.applyParseDate(transformation, data);
      
      case TransformationType.PARSE_NUMBER:
        return this.applyParseNumber(transformation, data);
      
      // Value operations
      case TransformationType.REPLACE_VALUE:
        return this.applyReplaceValue(transformation, data);
      
      case TransformationType.FILL_NULL:
        return this.applyFillNull(transformation, data);
      
      case TransformationType.MAP_VALUES:
        return this.applyMapValues(transformation, data);
      
      // String operations
      case TransformationType.TO_UPPERCASE:
        return this.applyToUppercase(transformation, data);
      
      case TransformationType.TO_LOWERCASE:
        return this.applyToLowercase(transformation, data);
      
      case TransformationType.TRIM:
        return this.applyTrim(transformation, data);
      
      case TransformationType.SUBSTRING:
        return this.applySubstring(transformation, data);
      
      case TransformationType.CONCAT:
        return this.applyConcat(transformation, data);
      
      case TransformationType.SPLIT:
        return this.applySplit(transformation, data);
      
      // Numeric operations
      case TransformationType.ROUND:
        return this.applyRound(transformation, data);
      
      case TransformationType.ADD:
        return this.applyAdd(transformation, data);
      
      case TransformationType.SUBTRACT:
        return this.applySubtract(transformation, data);
      
      case TransformationType.MULTIPLY:
        return this.applyMultiply(transformation, data);
      
      case TransformationType.DIVIDE:
        return this.applyDivide(transformation, data);
      
      // Data operations
      case TransformationType.FILTER:
        return this.applyFilter(transformation, data);
      
      case TransformationType.SORT:
        return this.applySort(transformation, data);
      
      case TransformationType.GROUP_BY:
      case TransformationType.GROUP:
        return this.applyGroup(transformation, data);
      
      case TransformationType.AGGREGATE:
        return this.applyAggregate(transformation, data);
      
      case TransformationType.JOIN:
        return this.applyJoin(transformation, data);
      
      case TransformationType.UNION:
        return this.applyUnion(transformation, data);
      
      // Quality operations
      case TransformationType.REMOVE_DUPLICATES:
      case TransformationType.DEDUPLICATE:
        return this.applyDeduplicate(transformation, data);
      
      case TransformationType.VALIDATE:
        return this.applyValidate(transformation, data);
      
      // Advanced operations
      case TransformationType.CUSTOM_FUNCTION:
      case TransformationType.JAVASCRIPT:
      case TransformationType.CUSTOM:
        return this.applyCustom(transformation, data);
      
      case TransformationType.SQL:
        return this.applySQL(transformation, data);
      
      case TransformationType.FORMULA:
        return this.applyFormula(transformation, data);
      
      // Basic operations
      case TransformationType.MAP:
        return this.applyMap(transformation, data);
      
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
  
  /**
   * Apply a rename column transformation
   */
  private applyRenameColumn(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.renameMappings) {
      console.warn(`Invalid rename column configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const [oldName, newName] of Object.entries(config.renameMappings)) {
        if (oldName in result) {
          result[newName as string] = result[oldName];
          delete result[oldName];
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a drop column transformation
   */
  private applyDropColumn(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid drop column configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        delete result[column];
      }
      
      return result;
    });
  }
  
  /**
   * Apply a reorder columns transformation
   */
  private applyReorderColumns(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columnOrder || !Array.isArray(config.columnOrder)) {
      console.warn(`Invalid reorder columns configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result: any = {};
      
      // Add columns in specified order
      for (const column of config.columnOrder) {
        if (column in item) {
          result[column] = item[column];
        }
      }
      
      // Add remaining columns if specified
      if (config.includeUnspecifiedColumns !== false) {
        for (const key in item) {
          if (!(key in result)) {
            result[key] = item[key];
          }
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a cast type transformation
   */
  private applyCastType(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.typeCasts || !Array.isArray(config.typeCasts)) {
      console.warn(`Invalid cast type configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const typeCast of config.typeCasts) {
        const { column, targetType } = typeCast;
        
        if (!column || !targetType || !(column in result)) {
          continue;
        }
        
        const value = result[column];
        
        switch (targetType.toLowerCase()) {
          case 'string':
            result[column] = String(value);
            break;
          
          case 'number':
            result[column] = Number(value);
            break;
          
          case 'boolean':
            result[column] = Boolean(value);
            break;
          
          case 'date':
            result[column] = new Date(value);
            break;
          
          default:
            console.warn(`Unknown target type: ${targetType}`);
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a parse date transformation
   */
  private applyParseDate(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.column) {
      console.warn(`Invalid parse date configuration for ${transformation.name}`);
      return data;
    }
    
    const { column, format, targetColumn = column } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result) {
        try {
          result[targetColumn] = new Date(result[column]);
        } catch (error) {
          console.error(`Error parsing date for ${column}:`, error);
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a parse number transformation
   */
  private applyParseNumber(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.column) {
      console.warn(`Invalid parse number configuration for ${transformation.name}`);
      return data;
    }
    
    const { column, targetColumn = column, decimalSeparator = '.', thousandsSeparator = ',', locale } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result) {
        const value = result[column];
        
        if (typeof value === 'string') {
          try {
            // Remove thousands separators and replace decimal separator with '.'
            let normalizedValue = value;
            
            if (thousandsSeparator) {
              normalizedValue = normalizedValue.replace(new RegExp('\\' + thousandsSeparator, 'g'), '');
            }
            
            if (decimalSeparator && decimalSeparator !== '.') {
              normalizedValue = normalizedValue.replace(new RegExp('\\' + decimalSeparator, 'g'), '.');
            }
            
            result[targetColumn] = parseFloat(normalizedValue);
          } catch (error) {
            console.error(`Error parsing number for ${column}:`, error);
          }
        } else if (typeof value === 'number') {
          result[targetColumn] = value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a replace value transformation
   */
  private applyReplaceValue(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.replacements || !Array.isArray(config.replacements)) {
      console.warn(`Invalid replace value configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const replacement of config.replacements) {
        const { column, oldValue, newValue, regex } = replacement;
        
        if (!column || !(column in result)) {
          continue;
        }
        
        const value = result[column];
        
        if (regex && typeof value === 'string') {
          try {
            const regexObj = new RegExp(regex);
            result[column] = value.replace(regexObj, newValue || '');
          } catch (error) {
            console.error(`Error applying regex replacement for ${column}:`, error);
          }
        } else if (value === oldValue) {
          result[column] = newValue;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a fill null transformation
   */
  private applyFillNull(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid fill null configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        const { name, defaultValue, strategy } = typeof column === 'string' ? { name: column, defaultValue: null, strategy: 'constant' } : column;
        
        if (!name || !(name in result) || (result[name] !== null && result[name] !== undefined)) {
          continue;
        }
        
        switch (strategy) {
          case 'constant':
            result[name] = defaultValue;
            break;
          
          // For more complex strategies like 'mean', 'median', etc.,
          // we would need to calculate these values from the entire dataset,
          // which is not implemented in this example.
          
          default:
            result[name] = defaultValue;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a map values transformation
   */
  private applyMapValues(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.column || !config.mappings) {
      console.warn(`Invalid map values configuration for ${transformation.name}`);
      return data;
    }
    
    const { column, mappings, targetColumn = column, defaultValue } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result) {
        const value = result[column];
        
        if (value in mappings) {
          result[targetColumn] = mappings[value];
        } else if (defaultValue !== undefined) {
          result[targetColumn] = defaultValue;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a to uppercase transformation
   */
  private applyToUppercase(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid to uppercase configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        const { name, targetColumn = name } = typeof column === 'string' ? { name: column } : column;
        
        if (name in result && typeof result[name] === 'string') {
          result[targetColumn] = result[name].toUpperCase();
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a to lowercase transformation
   */
  private applyToLowercase(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid to lowercase configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        const { name, targetColumn = name } = typeof column === 'string' ? { name: column } : column;
        
        if (name in result && typeof result[name] === 'string') {
          result[targetColumn] = result[name].toLowerCase();
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a trim transformation
   */
  private applyTrim(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid trim configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        const { name, targetColumn = name, trimType = 'both' } = typeof column === 'string' ? { name: column } : column;
        
        if (name in result && typeof result[name] === 'string') {
          const value = result[name];
          
          switch (trimType) {
            case 'left':
              result[targetColumn] = value.trimStart();
              break;
            
            case 'right':
              result[targetColumn] = value.trimEnd();
              break;
            
            case 'both':
            default:
              result[targetColumn] = value.trim();
              break;
          }
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a substring transformation
   */
  private applySubstring(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.column) {
      console.warn(`Invalid substring configuration for ${transformation.name}`);
      return data;
    }
    
    const { column, start = 0, end, length, targetColumn = column } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        const value = result[column];
        
        if (end !== undefined) {
          result[targetColumn] = value.substring(start, end);
        } else if (length !== undefined) {
          result[targetColumn] = value.substr(start, length);
        } else {
          result[targetColumn] = value.substring(start);
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a concat transformation
   */
  private applyConcat(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns) || !config.targetColumn) {
      console.warn(`Invalid concat configuration for ${transformation.name}`);
      return data;
    }
    
    const { columns, separator = '', targetColumn } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      const values = columns.map(column => {
        if (column in item) {
          return item[column] !== null && item[column] !== undefined ? String(item[column]) : '';
        }
        
        return column; // Treat as literal if not a column name
      });
      
      result[targetColumn] = values.join(separator);
      
      return result;
    });
  }
  
  /**
   * Apply a split transformation
   */
  private applySplit(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.column || !config.separator) {
      console.warn(`Invalid split configuration for ${transformation.name}`);
      return data;
    }
    
    const { column, separator, targetColumns, limit, keepSource = true } = config;
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        const value = result[column];
        const parts = value.split(separator, limit);
        
        if (targetColumns && Array.isArray(targetColumns)) {
          for (let i = 0; i < targetColumns.length && i < parts.length; i++) {
            result[targetColumns[i]] = parts[i];
          }
        } else if (targetColumns && typeof targetColumns === 'string') {
          result[targetColumns] = parts;
        }
        
        if (!keepSource) {
          delete result[column];
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a round transformation
   */
  private applyRound(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.columns || !Array.isArray(config.columns)) {
      console.warn(`Invalid round configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of config.columns) {
        const { name, precision = 0, targetColumn = name, method = 'round' } = typeof column === 'string' ? { name: column } : column;
        
        if (name in result && typeof result[name] === 'number') {
          const value = result[name];
          
          if (method === 'ceil') {
            if (precision === 0) {
              result[targetColumn] = Math.ceil(value);
            } else {
              const factor = Math.pow(10, precision);
              result[targetColumn] = Math.ceil(value * factor) / factor;
            }
          } else if (method === 'floor') {
            if (precision === 0) {
              result[targetColumn] = Math.floor(value);
            } else {
              const factor = Math.pow(10, precision);
              result[targetColumn] = Math.floor(value * factor) / factor;
            }
          } else {
            // Default to 'round'
            if (precision === 0) {
              result[targetColumn] = Math.round(value);
            } else {
              const factor = Math.pow(10, precision);
              result[targetColumn] = Math.round(value * factor) / factor;
            }
          }
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply an add transformation
   */
  private applyAdd(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || (!config.columns && !config.value) || !config.targetColumn) {
      console.warn(`Invalid add configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (config.columns && Array.isArray(config.columns)) {
        let sum = 0;
        
        for (const column of config.columns) {
          if (column in item && typeof item[column] === 'number') {
            sum += item[column];
          }
        }
        
        if (config.value && typeof config.value === 'number') {
          sum += config.value;
        }
        
        result[config.targetColumn] = sum;
      } else if (config.column && config.value !== undefined) {
        const { column, value, targetColumn = column } = config;
        
        if (column in item && typeof item[column] === 'number') {
          result[targetColumn] = item[column] + value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a subtract transformation
   */
  private applySubtract(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || (!config.columns && !config.value && !config.minuend && !config.subtrahend) || !config.targetColumn) {
      console.warn(`Invalid subtract configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (config.minuend && config.subtrahend) {
        // Explicit minuend and subtrahend
        const minuendValue = config.minuend in item ? item[config.minuend] : config.minuend;
        const subtrahendValue = config.subtrahend in item ? item[config.subtrahend] : config.subtrahend;
        
        if (typeof minuendValue === 'number' && typeof subtrahendValue === 'number') {
          result[config.targetColumn] = minuendValue - subtrahendValue;
        }
      } else if (config.columns && Array.isArray(config.columns) && config.columns.length >= 2) {
        // First column minus all others
        const first = item[config.columns[0]];
        
        if (typeof first === 'number') {
          let difference = first;
          
          for (let i = 1; i < config.columns.length; i++) {
            const column = config.columns[i];
            
            if (column in item && typeof item[column] === 'number') {
              difference -= item[column];
            }
          }
          
          result[config.targetColumn] = difference;
        }
      } else if (config.column && config.value !== undefined) {
        // Single column minus value
        const { column, value, targetColumn = column } = config;
        
        if (column in item && typeof item[column] === 'number') {
          result[targetColumn] = item[column] - value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a multiply transformation
   */
  private applyMultiply(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || (!config.columns && !config.value) || !config.targetColumn) {
      console.warn(`Invalid multiply configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (config.columns && Array.isArray(config.columns)) {
        let product = 1;
        
        for (const column of config.columns) {
          if (column in item && typeof item[column] === 'number') {
            product *= item[column];
          }
        }
        
        if (config.value && typeof config.value === 'number') {
          product *= config.value;
        }
        
        result[config.targetColumn] = product;
      } else if (config.column && config.value !== undefined) {
        const { column, value, targetColumn = column } = config;
        
        if (column in item && typeof item[column] === 'number') {
          result[targetColumn] = item[column] * value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a divide transformation
   */
  private applyDivide(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || (!config.numerator && !config.denominator && !config.columns) || !config.targetColumn) {
      console.warn(`Invalid divide configuration for ${transformation.name}`);
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (config.numerator && config.denominator) {
        // Explicit numerator and denominator
        const numeratorValue = config.numerator in item ? item[config.numerator] : parseFloat(config.numerator);
        const denominatorValue = config.denominator in item ? item[config.denominator] : parseFloat(config.denominator);
        
        if (typeof numeratorValue === 'number' && typeof denominatorValue === 'number' && denominatorValue !== 0) {
          result[config.targetColumn] = numeratorValue / denominatorValue;
        }
      } else if (config.columns && Array.isArray(config.columns) && config.columns.length >= 2) {
        // First column divided by all others
        const first = item[config.columns[0]];
        
        if (typeof first === 'number') {
          let quotient = first;
          
          for (let i = 1; i < config.columns.length; i++) {
            const column = config.columns[i];
            
            if (column in item && typeof item[column] === 'number' && item[column] !== 0) {
              quotient /= item[column];
            }
          }
          
          result[config.targetColumn] = quotient;
        }
      } else if (config.column && config.value !== undefined) {
        // Single column divided by value
        const { column, value, targetColumn = column } = config;
        
        if (column in item && typeof item[column] === 'number' && value !== 0) {
          result[targetColumn] = item[column] / value;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a join transformation
   */
  private applyJoin(transformation: TransformationRule, data: any[]): any[] {
    console.warn('Join transformation requires a second data source and is not fully implemented');
    return data;
  }
  
  /**
   * Apply a union transformation
   */
  private applyUnion(transformation: TransformationRule, data: any[]): any[] {
    console.warn('Union transformation requires a second data source and is not fully implemented');
    return data;
  }
  
  /**
   * Apply an SQL transformation
   */
  private applySQL(transformation: TransformationRule, data: any[]): any[] {
    console.warn('SQL transformation not fully implemented');
    return data;
  }
  
  /**
   * Apply a formula transformation
   */
  private applyFormula(transformation: TransformationRule, data: any[]): any[] {
    const config = transformation.config;
    
    if (!config || !config.formula || !config.targetColumn) {
      console.warn(`Invalid formula configuration for ${transformation.name}`);
      return data;
    }
    
    const { formula, targetColumn } = config;
    
    try {
      return data.map(item => {
        const result = { ...item };
        
        // Replace column references with values from item
        let evaluatedFormula = formula;
        
        // Replace all occurrences of [columnName] with the actual value
        const columnRefs = formula.match(/\[(.*?)\]/g) || [];
        
        for (const ref of columnRefs) {
          const columnName = ref.slice(1, -1);
          
          if (columnName in item) {
            const value = typeof item[columnName] === 'string'
              ? `"${item[columnName]}"`
              : item[columnName];
            
            evaluatedFormula = evaluatedFormula.replace(ref, String(value));
          }
        }
        
        // Evaluate the formula (security risk)
        const evaluatedValue = Function(`"use strict"; return (${evaluatedFormula})`)();
        result[targetColumn] = evaluatedValue;
        
        return result;
      });
    } catch (error) {
      console.error(`Error evaluating formula for ${transformation.name}:`, error);
      return data;
    }
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();