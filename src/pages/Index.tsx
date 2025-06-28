
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ModernHeader from '@/components/ModernHeader';
import ModernHero from '@/components/ModernHero';
import UnifiedChatInterface from '@/components/UnifiedChatInterface';
import { unifiedApiService } from '@/services/unifiedApi';

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => {
    setShowChat(true);
    // Smooth scroll to chat interface
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleChatSubmit = async (data: {
    type: 'text' | 'video' | 'youtube';
    content: string;
    file?: File;
  }) => {
    setIsLoading(true);
    
    try {
      let response;
      
      if (data.type === 'youtube') {
        // Extract YouTube URL from content
        const youtubeUrlMatch = data.content.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
        );
        
        if (youtubeUrlMatch) {
          const youtubeUrl = data.content.includes('http') 
            ? data.content.split(' ')[0] 
            : `https://www.youtube.com/watch?v=${youtubeUrlMatch[1]}`;
          
          response = await unifiedApiService.sendMessage({
            type: 'youtube',
            youtube_url: youtubeUrl,
            message: data.content,
          });

          // Navigate to analysis page with YouTube data
          navigate('/analyze', {
            state: {
              youtubeUrl,
              initialResponse: response.response,
            },
          });
          return;
        } else {
          toast.error('Please provide a valid YouTube URL');
          return;
        }
      } else if (data.type === 'video') {
        response = await unifiedApiService.sendMessage({
          type: 'video',
          file: data.file,
          message: data.content,
        });
        
        // For video uploads, we could navigate to a processing page
        toast.success('Video uploaded successfully! Processing...');
        return;
      } else {
        response = await unifiedApiService.sendMessage({
          type: 'text',
          message: data.content,
        });
        
        toast.success('Message sent successfully!');
        return;
      }
    } catch (error) {
      console.error('Chat submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <ModernHeader />
      
      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <ModernHero onGetStarted={handleGetStarted} />
        
        {/* Chat Interface */}
        {showChat && (
          <div ref={chatRef} className="py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Welcome to SceneSpeak
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Instantly chat with your videos, YouTube links, or just ask a question. 
                Our AI understands your content and provides intelligent responses.
              </p>
            </div>
            
            <UnifiedChatInterface 
              onSubmit={handleChatSubmit}
              isLoading={isLoading}
            />
            
            {/* Quick Examples */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Try these examples:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-colors">
                  <h4 className="font-medium text-slate-800 mb-2">Upload a Video</h4>
                  <p className="text-sm text-slate-600">
                    "Summarize the key points from this presentation"
                  </p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-colors">
                  <h4 className="font-medium text-slate-800 mb-2">YouTube Analysis</h4>
                  <p className="text-sm text-slate-600">
                    "https://youtube.com/watch?v=... What's the main topic?"
                  </p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-colors">
                  <h4 className="font-medium text-slate-800 mb-2">Ask Questions</h4>
                  <p className="text-sm text-slate-600">
                    "How can I improve my video content?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
