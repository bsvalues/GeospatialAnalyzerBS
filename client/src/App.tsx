/**
 * App Component
 * 
 * This is the main application component that handles routing
 * and provides the application layout.
 */
import { Switch, Route } from 'wouter';
import AnalysisPage from './pages/Analysis';
import { Toaster } from '@/components/ui/toaster';
import Header from './components/Header';

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={AnalysisPage} />
          <Route path="/analysis" component={AnalysisPage} />
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
  );
};

export default App;