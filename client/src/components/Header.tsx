/**
 * Header Component
 * 
 * This component provides the main navigation for the application
 * and displays the application branding.
 */
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Layers, Map, FileText, Home, Database } from 'lucide-react';

const Header = () => {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Navigation items
  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4 mr-2" /> },
    { href: '/analysis', label: 'Analysis', icon: <Map className="w-4 h-4 mr-2" /> },
    { href: '/properties', label: 'Properties', icon: <Database className="w-4 h-4 mr-2" /> },
    { href: '/layers', label: 'Layers', icon: <Layers className="w-4 h-4 mr-2" /> },
    { href: '/reports', label: 'Reports', icon: <FileText className="w-4 h-4 mr-2" /> }
  ];
  
  // Determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and App Name */}
          <div className="flex items-center">
            <Link href="/">
              <div className="text-2xl font-bold flex items-center cursor-pointer">
                <Map className="w-6 h-6 mr-2" />
                B-GIS
              </div>
            </Link>
            <div className="ml-4 hidden md:block text-sm">
              Benton County Geospatial Analysis System
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive(item.href) ? "secondary" : "ghost"} 
                  size="sm"
                  className="flex items-center"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          
          {/* Mobile Navigation Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] md:w-[300px] p-0">
              <div className="py-6 px-4">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Map className="w-5 h-5 mr-2" />
                  B-GIS
                </h2>
                <div className="flex flex-col space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button 
                        variant={isActive(item.href) ? "default" : "ghost"} 
                        size="sm"
                        className="justify-start w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;