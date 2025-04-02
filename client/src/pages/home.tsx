import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Welcome } from '@/components/Welcome';

export default function HomePage() {
  const [hasVisited, setHasVisited] = useState(false);
  const [, setLocation] = useLocation();

  // Check if user has visited before
  useEffect(() => {
    const visited = localStorage.getItem('hasVisitedBefore');
    if (visited === 'true') {
      setHasVisited(true);
      setLocation('/dashboard');
    } else {
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, [setLocation]);

  return <Welcome />;
}