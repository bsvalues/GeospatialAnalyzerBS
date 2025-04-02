import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { MapIcon, ArrowRight } from 'lucide-react';

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

  const handleBeginJourney = () => {
    setLocation('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#dbeafe] text-[#111827] flex flex-col items-center justify-center px-6 sm:px-10 md:px-20 relative overflow-hidden">
      {/* Elegant Depth Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#f0f4ff] via-white to-[#f0f4ff]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-[#93c5fd] rounded-full blur-[120px] opacity-20 z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-center mb-8 relative z-10"
      >
        <div className="p-4 bg-blue-100 rounded-full">
          <MapIcon className="h-12 w-12 text-blue-600" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl sm:text-5xl font-semibold text-center tracking-tight mb-4 relative z-10"
      >
        GIS_BS Spatial Analytics
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="text-2xl sm:text-3xl font-medium text-center tracking-tight mb-6 text-gray-700 relative z-10"
      >
        Benton County Property Valuation
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-lg text-center max-w-xl mb-10 text-gray-600 relative z-10"
      >
        A sophisticated spatial analysis platform providing deep insights into property valuation 
        and trends across Benton County, Washington.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10"
      >
        <Button 
          onClick={handleBeginJourney}
          className="px-6 py-6 text-lg rounded-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-all shadow-lg"
        >
          Begin Analysis <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 text-sm text-gray-500 z-10"
      >
        © 2025 Benton County Assessment & Valuation
      </motion.div>
    </main>
  );
}