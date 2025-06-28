
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Upload, Youtube, Send, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedChatInterfaceProps {
  onSubmit: (data: {
    type: 'text' | 'video' | 'youtube';
    content: string;
    file?: File;
  }) => Promise<void>;
  isLoading?: boolean;
}

const UnifiedChatInterface = ({ onSubmit, isLoading = false }: UnifiedChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;

    try {
      // Detect if message is a YouTube URL
      const isYouTubeUrl = message.includes('youtube.com') || message.includes('youtu.be');
      
      if (selectedFile) {
        await onSubmit({
          type: 'video',
          content: message || 'Analyze this video',
          file: selectedFile
        });
      } else if (isYouTubeUrl) {
        await onSubmit({
          type: 'youtube',
          content: message,
        });
      } else {
        await onSubmit({
          type: 'text',
          content: message,
        });
      }

      // Reset form
      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      toast.success('Video selected successfully!');
    } else {
      toast.error('Please select a valid video file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      toast.success('Video dropped successfully!');
    } else {
      toast.error('Please drop a valid video file.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card 
        className={`p-6 border-2 transition-all duration-300 ${
          dragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </Button>
            </div>
          )}

          {/* Main Input Area */}
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Upload a video, paste a YouTube URL, or ask me anything..."
              className="min-h-[100px] pr-20 resize-none border-slate-200 focus:border-primary-300 focus:ring-primary-200 text-slate-800 placeholder-slate-400"
              disabled={isLoading}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-600"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                type="submit"
                size="sm"
                disabled={(!message.trim() && !selectedFile) || isLoading}
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

          {/* Helper Text */}
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload videos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Youtube className="w-4 h-4" />
              <span>YouTube URLs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Text messages</span>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UnifiedChatInterface;
