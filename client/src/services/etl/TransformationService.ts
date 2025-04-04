import { TransformationRule, TransformationType } from './ETLTypes';

/**
 * Transform result interface
 */
export interface TransformResult {
  data: any[];
  transformedCount: number;
  filteredCount: number;
  addedCount: number;
  errors: { rule: TransformationRule; error: string; record?: any }[];
  duration: number;
}

/**
 * Transformation service for applying transformation rules to data
 */
class TransformationService {
  // Cache to store compiled custom functions
  private compiledFunctions: Map<number, Function> = new Map();
  
  constructor() {
    // Default constructor
  }
  
  /**
   * Apply a transformation rule to data
   */
  async applyTransformation(data: any[], rule: TransformationRule): Promise<TransformResult> {
    console.log(`Applying transformation rule: ${rule.name} (${rule.type})`);
    
    const startTime = Date.now();
    let transformedData: any[] = [...data];
    let transformedCount = 0;
    let filteredCount = 0;
    let addedCount = 0;
    const errors: { rule: TransformationRule; error: string; record?: any }[] = [];
    
    try {
      // Apply transformation based on type
      switch (rule.type) {
        case TransformationType.MAP:
          ({ data: transformedData, transformedCount } = this.applyMapTransformation(transformedData, rule));
          break;
          
        case TransformationType.FILTER:
          ({ data: transformedData, filteredCount } = this.applyFilterTransformation(transformedData, rule));
          break;
          
        case TransformationType.RENAME_COLUMN:
          ({ data: transformedData, transformedCount } = this.applyRenameColumnTransformation(transformedData, rule));
          break;
          
        case TransformationType.DROP_COLUMN:
          ({ data: transformedData, transformedCount } = this.applyDropColumnTransformation(transformedData, rule));
          break;
          
        case TransformationType.CAST_TYPE:
          ({ data: transformedData, transformedCount } = this.applyCastTypeTransformation(transformedData, rule));
          break;
          
        case TransformationType.ADD:
        case TransformationType.SUBTRACT:
        case TransformationType.MULTIPLY:
        case TransformationType.DIVIDE:
          ({ data: transformedData, transformedCount } = this.applyMathTransformation(transformedData, rule));
          break;
          
        case TransformationType.FILL_NULL:
          ({ data: transformedData, transformedCount } = this.applyFillNullTransformation(transformedData, rule));
          break;
          
        case TransformationType.CONCAT:
          ({ data: transformedData, transformedCount } = this.applyConcatTransformation(transformedData, rule));
          break;
          
        case TransformationType.TO_UPPERCASE:
        case TransformationType.TO_LOWERCASE:
        case TransformationType.TRIM:
          ({ data: transformedData, transformedCount } = this.applyStringTransformation(transformedData, rule));
          break;
          
        case TransformationType.SUBSTRING:
          ({ data: transformedData, transformedCount } = this.applySubstringTransformation(transformedData, rule));
          break;
          
        case TransformationType.DATE_FORMAT:
          ({ data: transformedData, transformedCount } = this.applyDateFormatTransformation(transformedData, rule));
          break;
          
        case TransformationType.VALIDATE:
          ({ data: transformedData, transformedCount, filteredCount } = this.applyValidateTransformation(transformedData, rule));
          break;
          
        case TransformationType.STANDARDIZE:
          ({ data: transformedData, transformedCount } = this.applyStandardizeTransformation(transformedData, rule));
          break;
          
        case TransformationType.DEDUPLICATE:
          ({ data: transformedData, filteredCount } = this.applyDeduplicateTransformation(transformedData, rule));
          break;
          
        case TransformationType.CUSTOM_FUNCTION:
          ({ data: transformedData, transformedCount, filteredCount, addedCount } = await this.applyCustomFunctionTransformation(transformedData, rule));
          break;
          
        case TransformationType.PRICE_ADJUST:
          ({ data: transformedData, transformedCount } = this.applyPriceAdjustTransformation(transformedData, rule));
          break;
          
        case TransformationType.PRICE_PER_SQFT:
          ({ data: transformedData, transformedCount } = this.applyPricePerSqftTransformation(transformedData, rule));
          break;
          
        default:
          throw new Error(`Unsupported transformation type: ${rule.type}`);
      }
    } catch (error) {
      console.error(`Error applying transformation rule ${rule.name}:`, error);
      errors.push({
        rule,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    const duration = Date.now() - startTime;
    
    return {
      data: transformedData,
      transformedCount,
      filteredCount,
      addedCount,
      errors,
      duration
    };
  }
  
  /**
   * Apply multiple transformation rules to data
   */
  async applyTransformations(data: any[], rules: TransformationRule[]): Promise<TransformResult> {
    console.log(`Applying ${rules.length} transformation rules`);
    
    const startTime = Date.now();
    let transformedData = [...data];
    let totalTransformedCount = 0;
    let totalFilteredCount = 0;
    let totalAddedCount = 0;
    const errors: { rule: TransformationRule; error: string; record?: any }[] = [];
    
    // Sort rules by order
    const sortedRules = [...rules].sort((a, b) => a.order - b.order);
    
    // Apply each rule in order
    for (const rule of sortedRules) {
      if (!rule.enabled) {
        console.log(`Skipping disabled rule: ${rule.name}`);
        continue;
      }
      
      try {
        const result = await this.applyTransformation(transformedData, rule);
        transformedData = result.data;
        totalTransformedCount += result.transformedCount;
        totalFilteredCount += result.filteredCount;
        totalAddedCount += result.addedCount;
        errors.push(...result.errors);
      } catch (error) {
        console.error(`Error applying transformation rule ${rule.name}:`, error);
        errors.push({
          rule,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      data: transformedData,
      transformedCount: totalTransformedCount,
      filteredCount: totalFilteredCount,
      addedCount: totalAddedCount,
      errors,
      duration
    };
  }
  
  /**
   * Apply map transformation
   */
  private applyMapTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { mappings, includeOriginal = true } = rule.config;
    let transformedCount = 0;
    
    const mappedData = data.map(record => {
      const mappedRecord = includeOriginal ? { ...record } : {};
      
      for (const mapping of mappings) {
        if (mapping.source in record) {
          mappedRecord[mapping.target] = record[mapping.source];
          transformedCount++;
        }
      }
      
      return mappedRecord;
    });
    
    return { data: mappedData, transformedCount };
  }
  
  /**
   * Apply filter transformation
   */
  private applyFilterTransformation(data: any[], rule: TransformationRule): { data: any[], filteredCount: number } {
    const { conditions, operator = 'AND' } = rule.config;
    let filteredCount = 0;
    
    const filteredData = data.filter(record => {
      const results = conditions.map(condition => {
        const { field, operator: condOp, value } = condition;
        
        // Get field value
        const fieldValue = record[field];
        
        // Apply operator
        switch (condOp) {
          case 'EQ':
          case '=':
          case '==':
            return fieldValue == value;
          case 'NEQ':
          case '!=':
          case '<>':
            return fieldValue != value;
          case 'GT':
          case '>':
            return fieldValue > value;
          case 'GTE':
          case '>=':
            return fieldValue >= value;
          case 'LT':
          case '<':
            return fieldValue < value;
          case 'LTE':
          case '<=':
            return fieldValue <= value;
          case 'IN':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'NOT_IN':
            return !Array.isArray(value) || !value.includes(fieldValue);
          case 'CONTAINS':
            return String(fieldValue).includes(String(value));
          case 'NOT_CONTAINS':
            return !String(fieldValue).includes(String(value));
          case 'STARTS_WITH':
            return String(fieldValue).startsWith(String(value));
          case 'ENDS_WITH':
            return String(fieldValue).endsWith(String(value));
          case 'MATCHES':
            return new RegExp(value).test(String(fieldValue));
          case 'IS_NULL':
            return fieldValue === null || fieldValue === undefined;
          case 'IS_NOT_NULL':
            return fieldValue !== null && fieldValue !== undefined;
          case 'IS_EMPTY':
            return fieldValue === '' || fieldValue === null || fieldValue === undefined;
          case 'IS_NOT_EMPTY':
            return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
          default:
            throw new Error(`Unsupported filter operator: ${condOp}`);
        }
      });
      
      // Apply logical operator
      let result = false;
      if (operator === 'AND') {
        result = results.every(r => r);
      } else if (operator === 'OR') {
        result = results.some(r => r);
      } else {
        throw new Error(`Unsupported logical operator: ${operator}`);
      }
      
      if (!result) {
        filteredCount++;
      }
      
      return result;
    });
    
    return { data: filteredData, filteredCount };
  }
  
  /**
   * Apply rename column transformation
   */
  private applyRenameColumnTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { renames } = rule.config;
    let transformedCount = 0;
    
    const renamedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const { source, target } of renames) {
        if (source in newRecord) {
          newRecord[target] = newRecord[source];
          delete newRecord[source];
          transformedCount++;
        }
      }
      
      return newRecord;
    });
    
    return { data: renamedData, transformedCount };
  }
  
  /**
   * Apply drop column transformation
   */
  private applyDropColumnTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { columns } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const column of columns) {
        if (column in newRecord) {
          delete newRecord[column];
          transformedCount++;
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply cast type transformation
   */
  private applyCastTypeTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { casts } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const { column, type } of casts) {
        if (column in newRecord && newRecord[column] !== null && newRecord[column] !== undefined) {
          try {
            switch (type) {
              case 'string':
                newRecord[column] = String(newRecord[column]);
                break;
              case 'number':
                newRecord[column] = Number(newRecord[column]);
                break;
              case 'boolean':
                newRecord[column] = Boolean(newRecord[column]);
                break;
              case 'date':
                newRecord[column] = new Date(newRecord[column]);
                break;
              default:
                throw new Error(`Unsupported cast type: ${type}`);
            }
            transformedCount++;
          } catch (error) {
            console.warn(`Failed to cast ${column} to ${type}:`, error);
          }
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply math transformation
   */
  private applyMathTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { column, value, targetColumn = column } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      if (column in newRecord && newRecord[column] !== null && newRecord[column] !== undefined) {
        try {
          const numValue = Number(newRecord[column]);
          const operandValue = Number(value);
          
          if (!isNaN(numValue) && !isNaN(operandValue)) {
            switch (rule.type) {
              case TransformationType.ADD:
                newRecord[targetColumn] = numValue + operandValue;
                break;
              case TransformationType.SUBTRACT:
                newRecord[targetColumn] = numValue - operandValue;
                break;
              case TransformationType.MULTIPLY:
                newRecord[targetColumn] = numValue * operandValue;
                break;
              case TransformationType.DIVIDE:
                if (operandValue === 0) {
                  throw new Error('Division by zero');
                }
                newRecord[targetColumn] = numValue / operandValue;
                break;
              default:
                throw new Error(`Unsupported math operation: ${rule.type}`);
            }
            transformedCount++;
          }
        } catch (error) {
          console.warn(`Failed to apply math operation to ${column}:`, error);
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply fill null transformation
   */
  private applyFillNullTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { columns, value } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const column of columns) {
        if (column in newRecord && (newRecord[column] === null || newRecord[column] === undefined)) {
          newRecord[column] = value;
          transformedCount++;
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply concat transformation
   */
  private applyConcatTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { columns, separator = '', targetColumn } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      const values = columns.map(column => {
        return column in newRecord && newRecord[column] !== null && newRecord[column] !== undefined
          ? String(newRecord[column])
          : '';
      });
      
      newRecord[targetColumn] = values.join(separator);
      transformedCount++;
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply string transformation
   */
  private applyStringTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { columns, targetColumns } = rule.config;
    const columnList = Array.isArray(columns) ? columns : [columns];
    const targetList = Array.isArray(targetColumns) ? targetColumns : columnList;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      for (let i = 0; i < columnList.length; i++) {
        const column = columnList[i];
        const targetColumn = targetList[i] || column;
        
        if (column in newRecord && typeof newRecord[column] === 'string') {
          switch (rule.type) {
            case TransformationType.TO_UPPERCASE:
              newRecord[targetColumn] = newRecord[column].toUpperCase();
              break;
            case TransformationType.TO_LOWERCASE:
              newRecord[targetColumn] = newRecord[column].toLowerCase();
              break;
            case TransformationType.TRIM:
              newRecord[targetColumn] = newRecord[column].trim();
              break;
            default:
              throw new Error(`Unsupported string operation: ${rule.type}`);
          }
          transformedCount++;
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply substring transformation
   */
  private applySubstringTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { column, start, end, targetColumn = column } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      if (column in newRecord && typeof newRecord[column] === 'string') {
        newRecord[targetColumn] = newRecord[column].substring(start, end !== undefined ? end : undefined);
        transformedCount++;
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply date format transformation
   */
  private applyDateFormatTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { column, format, targetColumn = column } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      if (column in newRecord && newRecord[column] !== null && newRecord[column] !== undefined) {
        try {
          const date = new Date(newRecord[column]);
          
          if (!isNaN(date.getTime())) {
            // For simplicity, we'll use a basic formatter
            // In a real implementation, use a library like date-fns
            newRecord[targetColumn] = this.formatDate(date, format);
            transformedCount++;
          }
        } catch (error) {
          console.warn(`Failed to format date ${column}:`, error);
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply validate transformation
   */
  private applyValidateTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number, filteredCount: number } {
    const { validations, stopOnFirstError = false, filterInvalid = false } = rule.config;
    let transformedCount = 0;
    let filteredCount = 0;
    
    const validatedData = [];
    
    for (const record of data) {
      let isValid = true;
      const validatedRecord = { ...record };
      
      for (const validation of validations) {
        const { field, rules } = validation;
        
        if (!(field in validatedRecord)) {
          continue;
        }
        
        const value = validatedRecord[field];
        
        for (const rule of rules) {
          const { type, message } = rule;
          let ruleValid = true;
          
          switch (type) {
            case 'required':
              ruleValid = value !== null && value !== undefined && value !== '';
              break;
            case 'min':
              ruleValid = Number(value) >= rule.min;
              break;
            case 'max':
              ruleValid = Number(value) <= rule.max;
              break;
            case 'minLength':
              ruleValid = String(value).length >= rule.length;
              break;
            case 'maxLength':
              ruleValid = String(value).length <= rule.length;
              break;
            case 'pattern':
              ruleValid = new RegExp(rule.pattern).test(String(value));
              break;
            case 'email':
              ruleValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
              break;
            case 'url':
              ruleValid = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(String(value));
              break;
            case 'numeric':
              ruleValid = !isNaN(Number(value));
              break;
            case 'integer':
              ruleValid = Number.isInteger(Number(value));
              break;
            case 'boolean':
              ruleValid = typeof value === 'boolean';
              break;
            case 'in':
              ruleValid = rule.values.includes(value);
              break;
            case 'notIn':
              ruleValid = !rule.values.includes(value);
              break;
            default:
              console.warn(`Unsupported validation type: ${type}`);
              ruleValid = true;
          }
          
          if (!ruleValid) {
            isValid = false;
            
            // Add validation error
            validatedRecord._validationErrors = validatedRecord._validationErrors || {};
            validatedRecord._validationErrors[field] = validatedRecord._validationErrors[field] || [];
            validatedRecord._validationErrors[field].push(message || `Failed validation: ${type}`);
            
            if (stopOnFirstError) {
              break;
            }
          }
        }
        
        if (!isValid && stopOnFirstError) {
          break;
        }
      }
      
      if (isValid || !filterInvalid) {
        validatedData.push(validatedRecord);
        transformedCount++;
      } else {
        filteredCount++;
      }
    }
    
    return { data: validatedData, transformedCount, filteredCount };
  }
  
  /**
   * Apply standardize transformation
   */
  private applyStandardizeTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { rules } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const standardizeRule of rules) {
        const { field, format } = standardizeRule;
        
        if (field in newRecord && newRecord[field] !== null && newRecord[field] !== undefined) {
          try {
            switch (format) {
              case 'uppercase':
                newRecord[field] = String(newRecord[field]).toUpperCase();
                break;
              case 'lowercase':
                newRecord[field] = String(newRecord[field]).toLowerCase();
                break;
              case 'capitalize':
                newRecord[field] = String(newRecord[field])
                  .toLowerCase()
                  .replace(/(?:^|\s)\S/g, a => a.toUpperCase());
                break;
              case 'trim':
                newRecord[field] = String(newRecord[field]).trim();
                break;
              case 'phone':
                // Basic US phone standardization
                newRecord[field] = String(newRecord[field])
                  .replace(/\D/g, '')
                  .replace(/^1/, '')
                  .replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                break;
              case 'zip':
                // Basic US ZIP code standardization
                newRecord[field] = String(newRecord[field])
                  .replace(/\D/g, '')
                  .substring(0, 9)
                  .replace(/^(\d{5})(\d{4})$/, '$1-$2')
                  .replace(/^(\d{5})$/, '$1');
                break;
              case 'date':
                // Standardize date to ISO format
                const date = new Date(newRecord[field]);
                if (!isNaN(date.getTime())) {
                  newRecord[field] = date.toISOString().split('T')[0];
                }
                break;
              case 'currency':
                // Standardize currency
                const num = parseFloat(String(newRecord[field]).replace(/[$,]/g, ''));
                if (!isNaN(num)) {
                  newRecord[field] = num.toFixed(2);
                }
                break;
              case 'address':
                // Basic address standardization
                newRecord[field] = String(newRecord[field])
                  .replace(/\s+/g, ' ')
                  .replace(/(\d+)\s+([nsew])[\.]*\s+/i, '$1 $2. ')
                  .replace(/\b(st|rd|ave|blvd|ln|ct|dr|pl|cir)\b\.*/i, match => match.toLowerCase() + '.')
                  .replace(/\b(street|road|avenue|boulevard|lane|court|drive|place|circle)\b/i, match => {
                    const abbrev = { 
                      street: 'st.', road: 'rd.', avenue: 'ave.', boulevard: 'blvd.', 
                      lane: 'ln.', court: 'ct.', drive: 'dr.', place: 'pl.', circle: 'cir.' 
                    }[match.toLowerCase()];
                    return abbrev || match;
                  })
                  .trim();
                break;
              case 'name':
                // Basic name standardization
                newRecord[field] = String(newRecord[field])
                  .toLowerCase()
                  .replace(/\b\w/g, l => l.toUpperCase())
                  .replace(/\bmac(?=\w)/i, 'Mac')
                  .replace(/\bmc(?=\w)/i, 'Mc');
                break;
              default:
                console.warn(`Unsupported standardization format: ${format}`);
                continue;
            }
            
            transformedCount++;
          } catch (error) {
            console.warn(`Failed to standardize ${field}:`, error);
          }
        }
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply deduplicate transformation
   */
  private applyDeduplicateTransformation(data: any[], rule: TransformationRule): { data: any[], filteredCount: number } {
    const { columns, keepFirst = true } = rule.config;
    
    const seen = new Set();
    const deduplicatedData = [];
    let filteredCount = 0;
    
    for (const record of data) {
      // Create a key from the specified columns
      const keyValues = columns.map(column => {
        const value = column in record ? record[column] : undefined;
        return value !== undefined && value !== null ? String(value) : '';
      });
      
      const key = keyValues.join('|');
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedData.push(record);
      } else {
        filteredCount++;
        
        if (!keepFirst) {
          // Replace the previous record
          deduplicatedData.pop();
          deduplicatedData.push(record);
        }
      }
    }
    
    return { data: deduplicatedData, filteredCount };
  }
  
  /**
   * Apply custom function transformation
   */
  private async applyCustomFunctionTransformation(data: any[], rule: TransformationRule): Promise<{ data: any[], transformedCount: number, filteredCount: number, addedCount: number }> {
    const { function: functionStr, parameters, targetColumn } = rule.config;
    
    let transformFunc: Function;
    
    // Check if function is already compiled
    if (this.compiledFunctions.has(rule.id)) {
      transformFunc = this.compiledFunctions.get(rule.id);
    } else {
      // Compile function
      try {
        // For safety in a real production system, use a sandboxed evaluation
        transformFunc = new Function(...parameters.map(p => p.name), functionStr);
        this.compiledFunctions.set(rule.id, transformFunc);
      } catch (error) {
        throw new Error(`Failed to compile custom function: ${error.message}`);
      }
    }
    
    let transformedCount = 0;
    let filteredCount = 0;
    let addedCount = 0;
    
    const transformedData = [];
    
    for (const record of data) {
      try {
        // Extract parameter values from record
        const paramValues = parameters.map(param => {
          return param.column ? record[param.column] : param.value;
        });
        
        // Call the function
        const result = transformFunc.apply(null, paramValues);
        
        if (result === null) {
          // Skip this record
          filteredCount++;
          continue;
        } else if (Array.isArray(result)) {
          // Function returned multiple records
          for (const item of result) {
            if (typeof item === 'object') {
              transformedData.push({ ...record, ...item });
              addedCount++;
            }
          }
        } else if (targetColumn) {
          // Function returned a value to be assigned to targetColumn
          const newRecord = { ...record };
          newRecord[targetColumn] = result;
          transformedData.push(newRecord);
          transformedCount++;
        } else if (typeof result === 'object') {
          // Function returned a replacement record
          transformedData.push(result);
          transformedCount++;
        } else {
          // Just pass through the original record
          transformedData.push(record);
        }
      } catch (error) {
        console.warn(`Error executing custom function for record:`, error);
        transformedData.push(record); // Pass through on error
      }
    }
    
    return { data: transformedData, transformedCount, filteredCount, addedCount };
  }
  
  /**
   * Apply price adjust transformation
   */
  private applyPriceAdjustTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { priceColumn, targetColumn, adjustmentFactors } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      if (priceColumn in newRecord && typeof newRecord[priceColumn] === 'number') {
        let adjustedPrice = newRecord[priceColumn];
        
        // Apply each adjustment factor
        for (const factor of adjustmentFactors) {
          const { column, values, defaultAdjustment = 1.0 } = factor;
          
          if (column in newRecord) {
            const columnValue = String(newRecord[column]);
            const adjustmentFactor = columnValue in values ? values[columnValue] : defaultAdjustment;
            
            adjustedPrice *= adjustmentFactor;
          }
        }
        
        newRecord[targetColumn] = adjustedPrice;
        transformedCount++;
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Apply price per sqft transformation
   */
  private applyPricePerSqftTransformation(data: any[], rule: TransformationRule): { data: any[], transformedCount: number } {
    const { priceColumn, sqftColumn, targetColumn } = rule.config;
    let transformedCount = 0;
    
    const transformedData = data.map(record => {
      const newRecord = { ...record };
      
      if (priceColumn in newRecord && sqftColumn in newRecord &&
          typeof newRecord[priceColumn] === 'number' && 
          typeof newRecord[sqftColumn] === 'number' &&
          newRecord[sqftColumn] > 0) {
        
        newRecord[targetColumn] = newRecord[priceColumn] / newRecord[sqftColumn];
        transformedCount++;
      }
      
      return newRecord;
    });
    
    return { data: transformedData, transformedCount };
  }
  
  /**
   * Format a date using a simple format string
   */
  private formatDate(date: Date, format: string): string {
    // Very basic date formatter for demonstration
    // In a real app, use a library like date-fns
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Pad with leading zeros
    const pad = (num: number): string => num.toString().padStart(2, '0');
    
    // Replace format tokens
    return format
      .replace('YYYY', year.toString())
      .replace('YY', (year % 100).toString())
      .replace('MM', pad(month))
      .replace('M', month.toString())
      .replace('DD', pad(day))
      .replace('D', day.toString())
      .replace('HH', pad(hours))
      .replace('H', hours.toString())
      .replace('hh', pad(hours % 12 || 12))
      .replace('h', (hours % 12 || 12).toString())
      .replace('mm', pad(minutes))
      .replace('m', minutes.toString())
      .replace('ss', pad(seconds))
      .replace('s', seconds.toString())
      .replace('A', hours >= 12 ? 'PM' : 'AM')
      .replace('a', hours >= 12 ? 'pm' : 'am');
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();