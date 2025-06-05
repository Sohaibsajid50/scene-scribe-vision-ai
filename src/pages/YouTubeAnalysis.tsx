
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader, Send, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface YouTubeAnalysisData {
  video_id: string;
  title: string;
  summary: string;
  embed_url: string;
}

const YouTubeAnalysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoId = searchParams.get('videoId');
  
  const [analysisData, setAnalysisData] = useState<YouTubeAnalysisData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (!videoId) {
      navigate('/');
      return;
    }

    // Simulate loading analysis data
    setTimeout(() => {
      setAnalysisData({
        video_id: videoId,
        title: 'YouTube Video Analysis',
        summary: 'This is a placeholder summary of the YouTube video. The AI has analyzed the content and identified key themes, topics, and insights from the video.',
        embed_url: `https://www.youtube.com/embed/${videoId}`
      });
      setIsInitialLoading(false);
    }, 2000);
  }, [videoId, navigate]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = prompt.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      // Simulate AI response for YouTube analysis
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Based on the YouTube video analysis, here's my response to your question: "${messageText}". This is a simulated response that would contain insights about the video content.`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      toast.error('Failed to generate response');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header currentView="analysis" onViewChange={() => {}} />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Analyzing YouTube Video</h2>
            <p className="text-slate-600">Please wait while we process the video content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header currentView="analysis" onViewChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Video Not Found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentView="analysis" onViewChange={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">YouTube Analysis</h1>
              <p className="text-slate-600">{analysisData.title}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video and Summary */}
            <Card className="p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-800">Video & Summary</h2>
              
              {/* YouTube Embed */}
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <iframe
                  src={analysisData.embed_url}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>

              {/* AI Summary */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-200">
                <h3 className="font-semibold text-slate-800 mb-2">AI Summary</h3>
                <p className="text-slate-700 leading-relaxed">{analysisData.summary}</p>
              </div>
            </Card>

            {/* Chat Interface */}
            <Card className="p-6 flex flex-col min-h-[600px]">
              <h2 className="text-xl font-semibold mb-4 flex-shrink-0 text-slate-800">Ask about this video</h2>
              
              {/* Messages */}
              <div className="flex-1 min-h-0 mb-4 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {messages.length === 0 && !isLoading && (
                      <div className="text-center py-8 text-slate-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mx-auto flex items-center justify-center mb-4">
                          <Send className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-lg font-medium mb-2 text-slate-700">Start asking questions</p>
                        <p className="text-sm text-slate-500">Ask me anything about this YouTube video</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-br-md'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <div className={`text-xs mt-2 ${
                            message.type === 'user' ? 'text-white/70' : 'text-slate-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-md shadow-sm flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-slate-600">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-3 flex-shrink-0">
                <div className="relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about this YouTube video..."
                    className="resize-none pr-12 rounded-xl border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800"
                    rows={3}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isLoading}
                    size="sm"
                    className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                  >
                    {isLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default YouTubeAnalysis;
