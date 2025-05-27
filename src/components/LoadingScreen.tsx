
import { Card } from '@/components/ui/card';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center animate-pulse-slow">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-accent-500 rounded-full animate-spin"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-800">
              Analyzing your video...
            </h2>
            <p className="text-muted-foreground">
              Our AI is understanding every frame and scene
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full animate-gradient-shift"></div>
            </div>
            <div className="text-sm text-muted-foreground">
              This usually takes 30-60 seconds...
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing frames</span>
              <span className="text-accent-600 font-medium">✓</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Extracting scenes</span>
              <div className="w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Generating insights</span>
              <span>○</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingScreen;
