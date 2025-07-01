
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ModernHeader from '@/components/ModernHeader';
import ModernHero from '@/components/ModernHero';
import UnifiedChatInterface from '@/components/UnifiedChatInterface';
import { unifiedApiService } from '@/services/unifiedApi';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal'; // Import AuthModal

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    if (authLoading) return; // Prevent action while auth status is loading

    if (!isAuthenticated) {
      toast.info("Please sign in to get started.");
      setShowAuthModal(true);
      return;
    }
    setShowChat(true);
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleChatSubmit = async (data: {
    type: 'text' | 'video' | 'youtube';
    content: string;
    file?: File;
  }) => {
    if (!isAuthenticated) {
      toast.error("You must be signed in to start a conversation.");
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await unifiedApiService.sendMessage({
        message: data.content,
        file: data.file,
      });

      // Determine content type for the analysis page
      let contentType: 'video' | 'youtube' | 'text' = 'text';
      let videoUrl: string | undefined;
      let videoFile: File | undefined;

      if (data.file) {
        contentType = 'video';
        videoFile = data.file;
      } else if (data.content.includes('youtube.com') || data.content.includes('youtu.be')) {
        contentType = 'youtube';
        const youtubeUrlMatch = data.content.match(
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#\s]+)/
        );
        if (youtubeUrlMatch) {
          videoUrl = youtubeUrlMatch[0].startsWith('http') 
            ? youtubeUrlMatch[0] 
            : `https://www.youtube.com/watch?v=${youtubeUrlMatch[1]}`;
        }
      }

      navigate('/analysis', {
        state: {
          analysisData: {
            contentType,
            initialResponse: response.response,
            videoUrl,
            videoFile,
            fileId: response.file_id, // Pass the file_id
            originalMessage: data.content,
            conversationId: response.conversation_id, // Pass the conversation_id
          },
        },
      });
    } catch (error) {
      console.error('Chat submission failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // If user just signed in, and they were trying to get started, show chat
    if (!showChat) {
      setShowChat(true);
      setTimeout(() => {
        chatRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
              disabled={authLoading || !isAuthenticated} // Disable if not authenticated or loading
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
