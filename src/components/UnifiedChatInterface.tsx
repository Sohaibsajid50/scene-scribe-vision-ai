
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedChatInterfaceProps {
  onSubmit: (data: {
    type: 'text';
    content: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const UnifiedChatInterface = ({ onSubmit, isLoading = false }: UnifiedChatInterfaceProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await onSubmit({
        type: 'text',
        content: message,
      });

      // Reset form
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card 
        className="p-6 border-2 transition-all duration-300 border-slate-200 hover:border-slate-300"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Input Area */}
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[100px] pr-20 resize-none border-slate-200 focus:border-primary-300 focus:ring-primary-200 !text-slate-800 placeholder-slate-500"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e); // Pass the event to handleSubmit
                }
              }}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || isLoading}
                className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UnifiedChatInterface;
