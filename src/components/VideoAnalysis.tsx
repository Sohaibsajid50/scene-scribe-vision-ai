
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Play } from 'lucide-react';

interface VideoAnalysisProps {
  videoFile: File;
  onBack: () => void;
}

interface TimelineInsight {
  timestamp: number;
  title: string;
  description: string;
  confidence: number;
}

const VideoAnalysis = ({ videoFile, onBack }: VideoAnalysisProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock AI-generated insights
  const insights: TimelineInsight[] = [
    {
      timestamp: 0,
      title: "Scene Opening",
      description: "Video begins with a wide establishing shot of a city skyline at golden hour. The lighting suggests late afternoon with warm, amber tones dominating the frame.",
      confidence: 0.94
    },
    {
      timestamp: 15,
      title: "Character Introduction",
      description: "A person in business attire enters the frame from the left, walking confidently down a busy street. Body language suggests purposeful movement.",
      confidence: 0.89
    },
    {
      timestamp: 32,
      title: "Environment Change",
      description: "Scene transitions to an indoor office environment. Modern, minimalist design with glass partitions and natural lighting from large windows.",
      confidence: 0.92
    },
    {
      timestamp: 48,
      title: "Interaction Detected",
      description: "Multiple people are engaged in what appears to be a meeting or presentation. Gestures and body language indicate active discussion.",
      confidence: 0.87
    },
    {
      timestamp: 65,
      title: "Technology Focus",
      description: "Camera focuses on digital screens and devices. Content appears to be data visualization or presentation materials.",
      confidence: 0.91
    }
  ];

  const handleTimeSeek = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const videoUrl = videoFile ? URL.createObjectURL(videoFile) : '';

  const filteredInsights = insights.filter(insight =>
    insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Video Analysis</h2>
          <p className="text-muted-foreground">{videoFile.name}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Video Player</h3>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full aspect-video"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Current time: {Math.floor(currentTime)}s
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                  onClick={() => handleTimeSeek(insight.timestamp)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                      <span className="text-sm font-medium text-primary-600">
                        {Math.floor(insight.timestamp / 60)}:{String(insight.timestamp % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {Math.round(insight.confidence * 100)}% confident
                      </span>
                      <Play className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <h4 className="font-medium text-slate-800 mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Scene Timeline</h3>
        <div className="relative">
          <div className="h-2 bg-slate-200 rounded-full relative overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                 style={{ width: `${(currentTime / 80) * 100}%` }}>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            {insights.map((insight, index) => (
              <button
                key={index}
                onClick={() => handleTimeSeek(insight.timestamp)}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className="w-3 h-3 bg-accent-500 rounded-full group-hover:scale-125 transition-transform"></div>
                <span className="text-xs text-muted-foreground group-hover:text-primary-600">
                  {Math.floor(insight.timestamp / 60)}:{String(insight.timestamp % 60).padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoAnalysis;
