import OpenAI from 'openai';
import { Property } from '@shared/schema';

/**
 * OpenAI Service
 * 
 * This service provides integration with OpenAI API for language model tasks like
 * converting natural language to code, explaining code, optimizing code,
 * and performing contextual property value predictions.
 */

// Singleton instance of OpenAI client
let openaiClient: OpenAI | null = null;

// Initialize the OpenAI client with API key
const getOpenAIClient = (): OpenAI | null => {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

// Check if OpenAI API is configured
export const isOpenAIConfigured = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};

/**
 * Transform natural language to JavaScript code
 * @param naturalLanguage Natural language description of code functionality
 * @param context Additional context to provide to the model (e.g., available data)
 */
export const generateCodeFromLanguage = async (
  naturalLanguage: string,
  context?: { properties?: boolean; transformedData?: boolean; dataStructures?: string }
): Promise<{ code: string; explanation: string }> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Build system message with context about available data
    let systemMessage = 'You are an expert JavaScript programmer specializing in data analysis. ';
    systemMessage += 'Transform natural language into clean, efficient JavaScript code. ';
    systemMessage += 'The code will be executed in a browser environment with the following objects available:\n';
    
    // Add context about available data
    if (context?.properties) {
      systemMessage += '- properties: Array of property objects with fields like id, address, value, squareFeet, yearBuilt, etc.\n';
    }
    
    if (context?.transformedData) {
      systemMessage += '- transformedData: Processed data from ETL pipelines\n';
    }
    
    if (context?.dataStructures) {
      systemMessage += `- Available data structures: ${context.dataStructures}\n`;
    }
    
    systemMessage += '\nProvide only valid JavaScript code that returns a result. Do not include explanations in the code itself.';
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Using the latest model for best code generation
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: naturalLanguage }
      ],
      temperature: 0.2, // Low temperature for more deterministic code generation
      max_tokens: 2048
    });
    
    const content = response.choices[0]?.message?.content?.trim() || '';
    
    // Extract code from the response
    let code = content;
    
    // If the response includes markdown code blocks, extract just the code
    if (content.includes('```javascript')) {
      const match = content.match(/```javascript\n([\s\S]*?)```/);
      code = match ? match[1].trim() : content;
    } else if (content.includes('```js')) {
      const match = content.match(/```js\n([\s\S]*?)```/);
      code = match ? match[1].trim() : content;
    } else if (content.includes('```')) {
      const match = content.match(/```\n([\s\S]*?)```/);
      code = match ? match[1].trim() : content;
    }
    
    // Get an explanation of the code
    const explanationResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are a JavaScript expert who explains code in clear, concise terms. Explain what the following code does, including key algorithms or techniques used.' 
        },
        { role: 'user', content: `Explain this JavaScript code:\n\n${code}` }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    
    const explanation = explanationResponse.choices[0]?.message?.content?.trim() || '';
    
    return {
      code,
      explanation
    };
  } catch (error) {
    console.error('Error generating code from OpenAI:', error);
    throw new Error('Failed to generate code from natural language description');
  }
};

/**
 * Optimize existing JavaScript code
 * @param code The JavaScript code to optimize
 * @param instructions Specific optimization instructions
 */
export const optimizeCode = async (
  code: string,
  instructions?: string
): Promise<{ optimizedCode: string; explanation: string }> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Build prompt with optimization instructions
    let prompt = 'Optimize the following JavaScript code';
    if (instructions) {
      prompt += ` with focus on ${instructions}`;
    }
    prompt += ':\n\n' + code;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert JavaScript programmer who specializes in optimization. Provide clean, efficient, optimized JavaScript code.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2048
    });
    
    const content = response.choices[0]?.message?.content?.trim() || '';
    
    // Extract optimized code from the response
    let optimizedCode = content;
    
    // If the response includes markdown code blocks, extract just the code
    if (content.includes('```javascript')) {
      const match = content.match(/```javascript\n([\s\S]*?)```/);
      optimizedCode = match ? match[1].trim() : content;
    } else if (content.includes('```js')) {
      const match = content.match(/```js\n([\s\S]*?)```/);
      optimizedCode = match ? match[1].trim() : content;
    } else if (content.includes('```')) {
      const match = content.match(/```\n([\s\S]*?)```/);
      optimizedCode = match ? match[1].trim() : content;
    }
    
    // Get an explanation of the optimizations
    const explanationResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are a JavaScript expert who explains code optimizations clearly and concisely. Explain what optimizations were made and why.' 
        },
        { 
          role: 'user', 
          content: `Original code:\n\n${code}\n\nOptimized code:\n\n${optimizedCode}\n\nExplain what optimizations were made and why they improve the code.` 
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    
    const explanation = explanationResponse.choices[0]?.message?.content?.trim() || '';
    
    return {
      optimizedCode,
      explanation
    };
  } catch (error) {
    console.error('Error optimizing code with OpenAI:', error);
    throw new Error('Failed to optimize code');
  }
};

/**
 * Debug JavaScript code by identifying and fixing issues
 * @param code The JavaScript code to debug
 * @param errorMessage Error message if available
 */
export const debugCode = async (
  code: string,
  errorMessage?: string
): Promise<{ fixedCode: string; explanation: string }> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Build prompt with the code and error message
    let prompt = 'Debug the following JavaScript code';
    if (errorMessage) {
      prompt += ` which produces this error: "${errorMessage}"`;
    }
    prompt += ':\n\n' + code;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert JavaScript debugger. Identify and fix issues in the provided code.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2048
    });
    
    const content = response.choices[0]?.message?.content?.trim() || '';
    
    // Extract fixed code from the response
    let fixedCode = content;
    
    // If the response includes markdown code blocks, extract just the code
    if (content.includes('```javascript')) {
      const match = content.match(/```javascript\n([\s\S]*?)```/);
      fixedCode = match ? match[1].trim() : content;
    } else if (content.includes('```js')) {
      const match = content.match(/```js\n([\s\S]*?)```/);
      fixedCode = match ? match[1].trim() : content;
    } else if (content.includes('```')) {
      const match = content.match(/```\n([\s\S]*?)```/);
      fixedCode = match ? match[1].trim() : content;
    }
    
    // Get an explanation of the fixes
    const explanationResponse = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are a JavaScript expert who explains code fixes clearly and concisely. Explain what issues were fixed and why.' 
        },
        { 
          role: 'user', 
          content: `Original code with issues:\n\n${code}\n\nFixed code:\n\n${fixedCode}\n\nExplain what issues were fixed and why these changes resolve the problems.` 
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    
    const explanation = explanationResponse.choices[0]?.message?.content?.trim() || '';
    
    return {
      fixedCode,
      explanation
    };
  } catch (error) {
    console.error('Error debugging code with OpenAI:', error);
    throw new Error('Failed to debug code');
  }
};

/**
 * Generate contextual property value predictions with AI insights
 * @param property The property to analyze
 * @param context Additional contextual information
 * @param mlPrediction Machine learning baseline prediction
 * @param comparableProperties Array of comparable properties
 */
export const generateContextualPropertyPrediction = async (
  property: Property,
  context: string,
  mlPrediction: number,
  comparableProperties: Property[] = []
): Promise<{
  predictedValue: number;
  confidence: number;
  adjustmentFactors: { factor: string; impact: number; description: string }[];
  explanation: string;
  comparableProperties?: {
    property: Property;
    similarity: number;
    adjustedValue: number;
    keyDifferences: {
      factor: string;
      propertyValue: string | number;
      comparableValue: string | number;
      impact: number;
    }[];
  }[];
}> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Prepare a structured summary of the property
    const propertySummary = `
      Property ID: ${property.id}
      Address: ${property.address}
      Size: ${property.squareFeet} sq ft
      Year Built: ${property.yearBuilt}
      Bedrooms: ${property.bedrooms}
      Bathrooms: ${property.bathrooms}
      Lot Size: ${property.lotSize} sq ft
      Neighborhood: ${property.neighborhood}
      Current Value: $${property.value}
      Land Value: $${property.landValue}
    `;
    
    // Prepare description of comparable properties
    let comparablesSummary = '';
    if (comparableProperties.length > 0) {
      comparablesSummary = 'Comparable Properties:\n';
      comparableProperties.slice(0, 5).forEach((comp, index) => {
        comparablesSummary += `
          Comparable #${index + 1}:
          ID: ${comp.id}
          Address: ${comp.address}
          Size: ${comp.squareFeet} sq ft
          Year Built: ${comp.yearBuilt}
          Bedrooms: ${comp.bedrooms}
          Bathrooms: ${comp.bathrooms}
          Value: $${comp.value}
          Distance: unknown miles
        `;
      });
    }
    
    // Create a comprehensive prompt for the AI
    const prompt = `
      I need to generate a property valuation with contextual insights.
      
      Subject Property:
      ${propertySummary}
      
      ${comparablesSummary}
      
      User-provided context about this property:
      ${context}
      
      Machine Learning baseline prediction: $${mlPrediction}
      
      Please analyze this property and provide:
      1. A predicted value based on the provided information
      2. Your confidence level (0.0-1.0) in this prediction
      3. Key adjustment factors that influenced your valuation (and their impact in %)
      4. A brief explanation of your valuation approach
      5. Analysis of the comparable properties, including similarity scores and key differences
      
      Format your response as a structured JSON object. Only respond with valid JSON.
    `;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert real estate appraiser with extensive knowledge of property valuation techniques, market analysis, and property comparisons. Provide detailed, accurate property valuations with quantitative adjustments and clear reasoning.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' } // Ensure we get a valid JSON response
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const result = JSON.parse(content);
      
      // Format and validate the result
      return {
        predictedValue: Number(result.predictedValue || mlPrediction * 1.05),
        confidence: Number(result.confidence || 0.6),
        adjustmentFactors: result.adjustmentFactors || [
          { factor: 'Base ML Model', impact: 0, description: 'Base machine learning prediction' }
        ],
        explanation: result.explanation || 'Generated using AI-enhanced contextual valuation model with machine learning baseline',
        comparableProperties: result.comparableProperties
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Return a fallback if JSON parsing fails
      return {
        predictedValue: mlPrediction * 1.05, // 5% adjustment as fallback
        confidence: 0.6,
        adjustmentFactors: [
          { factor: 'Market Trend', impact: 5, description: 'General market appreciation applied as fallback' }
        ],
        explanation: 'AI contextual analysis produced invalid format, using ML prediction with market adjustment factor.',
        comparableProperties: comparableProperties.slice(0, 3).map(prop => ({
          property: prop,
          similarity: 0.8,
          adjustedValue: parseFloat(prop.value || '0'),
          keyDifferences: []
        }))
      };
    }
  } catch (error) {
    console.error('Error generating contextual property prediction with OpenAI:', error);
    throw new Error('Failed to generate contextual property prediction');
  }
};