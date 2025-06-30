import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader, ArrowLeft, AlertCircle, Play, Bot } from 'lucide-react';
import { unifiedApiService, StatusResponse } from '@/services/unifiedApi';
import { toast } from 'sonner';
import ModernHeader from '@/components/ModernHeader';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface AnalysisData {
  contentType: 'video' | 'youtube' | 'text';
  initialResponse: string;
  videoUrl?: string;
  videoFile?: File;
  fileId?: string;
  originalMessage?: string;
}

const UniversalAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisData } = (location.state || {}) as { analysisData?: AnalysisData };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For follow-up chats
  const [isProcessing, setIsProcessing] = useState(false); // For initial analysis
  const [processingStatus, setProcessingStatus] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState('');

  const { data: statusData, error: statusError } = useQuery<StatusResponse, Error>({
    queryKey: ['analysisStatus', analysisData?.fileId],
    queryFn: () => unifiedApiService.getStatus(analysisData!.fileId!),
    enabled: !!analysisData?.fileId && isProcessing,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if the analysis is active or has failed
      if (data?.status === 'ACTIVE' || data?.status === 'ERROR') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!analysisData) {
      navigate('/');
      return;
    }

    // If there's a fileId, it means we need to poll for status
    if (analysisData.fileId) {
      setIsProcessing(true);
      setProcessingStatus('Starting analysis...');
      const initialMessage: Message = {
        id: 'initial-processing',
        type: 'ai',
        content: analysisData.initialResponse,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    } else {
      // Otherwise, the analysis was synchronous
      const initialMessage: Message = {
        id: 'initial',
        type: 'ai',
        content: analysisData.initialResponse,
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    }

    // Handle video display
    if (analysisData.contentType === 'youtube' && analysisData.videoUrl) {
      const videoId = extractVideoId(analysisData.videoUrl);
      if (videoId) setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
      else setVideoError(true);
    } else if (analysisData.contentType === 'video' && analysisData.videoFile) {
      const objectUrl = URL.createObjectURL(analysisData.videoFile);
      setVideoObjectUrl(objectUrl);
    }

    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    };
  }, [analysisData, navigate]);

  // Effect to handle status updates from polling
  useEffect(() => {
    if (statusData) {
      setProcessingStatus(statusData.message || statusData.status);
      if (statusData.status === 'ACTIVE') {
        setIsProcessing(false);
        const finalMessage: Message = {
          id: 'final-analysis',
          type: 'ai',
          content: statusData.response || 'Analysis complete. You can now ask me questions.',
          timestamp: Date.now()
        };
        // Replace the "processing" message with the final one
        setMessages(prev => [finalMessage]);
        toast.success('Analysis complete!');
      } else if (statusData.status === 'ERROR') {
        setIsProcessing(false);
        const errorMessage: Message = {
          id: 'error-analysis',
          type: 'ai',
          content: statusData.message || 'An error occurred during analysis.',
          timestamp: Date.now()
        };
        setMessages(prev => [errorMessage]);
        toast.error('Analysis failed.');
      }
    }
    if (statusError) {
      setIsProcessing(false);
      toast.error(statusError.message);
    }
  }, [statusData, statusError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

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
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = prompt.trim();
    if (!messageText || isLoading || isProcessing) return;

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
      const response = await unifiedApiService.continueChat(messageText, {
        contentType: analysisData?.contentType,
        fileId: analysisData?.fileId,
        originalMessage: analysisData?.originalMessage
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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
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
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderVideoPlayer = () => {
    // ... (This function remains the same, so it's omitted for brevity)
    if (analysisData?.contentType === 'youtube') {
        if (videoError) {
          return (
            <div className="h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-slate-700 font-medium mb-2">Unable to load video</p>
              <p className="text-slate-500 text-sm text-center">The YouTube URL provided is invalid or the video may be private.</p>
            </div>
          );
        } else if (embedUrl) {
          return (
            <div className="h-full bg-slate-100 rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                onError={() => setVideoError(true)}
              />
            </div>
          );
        }
      } else if (analysisData?.contentType === 'video' && videoObjectUrl) {
        return (
          <div className="h-full bg-slate-100 rounded-lg overflow-hidden">
            <video
              src={videoObjectUrl}
              controls
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
  
      return (
        <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No video content</p>
            <p className="text-slate-500 text-sm">Continue chatting below</p>
          </div>
        </div>
      );
  };

  if (!analysisData) {
    // ... (This part remains the same)
    return (
        <div className="min-h-screen bg-slate-50">
          <ModernHeader />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">No Content Found</h1>
              <p className="text-slate-600 mb-4">No analysis data was provided.</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Content Analysis</h1>
              <p className="text-slate-600">AI-powered insights and chat</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
            <Card className="lg:col-span-3 p-4 flex flex-col">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                {analysisData.contentType === 'youtube' ? 'YouTube Video' : 
                 analysisData.contentType === 'video' ? 'Video Content' : 'Text Analysis'}
              </h2>
              <div className="flex-1 min-h-0">{renderVideoPlayer()}</div>
            </Card>

            <Card className="lg:col-span-2 p-4 flex flex-col h-full">
              <h2 className="text-lg font-semibold mb-3 flex-shrink-0 text-slate-800">AI Chat</h2>
              
              <div className="flex-1 min-h-0 mb-3 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-lg shadow-sm ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-slate-500'}`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-white border p-3 rounded-lg shadow-sm flex items-center space-x-3">
                        <Bot className="w-5 h-5 text-blue-500 animate-pulse" />
                        <span className="text-sm text-slate-600">{processingStatus}</span>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border p-3 rounded-lg shadow-sm flex items-center space-x-2">
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

              <form onSubmit={handleSubmit} className="space-y-2 flex-shrink-0">
                <div className="relative">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Continue the conversation..."
                    className="resize-none pr-12 rounded-lg"
                    rows={2}
                    disabled={isLoading || isProcessing}
                  />
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isLoading || isProcessing}
                    size="sm"
                    className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-lg"
                  >
                    {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
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

export default UniversalAnalysis;