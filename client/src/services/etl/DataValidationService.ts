// No imports needed

export interface ValidationRule {
  id: string;
  name: string;
  field: string;
  description: string;
  type: 'required' | 'format' | 'range' | 'uniqueness' | 'consistency' | 'regex' | 'custom';
  severity: 'low' | 'medium' | 'high';
  parameters?: {
    min?: number;
    max?: number;
    pattern?: string;
    acceptedValues?: string[];
    format?: string;
    customValidator?: (value: any) => boolean;
  };
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  summary: {
    total: number;
    byField: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
}

export interface ValidationError {
  field: string;
  value: any;
  rule: ValidationRule;
  message: string;
  rowIndex?: number;
}

export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  rowIndices?: number[];
  affectedCount?: number;
  examples?: any[];
}

export interface DataQualityAnalysisResult {
  totalIssues: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: DataQualityIssue[];
  summary: string;
  aiRecommendations?: string[];
}

export class DataValidationService {
  /**
   * Performs a comprehensive data quality analysis
   */
  public static async analyzeDataQuality(
    name: string,
    type: string,
    columns: string[],
    rows: any[][]
  ): Promise<DataQualityAnalysisResult> {
    try {
      const response = await fetch('/api/etl/analyze-data-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          type,
          columns,
          rows
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze data quality');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing data quality:', error);
      
      // In a React component we would use useToast directly, but since this is a static class method,
      // we'll just log the error to console and return the error response
      
      // Return default error response
      return {
        totalIssues: 0,
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        issues: [],
        summary: 'Failed to analyze data quality'
      };
    }
  }

  /**
   * Validates data against a set of rules
   */
  public static validateData(
    data: any[], 
    rules: ValidationRule[], 
    options: { stopOnFirstError?: boolean } = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const fieldErrors: Record<string, number> = {};
    const severityErrors: Record<string, number> = {};
    const typeErrors: Record<string, number> = {};
    
    let totalFields = 0;
    let missingValues = 0;
    let formatErrors = 0;
    let consistencyErrors = 0;

    data.forEach((row, rowIndex) => {
      rules.forEach(rule => {
        // Skip validation for rules that don't apply to this row
        if (!row.hasOwnProperty(rule.field)) {
          return;
        }

        totalFields++;
        const value = row[rule.field];
        const isValid = this.validateByRule(value, rule);

        if (!isValid) {
          const error: ValidationError = {
            field: rule.field,
            value,
            rule,
            message: rule.message,
            rowIndex
          };
          
          errors.push(error);
          
          // Track error statistics
          fieldErrors[rule.field] = (fieldErrors[rule.field] || 0) + 1;
          severityErrors[rule.severity] = (severityErrors[rule.severity] || 0) + 1;
          typeErrors[rule.type] = (typeErrors[rule.type] || 0) + 1;
          
          // Track quality metrics
          if (rule.type === 'required' && (value === null || value === undefined || value === '')) {
            missingValues++;
          } else if (rule.type === 'format' || rule.type === 'regex') {
            formatErrors++;
          } else if (rule.type === 'consistency') {
            consistencyErrors++;
          }
          
          // Stop on first error if specified
          if (options.stopOnFirstError) {
            return;
          }
        }
      });
    });

    // Calculate quality scores (0-100)
    const completenessScore = totalFields > 0 ? Math.round(((totalFields - missingValues) / totalFields) * 100) : 100;
    const accuracyScore = totalFields > 0 ? Math.round(((totalFields - formatErrors) / totalFields) * 100) : 100;
    const consistencyScore = totalFields > 0 ? Math.round(((totalFields - consistencyErrors) / totalFields) * 100) : 100;

    return {
      isValid: errors.length === 0,
      errors,
      summary: {
        total: errors.length,
        byField: fieldErrors,
        bySeverity: severityErrors,
        byType: typeErrors
      },
      completenessScore,
      accuracyScore,
      consistencyScore
    };
  }

  /**
   * Validates a single value against a validation rule
   */
  private static validateByRule(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
        
      case 'format':
        if (!rule.parameters?.format) return true;
        
        switch (rule.parameters.format) {
          case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          case 'phone':
            return /^\+?[\d\s-()]{7,}$/.test(value);
          case 'date':
            return !isNaN(Date.parse(value));
          case 'number':
            return !isNaN(Number(value));
          case 'integer':
            return Number.isInteger(Number(value));
          case 'url':
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          default:
            return true;
        }
        
      case 'range':
        const num = Number(value);
        const min = rule.parameters?.min;
        const max = rule.parameters?.max;
        
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        
        return true;
        
      case 'uniqueness':
        // Uniqueness validation requires context of all values, 
        // typically handled at a higher level
        return true;
        
      case 'consistency':
        // Consistency validation requires context,
        // typically handled at a higher level
        return true;
        
      case 'regex':
        if (!rule.parameters?.pattern) return true;
        const regex = new RegExp(rule.parameters.pattern);
        return regex.test(String(value));
        
      case 'custom':
        if (!rule.parameters?.customValidator) return true;
        return rule.parameters.customValidator(value);
        
      default:
        return true;
    }
  }

  /**
   * Generates common validation rules for a dataset based on column names
   */
  public static generateDefaultRules(columns: string[]): ValidationRule[] {
    const rules: ValidationRule[] = [];
    const id = (Math.random() * 10000).toFixed(0);
    
    columns.forEach((column, index) => {
      const lowerColumn = column.toLowerCase();
      
      // Required fields
      if (lowerColumn.includes('id') || 
          lowerColumn.includes('name') || 
          lowerColumn.includes('key') ||
          lowerColumn === 'address' ||
          lowerColumn === 'parcel_id') {
        rules.push({
          id: `req_${id}_${index}`,
          name: `${column} Required`,
          field: column,
          type: 'required',
          severity: 'high',
          description: `${column} must not be empty`,
          message: `${column} is required`
        });
      }
      
      // Email validation
      if (lowerColumn.includes('email')) {
        rules.push({
          id: `email_${id}_${index}`,
          name: `${column} Format`,
          field: column,
          type: 'format',
          severity: 'medium',
          description: `${column} must be a valid email address`,
          parameters: { format: 'email' },
          message: `${column} must be a valid email address`
        });
      }
      
      // Date validation
      if (lowerColumn.includes('date') || 
          lowerColumn.includes('time') ||
          lowerColumn.includes('created_at') ||
          lowerColumn.includes('updated_at')) {
        rules.push({
          id: `date_${id}_${index}`,
          name: `${column} Format`,
          field: column,
          type: 'format',
          severity: 'medium',
          description: `${column} must be a valid date`,
          parameters: { format: 'date' },
          message: `${column} must be a valid date`
        });
      }
      
      // Number validation
      if (lowerColumn.includes('amount') || 
          lowerColumn.includes('price') ||
          lowerColumn.includes('cost') ||
          lowerColumn.includes('value') ||
          lowerColumn.includes('square_feet') ||
          lowerColumn.includes('sqft') ||
          lowerColumn.includes('area') ||
          lowerColumn.includes('size')) {
        rules.push({
          id: `num_${id}_${index}`,
          name: `${column} Format`,
          field: column,
          type: 'format',
          severity: 'medium',
          description: `${column} must be a valid number`,
          parameters: { format: 'number' },
          message: `${column} must be a valid number`
        });
      }
      
      // URL validation
      if (lowerColumn.includes('url') || 
          lowerColumn.includes('website') ||
          lowerColumn.includes('link')) {
        rules.push({
          id: `url_${id}_${index}`,
          name: `${column} Format`,
          field: column,
          type: 'format',
          severity: 'low',
          description: `${column} must be a valid URL`,
          parameters: { format: 'url' },
          message: `${column} must be a valid URL`
        });
      }
    });
    
    return rules;
  }
}