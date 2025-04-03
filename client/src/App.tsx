/**
 * App Component
 * 
 * This is the main application component that handles routing
 * and provides the application layout.
 */
import { Switch, Route } from 'wouter';
import AnalysisPage from './pages/Analysis';
import IncomePage from './pages/income';
import { Toaster } from '@/components/ui/toaster';
import Header from './components/Header';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,  // 5 minutes
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Switch>
            <Route path="/" component={IncomePage} />
            <Route path="/analysis" component={AnalysisPage} />
            <Route path="/income" component={IncomePage} />
            {/* Additional routes will be added as needed */}
            <Route>
              <div className="container mx-auto py-8">
                <h1 className="text-2xl font-bold">Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
              </div>
            </Route>
          </Switch>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
};

export default App;