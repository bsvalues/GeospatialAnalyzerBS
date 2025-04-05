import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClusteringPanel } from '../analysis/ClusteringPanel';
import { TemporalAnalysisPanel } from '../analysis/TemporalAnalysisPanel';
import { Property } from '@shared/schema';

// Interface for component props
interface SpatialAnalysisPanelProps {
  properties: Property[];
  className?: string;
}

/**
 * Panel for spatial analysis features including clustering, heatmaps, and temporal analysis
 */
export const SpatialAnalysisPanel: React.FC<SpatialAnalysisPanelProps> = ({ 
  properties, 
  className = "" 
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('clustering');
  
  // Handler for tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Card className={`shadow-md overflow-visible ${className}`}>
      <CardHeader>
        <CardTitle>Spatial Analysis</CardTitle>
        <CardDescription>
          Analyze spatial patterns and relationships in property data
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-visible">
        <Tabs defaultValue="clustering" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clustering">Clustering</TabsTrigger>
            <TabsTrigger value="temporal">Temporal Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clustering" className="overflow-visible">
            <ClusteringPanel properties={properties} />
          </TabsContent>
          
          <TabsContent value="temporal" className="overflow-visible">
            <TemporalAnalysisPanel properties={properties} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};