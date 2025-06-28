import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import ModernHeader from '@/components/ModernHeader';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!youtubeUrl || !initialResponse) {
      navigate('/');
      return;
    }

    // Extract video ID and create embed URL
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    } else {
      setVideoError(true);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      // Use the /youtube/analyze endpoint for follow-up questions
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
      console.error('Failed to generate response:', error);
      toast.error('Failed to generate response. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
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
        <ModernHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Video Not Found</h1>
            <p className="text-slate-600 mb-4">No video data was provided.</p>
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ModernHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">YouTube Analysis</h1>
              <p className="text-slate-600">AI-powered video insights and chat</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
            {/* Video Player - 60% */}
            <Card className="lg:col-span-3 p-4 flex flex-col">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Video Player</h2>
              
              <div className="flex-1 min-h-0">
                {videoError ? (
                  <div className="h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-6">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="text-slate-700 font-medium mb-2">Unable to load video</p>
                    <p className="text-slate-500 text-sm text-center">The YouTube URL provided is invalid or the video may be private.</p>
                  </div>
                ) : embedUrl ? (
                  <div className="h-full bg-slate-100 rounded-lg overflow-hidden">
                    <iframe
                      src={embedUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      onError={() => setVideoError(true)}
                    ></iframe>
                  </div>
                ) : (
                  <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center">
                    <Loader className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
            </Card>

            {/* Chat Interface - 40% */}
            <Card className="lg:col-span-2 p-4 flex flex-col h-full">
              <h2 className="text-lg font-semibold mb-3 flex-shrink-0 text-slate-800">AI Chat</h2>
              
              {/* Messages - Scrollable */}
              <div className="flex-1 min-h-0 mb-3 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 space-y-3">
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
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Form - Fixed at bottom */}
              <form onSubmit={handleSubmit} className="space-y-2 flex-shrink-0">
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
