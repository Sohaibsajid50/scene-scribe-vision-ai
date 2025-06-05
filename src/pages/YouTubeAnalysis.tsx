
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const YouTubeAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { youtubeUrl, initialResponse } = location.state || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    if (!youtubeUrl || !initialResponse) {
      navigate('/');
      return;
    }

    // Extract video ID and create embed URL
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    }

    // Add initial AI response
    const initialMessage: Message = {
      id: 'initial',
      type: 'ai',
      content: initialResponse,
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  }, [youtubeUrl, initialResponse, navigate]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

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
      const response = await apiService.analyzeYouTube({
        youtube_url: youtubeUrl,
        prompt: messageText
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to generate response');
    } finally {
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

  if (!youtubeUrl || !initialResponse) {
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
              <p className="text-slate-600">AI-powered video insights and chat</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
            {/* Video Player - 60% */}
            <Card className="lg:col-span-3 p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Video Player</h2>
              
              {embedUrl ? (
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Unable to load video</p>
                </div>
              )}
            </Card>

            {/* Chat Interface - 40% */}
            <Card className="lg:col-span-2 p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 flex-shrink-0 text-slate-800">AI Chat</h2>
              
              {/* Messages */}
              <div className="flex-1 min-h-0 mb-4 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
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
                        <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-bl-md shadow-sm flex items-center space-x-2">
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
                    placeholder="Ask about this video..."
                    className="resize-none pr-12 rounded-lg border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800"
                    rows={2}
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
