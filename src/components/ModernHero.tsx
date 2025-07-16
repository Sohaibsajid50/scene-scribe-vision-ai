
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Brain, MessageSquare } from 'lucide-react';

interface ModernHeroProps {
  onGetStarted: () => void;
}

const ModernHero = ({ onGetStarted }: ModernHeroProps) => {
  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center space-y-8 py-32">
        

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight">
            Chat with your
            <span className="bg-gradient-to-r from-primary-500 via-accent-500 to-purple-500 bg-clip-text text-transparent">
              {" "}videos
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Upload any video, paste a YouTube link, or just ask a question. 
            Get instant insights, summaries, and have natural conversations about your content.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 py-6">
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
            <Play className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-slate-700">Video Analysis</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
            <MessageSquare className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-medium text-slate-700">Smart Chat</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-slate-700">AI Insights</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-slate-700">Instant Results</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started Free
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="pt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Trusted by creators worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-slate-400">YT</div>
            <div className="text-2xl font-bold text-slate-400">MP4</div>
            <div className="text-2xl font-bold text-slate-400">MOV</div>
            <div className="text-2xl font-bold text-slate-400">AI</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHero;
