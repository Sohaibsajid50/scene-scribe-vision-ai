
import { useState } from 'react';
import { Upload, Search, Play } from 'lucide-react';
import Header from '@/components/Header';
import VideoUpload from '@/components/VideoUpload';
import LoadingScreen from '@/components/LoadingScreen';
import VideoAnalysis from '@/components/VideoAnalysis';
import VideoHistory from '@/components/VideoHistory';

type AppView = 'home' | 'loading' | 'analysis' | 'history';

interface HistoryVideo {
  id: string;
  name: string;
  thumbnail: string;
  uploadDate: string;
  duration: string;
  insights: number;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  const handleVideoSelect = (file: File) => {
    setSelectedVideoFile(file);
    setCurrentView('loading');
    
    // Simulate AI processing time
    setTimeout(() => {
      setCurrentView('analysis');
    }, 3000);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedVideoFile(null);
  };

  const handleViewChange = (view: 'home' | 'analysis' | 'history') => {
    if (view === 'home') {
      handleBackToHome();
    } else {
      setCurrentView(view);
    }
  };

  const handleHistoryVideoSelect = (video: HistoryVideo) => {
    console.log('Selected history video:', video);
    // In a real app, you would load the video analysis data
    // For now, we'll just show a placeholder
  };

  if (currentView === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentView={currentView} onViewChange={handleViewChange} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-6 py-12">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-accent-100 px-4 py-2 rounded-full text-sm font-medium text-primary-700">
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                <span>Powered by Advanced AI</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-slate-800 leading-tight">
                Understand your videos
                <br />
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                  with AI precision
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload any video and get detailed, frame-by-frame insights about what's happening. 
                Perfect for content analysis, accessibility, and understanding.
              </p>
            </div>

            {/* Upload Section */}
            <VideoUpload onVideoSelect={handleVideoSelect} />

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold">Smart Upload</h3>
                <p className="text-muted-foreground">Drag, drop, or browse to upload videos up to 500MB</p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-accent-100 rounded-xl mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6 text-accent-600" />
                </div>
                <h3 className="text-lg font-semibold">AI Analysis</h3>
                <p className="text-muted-foreground">Advanced computer vision understands scenes, objects, and actions</p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl mx-auto flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold">Interactive Timeline</h3>
                <p className="text-muted-foreground">Navigate through insights and jump to specific moments</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'analysis' && selectedVideoFile && (
          <VideoAnalysis videoFile={selectedVideoFile} onBack={handleBackToHome} />
        )}

        {currentView === 'history' && (
          <VideoHistory onVideoSelect={handleHistoryVideoSelect} />
        )}
      </main>
    </div>
  );
};

export default Index;
