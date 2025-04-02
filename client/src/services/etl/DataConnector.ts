/**
 * Data Connector Interface
 * 
 * This interface defines the standard contract that all data connectors
 * must implement to ensure consistency across different data sources.
 */

/**
 * DataConnector interface for connecting to external data sources
 */
export interface DataConnector {
  /**
   * Get the name of this data source
   * @returns {string} The name of the data source
   */
  getSourceName(): string;
  
  /**
   * Check if the data source is available and ready to use
   * @returns {Promise<boolean>} True if the data source is available, false otherwise
   */
  checkAvailability(): Promise<boolean>;
}