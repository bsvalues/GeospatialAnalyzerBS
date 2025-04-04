import React, { useState, useEffect } from 'react';
import { Lightbulb, HelpCircle, Wrench, ArrowRight, MessageSquare, Database, Settings, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { EtlDataSource, EtlTransformationRule, EtlJob } from '@shared/schema';

interface ETLAssistantProps {
  currentPage: string;
  currentAction?: string;
  selectedSource?: EtlDataSource;
  selectedRule?: EtlTransformationRule;
  selectedJob?: EtlJob;
  dataSources?: EtlDataSource[];
  userExperience?: 'beginner' | 'intermediate' | 'expert';
  onActionSelected?: (action: string) => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

interface AssistantResponse {
  message: string;
  tips: string[];
  suggestedActions: {
    label: string;
    description: string;
    action?: string;
  }[];
}

interface OnboardingTips {
  title: string;
  description: string;
  steps: { step: string; description: string }[];
  bestPractices: string[];
  commonPitfalls: string[];
}

interface ETLAssistantState {
  loading: boolean;
  response?: AssistantResponse;
  showTips: boolean;
  onboardingTips?: OnboardingTips;
  loadingOnboarding: boolean;
  previousInteractions: { question?: string; answer?: string }[];
  userQuestion: string;
}

export function ETLAssistant({
  currentPage,
  currentAction,
  selectedSource,
  selectedRule,
  selectedJob,
  dataSources = [],
  userExperience = 'beginner',
  onActionSelected,
  minimized = false,
  onToggleMinimize,
}: ETLAssistantProps) {
  const [state, setState] = useState<ETLAssistantState>({
    loading: true,
    showTips: false,
    loadingOnboarding: false,
    previousInteractions: [],
    userQuestion: '',
  });
  
  const { toast } = useToast();
  
  // Fetch assistant response when component mounts or context changes
  useEffect(() => {
    if (minimized) return;
    
    const fetchAssistance = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        const response = await fetch('/api/etl/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: {
              page: currentPage,
              action: currentAction,
              selectedSource,
              selectedRule,
              selectedJob,
            },
            dataSources,
            userExperience,
            previousInteractions: state.previousInteractions,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch ETL assistance');
        }
        
        const data = await response.json();
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          response: data 
        }));
      } catch (error) {
        console.error('Error fetching ETL assistance:', error);
        setState(prev => ({ ...prev, loading: false }));
        toast({
          title: 'Error',
          description: 'Could not load ETL assistant. Please try again later.',
          variant: 'destructive',
        });
      }
    };
    
    fetchAssistance();
  }, [currentPage, currentAction, selectedSource, selectedRule, selectedJob, userExperience, minimized]);
  
  // Function to fetch onboarding tips for a specific feature
  const fetchOnboardingTips = async (feature: string) => {
    try {
      setState(prev => ({ ...prev, loadingOnboarding: true }));
      
      const response = await fetch('/api/etl/onboarding-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature,
          userExperience,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding tips');
      }
      
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        loadingOnboarding: false,
        onboardingTips: data,
        showTips: true 
      }));
    } catch (error) {
      console.error('Error fetching onboarding tips:', error);
      setState(prev => ({ ...prev, loadingOnboarding: false }));
      toast({
        title: 'Error',
        description: 'Could not load onboarding tips. Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle clicking on a suggested action
  const handleActionClick = (action?: string) => {
    if (action && onActionSelected) {
      onActionSelected(action);
    }
  };
  
  // Handle closing onboarding tips
  const handleCloseTips = () => {
    setState(prev => ({ ...prev, showTips: false }));
  };
  
  // Handle user asking a question
  const handleAskQuestion = async () => {
    if (!state.userQuestion.trim()) return;
    
    // Save the question to previous interactions
    const newInteractions = [
      ...state.previousInteractions,
      { question: state.userQuestion }
    ];
    
    setState(prev => ({ 
      ...prev, 
      loading: true,
      previousInteractions: newInteractions,
      userQuestion: ''
    }));
    
    try {
      const response = await fetch('/api/etl/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            page: currentPage,
            action: currentAction,
            selectedSource,
            selectedRule,
            selectedJob,
          },
          dataSources,
          userExperience,
          previousInteractions: newInteractions,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      
      // Save the answer to previous interactions
      const updatedInteractions = [
        ...newInteractions,
        { answer: data.message }
      ];
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        response: data,
        previousInteractions: updatedInteractions
      }));
    } catch (error) {
      console.error('Error getting answer:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: 'Error',
        description: 'Could not get an answer. Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  // Render the minimized version of the assistant
  if (minimized) {
    return (
      <div className="fixed right-4 bottom-4">
        <Tooltip content="ETL Assistant">
          <Button 
            className="rounded-full h-12 w-12 shadow-lg" 
            variant="default"
            onClick={onToggleMinimize}
          >
            <Lightbulb className="h-6 w-6" />
          </Button>
        </Tooltip>
      </div>
    );
  }
  
  // If showing onboarding tips, render the tips card
  if (state.showTips && state.onboardingTips) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{state.onboardingTips.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCloseTips}>
              Close
            </Button>
          </div>
          <CardDescription>{state.onboardingTips.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Steps to get started:</h3>
              <ol className="pl-5 list-decimal">
                {state.onboardingTips.steps.map((step, index) => (
                  <li key={index} className="pb-2">
                    <div className="font-medium">{step.step}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Best Practices:</h3>
              <ul className="pl-5 list-disc text-sm">
                {state.onboardingTips.bestPractices.map((practice, index) => (
                  <li key={index} className="pb-1">{practice}</li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Common Pitfalls to Avoid:</h3>
              <ul className="pl-5 list-disc text-sm">
                {state.onboardingTips.commonPitfalls.map((pitfall, index) => (
                  <li key={index} className="pb-1">{pitfall}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCloseTips}
          >
            Return to Assistant
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Main assistant card
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-md font-bold">ETL Assistant</CardTitle>
          <CardDescription>AI-powered guidance for ETL management</CardDescription>
        </div>
        <Badge variant="outline" className="px-2">
          {userExperience}
        </Badge>
        {onToggleMinimize && (
          <Button variant="ghost" size="sm" onClick={onToggleMinimize} className="ml-2 h-8 w-8 p-0">
            <span className="sr-only">Minimize</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {state.loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Getting ETL insights...</p>
          </div>
        ) : state.response ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm">{state.response.message}</p>
            </div>
            
            {state.response.tips.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span>Tips</span>
                </h3>
                <ul className="space-y-1 pl-5 list-disc text-sm">
                  {state.response.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {state.response.suggestedActions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Suggested Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {state.response.suggestedActions.map((action, index) => (
                    <button
                      key={index}
                      className="flex justify-between items-center p-2 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                      onClick={() => handleActionClick(action.action)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground max-w-[180px] text-right">
                        {action.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Need help with a specific feature?</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => fetchOnboardingTips('data_sources')}
                  disabled={state.loadingOnboarding}
                >
                  <Database className="h-3 w-3 mr-1" />
                  Data Sources
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => fetchOnboardingTips('transformation_rules')}
                  disabled={state.loadingOnboarding}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Transformations
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => fetchOnboardingTips('jobs')}
                  disabled={state.loadingOnboarding}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Jobs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => fetchOnboardingTips('optimization')}
                  disabled={state.loadingOnboarding}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Optimization
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => fetchOnboardingTips('general')}
                  disabled={state.loadingOnboarding}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  General Help
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Could not load assistant. Please try again.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setState(prev => ({ ...prev, loading: true }))}
            >
              Retry
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="w-full flex">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Ask me anything about ETL..."
              className="w-full px-3 py-2 border rounded-md"
              value={state.userQuestion}
              onChange={(e) => setState(prev => ({ ...prev, userQuestion: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAskQuestion();
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={handleAskQuestion}
              disabled={state.loading || !state.userQuestion.trim()}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!isOpenAIConfigured() && (
          <div className="flex items-center text-xs text-muted-foreground mt-2">
            <Lock className="h-3 w-3 mr-1" />
            <span>Set OPENAI_API_KEY for enhanced capabilities</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Helper function to check if OpenAI is configured
function isOpenAIConfigured() {
  return true; // Placeholder - will be replaced with actual check from API
}