// No imports needed

export interface TransformationContext {
  sourceColumns: string[];
  sourceRows: any[][];
  transformedColumns: string[];
  transformedRows: any[][];
  logs: string[];
  metrics: {
    startTime: number;
    endTime?: number;
    totalRowsProcessed: number;
    successfulTransformations: number;
    failedTransformations: number;
    processingTimeMs?: number;
  };
}

export interface TransformationResult {
  success: boolean;
  data?: {
    columns: string[];
    rows: any[][];
    totalRows: number;
  };
  metrics?: {
    processingTimeMs: number;
    successRate: number;
    errorRate: number;
  };
  error?: string;
  logs: string[];
}

export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  dataType: string;
  transformationCode: string;
  isActive: boolean;
}

export class TransformationService {
  /**
   * Apply transformations to the provided data
   */
  public static async transformData(
    data: { columns: string[]; rows: any[][] },
    transformationRuleIds: number[],
    options: { validateResults?: boolean } = {}
  ): Promise<TransformationResult> {
    try {
      const response = await fetch('/api/etl/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          transformationRuleIds,
          options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transform data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error transforming data:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transformation error',
        logs: ['Transformation failed', error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Test a transformation rule with sample data
   */
  public static async testTransformationRule(
    rule: Pick<TransformationRule, 'dataType' | 'transformationCode'>,
    sampleData: any[]
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> {
    try {
      const response = await fetch('/api/etl/transformation-rules/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rule,
          sampleData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test transformation rule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing transformation rule:', error);
      
      return {
        success: false,
        results: [],
        errors: [error instanceof Error ? error.message : 'Unknown error during transformation test']
      };
    }
  }

  /**
   * Generate a transformation rule suggestion based on data quality issues
   */
  public static async suggestTransformationRules(
    dataQualityIssues: { field: string; issue: string; severity: string }[],
    sampleData: { columns: string[]; rows: any[][] }
  ): Promise<{
    success: boolean;
    suggestions: {
      name: string;
      description: string;
      dataType: string;
      transformationCode: string;
      targetIssue: { field: string; issue: string };
    }[];
  }> {
    try {
      const response = await fetch('/api/etl/suggest-transformations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: dataQualityIssues,
          sampleData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate transformation suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error suggesting transformations:', error);
      
      return {
        success: false,
        suggestions: []
      };
    }
  }

  /**
   * Apply a specific data transformation operation to rows
   */
  public static applyTransformation(
    operation: string,
    rows: any[][],
    sourceIndex: number,
    targetIndex: number = -1,
    options: any = {}
  ): { rows: any[][]; transformedCount: number; errors: string[] } {
    let transformedCount = 0;
    const errors: string[] = [];
    const newRows = [...rows]; // Create a copy to avoid modifying the original

    try {
      switch (operation) {
        case 'fill_missing_values':
          // Fill missing values in targetIndex with values from sourceIndex or a default value
          targetIndex = targetIndex === -1 ? sourceIndex : targetIndex;
          const defaultValue = options.defaultValue;
          
          newRows.forEach((row, rowIndex) => {
            if (row[targetIndex] === null || row[targetIndex] === undefined || row[targetIndex] === '') {
              if (sourceIndex !== targetIndex) {
                // Use value from another column
                row[targetIndex] = row[sourceIndex];
              } else {
                // Use default value
                row[targetIndex] = defaultValue;
              }
              transformedCount++;
            }
          });
          break;
          
        case 'format_date':
          // Convert date strings to a consistent format
          const format = options.format || 'YYYY-MM-DD';
          
          newRows.forEach((row, rowIndex) => {
            try {
              const dateValue = row[sourceIndex];
              if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                  const formattedDate = this.formatDate(date, format);
                  
                  if (targetIndex === -1) {
                    row[sourceIndex] = formattedDate;
                  } else {
                    row[targetIndex] = formattedDate;
                  }
                  
                  transformedCount++;
                }
              }
            } catch (e) {
              errors.push(`Error formatting date at row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
            }
          });
          break;
          
        case 'number_format':
          // Format numbers (rounding, precision, etc.)
          const precision = options.precision !== undefined ? options.precision : 2;
          
          newRows.forEach((row, rowIndex) => {
            try {
              const value = row[sourceIndex];
              if (value !== null && value !== undefined && value !== '') {
                const number = Number(value);
                if (!isNaN(number)) {
                  const formatted = number.toFixed(precision);
                  
                  if (targetIndex === -1) {
                    row[sourceIndex] = formatted;
                  } else {
                    row[targetIndex] = formatted;
                  }
                  
                  transformedCount++;
                }
              }
            } catch (e) {
              errors.push(`Error formatting number at row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
            }
          });
          break;
          
        case 'text_case':
          // Change text case (uppercase, lowercase, title case)
          const caseType = options.caseType || 'upper';
          
          newRows.forEach((row, rowIndex) => {
            try {
              const value = row[sourceIndex];
              if (typeof value === 'string') {
                let transformed: string;
                
                switch (caseType) {
                  case 'upper':
                    transformed = value.toUpperCase();
                    break;
                  case 'lower':
                    transformed = value.toLowerCase();
                    break;
                  case 'title':
                    transformed = value
                      .toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    break;
                  default:
                    transformed = value;
                }
                
                if (targetIndex === -1) {
                  row[sourceIndex] = transformed;
                } else {
                  row[targetIndex] = transformed;
                }
                
                transformedCount++;
              }
            } catch (e) {
              errors.push(`Error transforming text case at row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
            }
          });
          break;
          
        case 'regex_replace':
          // Replace text based on regex pattern
          const pattern = options.pattern;
          const replacement = options.replacement || '';
          
          if (!pattern) {
            errors.push('Missing regex pattern for text replacement');
            break;
          }
          
          const regex = new RegExp(pattern, options.flags || 'g');
          
          newRows.forEach((row, rowIndex) => {
            try {
              const value = row[sourceIndex];
              if (typeof value === 'string') {
                const transformed = value.replace(regex, replacement);
                
                if (targetIndex === -1) {
                  row[sourceIndex] = transformed;
                } else {
                  row[targetIndex] = transformed;
                }
                
                transformedCount++;
              }
            } catch (e) {
              errors.push(`Error applying regex replacement at row ${rowIndex}: ${e instanceof Error ? e.message : String(e)}`);
            }
          });
          break;
          
        default:
          errors.push(`Unknown transformation operation: ${operation}`);
      }
    } catch (e) {
      errors.push(`Transformation error: ${e instanceof Error ? e.message : String(e)}`);
    }

    return {
      rows: newRows,
      transformedCount,
      errors
    };
  }

  /**
   * Format a date according to the specified format string
   */
  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
}