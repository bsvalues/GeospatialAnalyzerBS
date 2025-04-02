import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideMap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface QuoteType {
  text: string;
  author: string;
}

const insightfulQuotes: QuoteType[] = [
  {
    text: "Understanding the spatial relationships between properties is the key to accurate valuation.",
    author: "GIS_BS Insights"
  },
  {
    text: "Data without context is just numbers; spatial analysis provides the context.",
    author: "Geospatial Analytics Principle"
  },
  {
    text: "The value of a property is influenced by its surroundings as much as by its intrinsic qualities.",
    author: "Modern Appraisal Theory"
  },
  {
    text: "Where infrastructure meets property, value emerges. Spatial analysis reveals these intersections.",
    author: "Urban Economics Journal"
  }
];

export function Welcome() {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteType>(insightfulQuotes[0]);
  const [, setLocation] = useLocation();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Select a random quote
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * insightfulQuotes.length);
    setQuote(insightfulQuotes[randomIndex]);
  }, []);

  const handleEnterApp = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      {loading ? (
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative w-24 h-24 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              delay: 0.2
            }}
          >
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.2, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <LucideMap className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            GIS_BS
          </motion.h1>
          
          <motion.p 
            className="text-gray-500 text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Initializing Benton County Property Valuation Platform
          </motion.p>
          
          <motion.div
            className="h-1 w-48 bg-gray-200 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <motion.div 
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ 
                delay: 0.8,
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-8 inline-flex p-3 rounded-full bg-primary/10"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <LucideMap className="h-10 w-10 text-primary" />
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Welcome to GIS_BS
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Benton County's Advanced Property Valuation Platform
          </motion.p>
          
          <motion.div
            className="mb-12 p-6 bg-white rounded-xl shadow-sm border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-lg italic text-gray-700 mb-4">"{quote.text}"</p>
            <p className="text-sm text-gray-500">— {quote.author}</p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button 
              size="lg" 
              onClick={handleEnterApp}
              className="px-8 py-6 text-lg font-medium"
            >
              Enter Platform <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
      
      <motion.p 
        className="absolute bottom-4 text-sm text-gray-400 mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: loading ? 2 : 0.8, duration: 0.5 }}
      >
        © 2025 Benton County Assessment & Valuation
      </motion.p>
    </div>
  );
}

export default Welcome;