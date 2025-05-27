
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, History, Upload } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'analysis' | 'history';
  onViewChange: (view: 'home' | 'analysis' | 'history') => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                SceneSpeak
              </h1>
            </div>
            <span className="text-sm text-muted-foreground">AI Video Understanding</span>
          </div>

          <nav className="flex items-center space-x-2">
            <Button
              variant={currentView === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('home')}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('history')}
              className="flex items-center space-x-2"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
