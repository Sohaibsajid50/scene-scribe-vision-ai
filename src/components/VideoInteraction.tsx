
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader } from 'lucide-react';
import { apiService, GenerateResponse } from '@/services/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface VideoInteractionProps {
  fileId: string;
  videoFile: File;
  onBack: () => void;
}

const VideoInteraction = ({ fileId, videoFile, onBack }: VideoInteractionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Create video URL for preview
  useState(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await apiService.generateResponse({
        file_id: fileId,
        prompt: prompt.trim()
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Video Analysis</h1>
          <p className="text-slate-600">{videoFile.name}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Video Preview</h2>
          <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Timeline Placeholder */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 mb-2">Timeline (Coming Soon)</h3>
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="text-sm text-slate-500">
                Timestamped insights will appear here
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Ask about your video</h2>
          
          {/* Messages */}
          <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p className="mb-2">Start by asking a question about your video</p>
                <div className="text-sm space-y-1">
                  <p>Try: "Summarize this video"</p>
                  <p>Or: "What are the main topics discussed?"</p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-lg flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-slate-600">Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about your video..."
              className="resize-none"
              rows={3}
            />
            <Button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default VideoInteraction;
