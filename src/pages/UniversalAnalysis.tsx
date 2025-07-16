import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader, ArrowLeft, Bot } from 'lucide-react';
import { unifiedApiService, Job, Message as ApiMessage } from '@/services/unifiedApi';
import { toast } from 'sonner';
import ModernHeader from '@/components/ModernHeader';
import { useAuth } from '@/context/AuthContext';
import VideoDisplay from '@/components/VideoDisplay'; // Import the new component

interface Message extends ApiMessage {
  id?: string; 
  type: 'user' | 'ai';
  timestamp: number;
}

interface AnalysisData {
  contentType: 'video' | 'youtube' | 'text';
  initialResponse?: string;
  videoUrl?: string;
  videoFile?: File;
  fileId?: string;
  originalMessage?: string;
  conversationId?: string;
}

const UniversalAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisData } = (location.state || {}) as { analysisData?: AnalysisData };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [displayUrl, setDisplayUrl] = useState(''); // Single URL state for the video display
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: jobData, error: jobError } = useQuery<Job, Error>({
    queryKey: ['jobStatusAndHistory', analysisData?.conversationId],
    queryFn: async () => {
      if (!analysisData?.conversationId) throw new Error("Conversation ID is missing.");
      const job = await unifiedApiService.getJob(analysisData.conversationId);
      const history = await unifiedApiService.getChatHistory(analysisData.conversationId);
      return { ...job, messages: history };
    },
    enabled: !!analysisData?.conversationId && isAuthenticated,
    refetchInterval: (query) => {
      const data = query.state.data;
      const currentMessagesCount = query.state.data?.messages?.length || 0;
      const previousMessagesCount = messages.length;

      if ((data?.status === 'ACTIVE' || data?.status === 'ERROR') && currentMessagesCount > previousMessagesCount) {
        return false; 
      }
      return 2000;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!analysisData || !analysisData.conversationId) {
      navigate('/');
      return;
    }

    if (!isAuthenticated && !authLoading) {
      toast.error("You must be signed in to view analysis.");
      navigate('/');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Loading conversation...');

    // Set initial display URL from navigation state for immediate feedback
    if (analysisData.contentType === 'youtube' && analysisData.videoUrl) {
      setDisplayUrl(analysisData.videoUrl);
    } else if (analysisData.contentType === 'video' && analysisData.videoFile) {
      const objectUrl = URL.createObjectURL(analysisData.videoFile);
      setDisplayUrl(objectUrl);
      // Set up cleanup for the object URL
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [analysisData, navigate, isAuthenticated, authLoading]);

  useEffect(() => {
    if (jobData) {
      setCurrentJob(jobData);
      const formattedMessages: Message[] = jobData.messages?.map((msg, index) => ({
        ...msg,
        id: msg.id || `${msg.timestamp}-${index}`,
        type: msg.sender.toLowerCase() === 'user' ? 'user' : 'ai',
        timestamp: new Date(msg.created_at).getTime(),
      })) || [];
      setMessages(formattedMessages);

      // Update the display URL from the job data, which is the source of truth from the backend
      if (jobData.source_url && jobData.source_url !== displayUrl) {
         setDisplayUrl(jobData.source_url);
      }

      setProcessingStatus(jobData.status);
      if (jobData.status === 'ACTIVE') {
        setIsProcessing(false);
        toast.success('Analysis complete!');
      } else if (jobData.status === 'ERROR') {
        setIsProcessing(false);
        toast.error(jobData.error_message || 'An error occurred during analysis.');
      } else {
        setIsProcessing(true);
      }
    }
    if (jobError) {
      setIsProcessing(false);
      toast.error(jobError.message);
    }
  }, [jobData, jobError]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = prompt.trim();
    if (!messageText || isLoading || isProcessing || !analysisData?.conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      sender: 'USER',
      content: messageText,
      created_at: new Date().toISOString(),
      job_id: analysisData.conversationId,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      await unifiedApiService.continueChat(analysisData.conversationId, messageText);
    } catch (error) {
      console.error('Failed to generate response:', error);
      toast.error('Failed to generate response. Please try again.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        sender: 'AI',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
        job_id: analysisData.conversationId,
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

  if (!analysisData || !analysisData.conversationId) {
    return (
        <div className="min-h-screen bg-slate-50">
          <ModernHeader />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">No Content Found</h1>
              <p className="text-slate-600 mb-4">No analysis data was provided or conversation ID.</p>
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
              <div className="flex-1 min-h-0 relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-slate-100">
                {/* Replace the complex render function with the new component */}
                {displayUrl ? (
                  <VideoDisplay url={displayUrl} />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                     <Loader className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
            </Card>

            <Card className="lg:col-span-2 p-4 flex flex-col h-full">
              <h2 className="text-lg font-semibold mb-3 flex-shrink-0 text-slate-800">AI Chat</h2>
              
              <div className="flex-1 min-h-0 mb-3 relative">
                <div className="absolute inset-0 overflow-y-auto pr-2 space-y-3">
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
