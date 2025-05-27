
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Search } from 'lucide-react';

interface HistoryVideo {
  id: string;
  name: string;
  thumbnail: string;
  uploadDate: string;
  duration: string;
  insights: number;
}

interface VideoHistoryProps {
  onVideoSelect: (video: HistoryVideo) => void;
}

const VideoHistory = ({ onVideoSelect }: VideoHistoryProps) => {
  // Mock history data
  const historyVideos: HistoryVideo[] = [
    {
      id: '1',
      name: 'Product Demo Meeting.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop',
      uploadDate: '2024-01-15',
      duration: '5:32',
      insights: 12
    },
    {
      id: '2',
      name: 'Team Presentation.mov',
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop',
      uploadDate: '2024-01-14',
      duration: '8:45',
      insights: 18
    },
    {
      id: '3',
      name: 'Customer Interview.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=225&fit=crop',
      uploadDate: '2024-01-12',
      duration: '12:15',
      insights: 24
    },
    {
      id: '4',
      name: 'Marketing Campaign.mov',
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=225&fit=crop',
      uploadDate: '2024-01-10',
      duration: '3:28',
      insights: 8
    }
  ];

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
        {historyVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => onVideoSelect(video)}>
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-800 truncate">{video.name}</h3>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded-full text-xs">
                  {video.insights} insights
                </span>
              </div>
              
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoSelect(video);
                }}
              >
                View Analysis
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State (if no videos) */}
      {historyVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No videos found</h3>
          <p className="text-muted-foreground">Upload your first video to get started with AI analysis</p>
        </div>
      )}
    </div>
  );
};

export default VideoHistory;
