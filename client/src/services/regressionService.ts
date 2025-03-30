import { Property } from '@shared/schema';
import { calculateDistance } from './spatialAnalysisService';

/**
 * Interface for regression model results
 */
export interface RegressionModel {
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
  observations: number;
  standardErrors: Record<string, number>;
  tValues: Record<string, number>;
  pValues: Record<string, number>;
  usedVariables: string[];
  targetVariable: string;
  residuals: number[];
  predictedValues: number[];
  actualValues: number[];
  diagnostics: {
    collinearity: boolean;
    vif: Record<string, number>;
    missingValueCount: number;
    noSignificantVariables: boolean;
    heteroskedasticity: boolean;
    spatialAutocorrelation: boolean;
  };
  usedObservations: number;
  dataMean: number;
  dataStd: number;
  modelName?: string;
  createdAt?: Date;
}

/**
 * Interface for GWR regression results
 */
export interface GWRegressionModel extends RegressionModel {
  localCoefficients: Array<Record<string, number>>;
  localIntercepts: number[];
  localRSquared: number[];
  globalRSquared: number;
  bandwidth: number;
  kernel: string;
  coordinates: Array<[number, number]>;
}

/**
 * Kernel types for GWR
 */
export enum KernelType {
  GAUSSIAN = 'gaussian',
  EXPONENTIAL = 'exponential',
  BISQUARE = 'bisquare',
  TRICUBE = 'tricube',
  BOXCAR = 'boxcar'
}

/**
 * Options for regression calculations
 */
export interface RegressionOptions {
  weighted?: boolean;
  weights?: number[];
  robust?: boolean;
  spatialLag?: boolean;
  spatialError?: boolean;
  gwr?: boolean;
  gwrOptions?: {
    bandwidth?: number;
    kernel?: KernelType;
    adaptive?: boolean;
  };
}

/**
 * Transforms a dataset into a design matrix for regression
 * @param properties Array of properties
 * @param variables Array of variable names to include
 * @returns Object containing X matrix, y vector, and column names
 */
export function createDesignMatrix(
  properties: Property[],
  targetVariable: string,
  variables: string[]
) {
  // Filter out properties with missing values in target or any independent variables
  const validProperties = properties.filter(property => {
    const targetValue = getPropertyValue(property, targetVariable);
    if (targetValue === null || targetValue === undefined) return false;

    for (const variable of variables) {
      const value = getPropertyValue(property, variable);
      if (value === null || value === undefined) return false;
    }

    return true;
  });

  const n = validProperties.length;
  const p = variables.length + 1; // +1 for intercept

  // Create empty matrices
  const X = Array(n).fill(0).map(() => Array(p).fill(0));
  const y = Array(n).fill(0);
  const columnNames = ['intercept', ...variables];

  // Fill matrices
  for (let i = 0; i < n; i++) {
    // Set intercept to 1
    X[i][0] = 1;

    // Set independent variables
    for (let j = 0; j < variables.length; j++) {
      X[i][j + 1] = parseFloat(String(getPropertyValue(validProperties[i], variables[j])));
    }

    // Set target variable
    y[i] = parseFloat(String(getPropertyValue(validProperties[i], targetVariable)));
  }

  return {
    X,
    y,
    columnNames,
    properties: validProperties
  };
}

/**
 * Gets a value from a property by path
 * @param property Property object
 * @param path Path to property (e.g. 'landValue', 'attributes.someProp')
 * @returns Value at path or undefined
 */
function getPropertyValue(property: Property, path: string): any {
  const parts = path.split('.');
  let current: any = property;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Calculates the transpose of a matrix
 * @param matrix Input matrix
 * @returns Transposed matrix
 */
function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}

/**
 * Multiplies two matrices
 * @param a First matrix
 * @param b Second matrix
 * @returns Result of a * b
 */
function matrixMultiply(a: number[][], b: number[][]): number[][] {
  const rowsA = a.length;
  const colsA = a[0].length;
  const rowsB = b.length;
  const colsB = b[0].length;

  if (colsA !== rowsB) {
    throw new Error('Matrix dimensions do not match for multiplication');
  }

  const result = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

/**
 * Matrix-vector multiplication
 * @param matrix Matrix
 * @param vector Vector
 * @returns Result of matrix * vector
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  const rows = matrix.length;
  const cols = matrix[0].length;

  if (cols !== vector.length) {
    throw new Error('Matrix dimensions do not match for multiplication');
  }

  const result = Array(rows).fill(0);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }

  return result;
}

/**
 * Inverts a matrix using Gaussian elimination
 * @param matrix Square matrix to invert
 * @returns Inverted matrix
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;

  // Create augmented matrix [A|I]
  const augmented = [];
  for (let i = 0; i < n; i++) {
    augmented[i] = [...matrix[i]];
    for (let j = 0; j < n; j++) {
      augmented[i].push(i === j ? 1 : 0);
    }
  }

  // Gaussian elimination (forward elimination)
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = j;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Check for singularity
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular and cannot be inverted');
    }

    // Scale row i to make pivot 1
    const pivot = augmented[i][i];
    for (let j = i; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const factor = augmented[j][i];
      for (let k = i; k < 2 * n; k++) {
        augmented[j][k] -= factor * augmented[i][k];
      }
    }
  }

  // Extract the inverse
  const inverse = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      inverse[i][j] = augmented[i][j + n];
    }
  }

  return inverse;
}

/**
 * Calculates the mean of an array
 * @param array Input array
 * @returns Mean value
 */
function mean(array: number[]): number {
  return array.reduce((a, b) => a + b, 0) / array.length;
}

/**
 * Calculates the standard deviation of an array
 * @param array Input array
 * @returns Standard deviation
 */
function standardDeviation(array: number[]): number {
  const avg = mean(array);
  const squareDiffs = array.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculates OLS regression
 * @param properties Array of properties
 * @param targetVariable Name of target variable
 * @param variables Array of independent variable names
 * @param options Regression options
 * @returns Regression model results
 */
export function calculateOLSRegression(
  properties: Property[],
  targetVariable: string,
  variables: string[],
  options: RegressionOptions = {}
): RegressionModel {
  // Check for sufficient observations
  if (properties.length <= variables.length + 1) {
    throw new Error('Insufficient observations for regression');
  }

  // Create design matrix
  const { X, y, columnNames, properties: validProperties } = createDesignMatrix(
    properties,
    targetVariable,
    variables
  );

  const n = X.length; // Number of observations
  const p = X[0].length; // Number of parameters (including intercept)

  if (n <= p) {
    throw new Error('Insufficient observations for regression');
  }

  // Calculate regression coefficients: β = (X'X)^-1 X'y
  const XT = transpose(X);
  const XTX = matrixMultiply(XT, X);
  const XTXInv = invertMatrix(XTX);
  const XTy = matrixVectorMultiply(XT, y);
  const beta = matrixVectorMultiply(XTXInv, XTy);

  // Extract coefficients
  const intercept = beta[0];
  const coefficients: Record<string, number> = {};
  for (let i = 1; i < columnNames.length; i++) {
    coefficients[columnNames[i]] = beta[i];
  }

  // Calculate fitted values
  const yHat = matrixVectorMultiply(X, beta);

  // Calculate residuals
  const residuals = y.map((actual, i) => actual - yHat[i]);

  // Calculate total sum of squares
  const yMean = mean(y);
  const TSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);

  // Calculate residual sum of squares
  const RSS = residuals.reduce((sum, val) => sum + Math.pow(val, 2), 0);

  // Calculate explained sum of squares
  const ESS = TSS - RSS;

  // Calculate R-squared
  const rSquared = ESS / TSS;

  // Calculate adjusted R-squared
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - p));

  // Calculate F-statistic
  const fStatistic = (ESS / (p - 1)) / (RSS / (n - p));

  // Calculate p-value of F-statistic (approximation)
  const pValue = 1 - fDistributionCDF(fStatistic, p - 1, n - p);

  // Calculate standard errors of coefficients
  const MSE = RSS / (n - p); // Mean square error
  const varBeta = XTXInv.map(row => row.map(val => val * MSE));
  const standardErrors: Record<string, number> = {};
  for (let i = 1; i < columnNames.length; i++) {
    standardErrors[columnNames[i]] = Math.sqrt(varBeta[i][i]);
  }

  // Calculate t-values
  const tValues: Record<string, number> = {};
  for (const variable of variables) {
    tValues[variable] = coefficients[variable] / standardErrors[variable];
  }

  // Calculate p-values
  const pValues: Record<string, number> = {};
  for (const variable of variables) {
    const tAbs = Math.abs(tValues[variable]);
    pValues[variable] = 2 * (1 - tDistributionCDF(tAbs, n - p));
  }

  // Check for multicollinearity using VIF
  const vif: Record<string, number> = {};
  for (let i = 1; i < variables.length + 1; i++) {
    // Create X matrix without the current variable
    const Xreduced = X.map(row => [...row.slice(0, i), ...row.slice(i + 1)]);
    const XReducedT = transpose(Xreduced);
    const XReducedTXReduced = matrixMultiply(XReducedT, Xreduced);
    
    try {
      const XReducedTXReducedInv = invertMatrix(XReducedTXReduced);
      const XReduced_i = X.map(row => row[i]);
      const XReducedTXReduced_i = matrixVectorMultiply(XReducedT, XReduced_i);
      const result = matrixVectorMultiply(XReducedTXReducedInv, XReducedTXReduced_i);
      const R2 = matrixVectorMultiply(result, matrixVectorMultiply(XReducedT, XReduced_i)) / matrixVectorMultiply(X.map(row => row[i]), X.map(row => row[i]));
      vif[variables[i - 1]] = 1 / (1 - R2);
    } catch (e) {
      // If matrix is singular, VIF is infinite (perfect multicollinearity)
      vif[variables[i - 1]] = Infinity;
    }
  }

  // Determine if there's collinearity
  const collinearity = Object.values(vif).some(v => v > 10);

  // Check if any variables are significant
  const noSignificantVariables = Object.values(pValues).every(p => p > 0.05);

  // Check for heteroskedasticity (Breusch-Pagan test)
  const residualsSquared = residuals.map(r => r * r);
  const residualsMean = mean(residualsSquared);
  const normalizedResiduals = residualsSquared.map(r => r / residualsMean);
  
  // Use X matrix for auxiliary regression
  const auxReg = calculateSimpleRegression(X, normalizedResiduals);
  const bpStatistic = auxReg.rSquared * n;
  const bpPvalue = 1 - chiSquareCDF(bpStatistic, p - 1);
  const heteroskedasticity = bpPvalue < 0.05;

  // Check for spatial autocorrelation in residuals (simplified Moran's I)
  let spatialAutocorrelation = false;
  if (validProperties.length > 0 && 
      'latitude' in validProperties[0] && 
      'longitude' in validProperties[0]) {
    
    // Calculate spatial weights matrix (simplified - using inverse distance)
    const coords = validProperties.map(p => [p.latitude!, p.longitude!]);
    const W: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const dist = calculateDistance(
            {lat: coords[i][0], lng: coords[i][1]},
            {lat: coords[j][0], lng: coords[j][1]}
          );
          W[i][j] = 1 / (dist + 0.0001); // Add small constant to avoid division by zero
        }
      }
    }
    
    // Row-normalize the weights matrix
    for (let i = 0; i < n; i++) {
      const rowSum = W[i].reduce((a, b) => a + b, 0);
      if (rowSum > 0) {
        for (let j = 0; j < n; j++) {
          W[i][j] /= rowSum;
        }
      }
    }
    
    // Calculate Moran's I
    const residualMean = mean(residuals);
    const numerator = residuals.reduce((sum, ri, i) => {
      return sum + residuals.reduce((innerSum, rj, j) => {
        return innerSum + W[i][j] * (ri - residualMean) * (rj - residualMean);
      }, 0);
    }, 0);
    
    const denominator = residuals.reduce((sum, r) => sum + Math.pow(r - residualMean, 2), 0);
    const moransI = (n / W.flat().reduce((a, b) => a + b, 0)) * (numerator / denominator);
    
    // Expected value of Moran's I under null hypothesis
    const expectedI = -1 / (n - 1);
    
    // Simplified variance calculation
    const s1 = 0.5 * W.flat().reduce((sum, w) => sum + Math.pow(w + W.flat()[0], 2), 0);
    const s2 = W.reduce((sum, row, i) => sum + Math.pow(row.reduce((a, b) => a + b, 0) + W.map(r => r[i]).reduce((a, b) => a + b, 0), 2), 0);
    const s0 = W.flat().reduce((a, b) => a + b, 0);
    
    const varI = (n * ((n*n - 3*n + 3)*s1 - n*s2 + 3*s0*s0) - 
                  (n*n - n)*s1 - 2*n*s2 + 6*s0*s0) / 
                 ((n - 1)*(n - 2)*(n - 3)*s0*s0);
    
    // Z-score
    const zScore = (moransI - expectedI) / Math.sqrt(varI);
    
    // p-value (two-tailed test)
    const pValueMoransI = 2 * (1 - normalCDF(Math.abs(zScore)));
    
    spatialAutocorrelation = pValueMoransI < 0.05;
  }

  // Return regression model
  return {
    coefficients,
    intercept,
    rSquared,
    adjustedRSquared,
    fStatistic,
    pValue,
    observations: n,
    standardErrors,
    tValues,
    pValues,
    usedVariables: variables,
    targetVariable,
    residuals,
    predictedValues: yHat,
    actualValues: y,
    diagnostics: {
      collinearity,
      vif,
      missingValueCount: properties.length - validProperties.length,
      noSignificantVariables,
      heteroskedasticity,
      spatialAutocorrelation
    },
    usedObservations: validProperties.length,
    dataMean: yMean,
    dataStd: standardDeviation(y)
  };
}

/**
 * Helper function to calculate simple regression for auxiliary tests
 */
function calculateSimpleRegression(X: number[][], y: number[]) {
  const n = X.length;
  const p = X[0].length;
  
  // Calculate regression coefficients: β = (X'X)^-1 X'y
  const XT = transpose(X);
  const XTX = matrixMultiply(XT, X);
  const XTXInv = invertMatrix(XTX);
  const XTy = matrixVectorMultiply(XT, y);
  const beta = matrixVectorMultiply(XTXInv, XTy);
  
  // Calculate fitted values
  const yHat = matrixVectorMultiply(X, beta);
  
  // Calculate residuals
  const residuals = y.map((actual, i) => actual - yHat[i]);
  
  // Calculate total sum of squares
  const yMean = mean(y);
  const TSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  
  // Calculate residual sum of squares
  const RSS = residuals.reduce((sum, val) => sum + Math.pow(val, 2), 0);
  
  // Calculate explained sum of squares
  const ESS = TSS - RSS;
  
  // Calculate R-squared
  const rSquared = ESS / TSS;
  
  return { beta, rSquared };
}

/**
 * Calculate Geographical Weighted Regression
 * @param properties Array of properties
 * @param targetVariable Name of target variable
 * @param variables Array of independent variable names
 * @param options GWR options
 * @returns GWR model results
 */
export function calculateGWRRegression(
  properties: Property[],
  targetVariable: string,
  variables: string[],
  options: {
    bandwidth?: number;
    kernel?: KernelType;
    adaptive?: boolean;
  } = {}
): GWRegressionModel {
  // Create design matrix
  const { X, y, columnNames, properties: validProperties } = createDesignMatrix(
    properties,
    targetVariable,
    variables
  );

  const n = X.length; // Number of observations
  const p = X[0].length; // Number of parameters (including intercept)

  if (n <= p) {
    throw new Error('Insufficient observations for GWR');
  }

  // Get coordinates
  if (!validProperties.every(p => p.latitude !== null && p.longitude !== null)) {
    throw new Error('All properties must have coordinates for GWR');
  }

  const coordinates = validProperties.map(p => [p.latitude!, p.longitude!] as [number, number]);

  // Set defaults
  const bandwidth = options.bandwidth || Math.sqrt(n) * 0.1; // Default 10% of sqrt(n)
  const kernel = options.kernel || KernelType.GAUSSIAN;
  const adaptive = options.adaptive !== undefined ? options.adaptive : false;

  // Arrays to store local results
  const localCoefficients: Array<Record<string, number>> = [];
  const localIntercepts: number[] = [];
  const localRSquared: number[] = [];

  // For each point, fit a weighted regression
  for (let i = 0; i < n; i++) {
    // Calculate weights for this regression point
    const weights = calculateGWRWeights(coordinates, i, bandwidth, kernel, adaptive);

    // Apply weights to X and y
    const weightedX = X.map((row, idx) => row.map(val => val * weights[idx]));
    const weightedY = y.map((val, idx) => val * weights[idx]);

    // Calculate regression coefficients: β = (X'WX)^-1 X'Wy
    const XT = transpose(weightedX);
    const XTX = matrixMultiply(XT, weightedX);
    const XTXInv = invertMatrix(XTX);
    const XTy = matrixVectorMultiply(XT, weightedY);
    const beta = matrixVectorMultiply(XTXInv, XTy);

    // Store local results
    localIntercepts.push(beta[0]);
    const coefs: Record<string, number> = {};
    for (let j = 1; j < columnNames.length; j++) {
      coefs[columnNames[j]] = beta[j];
    }
    localCoefficients.push(coefs);

    // Calculate local R-squared
    const yHat = matrixVectorMultiply(X, beta);
    const weightedResiduals = y.map((actual, idx) => weights[idx] * Math.pow(actual - yHat[idx], 2));
    const weightedTSS = y.map((val, idx) => weights[idx] * Math.pow(val - mean(weightedY) / mean(weights), 2));
    
    const RSS = weightedResiduals.reduce((a, b) => a + b, 0);
    const TSS = weightedTSS.reduce((a, b) => a + b, 0);
    
    localRSquared.push(1 - (RSS / TSS));
  }

  // Calculate global model for comparison
  const globalModel = calculateOLSRegression(
    validProperties,
    targetVariable,
    variables
  );

  // Return GWR model
  return {
    ...globalModel,
    localCoefficients,
    localIntercepts,
    localRSquared,
    globalRSquared: globalModel.rSquared,
    bandwidth,
    kernel,
    coordinates
  };
}

/**
 * Calculate weights for GWR
 * @param coordinates Array of [lat, lng] coordinates
 * @param i Index of the regression point
 * @param bandwidth Bandwidth parameter
 * @param kernel Kernel type
 * @param adaptive Whether to use adaptive bandwidth
 * @returns Array of weights
 */
function calculateGWRWeights(
  coordinates: Array<[number, number]>,
  i: number,
  bandwidth: number,
  kernel: KernelType,
  adaptive: boolean
): number[] {
  const n = coordinates.length;
  const weights = Array(n).fill(0);
  
  // Calculate distances from point i to all other points
  const distances = coordinates.map(coord => 
    calculateDistance(
      {lat: coordinates[i][0], lng: coordinates[i][1]},
      {lat: coord[0], lng: coord[1]}
    )
  );
  
  // For adaptive bandwidth, use the nth nearest neighbor distance
  let effectiveBandwidth = bandwidth;
  if (adaptive) {
    const sortedDistances = [...distances].sort((a, b) => a - b);
    effectiveBandwidth = sortedDistances[Math.floor(n * bandwidth)];
  }
  
  // Apply kernel function to each distance
  for (let j = 0; j < n; j++) {
    const distance = distances[j];
    weights[j] = kernelFunction(distance, effectiveBandwidth, kernel);
  }
  
  return weights;
}

/**
 * Kernel function for GWR
 * @param distance Distance
 * @param bandwidth Bandwidth parameter
 * @param kernel Kernel type
 * @returns Weight
 */
function kernelFunction(
  distance: number,
  bandwidth: number,
  kernel: KernelType
): number {
  const ratio = distance / bandwidth;
  
  if (ratio >= 1 && kernel !== KernelType.GAUSSIAN && kernel !== KernelType.EXPONENTIAL) {
    return 0;
  }
  
  switch (kernel) {
    case KernelType.GAUSSIAN:
      return Math.exp(-0.5 * Math.pow(ratio, 2));
    case KernelType.EXPONENTIAL:
      return Math.exp(-ratio);
    case KernelType.BISQUARE:
      return Math.pow(1 - Math.pow(ratio, 2), 2);
    case KernelType.TRICUBE:
      return Math.pow(1 - Math.pow(ratio, 3), 3);
    case KernelType.BOXCAR:
      return 1;
    default:
      return Math.exp(-0.5 * Math.pow(ratio, 2)); // Default to Gaussian
  }
}

/**
 * Approximate cumulative distribution function (CDF) of F distribution
 * @param x Value
 * @param d1 Degrees of freedom 1
 * @param d2 Degrees of freedom 2
 * @returns Probability
 */
function fDistributionCDF(x: number, d1: number, d2: number): number {
  // Use beta incomplete function approximation
  const v1 = d1;
  const v2 = d2;
  const z = v1 * x / (v1 * x + v2);
  
  return betaIncomplete(z, v1/2, v2/2);
}

/**
 * Approximate incomplete beta function
 * @param x Value
 * @param a Alpha parameter
 * @param b Beta parameter
 * @returns Value of incomplete beta function
 */
function betaIncomplete(x: number, a: number, b: number): number {
  // Simple approximation for common cases
  if (x === 0) return 0;
  if (x === 1) return 1;
  
  // Use continued fraction approximation
  const maxIterations = 100;
  const epsilon = 1e-8;
  
  const front = Math.pow(x, a) * Math.pow(1 - x, b) / betaFunction(a, b);
  
  let C = 1;
  let D = 1 - (a + b) * x / (a + 1);
  if (Math.abs(D) < epsilon) D = epsilon;
  D = 1 / D;
  let H = D;
  
  for (let i = 1; i <= maxIterations; i++) {
    const m = i >> 1; // integer division by 2
    const numerator = i * (b - m) * x / ((a + 2*m - 1) * (a + 2*m));
    const denominator = 1 + numerator * D;
    
    if (Math.abs(denominator) < epsilon) {
      D = epsilon;
    } else {
      D = 1 / denominator;
    }
    
    C = 1 + numerator / C;
    if (Math.abs(C) < epsilon) {
      C = epsilon;
    }
    
    const delta = C * D;
    H *= delta;
    
    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }
  
  return 1 - front * H / a;
}

/**
 * Approximate beta function
 * @param a Alpha parameter
 * @param b Beta parameter
 * @returns Value of beta function
 */
function betaFunction(a: number, b: number): number {
  // Use gamma function approximation
  return gammaFunction(a) * gammaFunction(b) / gammaFunction(a + b);
}

/**
 * Approximate gamma function using Lanczos approximation
 * @param z Input value
 * @returns Gamma function value
 */
function gammaFunction(z: number): number {
  // Coefficients for Lanczos approximation
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  if (z < 0.5) {
    // Reflection formula
    return Math.PI / (Math.sin(Math.PI * z) * gammaFunction(1 - z));
  }
  
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Approximate chi-square CDF
 * @param x Value
 * @param k Degrees of freedom
 * @returns Probability
 */
function chiSquareCDF(x: number, k: number): number {
  // Chi-square is related to gamma distribution
  const halfK = k / 2;
  
  // Use lower incomplete gamma function divided by gamma function
  return lowerIncompleteGamma(halfK, x / 2) / gammaFunction(halfK);
}

/**
 * Approximate lower incomplete gamma function
 * @param s Shape parameter
 * @param x Upper bound
 * @returns Value of lower incomplete gamma function
 */
function lowerIncompleteGamma(s: number, x: number): number {
  // Use series expansion for small x
  if (x < s + 1) {
    let sum = 0;
    let term = 1 / s;
    
    for (let i = 0; i < 100; i++) {
      sum += term;
      term *= x / (s + i + 1);
      
      if (term < 1e-10) break;
    }
    
    return Math.pow(x, s) * Math.exp(-x) * sum;
  }
  
  // Use continued fraction for large x
  let a = 1 - s;
  let b = a + x + 1;
  let pn1 = 1;
  let pn2 = x;
  let pn3 = x + 1;
  let pn4 = x * b;
  
  let ratio = pn3 / pn4;
  
  for (let i = 0; i < 100; i++) {
    a++;
    b += 2;
    const an = a * (s - 1);
    
    pn1 = b * pn1 - an * pn2;
    pn2 = b * pn2 - an * pn3;
    pn3 = b * pn3 - an * pn4;
    pn4 = b * pn4;
    
    if (Math.abs(pn3) > 1e10) {
      pn1 /= pn3;
      pn2 /= pn3;
      pn3 = 1;
      pn4 /= pn3;
    }
    
    if (Math.abs(pn4) > 1e10) {
      pn1 /= pn4;
      pn2 /= pn4;
      pn3 /= pn4;
      pn4 = 1;
    }
    
    const newRatio = pn3 / pn4;
    
    if (Math.abs(ratio - newRatio) < 1e-10) {
      ratio = newRatio;
      break;
    }
    
    ratio = newRatio;
  }
  
  return gammaFunction(s) - Math.pow(x, s) * Math.exp(-x) * ratio;
}

/**
 * Standard normal cumulative distribution function
 * @param z Z-score
 * @returns Probability
 */
function normalCDF(z: number): number {
  // Use error function
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Error function approximation
 * @param x Input value
 * @returns erf(x)
 */
function erf(x: number): number {
  // Constants
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  // Save the sign
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // Abramowitz and Stegun formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Student's t-distribution cumulative distribution function
 * @param t T-value
 * @param df Degrees of freedom
 * @returns Probability
 */
function tDistributionCDF(t: number, df: number): number {
  // Use relationship with beta incomplete function
  const x = df / (df + t * t);
  return 1 - 0.5 * betaIncomplete(x, df/2, 0.5);
}

/**
 * Calculate weighted regression
 * @param properties Array of properties
 * @param targetVariable Name of target variable
 * @param variables Array of independent variable names
 * @param weightFunction Function to calculate weight for each property
 * @returns Regression model results
 */
export function calculateWeightedRegression(
  properties: Property[],
  targetVariable: string,
  variables: string[],
  weightFunction: (property: Property) => number
): RegressionModel {
  // Create design matrix
  const { X, y, columnNames, properties: validProperties } = createDesignMatrix(
    properties,
    targetVariable,
    variables
  );

  // Calculate weights
  const weights = validProperties.map(p => weightFunction(p));
  
  // Apply square root of weights to X and y
  const sqrtWeights = weights.map(w => Math.sqrt(w));
  const weightedX = X.map((row, i) => row.map(val => val * sqrtWeights[i]));
  const weightedY = y.map((val, i) => val * sqrtWeights[i]);
  
  // Use OLS on weighted data
  const n = weightedX.length; // Number of observations
  const p = weightedX[0].length; // Number of parameters (including intercept)

  // Calculate regression coefficients: β = (X'WX)^-1 X'Wy
  const XT = transpose(weightedX);
  const XTX = matrixMultiply(XT, weightedX);
  const XTXInv = invertMatrix(XTX);
  const XTy = matrixVectorMultiply(XT, weightedY);
  const beta = matrixVectorMultiply(XTXInv, XTy);

  // Extract coefficients
  const intercept = beta[0];
  const coefficients: Record<string, number> = {};
  for (let i = 1; i < columnNames.length; i++) {
    coefficients[columnNames[i]] = beta[i];
  }

  // Calculate fitted values (unweighted)
  const yHat = matrixVectorMultiply(X, beta);

  // Calculate residuals (unweighted)
  const residuals = y.map((actual, i) => actual - yHat[i]);

  // Calculate weighted residuals
  const weightedResiduals = residuals.map((r, i) => r * weights[i]);

  // Calculate total sum of squares (weighted)
  const weightedYMean = weightedY.reduce((a, b) => a + b, 0) / sqrtWeights.reduce((a, b) => a + b, 0);
  const TSS = y.map((val, i) => weights[i] * Math.pow(val - weightedYMean, 2)).reduce((a, b) => a + b, 0);

  // Calculate residual sum of squares (weighted)
  const RSS = weightedResiduals.reduce((sum, val) => sum + Math.pow(val, 2), 0);

  // Calculate explained sum of squares
  const ESS = TSS - RSS;

  // Calculate R-squared
  const rSquared = ESS / TSS;

  // Calculate adjusted R-squared
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - p));

  // Calculate F-statistic
  const fStatistic = (ESS / (p - 1)) / (RSS / (n - p));

  // Calculate p-value of F-statistic (approximation)
  const pValue = 1 - fDistributionCDF(fStatistic, p - 1, n - p);

  // Calculate standard errors of coefficients
  const MSE = RSS / (n - p); // Mean square error
  const varBeta = XTXInv.map(row => row.map(val => val * MSE));
  const standardErrors: Record<string, number> = {};
  for (let i = 1; i < columnNames.length; i++) {
    standardErrors[columnNames[i]] = Math.sqrt(varBeta[i][i]);
  }

  // Calculate t-values
  const tValues: Record<string, number> = {};
  for (const variable of variables) {
    tValues[variable] = coefficients[variable] / standardErrors[variable];
  }

  // Calculate p-values
  const pValues: Record<string, number> = {};
  for (const variable of variables) {
    const tAbs = Math.abs(tValues[variable]);
    pValues[variable] = 2 * (1 - tDistributionCDF(tAbs, n - p));
  }

  // Return regression model (similar to OLS but with weighted calculations)
  return {
    coefficients,
    intercept,
    rSquared,
    adjustedRSquared,
    fStatistic,
    pValue,
    observations: n,
    standardErrors,
    tValues,
    pValues,
    usedVariables: variables,
    targetVariable,
    residuals,
    predictedValues: yHat,
    actualValues: y,
    diagnostics: {
      collinearity: false, // Would need to recalculate VIF with weights
      vif: {},
      missingValueCount: properties.length - validProperties.length,
      noSignificantVariables: Object.values(pValues).every(p => p > 0.05),
      heteroskedasticity: false, // Would need weighted Breusch-Pagan test
      spatialAutocorrelation: false // Would need weighted Moran's I
    },
    usedObservations: validProperties.length,
    dataMean: mean(y),
    dataStd: standardDeviation(y)
  };
}

/**
 * Predict values using a regression model
 * @param model Regression model
 * @param properties Properties to predict for
 * @returns Array of predicted values
 */
export function predictWithModel(
  model: RegressionModel,
  properties: Property[]
): number[] {
  return properties.map(property => {
    let prediction = model.intercept;
    
    for (const variable of model.usedVariables) {
      const value = getPropertyValue(property, variable);
      if (value !== null && value !== undefined) {
        prediction += model.coefficients[variable] * parseFloat(String(value));
      }
    }
    
    return prediction;
  });
}

/**
 * Calculate variable importance
 * @param model Regression model
 * @returns Object with variable importance scores
 */
export function calculateVariableImportance(
  model: RegressionModel
): Record<string, number> {
  const importance: Record<string, number> = {};
  
  // Calculate absolute standardized coefficients
  for (const variable of model.usedVariables) {
    // |t-value| is a simple measure of importance
    importance[variable] = Math.abs(model.tValues[variable]);
  }
  
  // Normalize to sum to 1
  const sum = Object.values(importance).reduce((a, b) => a + b, 0);
  for (const variable of model.usedVariables) {
    importance[variable] /= sum;
  }
  
  return importance;
}

/**
 * Calculate model quality metrics
 * @param model Regression model
 * @returns Object with model quality metrics
 */
export function calculateModelQuality(
  model: RegressionModel
): {
  cod: number; // Coefficient of Dispersion
  prd: number; // Price-Related Differential
  prb: number; // Price-Related Bias
  averageAbsoluteError: number;
  medianAbsoluteError: number;
  rootMeanSquaredError: number;
} {
  const n = model.actualValues.length;
  
  // Calculate ratios
  const ratios = model.actualValues.map((actual, i) => actual / model.predictedValues[i]);
  
  // Calculate median ratio
  const sortedRatios = [...ratios].sort((a, b) => a - b);
  const medianRatio = sortedRatios[Math.floor(n / 2)];
  
  // Calculate COD
  const absoluteDeviations = ratios.map(r => Math.abs(r - medianRatio));
  const cod = 100 * absoluteDeviations.reduce((a, b) => a + b, 0) / (n * medianRatio);
  
  // Calculate PRD
  const meanRatio = ratios.reduce((a, b) => a + b, 0) / n;
  const weightedMeanRatio = ratios.reduce((sum, ratio, i) => sum + ratio * model.predictedValues[i], 0) / 
                           model.predictedValues.reduce((a, b) => a + b, 0);
  const prd = meanRatio / weightedMeanRatio;
  
  // Calculate PRB
  const loggedValues = model.predictedValues.map(v => Math.log(v));
  const meanLoggedValue = mean(loggedValues);
  const numerator = ratios.reduce((sum, ratio, i) => sum + (loggedValues[i] - meanLoggedValue) * (ratio - meanRatio), 0);
  const denominator = loggedValues.reduce((sum, v) => sum + Math.pow(v - meanLoggedValue, 2), 0);
  const prb = numerator / denominator;
  
  // Calculate error metrics
  const errors = model.actualValues.map((actual, i) => actual - model.predictedValues[i]);
  const absoluteErrors = errors.map(e => Math.abs(e));
  const averageAbsoluteError = mean(absoluteErrors);
  const sortedAbsoluteErrors = [...absoluteErrors].sort((a, b) => a - b);
  const medianAbsoluteError = sortedAbsoluteErrors[Math.floor(n / 2)];
  const rootMeanSquaredError = Math.sqrt(mean(errors.map(e => e * e)));
  
  return {
    cod,
    prd,
    prb,
    averageAbsoluteError,
    medianAbsoluteError,
    rootMeanSquaredError
  };
}