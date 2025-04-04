/**
 * TransformationService.ts
 * 
 * Provides functionality for applying data transformations to datasets
 */

import {
  TransformationRule,
  TransformationType,
  ValidationRule
} from './ETLTypes';

class TransformationService {
  /**
   * Apply a transformation rule to a dataset
   */
  async applyTransformation(data: any[], rule: TransformationRule): Promise<any[]> {
    console.log(`Applying transformation: ${rule.name}`);
    
    if (!rule.isActive) {
      console.log(`Skipping inactive transformation: ${rule.name}`);
      return data;
    }
    
    try {
      switch (rule.type) {
        case TransformationType.RENAME_COLUMN:
          return this.renameColumn(data, rule);
          
        case TransformationType.DROP_COLUMN:
          return this.dropColumn(data, rule);
          
        case TransformationType.REORDER_COLUMNS:
          return this.reorderColumns(data, rule);
          
        case TransformationType.CAST_TYPE:
          return this.castType(data, rule);
          
        case TransformationType.PARSE_DATE:
          return this.parseDate(data, rule);
          
        case TransformationType.PARSE_NUMBER:
          return this.parseNumber(data, rule);
          
        case TransformationType.REPLACE_VALUE:
          return this.replaceValue(data, rule);
          
        case TransformationType.FILL_NULL:
          return this.fillNull(data, rule);
          
        case TransformationType.MAP_VALUES:
          return this.mapValues(data, rule);
          
        case TransformationType.TO_UPPERCASE:
          return this.toUppercase(data, rule);
          
        case TransformationType.TO_LOWERCASE:
          return this.toLowercase(data, rule);
          
        case TransformationType.TRIM:
          return this.trim(data, rule);
          
        case TransformationType.SUBSTRING:
          return this.substring(data, rule);
          
        case TransformationType.CONCAT:
          return this.concat(data, rule);
          
        case TransformationType.SPLIT:
          return this.split(data, rule);
          
        case TransformationType.ROUND:
          return this.round(data, rule);
          
        case TransformationType.ADD:
          return this.add(data, rule);
          
        case TransformationType.SUBTRACT:
          return this.subtract(data, rule);
          
        case TransformationType.MULTIPLY:
          return this.multiply(data, rule);
          
        case TransformationType.DIVIDE:
          return this.divide(data, rule);
          
        case TransformationType.FILTER:
          return this.filter(data, rule);
          
        case TransformationType.SORT:
          return this.sort(data, rule);
          
        case TransformationType.GROUP_BY:
          return this.groupBy(data, rule);
          
        case TransformationType.AGGREGATE:
          return this.aggregate(data, rule);
          
        case TransformationType.JOIN:
          return this.join(data, rule);
          
        case TransformationType.UNION:
          return this.union(data, rule);
          
        case TransformationType.REMOVE_DUPLICATES:
          return this.removeDuplicates(data, rule);
          
        case TransformationType.VALIDATE:
          return this.validate(data, rule);
          
        case TransformationType.CUSTOM_FUNCTION:
        case TransformationType.JAVASCRIPT:
          return this.executeCustomCode(data, rule);
          
        case TransformationType.SQL:
          return this.executeSql(data, rule);
          
        case TransformationType.FORMULA:
          return this.executeFormula(data, rule);
          
        default:
          console.warn(`Unknown transformation type: ${rule.type}`);
          return data;
      }
    } catch (error) {
      console.error(`Error applying transformation ${rule.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Apply multiple transformation rules in sequence
   */
  async applyTransformations(data: any[], rules: TransformationRule[]): Promise<any[]> {
    console.log(`Applying ${rules.length} transformations`);
    
    if (rules.length === 0) {
      return data;
    }
    
    // Sort rules by priority if available
    const sortedRules = [...rules].sort((a, b) => 
      (a.priority || 0) - (b.priority || 0)
    );
    
    // Apply each rule in sequence
    let transformedData = [...data];
    
    for (const rule of sortedRules) {
      if (!rule.isActive) {
        console.log(`Skipping inactive transformation: ${rule.name}`);
        continue;
      }
      
      // Apply the transformation
      transformedData = await this.applyTransformation(transformedData, rule);
    }
    
    return transformedData;
  }
  
  // Implementation of transformation types
  
  private renameColumn(data: any[], rule: TransformationRule): any[] {
    const { fromColumn, toColumn } = rule.parameters;
    
    if (!fromColumn || !toColumn) {
      throw new Error('Missing fromColumn or toColumn parameter for RENAME_COLUMN');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (fromColumn in result) {
        result[toColumn] = result[fromColumn];
        delete result[fromColumn];
      }
      
      return result;
    });
  }
  
  private dropColumn(data: any[], rule: TransformationRule): any[] {
    const columns = rule.columns || [];
    
    if (columns.length === 0) {
      throw new Error('No columns specified for DROP_COLUMN');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const column of columns) {
        delete result[column];
      }
      
      return result;
    });
  }
  
  private reorderColumns(data: any[], rule: TransformationRule): any[] {
    const columnOrder = rule.parameters.columnOrder || [];
    
    if (columnOrder.length === 0) {
      return data;
    }
    
    return data.map(item => {
      const result: Record<string, any> = {};
      
      // First add columns in the specified order
      for (const column of columnOrder) {
        if (column in item) {
          result[column] = item[column];
        }
      }
      
      // Then add any remaining columns
      for (const key in item) {
        if (!columnOrder.includes(key)) {
          result[key] = item[key];
        }
      }
      
      return result;
    });
  }
  
  private castType(data: any[], rule: TransformationRule): any[] {
    const { column, targetType } = rule.parameters;
    
    if (!column || !targetType) {
      throw new Error('Missing column or targetType parameter for CAST_TYPE');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result) {
        switch (targetType) {
          case 'string':
            result[column] = String(result[column]);
            break;
            
          case 'number':
            result[column] = Number(result[column]);
            break;
            
          case 'boolean':
            result[column] = Boolean(result[column]);
            break;
            
          case 'date':
            result[column] = new Date(result[column]);
            break;
            
          default:
            // No conversion for unknown types
            break;
        }
      }
      
      return result;
    });
  }
  
  private parseDate(data: any[], rule: TransformationRule): any[] {
    const { column, format } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for PARSE_DATE');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && result[column]) {
        try {
          result[column] = new Date(result[column]);
        } catch (error) {
          console.warn(`Failed to parse date: ${result[column]}`);
        }
      }
      
      return result;
    });
  }
  
  private parseNumber(data: any[], rule: TransformationRule): any[] {
    const { column, decimalSeparator, thousandsSeparator } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for PARSE_NUMBER');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && result[column] !== null && result[column] !== undefined) {
        let value = String(result[column]);
        
        // Replace custom separators if provided
        if (thousandsSeparator) {
          value = value.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
        }
        
        if (decimalSeparator && decimalSeparator !== '.') {
          value = value.replace(decimalSeparator, '.');
        }
        
        result[column] = Number(value);
      }
      
      return result;
    });
  }
  
  private replaceValue(data: any[], rule: TransformationRule): any[] {
    const { column, search, replace, regex } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for REPLACE_VALUE');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && result[column] !== null && result[column] !== undefined) {
        if (regex && typeof result[column] === 'string') {
          const re = new RegExp(search, 'g');
          result[column] = result[column].replace(re, replace || '');
        } else if (result[column] === search) {
          result[column] = replace;
        }
      }
      
      return result;
    });
  }
  
  private fillNull(data: any[], rule: TransformationRule): any[] {
    const { column, value } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for FILL_NULL');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && (result[column] === null || result[column] === undefined)) {
        result[column] = value;
      }
      
      return result;
    });
  }
  
  private mapValues(data: any[], rule: TransformationRule): any[] {
    const { column, mapping } = rule.parameters;
    
    if (!column || !mapping || typeof mapping !== 'object') {
      throw new Error('Missing column or mapping parameter for MAP_VALUES');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && result[column] in mapping) {
        result[column] = mapping[result[column]];
      }
      
      return result;
    });
  }
  
  private toUppercase(data: any[], rule: TransformationRule): any[] {
    const { column } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for TO_UPPERCASE');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        result[column] = result[column].toUpperCase();
      }
      
      return result;
    });
  }
  
  private toLowercase(data: any[], rule: TransformationRule): any[] {
    const { column } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for TO_LOWERCASE');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        result[column] = result[column].toLowerCase();
      }
      
      return result;
    });
  }
  
  private trim(data: any[], rule: TransformationRule): any[] {
    const { column } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for TRIM');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        result[column] = result[column].trim();
      }
      
      return result;
    });
  }
  
  private substring(data: any[], rule: TransformationRule): any[] {
    const { column, start, end } = rule.parameters;
    
    if (!column || start === undefined) {
      throw new Error('Missing column or start parameter for SUBSTRING');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        result[column] = end !== undefined
          ? result[column].substring(start, end)
          : result[column].substring(start);
      }
      
      return result;
    });
  }
  
  private concat(data: any[], rule: TransformationRule): any[] {
    const { columns, targetColumn, separator } = rule.parameters;
    
    if (!columns || !columns.length || !targetColumn) {
      throw new Error('Missing columns or targetColumn parameter for CONCAT');
    }
    
    return data.map(item => {
      const result = { ...item };
      const sep = separator || '';
      
      const values = columns.map(col => 
        col in item ? (item[col] !== null ? String(item[col]) : '') : ''
      );
      
      result[targetColumn] = values.join(sep);
      
      return result;
    });
  }
  
  private split(data: any[], rule: TransformationRule): any[] {
    const { column, separator, targetColumns } = rule.parameters;
    
    if (!column || !separator || !targetColumns || !targetColumns.length) {
      throw new Error('Missing column, separator or targetColumns parameter for SPLIT');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'string') {
        const parts = result[column].split(separator);
        
        targetColumns.forEach((targetCol: string, index: number) => {
          result[targetCol] = index < parts.length ? parts[index] : '';
        });
      }
      
      return result;
    });
  }
  
  private round(data: any[], rule: TransformationRule): any[] {
    const { column, precision } = rule.parameters;
    
    if (!column) {
      throw new Error('Missing column parameter for ROUND');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      if (column in result && typeof result[column] === 'number') {
        if (precision !== undefined) {
          const factor = Math.pow(10, precision);
          result[column] = Math.round(result[column] * factor) / factor;
        } else {
          result[column] = Math.round(result[column]);
        }
      }
      
      return result;
    });
  }
  
  private add(data: any[], rule: TransformationRule): any[] {
    const { column, value, targetColumn } = rule.parameters;
    
    if (!column || value === undefined) {
      throw new Error('Missing column or value parameter for ADD');
    }
    
    return data.map(item => {
      const result = { ...item };
      const target = targetColumn || column;
      
      if (column in result && typeof result[column] === 'number') {
        result[target] = result[column] + Number(value);
      }
      
      return result;
    });
  }
  
  private subtract(data: any[], rule: TransformationRule): any[] {
    const { column, value, targetColumn } = rule.parameters;
    
    if (!column || value === undefined) {
      throw new Error('Missing column or value parameter for SUBTRACT');
    }
    
    return data.map(item => {
      const result = { ...item };
      const target = targetColumn || column;
      
      if (column in result && typeof result[column] === 'number') {
        result[target] = result[column] - Number(value);
      }
      
      return result;
    });
  }
  
  private multiply(data: any[], rule: TransformationRule): any[] {
    const { column, value, targetColumn } = rule.parameters;
    
    if (!column || value === undefined) {
      throw new Error('Missing column or value parameter for MULTIPLY');
    }
    
    return data.map(item => {
      const result = { ...item };
      const target = targetColumn || column;
      
      if (column in result && typeof result[column] === 'number') {
        result[target] = result[column] * Number(value);
      }
      
      return result;
    });
  }
  
  private divide(data: any[], rule: TransformationRule): any[] {
    const { column, value, targetColumn } = rule.parameters;
    
    if (!column || value === undefined) {
      throw new Error('Missing column or value parameter for DIVIDE');
    }
    
    if (Number(value) === 0) {
      throw new Error('Division by zero');
    }
    
    return data.map(item => {
      const result = { ...item };
      const target = targetColumn || column;
      
      if (column in result && typeof result[column] === 'number') {
        result[target] = result[column] / Number(value);
      }
      
      return result;
    });
  }
  
  private filter(data: any[], rule: TransformationRule): any[] {
    const { conditions } = rule.parameters;
    
    if (!conditions || !conditions.length) {
      return data;
    }
    
    return data.filter(item => {
      // Check if all conditions are met
      return conditions.every((condition: any) => {
        const { column, operator, value } = condition;
        
        if (!column || !operator) {
          return true;
        }
        
        if (!(column in item)) {
          return false;
        }
        
        const itemValue = item[column];
        
        switch (operator) {
          case 'EQUALS':
            return itemValue === value;
            
          case 'NOT_EQUALS':
            return itemValue !== value;
            
          case 'GREATER_THAN':
            return itemValue > value;
            
          case 'LESS_THAN':
            return itemValue < value;
            
          case 'GREATER_THAN_EQUALS':
            return itemValue >= value;
            
          case 'LESS_THAN_EQUALS':
            return itemValue <= value;
            
          case 'CONTAINS':
            return typeof itemValue === 'string' && itemValue.includes(value);
            
          case 'NOT_CONTAINS':
            return typeof itemValue === 'string' && !itemValue.includes(value);
            
          case 'IN':
            return Array.isArray(value) && value.includes(itemValue);
            
          case 'NOT_IN':
            return Array.isArray(value) && !value.includes(itemValue);
            
          case 'IS_NULL':
            return itemValue === null || itemValue === undefined;
            
          case 'IS_NOT_NULL':
            return itemValue !== null && itemValue !== undefined;
            
          default:
            return true;
        }
      });
    });
  }
  
  private sort(data: any[], rule: TransformationRule): any[] {
    const { columns, directions } = rule.parameters;
    
    if (!columns || !columns.length) {
      return data;
    }
    
    return [...data].sort((a, b) => {
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const direction = directions && directions[i] ? directions[i].toUpperCase() : 'ASC';
        
        if (!(column in a) || !(column in b)) {
          continue;
        }
        
        const aVal = a[column];
        const bVal = b[column];
        
        if (aVal === bVal) {
          continue;
        }
        
        let comparison: number;
        
        if (aVal === null || aVal === undefined) {
          comparison = -1;
        } else if (bVal === null || bVal === undefined) {
          comparison = 1;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = aVal < bVal ? -1 : 1;
        }
        
        return direction === 'DESC' ? -comparison : comparison;
      }
      
      return 0;
    });
  }
  
  private groupBy(data: any[], rule: TransformationRule): any[] {
    const { columns } = rule.parameters;
    
    if (!columns || !columns.length) {
      return data;
    }
    
    // Group data by specified columns
    const grouped: Record<string, any[]> = {};
    
    data.forEach(item => {
      // Create key from the group by columns
      const keyParts = columns.map(col => 
        col in item ? JSON.stringify(item[col]) : 'null'
      );
      const key = keyParts.join('|');
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(item);
    });
    
    // Convert back to array with added group sizes
    return Object.values(grouped).map(group => {
      const result = { ...group[0] };
      result._group = group;
      result._groupSize = group.length;
      return result;
    });
  }
  
  private aggregate(data: any[], rule: TransformationRule): any[] {
    const { groupBy, aggregations } = rule.parameters;
    
    if (!groupBy || !groupBy.length || !aggregations || !aggregations.length) {
      return data;
    }
    
    // First group the data
    const groupedData = this.groupBy(data, {
      ...rule,
      parameters: { columns: groupBy }
    });
    
    // Then apply aggregations
    return groupedData.map(item => {
      const result = { ...item };
      const group = item._group || [];
      
      aggregations.forEach((agg: any) => {
        const { column, operation, targetColumn } = agg;
        
        if (!column || !operation || !targetColumn) {
          return;
        }
        
        const values = group
          .map((g: any) => g[column])
          .filter((v: any) => v !== null && v !== undefined && !isNaN(v));
        
        switch (operation) {
          case 'SUM':
            result[targetColumn] = values.reduce((sum: number, val: number) => sum + val, 0);
            break;
            
          case 'AVG':
            result[targetColumn] = values.length 
              ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
              : null;
            break;
            
          case 'MIN':
            result[targetColumn] = values.length ? Math.min(...values) : null;
            break;
            
          case 'MAX':
            result[targetColumn] = values.length ? Math.max(...values) : null;
            break;
            
          case 'COUNT':
            result[targetColumn] = values.length;
            break;
            
          case 'COUNT_DISTINCT':
            result[targetColumn] = new Set(values).size;
            break;
        }
      });
      
      // Remove internal group data
      delete result._group;
      
      return result;
    });
  }
  
  private join(data: any[], rule: TransformationRule): any[] {
    const { rightData, leftKey, rightKey, type, resultType } = rule.parameters;
    
    if (!rightData || !Array.isArray(rightData) || !leftKey || !rightKey) {
      return data;
    }
    
    // Build index for right dataset
    const rightIndex: Record<string, any[]> = {};
    
    rightData.forEach(item => {
      if (!(rightKey in item)) {
        return;
      }
      
      const key = JSON.stringify(item[rightKey]);
      
      if (!rightIndex[key]) {
        rightIndex[key] = [];
      }
      
      rightIndex[key].push(item);
    });
    
    const joinType = type || 'INNER';
    const output = resultType === 'ARRAY' ? [] : {};
    
    // Perform the join
    switch (joinType) {
      case 'INNER':
        return data.flatMap(leftItem => {
          if (!(leftKey in leftItem)) {
            return [];
          }
          
          const key = JSON.stringify(leftItem[leftKey]);
          const rightItems = rightIndex[key] || [];
          
          if (rightItems.length === 0) {
            return [];
          }
          
          return rightItems.map(rightItem => ({
            ...leftItem,
            ...rightItem
          }));
        });
        
      case 'LEFT':
        return data.flatMap(leftItem => {
          if (!(leftKey in leftItem)) {
            return [leftItem];
          }
          
          const key = JSON.stringify(leftItem[leftKey]);
          const rightItems = rightIndex[key] || [];
          
          if (rightItems.length === 0) {
            return [leftItem];
          }
          
          return rightItems.map(rightItem => ({
            ...leftItem,
            ...rightItem
          }));
        });
        
      case 'RIGHT':
        const result: any[] = [];
        
        // Add all right items with matching left items
        for (const key in rightIndex) {
          const rightItems = rightIndex[key];
          const rightKey = JSON.parse(key);
          
          const leftItems = data.filter(leftItem => 
            leftKey in leftItem && leftItem[leftKey] === rightKey
          );
          
          if (leftItems.length > 0) {
            rightItems.forEach(rightItem => {
              leftItems.forEach(leftItem => {
                result.push({
                  ...leftItem,
                  ...rightItem
                });
              });
            });
          } else {
            rightItems.forEach(rightItem => {
              result.push(rightItem);
            });
          }
        }
        
        return result;
        
      case 'FULL':
        const fullResult = [...this.join(data, { 
          ...rule, 
          parameters: { ...rule.parameters, type: 'LEFT' } 
        })];
        
        // Add right items that don't match any left item
        for (const key in rightIndex) {
          const rightItems = rightIndex[key];
          const rightKey = JSON.parse(key);
          
          const hasMatch = data.some(leftItem => 
            leftKey in leftItem && leftItem[leftKey] === rightKey
          );
          
          if (!hasMatch) {
            fullResult.push(...rightItems);
          }
        }
        
        return fullResult;
        
      default:
        return data;
    }
  }
  
  private union(data: any[], rule: TransformationRule): any[] {
    const { rightData, distinct } = rule.parameters;
    
    if (!rightData || !Array.isArray(rightData)) {
      return data;
    }
    
    if (distinct) {
      // Create a Map to track unique objects by their stringified JSON
      const uniqueMap = new Map();
      
      [...data, ...rightData].forEach(item => {
        // Create a key to identify unique items
        const key = JSON.stringify(item);
        uniqueMap.set(key, item);
      });
      
      return Array.from(uniqueMap.values());
    } else {
      // Simple concatenation
      return [...data, ...rightData];
    }
  }
  
  private removeDuplicates(data: any[], rule: TransformationRule): any[] {
    const { columns } = rule.parameters;
    
    if (!data.length) {
      return data;
    }
    
    if (!columns || !columns.length) {
      // If no columns specified, remove exact duplicates
      const uniqueMap = new Map();
      
      data.forEach(item => {
        const key = JSON.stringify(item);
        uniqueMap.set(key, item);
      });
      
      return Array.from(uniqueMap.values());
    } else {
      // Remove duplicates based on specified columns
      const uniqueMap = new Map();
      
      data.forEach(item => {
        const keyParts = columns.map(col => 
          col in item ? JSON.stringify(item[col]) : 'null'
        );
        const key = keyParts.join('|');
        
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });
      
      return Array.from(uniqueMap.values());
    }
  }
  
  private validate(data: any[], rule: TransformationRule): any[] {
    const validationRules = rule.parameters.rules;
    
    if (!validationRules || !validationRules.length) {
      return data;
    }
    
    data.forEach(item => {
      const validationErrors: string[] = [];
      
      validationRules.forEach((validationRule: ValidationRule) => {
        try {
          // Validate based on rule type
          let isValid = true;
          const { field, type, parameters, message } = validationRule;
          
          if (!(field in item)) {
            return;
          }
          
          const value = item[field];
          
          switch (type) {
            case 'NOT_NULL':
              isValid = value !== null && value !== undefined;
              break;
              
            case 'MIN_VALUE':
              isValid = typeof value === 'number' && value >= parameters;
              break;
              
            case 'MAX_VALUE':
              isValid = typeof value === 'number' && value <= parameters;
              break;
              
            case 'REGEX':
              isValid = typeof value === 'string' && new RegExp(parameters).test(value);
              break;
              
            case 'ENUM':
              isValid = Array.isArray(parameters) && parameters.includes(value);
              break;
              
            case 'DATE_FORMAT':
              isValid = Boolean(value && new Date(value).getTime());
              break;
              
            case 'CUSTOM':
              if (typeof parameters === 'function') {
                isValid = parameters(value);
              } else if (typeof parameters === 'string') {
                try {
                  const fn = new Function('value', `return ${parameters}`);
                  isValid = fn(value);
                } catch (error) {
                  console.error(`Error in custom validation:`, error);
                  isValid = false;
                }
              }
              break;
          }
          
          if (!isValid) {
            validationErrors.push(message || `Validation failed for ${field}`);
          }
        } catch (error) {
          console.error(`Error in validation:`, error);
          validationErrors.push(`Validation error: ${error}`);
        }
      });
      
      // Add validation errors to the item
      if (validationErrors.length > 0) {
        item._validationErrors = validationErrors;
        item._isValid = false;
      } else {
        item._isValid = true;
      }
    });
    
    // Filter out invalid items if removeInvalid is true
    if (rule.parameters.removeInvalid) {
      return data.filter(item => item._isValid);
    }
    
    return data;
  }
  
  private executeCustomCode(data: any[], rule: TransformationRule): any[] {
    const { code } = rule.parameters;
    
    if (!code) {
      return data;
    }
    
    try {
      // Create a function from the custom code
      const fn = new Function('data', code);
      
      // Execute the function with the data
      const result = fn(data);
      
      // Return the result if it's an array
      if (Array.isArray(result)) {
        return result;
      } else {
        console.warn('Custom code did not return an array, returning original data');
        return data;
      }
    } catch (error) {
      console.error(`Error executing custom code:`, error);
      throw error;
    }
  }
  
  private executeSql(data: any[], rule: TransformationRule): any[] {
    const { sql } = rule.parameters;
    
    if (!sql) {
      return data;
    }
    
    console.warn('SQL transformation is not fully implemented in this browser environment');
    
    // In real implementation, this would use a SQL engine like sql.js
    return data;
  }
  
  private executeFormula(data: any[], rule: TransformationRule): any[] {
    const { column, formula, targetColumn } = rule.parameters;
    
    if (!column || !formula || !targetColumn) {
      throw new Error('Missing column, formula or targetColumn parameter for FORMULA');
    }
    
    return data.map(item => {
      const result = { ...item };
      
      try {
        // Create a function that uses the item's properties
        const formulaFn = new Function(...Object.keys(item), `return ${formula}`);
        
        // Execute the formula with the item's values
        result[targetColumn] = formulaFn(...Object.values(item));
      } catch (error) {
        console.error(`Error executing formula for item:`, item, error);
        result[targetColumn] = null;
      }
      
      return result;
    });
  }
}

// Export a singleton instance
export const transformationService = new TransformationService();