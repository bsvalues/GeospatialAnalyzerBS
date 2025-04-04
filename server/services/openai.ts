import OpenAI from 'openai';
import { Property, EtlDataSource, EtlTransformationRule, EtlJob } from '@shared/schema';

/**
 * OpenAI Service
 * 
 * This service provides integration with OpenAI API for language model tasks like
 * converting natural language to code, explaining code, optimizing code,
 * performing contextual property value predictions, and providing ETL assistance.
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
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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

/**
 * Get ETL assistance based on user interaction context
 * @param context Current user context (page, action, etc.)
 * @param dataSources Available ETL data sources
 * @param userExperience User experience level (beginner/intermediate/expert)
 * @param previousInteractions Previous interactions with the assistant
 */
export const getETLAssistance = async (
  context: {
    page: string;
    action?: string;
    selectedSource?: EtlDataSource;
    selectedRule?: EtlTransformationRule;
    selectedJob?: EtlJob;
  },
  dataSources: EtlDataSource[] = [],
  userExperience: 'beginner' | 'intermediate' | 'expert' = 'beginner',
  previousInteractions: { question?: string; answer?: string }[] = []
): Promise<{
  message: string;
  tips: string[];
  suggestedActions: { label: string; description: string; action?: string }[];
}> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Build a context description
    let contextDescription = `User is on the ${context.page} page`;
    if (context.action) {
      contextDescription += ` performing ${context.action}`;
    }
    
    // Add information about selected data source if available
    if (context.selectedSource) {
      contextDescription += `\nSelected data source: ${context.selectedSource.name} (${context.selectedSource.type})`;
    }
    
    // Add information about selected transformation rule if available
    if (context.selectedRule) {
      contextDescription += `\nSelected transformation rule: ${context.selectedRule.name}`;
    }
    
    // Add information about selected job if available
    if (context.selectedJob) {
      contextDescription += `\nSelected ETL job: ${context.selectedJob.name} (Status: ${context.selectedJob.status})`;
    }
    
    // Add summarized information about available data sources
    let dataSourcesSummary = '';
    if (dataSources.length > 0) {
      const dataSourceTypes = dataSources.reduce((acc, source) => {
        acc[source.type] = (acc[source.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      dataSourcesSummary = 'Available data sources:\n';
      Object.entries(dataSourceTypes).forEach(([type, count]) => {
        dataSourcesSummary += `- ${count} ${type} source(s)\n`;
      });
    }
    
    // Include previous interactions for context
    let previousInteractionsText = '';
    if (previousInteractions.length > 0) {
      previousInteractionsText = 'Recent interactions:\n';
      previousInteractions.slice(-3).forEach((interaction, index) => {
        if (interaction.question) {
          previousInteractionsText += `User Q${index + 1}: ${interaction.question}\n`;
        }
        if (interaction.answer) {
          previousInteractionsText += `Assistant A${index + 1}: ${interaction.answer}\n`;
        }
      });
    }
    
    // Create a prompt for the ETL assistant
    const prompt = `
      Please provide ETL assistance to a user with ${userExperience} experience level.

      Current context:
      ${contextDescription}
      
      ${dataSourcesSummary}
      
      ${previousInteractionsText}
      
      Please provide:
      1. A helpful message related to the current context (personalized, encouraging, insightful)
      2. Up to 3 relevant tips for the current operation
      3. 2-3 suggested actions the user might want to take next
      
      Format your response as a structured JSON object with the following fields:
      - message: A personalized message for the user
      - tips: An array of strings with tips
      - suggestedActions: An array of objects with { label, description, action } fields
      
      Only respond with valid JSON.
    `;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'You are an ETL assistant for a property data management system. Your goal is to provide helpful, contextual guidance to users working with ETL processes. Be supportive, clear, and educational while avoiding overly technical jargon for beginners. For intermediate and expert users, provide more detailed technical information. Always aim to improve the user\'s understanding of ETL concepts and best practices.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const result = JSON.parse(content);
      
      // Format and validate the result
      return {
        message: result.message || 'Welcome to the ETL Management system! How can I help you today?',
        tips: Array.isArray(result.tips) ? result.tips : [
          'Make sure your data sources are properly configured before running ETL jobs',
          'Regular validation of your transformation rules helps maintain data quality',
          'Monitor job execution times to identify optimization opportunities'
        ],
        suggestedActions: Array.isArray(result.suggestedActions) ? result.suggestedActions : [
          { 
            label: 'Create New Data Source', 
            description: 'Set up a connection to a new data source',
            action: 'createDataSource'
          },
          {
            label: 'Configure Transformation Rules',
            description: 'Define how data should be processed',
            action: 'createTransformationRule'
          }
        ]
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Return a fallback if JSON parsing fails
      return {
        message: 'Welcome to the ETL Management system! I\'m here to help you manage your data pipelines effectively.',
        tips: [
          'Ensure your data sources have the correct connection details',
          'Test connections before setting up transformation rules',
          'Schedule regular ETL jobs for consistent data updates'
        ],
        suggestedActions: [
          { 
            label: 'Add Data Source', 
            description: 'Connect to a new database, API, or file source',
            action: 'createDataSource'
          },
          {
            label: 'Create Transformation', 
            description: 'Define rules to standardize and clean your data',
            action: 'createTransformationRule'
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error generating ETL assistance with OpenAI:', error);
    throw new Error('Failed to generate ETL assistance');
  }
};

/**
 * Get onboarding tips for ETL management features
 * @param feature The specific ETL feature the user is exploring
 * @param userExperience User experience level (beginner/intermediate/expert)
 */
export const getETLOnboardingTips = async (
  feature: 'data_sources' | 'transformation_rules' | 'jobs' | 'optimization' | 'general',
  userExperience: 'beginner' | 'intermediate' | 'expert' = 'beginner'
): Promise<{
  title: string;
  description: string;
  steps: { step: string; description: string }[];
  bestPractices: string[];
  commonPitfalls: string[];
}> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Create a prompt for onboarding tips
    const prompt = `
      Please provide onboarding tips for the ETL feature: "${feature}" 
      tailored to a user with ${userExperience} experience level.
      
      Please include:
      1. A short, engaging title
      2. A brief description of this feature's purpose
      3. 3-5 ordered steps for using this feature effectively
      4. 2-3 best practices
      5. 2-3 common pitfalls to avoid
      
      Format your response as a structured JSON object with the following fields:
      - title: A short, engaging title
      - description: A helpful description of the feature
      - steps: An array of objects with { step, description }
      - bestPractices: An array of strings with best practices
      - commonPitfalls: An array of strings with common mistakes to avoid
      
      Only respond with valid JSON.
    `;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'You are an ETL onboarding specialist for a property data management system. Your goal is to provide clear, educational guidance to new users learning about ETL features. Adapt your language based on the user\'s experience level - simpler explanations for beginners, and more technical details for intermediate and expert users. Focus on practical steps and actionable advice.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const result = JSON.parse(content);
      
      // Format and validate the result
      return {
        title: result.title || `Getting Started with ETL ${feature.replace('_', ' ')}`,
        description: result.description || `Learn how to use ${feature.replace('_', ' ')} effectively in your ETL workflows.`,
        steps: Array.isArray(result.steps) ? result.steps : [
          { step: 'Explore', description: 'Familiarize yourself with the interface and available options' },
          { step: 'Configure', description: 'Set up the necessary parameters and options' },
          { step: 'Test', description: 'Verify that your configuration works as expected' },
          { step: 'Implement', description: 'Apply your configuration to your production workflow' }
        ],
        bestPractices: Array.isArray(result.bestPractices) ? result.bestPractices : [
          'Document your configurations for future reference',
          'Regularly review and update your settings as requirements change'
        ],
        commonPitfalls: Array.isArray(result.commonPitfalls) ? result.commonPitfalls : [
          'Forgetting to validate data before processing',
          'Not monitoring performance metrics regularly'
        ]
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Return a fallback if JSON parsing fails
      return {
        title: `${feature.replace('_', ' ').charAt(0).toUpperCase() + feature.replace('_', ' ').slice(1)} Basics`,
        description: `Learn the essentials of ETL ${feature.replace('_', ' ')} to improve your data pipelines.`,
        steps: [
          { step: 'Understanding the UI', description: 'Familiarize yourself with the available controls and options' },
          { step: 'Basic Configuration', description: 'Set up essential parameters for your workflow' },
          { step: 'Testing', description: 'Validate your configuration with sample data' },
          { step: 'Integration', description: 'Incorporate this feature into your complete ETL process' }
        ],
        bestPractices: [
          'Start with simple configurations and gradually add complexity',
          'Use descriptive names for all components',
          'Document your decision-making process'
        ],
        commonPitfalls: [
          'Configuring overly complex workflows that are difficult to maintain',
          'Neglecting error handling and validation',
          'Failing to test with representative data samples'
        ]
      };
    }
  } catch (error) {
    console.error('Error generating ETL onboarding tips with OpenAI:', error);
    throw new Error('Failed to generate ETL onboarding tips');
  }
};

/**
 * Generate data source connection troubleshooting suggestions
 * @param dataSource The data source with connection issues
 * @param errorMessage Error message from connection attempt
 */
export const generateConnectionTroubleshooting = async (
  dataSource: EtlDataSource,
  errorMessage: string
): Promise<{
  possibleCauses: { cause: string; likelihood: 'high' | 'medium' | 'low' }[];
  suggestedFixes: { fix: string; description: string }[];
  validationChecks: string[];
}> => {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  try {
    // Create a prompt for troubleshooting
    const prompt = `
      I need help troubleshooting a connection issue with an ETL data source.
      
      Data Source Details:
      - Name: ${dataSource.name}
      - Type: ${dataSource.type}
      - Connection Details: ${JSON.stringify(dataSource.connectionDetails)}
      
      Error Message:
      ${errorMessage}
      
      Please provide:
      1. Possible causes of this issue with estimated likelihood (high/medium/low)
      2. Suggested fixes with descriptions
      3. Validation checks to verify the issue is resolved
      
      Format your response as a structured JSON object with the following fields:
      - possibleCauses: An array of objects with { cause, likelihood }
      - suggestedFixes: An array of objects with { fix, description }
      - validationChecks: An array of strings
      
      Only respond with valid JSON.
    `;
    
    // Make the API call
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'You are an ETL connection troubleshooting expert for a property data management system. Your goal is to help users diagnose and fix connection issues with their data sources. Provide practical, actionable suggestions based on the specific error message and data source type. Focus on common issues first before suggesting more complex solutions.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1024,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const result = JSON.parse(content);
      
      // Format and validate the result
      return {
        possibleCauses: Array.isArray(result.possibleCauses) ? result.possibleCauses : [
          { cause: 'Invalid connection credentials', likelihood: 'high' },
          { cause: 'Network connectivity issues', likelihood: 'medium' },
          { cause: 'Firewall blocking connection', likelihood: 'medium' }
        ],
        suggestedFixes: Array.isArray(result.suggestedFixes) ? result.suggestedFixes : [
          { fix: 'Verify credentials', description: 'Double-check username, password, and access tokens' },
          { fix: 'Check network connectivity', description: 'Ensure the host is reachable from your environment' },
          { fix: 'Review firewall settings', description: 'Make sure required ports are open for communication' }
        ],
        validationChecks: Array.isArray(result.validationChecks) ? result.validationChecks : [
          'Try connecting with a simple query to verify basic connectivity',
          'Check if you can access the data source through another tool',
          'Verify that the data source is online and accepting connections'
        ]
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Return a fallback if JSON parsing fails
      return {
        possibleCauses: [
          { cause: 'Authentication failure', likelihood: 'high' },
          { cause: 'Network connectivity issue', likelihood: 'medium' },
          { cause: 'Resource constraints or timeout', likelihood: 'low' }
        ],
        suggestedFixes: [
          { fix: 'Update credentials', description: 'Verify and update the username and password' },
          { fix: 'Check connection parameters', description: 'Verify host, port, and database name' },
          { fix: 'Test network connectivity', description: 'Use ping or telnet to verify basic connectivity' }
        ],
        validationChecks: [
          'Use the test connection button after making changes',
          'Try connecting with minimal permissions to verify authentication',
          'Check the source system\'s logs for failed connection attempts'
        ]
      };
    }
  } catch (error) {
    console.error('Error generating connection troubleshooting with OpenAI:', error);
    throw new Error('Failed to generate connection troubleshooting suggestions');
  }
};