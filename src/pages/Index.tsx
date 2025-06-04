
import { useState } from 'react';
import { Upload, Youtube, FileText, Brain } from 'lucide-react';
import Header from '@/components/Header';
import VideoUpload from '@/components/VideoUpload';
import VideoProcessing from '@/components/VideoProcessing';
import VideoInteraction from '@/components/VideoInteraction';
import VideoHistory from '@/components/VideoHistory';
import { Button } from '@/components/ui/button';

type AppView = 'home' | 'processing' | 'interaction' | 'history';

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
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');

  const handleVideoSelect = (file: File, fileId: string) => {
    setSelectedVideoFile(file);
    setCurrentFileId(fileId);
    setCurrentView('processing');
  };

  const handleProcessingComplete = () => {
    setCurrentView('interaction');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedVideoFile(null);
    setCurrentFileId(null);
  };

  const handleViewChange = (view: 'home' | 'analysis' | 'history') => {
    if (view === 'home') {
      handleBackToHome();
    } else if (view === 'history') {
      setCurrentView('history');
    } else if (view === 'analysis') {
      // If there's a current video, go to interaction view
      if (selectedVideoFile && currentFileId) {
        setCurrentView('interaction');
      } else {
        // Otherwise go to home to upload a video first
        handleBackToHome();
      }
    }
  };

  const handleHistoryVideoSelect = (video: HistoryVideo) => {
    console.log('Selected history video:', video);
    // In a real app, you would load the video analysis data
    // For now, we'll just show a placeholder
  };

  // Map internal view to header view for compatibility
  const getHeaderView = (): 'home' | 'analysis' | 'history' => {
    if (currentView === 'processing' || currentView === 'interaction') {
      return 'analysis';
    }
    return currentView === 'history' ? 'history' : 'home';
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be implemented in a future feature
    console.log('YouTube URL submitted:', youtubeUrl);
    // Show a toast or message that this feature is coming soon
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentView={getHeaderView()} onViewChange={handleViewChange} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full">
                  {/* Animated circles */}
                  <div className="absolute w-64 h-64 bg-primary-500/30 rounded-full -top-20 -left-20 blur-3xl animate-pulse-slow"></div>
                  <div className="absolute w-72 h-72 bg-accent-500/30 rounded-full -bottom-20 -right-20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>

              <div className="text-center space-y-6 py-16 relative">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-accent-100 px-4 py-2 rounded-full text-sm font-medium text-primary-700">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span>Powered by Advanced AI</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-slate-800 leading-tight">
                  AI-Powered <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">Video Understanding</span>
                </h1>
                
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  Upload a video or paste a YouTube link to get instant scene insights, summaries, and more.
                </p>
              </div>
            </div>

            {/* Upload Section */}
            <VideoUpload onVideoSelect={handleVideoSelect} />

            {/* YouTube URL Input */}
            <div className="max-w-md mx-auto">
              <form onSubmit={handleYoutubeSubmit} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Paste YouTube URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 text-slate-800"
                  />
                  <Youtube className="absolute left-3 top-3.5 w-5 h-5 text-red-500" />
                </div>
                <Button 
                  type="submit" 
                  className="h-12 bg-red-500 hover:bg-red-600 text-white"
                  disabled={!youtubeUrl.trim()}
                >
                  Analyze
                </Button>
              </form>
              <p className="text-xs text-center text-slate-500 mt-2">
                YouTube analysis coming soon!
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                <div className="w-12 h-12 bg-red-50 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Youtube className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Analyze YouTube Videos</h3>
                <p className="text-slate-600">Paste any video URL and let AI do the rest.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                <div className="w-12 h-12 bg-blue-50 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Auto Transcription</h3>
                <p className="text-slate-600">Get high-accuracy text from speech—even without captions.</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                <div className="w-12 h-12 bg-purple-50 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Smart Video Insights</h3>
                <p className="text-slate-600">Summaries, objects, actions, scenes — all in one click.</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'processing' && selectedVideoFile && currentFileId && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <VideoProcessing
              fileId={currentFileId}
              fileName={selectedVideoFile.name}
              onProcessingComplete={handleProcessingComplete}
            />
          </div>
        )}

        {currentView === 'interaction' && selectedVideoFile && currentFileId && (
          <VideoInteraction
            fileId={currentFileId}
            videoFile={selectedVideoFile}
            onBack={handleBackToHome}
          />
        )}

        {currentView === 'history' && (
          <VideoHistory onVideoSelect={handleHistoryVideoSelect} />
        )}
      </main>
    </div>
  );
};

export default Index;
