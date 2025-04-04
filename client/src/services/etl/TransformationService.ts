import { 
  TransformationRule, 
  TransformationType, 
  FilterCondition, 
  FilterOperator,
  FilterTransformConfig,
  MapTransformConfig,
  AggregateTransformConfig,
  JoinTransformConfig,
  GroupTransformConfig,
  SortTransformConfig,
  ValidateTransformConfig,
  EnrichTransformConfig,
  ValidationRule,
  AggregateFunction
} from './ETLTypes';

/**
 * Error message type
 */
export interface ErrorMessage {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Transformation result interface
 */
export interface TransformationResult {
  data: any[];
  recordsProcessed: number;
  recordsOutput: number;
  errors: ErrorMessage[];
  executionTime: number;
  success: boolean;
}

/**
 * TransformationService class
 */
class TransformationService {
  constructor() {
    console.log('TransformationService initialized');
  }
  
  /**
   * Apply transformation rules to a dataset
   */
  async applyTransformations(
    data: any[],
    rules: TransformationRule[],
    context: Record<string, any> = {}
  ): Promise<TransformationResult> {
    console.log(`Applying ${rules.length} transformation rules to ${data.length} records`);
    
    const startTime = new Date();
    const errors: ErrorMessage[] = [];
    
    let transformedData = [...data];
    
    try {
      // Sort rules by order
      const sortedRules = [...rules].sort((a, b) => 
        (a.order ?? 999) - (b.order ?? 999)
      );
      
      for (const rule of sortedRules) {
        if (!rule.enabled) {
          console.log(`Skipping disabled rule: ${rule.name}`);
          continue;
        }
        
        console.log(`Applying rule: ${rule.name} (${rule.type})`);
        
        try {
          const ruleStartTime = new Date();
          
          // Apply the transformation
          const result = await this.applyTransformation(transformedData, rule, context);
          transformedData = result.data;
          
          // Add any errors from this transformation
          errors.push(...result.errors);
          
          const ruleEndTime = new Date();
          const ruleTime = ruleEndTime.getTime() - ruleStartTime.getTime();
          
          console.log(`Rule ${rule.name} completed in ${ruleTime}ms`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error in rule ${rule.name}:`, errorMessage);
          
          errors.push({
            message: `Rule '${rule.name}' failed: ${errorMessage}`,
            code: 'RULE_FAILED'
          });
        }
      }
      
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      console.log(`Transformation completed in ${executionTime}ms`);
      console.log(`Input records: ${data.length}, Output records: ${transformedData.length}`);
      
      return {
        data: transformedData,
        recordsProcessed: data.length,
        recordsOutput: transformedData.length,
        errors,
        executionTime,
        success: true
      };
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Transformation failed:', errorMessage);
      
      errors.push({
        message: `Transformation failed: ${errorMessage}`,
        code: 'TRANSFORMATION_FAILED'
      });
      
      return {
        data: [],
        recordsProcessed: data.length,
        recordsOutput: 0,
        errors,
        executionTime,
        success: false
      };
    }
  }
  
  /**
   * Apply a single transformation rule
   */
  private async applyTransformation(
    data: any[],
    rule: TransformationRule,
    context: Record<string, any> = {}
  ): Promise<{
    data: any[];
    errors: ErrorMessage[];
  }> {
    const errors: ErrorMessage[] = [];
    
    try {
      switch (rule.type) {
        case TransformationType.FILTER:
          return this.applyFilterTransformation(data, rule, errors);
          
        case TransformationType.MAP:
          return this.applyMapTransformation(data, rule, errors);
          
        case TransformationType.AGGREGATE:
          return this.applyAggregateTransformation(data, rule, errors);
          
        case TransformationType.JOIN:
          return this.applyJoinTransformation(data, rule, context, errors);
          
        case TransformationType.GROUP:
          return this.applyGroupTransformation(data, rule, errors);
          
        case TransformationType.SORT:
          return this.applySortTransformation(data, rule, errors);
          
        case TransformationType.VALIDATE:
          return this.applyValidateTransformation(data, rule, errors);
          
        case TransformationType.ENRICH:
          return this.applyEnrichTransformation(data, rule, context, errors);
          
        default:
          throw new Error(`Unsupported transformation type: ${rule.type}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        message: errorMessage,
        code: 'TRANSFORMATION_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply filter transformation
   */
  private applyFilterTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as FilterTransformConfig;
    
    try {
      // Get conditions and operator
      const conditions = config.conditions || [];
      const logicalOperator = config.logicalOperator || 'AND';
      const keepMatching = config.keepMatching !== false;
      
      if (conditions.length === 0) {
        return { data, errors };
      }
      
      // Filter the data based on conditions
      const filteredData = data.filter(record => {
        // Evaluate each condition
        const results = conditions.map(condition => 
          this.evaluateFilterCondition(record, condition)
        );
        
        // Combine results based on logical operator
        let matches: boolean;
        
        if (logicalOperator === 'AND') {
          matches = results.every(result => result);
        } else {
          matches = results.some(result => result);
        }
        
        // Keep or exclude based on keepMatching
        return keepMatching ? matches : !matches;
      });
      
      return {
        data: filteredData,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Filter transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'FILTER_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Evaluate a single filter condition
   */
  private evaluateFilterCondition(record: any, condition: FilterCondition): boolean {
    const { field, operator, value, caseSensitive, negate } = condition;
    
    // Get the field value from the record
    const fieldValue = field.includes('.') 
      ? this.getNestedValue(record, field) 
      : record[field];
    
    // If field doesn't exist and we're not checking for null, return false
    if (fieldValue === undefined && 
        operator !== FilterOperator.IS_NULL && 
        operator !== FilterOperator.IS_NOT_NULL) {
      return negate ? true : false;
    }
    
    let result = false;
    
    // Handle string comparisons for case sensitivity
    const compareStringValues = (a: string, b: string): boolean => {
      if (caseSensitive) {
        return a === b;
      } else {
        return a.toLowerCase() === b.toLowerCase();
      }
    };
    
    // Evaluate based on operator
    switch (operator) {
      case FilterOperator.EQUALS:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = compareStringValues(fieldValue, value);
        } else {
          result = fieldValue === value;
        }
        break;
        
      case FilterOperator.NOT_EQUALS:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = !compareStringValues(fieldValue, value);
        } else {
          result = fieldValue !== value;
        }
        break;
        
      case FilterOperator.GREATER_THAN:
        result = fieldValue > value;
        break;
        
      case FilterOperator.LESS_THAN:
        result = fieldValue < value;
        break;
        
      case FilterOperator.GREATER_THAN_OR_EQUALS:
        result = fieldValue >= value;
        break;
        
      case FilterOperator.LESS_THAN_OR_EQUALS:
        result = fieldValue <= value;
        break;
        
      case FilterOperator.CONTAINS:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = caseSensitive 
            ? fieldValue.includes(value) 
            : fieldValue.toLowerCase().includes(value.toLowerCase());
        } else if (Array.isArray(fieldValue)) {
          result = fieldValue.includes(value);
        } else {
          result = false;
        }
        break;
        
      case FilterOperator.NOT_CONTAINS:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = caseSensitive 
            ? !fieldValue.includes(value) 
            : !fieldValue.toLowerCase().includes(value.toLowerCase());
        } else if (Array.isArray(fieldValue)) {
          result = !fieldValue.includes(value);
        } else {
          result = true;
        }
        break;
        
      case FilterOperator.STARTS_WITH:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = caseSensitive 
            ? fieldValue.startsWith(value) 
            : fieldValue.toLowerCase().startsWith(value.toLowerCase());
        } else {
          result = false;
        }
        break;
        
      case FilterOperator.ENDS_WITH:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          result = caseSensitive 
            ? fieldValue.endsWith(value) 
            : fieldValue.toLowerCase().endsWith(value.toLowerCase());
        } else {
          result = false;
        }
        break;
        
      case FilterOperator.IS_NULL:
        result = fieldValue === null || fieldValue === undefined;
        break;
        
      case FilterOperator.IS_NOT_NULL:
        result = fieldValue !== null && fieldValue !== undefined;
        break;
        
      case FilterOperator.IN:
        if (Array.isArray(value)) {
          if (typeof fieldValue === 'string' && !caseSensitive) {
            result = value.some(v => 
              typeof v === 'string' && compareStringValues(fieldValue, v)
            );
          } else {
            result = value.includes(fieldValue);
          }
        } else {
          result = false;
        }
        break;
        
      case FilterOperator.NOT_IN:
        if (Array.isArray(value)) {
          if (typeof fieldValue === 'string' && !caseSensitive) {
            result = !value.some(v => 
              typeof v === 'string' && compareStringValues(fieldValue, v)
            );
          } else {
            result = !value.includes(fieldValue);
          }
        } else {
          result = true;
        }
        break;
        
      case FilterOperator.BETWEEN:
        if (Array.isArray(value) && value.length === 2) {
          result = fieldValue >= value[0] && fieldValue <= value[1];
        } else {
          result = false;
        }
        break;
        
      case FilterOperator.NOT_BETWEEN:
        if (Array.isArray(value) && value.length === 2) {
          result = fieldValue < value[0] || fieldValue > value[1];
        } else {
          result = true;
        }
        break;
        
      case FilterOperator.REGEX:
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          try {
            const flags = caseSensitive ? '' : 'i';
            const regex = new RegExp(value, flags);
            result = regex.test(fieldValue);
          } catch (e) {
            result = false;
          }
        } else {
          result = false;
        }
        break;
        
      default:
        result = false;
    }
    
    // Apply negation if needed
    return negate ? !result : result;
  }
  
  /**
   * Apply map transformation
   */
  private applyMapTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as MapTransformConfig;
    
    try {
      const mappings = config.mappings || [];
      const includeOriginal = config.includeOriginal || false;
      const skipMissingFields = config.skipMissingFields !== false;
      
      if (mappings.length === 0) {
        return { data, errors };
      }
      
      const mappedData = data.map(record => {
        const newRecord = includeOriginal ? { ...record } : {};
        
        // Apply each mapping
        for (const mapping of mappings) {
          const { source, target, transform, defaultValue } = mapping;
          
          // Get source value
          let sourceValue = source.includes('.')
            ? this.getNestedValue(record, source)
            : record[source];
          
          // Skip if source field is missing and skipMissingFields is true
          if (sourceValue === undefined) {
            if (skipMissingFields) {
              // Use default value if provided
              if (defaultValue !== undefined) {
                newRecord[target] = defaultValue;
              }
              continue;
            } else {
              // Use default or null if not skipping
              sourceValue = defaultValue !== undefined ? defaultValue : null;
            }
          }
          
          // Apply transformation if provided
          let transformedValue = sourceValue;
          
          if (transform) {
            try {
              // Handle different transformation types
              if (transform.startsWith('function')) {
                // Function-based transform (limited implementation for security)
                // A real implementation would use a safer approach
                transformedValue = this.executeSimpleTransform(transform, sourceValue);
              } else if (transform.includes('{{') && transform.includes('}}')) {
                // Template-based transform
                transformedValue = this.applyTemplate(transform, record);
              } else {
                // Predefined transforms
                switch (transform) {
                  case 'LOWERCASE':
                    transformedValue = typeof sourceValue === 'string' 
                      ? sourceValue.toLowerCase() 
                      : sourceValue;
                    break;
                    
                  case 'UPPERCASE':
                    transformedValue = typeof sourceValue === 'string' 
                      ? sourceValue.toUpperCase() 
                      : sourceValue;
                    break;
                    
                  case 'TRIM':
                    transformedValue = typeof sourceValue === 'string' 
                      ? sourceValue.trim() 
                      : sourceValue;
                    break;
                    
                  case 'TO_NUMBER':
                    transformedValue = typeof sourceValue === 'string' 
                      ? Number(sourceValue) 
                      : sourceValue;
                    break;
                    
                  case 'TO_STRING':
                    transformedValue = sourceValue !== null && sourceValue !== undefined 
                      ? String(sourceValue) 
                      : sourceValue;
                    break;
                    
                  case 'TO_BOOLEAN':
                    if (typeof sourceValue === 'string') {
                      const lower = sourceValue.toLowerCase();
                      transformedValue = lower === 'true' || lower === 'yes' || lower === '1';
                    } else {
                      transformedValue = Boolean(sourceValue);
                    }
                    break;
                    
                  default:
                    // Unknown transform, keep original value
                    break;
                }
              }
            } catch (error) {
              errors.push({
                field: target,
                message: `Transform error on field "${source}": ${error instanceof Error ? error.message : String(error)}`,
                code: 'TRANSFORM_ERROR'
              });
              
              // Use default value on error if provided
              if (defaultValue !== undefined) {
                transformedValue = defaultValue;
              }
            }
          }
          
          // Set the target field
          if (target.includes('.')) {
            this.setNestedValue(newRecord, target, transformedValue);
          } else {
            newRecord[target] = transformedValue;
          }
        }
        
        return newRecord;
      });
      
      return {
        data: mappedData,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Map transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'MAP_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply aggregate transformation
   */
  private applyAggregateTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as AggregateTransformConfig;
    
    try {
      const aggregates = config.aggregates || [];
      
      if (aggregates.length === 0 || data.length === 0) {
        return { data, errors };
      }
      
      // Calculate aggregates
      const result: Record<string, any> = {};
      
      for (const agg of aggregates) {
        const { field, function: aggFunction, alias } = agg;
        
        // Extract field values
        const fieldValues = data.map(item => 
          field.includes('.') ? this.getNestedValue(item, field) : item[field]
        ).filter(value => value !== undefined && value !== null);
        
        // Skip if no valid values
        if (fieldValues.length === 0) {
          result[alias] = null;
          continue;
        }
        
        // Apply aggregate function
        switch (aggFunction) {
          case AggregateFunction.SUM: {
            const sum = fieldValues.reduce(
              (sum, value) => sum + (Number(value) || 0), 
              0
            );
            result[alias] = sum;
            break;
          }
            
          case AggregateFunction.AVG: {
            const sum = fieldValues.reduce(
              (sum, value) => sum + (Number(value) || 0), 
              0
            );
            result[alias] = fieldValues.length > 0 ? sum / fieldValues.length : null;
            break;
          }
            
          case AggregateFunction.MIN: {
            const min = Math.min(...fieldValues.map(v => Number(v) || 0));
            result[alias] = min;
            break;
          }
            
          case AggregateFunction.MAX: {
            const max = Math.max(...fieldValues.map(v => Number(v) || 0));
            result[alias] = max;
            break;
          }
            
          case AggregateFunction.COUNT: {
            result[alias] = fieldValues.length;
            break;
          }
            
          case AggregateFunction.COUNT_DISTINCT: {
            const uniqueValues = new Set(fieldValues);
            result[alias] = uniqueValues.size;
            break;
          }
            
          case AggregateFunction.FIRST: {
            result[alias] = fieldValues[0];
            break;
          }
            
          case AggregateFunction.LAST: {
            result[alias] = fieldValues[fieldValues.length - 1];
            break;
          }
            
          case AggregateFunction.CONCAT: {
            result[alias] = fieldValues.join(',');
            break;
          }
            
          default:
            result[alias] = null;
            errors.push({
              field: alias,
              message: `Unknown aggregate function: ${aggFunction}`,
              code: 'AGGREGATE_ERROR'
            });
        }
      }
      
      return {
        data: [result],
        errors
      };
    } catch (error) {
      errors.push({
        message: `Aggregate transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'AGGREGATE_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply group transformation
   */
  private applyGroupTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as GroupTransformConfig;
    
    try {
      const grouping = config.grouping;
      
      if (!grouping || !grouping.groupBy || !grouping.aggregates || data.length === 0) {
        return { data, errors };
      }
      
      const { groupBy, aggregates } = grouping;
      
      // Group the data
      const groups = new Map<string, any[]>();
      
      for (const item of data) {
        // Create a group key based on the groupBy fields
        const groupValues = groupBy.map(field => {
          const value = field.includes('.')
            ? this.getNestedValue(item, field)
            : item[field];
          return value !== undefined && value !== null ? value : 'null';
        });
        
        const groupKey = JSON.stringify(groupValues);
        
        // Add to the appropriate group
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        
        groups.get(groupKey)!.push(item);
      }
      
      // Calculate aggregates for each group
      const results: any[] = [];
      
      for (const [groupKey, items] of groups) {
        const groupValues = JSON.parse(groupKey);
        const result: Record<string, any> = {};
        
        // Add group by values to the result
        groupBy.forEach((field, index) => {
          result[field] = groupValues[index];
        });
        
        // Calculate aggregates
        for (const agg of aggregates) {
          const { field, function: aggFunction, alias } = agg;
          
          // Extract field values
          const fieldValues = items.map(item => 
            field.includes('.') ? this.getNestedValue(item, field) : item[field]
          ).filter(value => value !== undefined && value !== null);
          
          // Skip if no valid values
          if (fieldValues.length === 0) {
            result[alias] = null;
            continue;
          }
          
          // Apply aggregate function
          switch (aggFunction) {
            case AggregateFunction.SUM: {
              const sum = fieldValues.reduce(
                (sum, value) => sum + (Number(value) || 0), 
                0
              );
              result[alias] = sum;
              break;
            }
              
            case AggregateFunction.AVG: {
              const sum = fieldValues.reduce(
                (sum, value) => sum + (Number(value) || 0), 
                0
              );
              result[alias] = fieldValues.length > 0 ? sum / fieldValues.length : null;
              break;
            }
              
            case AggregateFunction.MIN: {
              const min = Math.min(...fieldValues.map(v => Number(v) || 0));
              result[alias] = min;
              break;
            }
              
            case AggregateFunction.MAX: {
              const max = Math.max(...fieldValues.map(v => Number(v) || 0));
              result[alias] = max;
              break;
            }
              
            case AggregateFunction.COUNT: {
              result[alias] = fieldValues.length;
              break;
            }
              
            case AggregateFunction.COUNT_DISTINCT: {
              const uniqueValues = new Set(fieldValues);
              result[alias] = uniqueValues.size;
              break;
            }
              
            case AggregateFunction.FIRST: {
              result[alias] = fieldValues[0];
              break;
            }
              
            case AggregateFunction.LAST: {
              result[alias] = fieldValues[fieldValues.length - 1];
              break;
            }
              
            case AggregateFunction.CONCAT: {
              result[alias] = fieldValues.join(',');
              break;
            }
              
            default:
              result[alias] = null;
              errors.push({
                field: alias,
                message: `Unknown aggregate function: ${aggFunction}`,
                code: 'AGGREGATE_ERROR'
              });
          }
        }
        
        results.push(result);
      }
      
      return {
        data: results,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Group transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'GROUP_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply join transformation
   */
  private applyJoinTransformation(
    data: any[],
    rule: TransformationRule,
    context: Record<string, any>,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as JoinTransformConfig;
    
    try {
      const joinWith = config.joinWith;
      
      if (!joinWith || !joinWith.rightSource || !joinWith.conditions || joinWith.conditions.length === 0) {
        return { data, errors };
      }
      
      // Get the right source data from context
      const rightData = context[joinWith.rightSource];
      
      if (!rightData || !Array.isArray(rightData)) {
        errors.push({
          message: `Right source data not found: ${joinWith.rightSource}`,
          code: 'JOIN_ERROR'
        });
        return { data, errors };
      }
      
      // Perform the join
      let joinResult: any[] = [];
      const joinType = joinWith.type || 'INNER';
      
      switch (joinType) {
        case 'INNER':
          joinResult = this.performInnerJoin(data, rightData, joinWith.conditions);
          break;
          
        case 'LEFT':
          joinResult = this.performLeftJoin(data, rightData, joinWith.conditions);
          break;
          
        case 'RIGHT':
          joinResult = this.performRightJoin(data, rightData, joinWith.conditions);
          break;
          
        case 'FULL':
          joinResult = this.performFullJoin(data, rightData, joinWith.conditions);
          break;
          
        default:
          errors.push({
            message: `Unsupported join type: ${joinType}`,
            code: 'JOIN_ERROR'
          });
          return { data, errors };
      }
      
      // Apply field inclusion logic if specified
      if (joinWith.includeFields && joinWith.includeFields.length > 0) {
        joinResult = this.applyFieldInclusion(joinResult, joinWith.includeFields);
      }
      
      return {
        data: joinResult,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Join transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'JOIN_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply sort transformation
   */
  private applySortTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as SortTransformConfig;
    
    try {
      const sortFields = config.sortFields || [];
      
      if (sortFields.length === 0) {
        return { data, errors };
      }
      
      // Create a copy of the data to sort
      const sortedData = [...data];
      
      // Sort the data
      sortedData.sort((a, b) => {
        for (const sortConfig of sortFields) {
          const { field, direction, nullsPosition } = sortConfig;
          
          // Get field values
          const valueA = field.includes('.')
            ? this.getNestedValue(a, field)
            : a[field];
          const valueB = field.includes('.')
            ? this.getNestedValue(b, field)
            : b[field];
          
          // Handle nulls based on nullsPosition
          if (valueA === undefined || valueA === null) {
            if (valueB === undefined || valueB === null) {
              continue; // Both null, check next field
            }
            
            // A is null, B is not
            if (nullsPosition === 'FIRST') {
              return -1; // Nulls first
            } else {
              return 1; // Nulls last
            }
          } else if (valueB === undefined || valueB === null) {
            // A is not null, B is null
            if (nullsPosition === 'FIRST') {
              return 1; // Nulls first
            } else {
              return -1; // Nulls last
            }
          }
          
          // Compare non-null values
          let comparison: number;
          
          if (typeof valueA === 'string' && typeof valueB === 'string') {
            comparison = valueA.localeCompare(valueB);
          } else {
            comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
          }
          
          // Apply direction
          if (direction === 'DESC') {
            comparison = -comparison;
          }
          
          // If not equal, return the comparison
          if (comparison !== 0) {
            return comparison;
          }
        }
        
        // All sort fields were equal
        return 0;
      });
      
      return {
        data: sortedData,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Sort transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'SORT_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply validate transformation
   */
  private applyValidateTransformation(
    data: any[],
    rule: TransformationRule,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as ValidateTransformConfig;
    
    try {
      const validations = config.validations || [];
      const stopOnFirstError = config.stopOnFirstError || false;
      
      if (validations.length === 0) {
        return { data, errors };
      }
      
      // Clone data to avoid modifying the original
      const validatedData = [...data];
      let validationErrors: ErrorMessage[] = [];
      
      // Check each record against validation rules
      validatedData.forEach((record, recordIndex) => {
        // Apply each validation to the record
        for (const validation of validations) {
          const { field, rules } = validation;
          
          // Get the field value
          const value = field.includes('.')
            ? this.getNestedValue(record, field)
            : record[field];
          
          // Apply each rule
          for (const rule of rules) {
            const isValid = this.validateValue(value, rule);
            
            if (!isValid) {
              validationErrors.push({
                field,
                message: rule.message || `Validation failed for field '${field}'`,
                code: `VALIDATION_${rule.type}`
              });
              
              if (stopOnFirstError) {
                break;
              }
            }
          }
          
          // Stop validating this record if required
          if (stopOnFirstError && validationErrors.length > 0) {
            break;
          }
        }
      });
      
      // Combine with any existing errors
      errors.push(...validationErrors);
      
      return {
        data: validatedData,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Validation transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'VALIDATION_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Apply enrich transformation
   */
  private applyEnrichTransformation(
    data: any[],
    rule: TransformationRule,
    context: Record<string, any>,
    errors: ErrorMessage[]
  ): {
    data: any[];
    errors: ErrorMessage[];
  } {
    const config = rule.config as EnrichTransformConfig;
    
    try {
      const enrichments = config.enrichments || [];
      
      if (enrichments.length === 0) {
        return { data, errors };
      }
      
      // Clone data to avoid modifying the original
      const enrichedData = [...data];
      
      // Process each enrichment
      for (const enrichment of enrichments) {
        const { sourceField, targetField, enrichmentSource, fallbackValue } = enrichment;
        
        // Get the enrichment data from the context
        let lookupData: any[] | Record<string, any> | undefined;
        
        if (enrichmentSource.type === 'MEMORY') {
          lookupData = context[enrichmentSource.sourceId] || context[String(enrichmentSource.sourceId)];
        } else {
          // For real implementation, you would fetch data from various sources
          lookupData = context[`${enrichmentSource.type}_${enrichmentSource.sourceId}`];
        }
        
        if (!lookupData) {
          errors.push({
            message: `Enrichment source data not found: ${enrichmentSource.type}_${enrichmentSource.sourceId}`,
            code: 'ENRICH_ERROR'
          });
          continue;
        }
        
        // Convert lookup data to a map for efficient lookups
        const lookupMap = this.createLookupMap(
          Array.isArray(lookupData) ? lookupData : [lookupData],
          enrichmentSource.keyField,
          enrichmentSource.valueFields
        );
        
        // Enrich each record
        for (const record of enrichedData) {
          // Get the source field value
          const sourceValue = sourceField.includes('.')
            ? this.getNestedValue(record, sourceField)
            : record[sourceField];
          
          if (sourceValue === undefined || sourceValue === null) {
            // Use fallback value if source is missing
            if (fallbackValue !== undefined) {
              if (targetField.includes('.')) {
                this.setNestedValue(record, targetField, fallbackValue);
              } else {
                record[targetField] = fallbackValue;
              }
            }
            continue;
          }
          
          // Lookup enrichment data
          const enrichmentData = lookupMap.get(String(sourceValue));
          
          if (!enrichmentData) {
            // Use fallback value if lookup fails
            if (fallbackValue !== undefined) {
              if (targetField.includes('.')) {
                this.setNestedValue(record, targetField, fallbackValue);
              } else {
                record[targetField] = fallbackValue;
              }
            }
            continue;
          }
          
          // Apply the enrichment
          if (targetField.includes('.')) {
            this.setNestedValue(
              record, 
              targetField, 
              enrichmentSource.valueFields.length === 1 ? enrichmentData[0] : enrichmentData
            );
          } else {
            record[targetField] = enrichmentSource.valueFields.length === 1 ? enrichmentData[0] : enrichmentData;
          }
        }
      }
      
      return {
        data: enrichedData,
        errors
      };
    } catch (error) {
      errors.push({
        message: `Enrichment transformation error: ${error instanceof Error ? error.message : String(error)}`,
        code: 'ENRICH_ERROR'
      });
      
      return { data, errors };
    }
  }
  
  /**
   * Perform an inner join between two datasets
   */
  private performInnerJoin(
    leftData: any[],
    rightData: any[],
    conditions: { leftField: string; rightField: string }[]
  ): any[] {
    const result: any[] = [];
    
    for (const leftRecord of leftData) {
      for (const rightRecord of rightData) {
        // Check if all join conditions match
        const matches = conditions.every(condition => {
          const leftValue = condition.leftField.includes('.')
            ? this.getNestedValue(leftRecord, condition.leftField)
            : leftRecord[condition.leftField];
            
          const rightValue = condition.rightField.includes('.')
            ? this.getNestedValue(rightRecord, condition.rightField)
            : rightRecord[condition.rightField];
          
          return leftValue === rightValue;
        });
        
        if (matches) {
          // Merge the records
          result.push({
            ...leftRecord,
            ...rightRecord
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * Perform a left join between two datasets
   */
  private performLeftJoin(
    leftData: any[],
    rightData: any[],
    conditions: { leftField: string; rightField: string }[]
  ): any[] {
    const result: any[] = [];
    
    for (const leftRecord of leftData) {
      let matched = false;
      
      for (const rightRecord of rightData) {
        // Check if all join conditions match
        const matches = conditions.every(condition => {
          const leftValue = condition.leftField.includes('.')
            ? this.getNestedValue(leftRecord, condition.leftField)
            : leftRecord[condition.leftField];
            
          const rightValue = condition.rightField.includes('.')
            ? this.getNestedValue(rightRecord, condition.rightField)
            : rightRecord[condition.rightField];
          
          return leftValue === rightValue;
        });
        
        if (matches) {
          // Merge the records
          result.push({
            ...leftRecord,
            ...rightRecord
          });
          matched = true;
        }
      }
      
      // If no match, include left record with nulls for right fields
      if (!matched) {
        result.push({ ...leftRecord });
      }
    }
    
    return result;
  }
  
  /**
   * Perform a right join between two datasets
   */
  private performRightJoin(
    leftData: any[],
    rightData: any[],
    conditions: { leftField: string; rightField: string }[]
  ): any[] {
    const result: any[] = [];
    
    for (const rightRecord of rightData) {
      let matched = false;
      
      for (const leftRecord of leftData) {
        // Check if all join conditions match
        const matches = conditions.every(condition => {
          const leftValue = condition.leftField.includes('.')
            ? this.getNestedValue(leftRecord, condition.leftField)
            : leftRecord[condition.leftField];
            
          const rightValue = condition.rightField.includes('.')
            ? this.getNestedValue(rightRecord, condition.rightField)
            : rightRecord[condition.rightField];
          
          return leftValue === rightValue;
        });
        
        if (matches) {
          // Merge the records
          result.push({
            ...leftRecord,
            ...rightRecord
          });
          matched = true;
        }
      }
      
      // If no match, include right record with nulls for left fields
      if (!matched) {
        result.push({ ...rightRecord });
      }
    }
    
    return result;
  }
  
  /**
   * Perform a full join between two datasets
   */
  private performFullJoin(
    leftData: any[],
    rightData: any[],
    conditions: { leftField: string; rightField: string }[]
  ): any[] {
    // Start with a left join
    const leftJoin = this.performLeftJoin(leftData, rightData, conditions);
    
    // Add right records that don't match any left record
    const rightJoinOnly = this.performRightJoin(leftData, rightData, conditions).filter(rightRecord => {
      // Check if this right record matches any record in the left join
      return !leftJoin.some(leftJoinRecord => {
        return conditions.every(condition => {
          const rightValue = condition.rightField.includes('.')
            ? this.getNestedValue(rightRecord, condition.rightField)
            : rightRecord[condition.rightField];
            
          const leftJoinValue = condition.rightField.includes('.')
            ? this.getNestedValue(leftJoinRecord, condition.rightField)
            : leftJoinRecord[condition.rightField];
          
          return rightValue === leftJoinValue;
        });
      });
    });
    
    // Combine the results
    return [...leftJoin, ...rightJoinOnly];
  }
  
  /**
   * Apply field inclusion logic to joined data
   */
  private applyFieldInclusion(
    data: any[],
    includeFields: { source: string; fields: string[] }[]
  ): any[] {
    if (data.length === 0 || !includeFields || includeFields.length === 0) {
      return data;
    }
    
    // Map of fields to include by source
    const fieldMap = new Map<string, Set<string>>();
    
    for (const include of includeFields) {
      fieldMap.set(include.source, new Set(include.fields));
    }
    
    // Apply the field filtering
    const result = data.map(record => {
      const filteredRecord: Record<string, any> = {};
      
      for (const [source, fields] of fieldMap.entries()) {
        for (const field of fields) {
          // If field exists, include it in the filtered record
          if (record[field] !== undefined) {
            filteredRecord[field] = record[field];
          }
        }
      }
      
      return filteredRecord;
    });
    
    return result;
  }
  
  /**
   * Create a lookup map from data for enrichment
   */
  private createLookupMap(
    data: any[],
    keyField: string,
    valueFields: string[]
  ): Map<string, any[]> {
    const map = new Map<string, any[]>();
    
    for (const item of data) {
      const key = String(
        keyField.includes('.') 
          ? this.getNestedValue(item, keyField) 
          : item[keyField]
      );
      
      if (key === undefined || key === 'undefined' || key === 'null') {
        continue;
      }
      
      const values = valueFields.map(field => 
        field.includes('.') 
          ? this.getNestedValue(item, field) 
          : item[field]
      );
      
      map.set(key, values);
    }
    
    return map;
  }
  
  /**
   * Validate a value against a validation rule
   */
  private validateValue(value: any, rule: ValidationRule): boolean {
    const { type, options = {} } = rule;
    
    switch (type) {
      case 'REQUIRED':
        return value !== undefined && value !== null && value !== '';
        
      case 'MIN_LENGTH':
        if (value === undefined || value === null) {
          return options.allowNull ?? false;
        }
        return String(value).length >= (options.min ?? 0);
        
      case 'MAX_LENGTH':
        if (value === undefined || value === null) {
          return options.allowNull ?? true;
        }
        return String(value).length <= (options.max ?? Number.MAX_SAFE_INTEGER);
        
      case 'PATTERN':
        if (value === undefined || value === null) {
          return options.allowNull ?? true;
        }
        try {
          const regex = new RegExp(options.pattern ?? '.*', options.flags);
          return regex.test(String(value));
        } catch (e) {
          return false;
        }
        
      case 'EMAIL':
        if (value === undefined || value === null || value === '') {
          return options.allowNull ?? true;
        }
        // Simple email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        
      case 'URL':
        if (value === undefined || value === null || value === '') {
          return options.allowNull ?? true;
        }
        try {
          new URL(String(value));
          return true;
        } catch (e) {
          return false;
        }
        
      case 'MIN_VALUE':
        if (value === undefined || value === null) {
          return options.allowNull ?? false;
        }
        return Number(value) >= (options.min ?? -Number.MAX_SAFE_INTEGER);
        
      case 'MAX_VALUE':
        if (value === undefined || value === null) {
          return options.allowNull ?? true;
        }
        return Number(value) <= (options.max ?? Number.MAX_SAFE_INTEGER);
        
      case 'IN_LIST':
        if (value === undefined || value === null) {
          return options.allowNull ?? true;
        }
        return (options.values || []).includes(value);
        
      case 'NOT_IN_LIST':
        if (value === undefined || value === null) {
          return options.allowNull ?? true;
        }
        return !((options.values || []).includes(value));
        
      case 'CUSTOM':
        // For a real implementation, you would have a safer way to evaluate custom functions
        if (typeof options.function === 'string') {
          try {
            return this.executeSimpleValidation(options.function, value);
          } catch (e) {
            return false;
          }
        }
        return true;
        
      default:
        return true;
    }
  }
  
  /**
   * Execute a simple transform function (limited implementation for security)
   */
  private executeSimpleTransform(functionStr: string, value: any): any {
    // Simple transform operations for demo purposes
    // In a real implementation, you would use a safer approach
    
    // Extract the function body
    const body = functionStr.substring(
      functionStr.indexOf('{') + 1,
      functionStr.lastIndexOf('}')
    ).trim();
    
    // Very simple transforms
    if (body.includes('return value.toUpperCase()')) {
      return typeof value === 'string' ? value.toUpperCase() : value;
    } else if (body.includes('return value.toLowerCase()')) {
      return typeof value === 'string' ? value.toLowerCase() : value;
    } else if (body.includes('return value.trim()')) {
      return typeof value === 'string' ? value.trim() : value;
    } else if (body.includes('return parseFloat(value)')) {
      return typeof value === 'string' ? parseFloat(value) : value;
    } else if (body.includes('return parseInt(value)')) {
      return typeof value === 'string' ? parseInt(value, 10) : value;
    } else if (body.includes('return String(value)')) {
      return value !== null && value !== undefined ? String(value) : value;
    }
    
    // Default to returning the original value
    return value;
  }
  
  /**
   * Execute a simple validation function (limited implementation for security)
   */
  private executeSimpleValidation(functionStr: string, value: any): boolean {
    // Simple validation operations for demo purposes
    // In a real implementation, you would use a safer approach
    
    if (functionStr.includes('value === null')) {
      return value === null;
    } else if (functionStr.includes('value !== null')) {
      return value !== null;
    } else if (functionStr.includes('value === undefined')) {
      return value === undefined;
    } else if (functionStr.includes('value !== undefined')) {
      return value !== undefined;
    } else if (functionStr.includes('value.length >')) {
      const match = functionStr.match(/value\.length\s*>\s*(\d+)/);
      if (match && match[1]) {
        const length = parseInt(match[1], 10);
        return value && value.length > length;
      }
    } else if (functionStr.includes('value.length <')) {
      const match = functionStr.match(/value\.length\s*<\s*(\d+)/);
      if (match && match[1]) {
        const length = parseInt(match[1], 10);
        return value && value.length < length;
      }
    } else if (functionStr.includes('value >')) {
      const match = functionStr.match(/value\s*>\s*(\d+)/);
      if (match && match[1]) {
        const num = parseFloat(match[1]);
        return value > num;
      }
    } else if (functionStr.includes('value <')) {
      const match = functionStr.match(/value\s*<\s*(\d+)/);
      if (match && match[1]) {
        const num = parseFloat(match[1]);
        return value < num;
      }
    }
    
    // Default to passing validation
    return true;
  }
  
  /**
   * Apply a template to a record
   */
  private applyTemplate(template: string, record: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
      if (field.includes('.')) {
        return String(this.getNestedValue(record, field) ?? '');
      } else {
        return String(record[field] ?? '');
      }
    });
  }
  
  /**
   * Get a value from a nested path
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) {
      return undefined;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * Set a value at a nested path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    if (!obj || !path) {
      return;
    }
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) {
      return;
    }
    
    let current = obj;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        current[key] = {};
      } else if (typeof current[key] !== 'object' || current[key] === null) {
        // Convert non-objects to empty objects
        current[key] = {};
      }
      
      current = current[key];
    }
    
    current[lastKey] = value;
  }
  
  /**
   * Get transformation type name
   */
  getTransformationTypeName(type: TransformationType): string {
    switch (type) {
      case TransformationType.FILTER:
        return 'Filter';
      case TransformationType.MAP:
        return 'Map';
      case TransformationType.AGGREGATE:
        return 'Aggregate';
      case TransformationType.JOIN:
        return 'Join';
      case TransformationType.GROUP:
        return 'Group';
      case TransformationType.SORT:
        return 'Sort';
      case TransformationType.VALIDATE:
        return 'Validate';
      case TransformationType.ENRICH:
        return 'Enrich';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Get transformation type description
   */
  getTransformationTypeDescription(type: TransformationType): string {
    switch (type) {
      case TransformationType.FILTER:
        return 'Filter records based on conditions';
      case TransformationType.MAP:
        return 'Transform fields and create new fields';
      case TransformationType.AGGREGATE:
        return 'Calculate aggregates on the entire dataset';
      case TransformationType.JOIN:
        return 'Combine data from multiple sources';
      case TransformationType.GROUP:
        return 'Group data and calculate aggregates';
      case TransformationType.SORT:
        return 'Sort records based on field values';
      case TransformationType.VALIDATE:
        return 'Validate data against rules';
      case TransformationType.ENRICH:
        return 'Enrich data with external sources';
      default:
        return 'Unknown transformation type';
    }
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();