
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { unifiedApiService } from '@/services/unifiedApi';
import { Job } from '@/models/api_models';
import { useAuth } from '@/context/AuthContext';

interface VideoHistoryProps {
  onVideoSelect: (job: Job) => void;
}

const VideoHistory = ({ onVideoSelect }: VideoHistoryProps) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: historyJobs, isLoading, isError, error } = useQuery<Job[], Error>({
    queryKey: ['userHistory'],
    queryFn: () => unifiedApiService.getHistory(),
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-500">
        Loading authentication status...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-500">
        Please sign in to view your history.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-slate-600">Loading your video history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-red-500">
        Error loading history: {error.message}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Video History</h2>
          <p className="text-muted-foreground">Your previously analyzed videos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search videos..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {historyJobs && historyJobs.length > 0 ? (
          historyJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => onVideoSelect(job)}>
              <div className="relative">
                {/* Placeholder for thumbnail - replace with actual thumbnail logic if available */}
                <img
                  src="https://via.placeholder.com/400x225?text=Video+Thumbnail" // Placeholder
                  alt={job.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {job.status} {/* Display status instead of duration */}
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-slate-800 truncate">{job.title}</h3>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded-full text-xs">
                    {job.job_type}
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVideoSelect(job);
                  }}
                >
                  View Analysis
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 col-span-full">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No videos found</h3>
            <p className="text-muted-foreground">Upload your first video to get started with AI analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoHistory;
