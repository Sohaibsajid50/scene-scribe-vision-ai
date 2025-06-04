
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, Loader, Send } from 'lucide-react';
import { apiService } from '@/services/api';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompts
  const promptSuggestions = [
    "Summarize this video",
    "What happens at the end?",
    "Describe this scene visually",
    "What are the main topics discussed?",
    "List the key moments in this video"
  ];

  // Create video URL for preview
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
    e?.preventDefault();
    const messageText = promptText || prompt.trim();
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
      const response = await apiService.generateResponse({
        file_id: fileId,
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
      toast.error(error instanceof Error ? error.message : 'Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    textareaRef.current?.focus();
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Fixed Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Video Analysis</h1>
          <p className="text-slate-600">{videoFile.name}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 12rem)' }}>
        {/* Video Preview - Fixed */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Video Preview</h2>
          <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-4">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Timeline Placeholder */}
          <div className="flex-1 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 mb-2">Timeline (Coming Soon)</h3>
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="text-sm text-slate-500">
                Timestamped insights will appear here
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Interface - Fixed with Scrollable Messages */}
        <Card className="p-6 flex flex-col h-full">
          {/* Fixed Header */}
          <h2 className="text-xl font-semibold mb-4">Ask about your video</h2>
          
          {/* Scrollable Messages Container */}
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4 pr-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-8 text-slate-500">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mx-auto flex items-center justify-center mb-4">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">Ask me anything about your video</p>
                  </div>
                </div>
              )}
              
              {/* Messages */}
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
              
              {/* Loading indicator */}
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
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Fixed Prompt Suggestions */}
          {messages.length === 0 && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors border border-slate-200 hover:border-slate-300"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your video..."
                className="resize-none pr-12 rounded-xl border-slate-200 focus:border-primary-300 focus:ring-primary-200"
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
  );
};

export default VideoInteraction;
