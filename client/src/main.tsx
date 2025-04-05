// Import polyfills first to ensure they're loaded before any other modules
import './polyfill';

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
