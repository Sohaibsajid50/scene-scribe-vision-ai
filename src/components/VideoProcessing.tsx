
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';
import { apiService, StatusResponse } from '@/services/api';

interface VideoProcessingProps {
  fileId: string;
  fileName: string;
  onProcessingComplete: () => void;
}

const VideoProcessing = ({ fileId, fileName, onProcessingComplete }: VideoProcessingProps) => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const statusResponse = await apiService.getStatus(fileId);
        setStatus(statusResponse);
        
        if (statusResponse.status === 'ACTIVE') {
          onProcessingComplete();
        } else if (statusResponse.status === 'ERROR') {
          setError(statusResponse.message || 'Processing failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);
    
    // Initial poll
    pollStatus();

    return () => clearInterval(interval);
  }, [fileId, onProcessingComplete]);

  if (error) {
    return (
      <Card className="p-8 max-w-md w-full mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 text-red-600">✕</div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-800">Processing Failed</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md w-full mx-auto">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center animate-pulse">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-800">
            Processing your video...
          </h2>
          <p className="text-slate-600 font-medium">
            {fileName}
          </p>
        </div>

        <div className="space-y-4">
          <Progress value={status?.progress || 30} className="w-full" />
          <div className="text-sm text-slate-600">
            Status: {status?.status || 'UPLOADING'}
            {status?.message && ` - ${status.message}`}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Upload complete</span>
            <span className="text-green-600 font-medium">✓</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Processing video</span>
            {status?.status === 'PROCESSING' ? (
              <Loader className="w-4 h-4 text-accent-500 animate-spin" />
            ) : status?.status === 'ACTIVE' ? (
              <span className="text-green-600 font-medium">✓</span>
            ) : (
              <span className="text-slate-400">○</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={status?.status === 'ACTIVE' ? 'text-slate-600' : 'text-slate-400'}>
              Ready for analysis
            </span>
            {status?.status === 'ACTIVE' ? (
              <span className="text-green-600 font-medium">✓</span>
            ) : (
              <span className="text-slate-400">○</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoProcessing;
