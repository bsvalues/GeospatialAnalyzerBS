// Property Types
export interface Property {
  id: string;
  parcelId: string;
  address: string;
  owner?: string;
  value?: string;
  salePrice?: string;
  squareFeet: number;
  yearBuilt?: number;
  landValue?: string;
}

// Map Types
export interface MapLayer {
  id: string;
  name: string;
  type: 'base' | 'viewable';
  checked: boolean;
}

export interface MapOptions {
  opacity: number;
  labels: boolean;
  center: [number, number];
  zoom: number;
}

// Script Types
export interface ScriptGroup {
  id: string;
  name: string;
  active: boolean;
}

export interface ScriptStep {
  id: string;
  name: string;
  status: 'complete' | 'active' | 'pending';
  code?: string;
  type?: 'compute' | 'group' | 'combine';
}

export interface SqlQuery {
  id: string;
  name: string;
  description?: string;
  sql?: string;
}

// Regression Types
export interface RegressionModel {
  id: number;
  name: string;
  r2: number;
  variables: number;
  cov: number;
  samples: number;
  lastRun: string;
  type?: string;
}

export interface ModelVariable {
  name: string;
  coefficient: number;
  tValue: number;
  pValue: number;
  correlation: number;
  included: boolean;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  year: string;
  metrics: {
    activeLayers: number;
    savedLocations: number;
    activeScripts: number;
    sqlQueries: number;
    modelR2: number;
    prdValue: number;
  };
  records: {
    properties: number;
    sales: number;
    models: number;
    analyses: number;
  };
}
