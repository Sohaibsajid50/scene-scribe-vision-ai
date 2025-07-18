import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, Youtube, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VideoInputProps {
  onSubmit: (data: {
    type: 'video' | 'youtube';
    content: string; // This will be the YouTube URL or a placeholder for video file
    file?: File;
  }) => Promise<void>;
  isLoading?: boolean;
}

const VideoInput: React.FC<VideoInputProps> = ({ onSubmit, isLoading = false }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (selectedFile) {
      await onSubmit({
        type: 'video',
        content: selectedFile.name, // Placeholder, actual content is the file
        file: selectedFile,
      });
    } else if (youtubeUrl.trim()) {
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(youtubeUrl)) {
        toast.error('Please enter a valid YouTube URL.');
        return;
      }
      await onSubmit({
        type: 'youtube',
        content: youtubeUrl,
      });
    } else {
      toast.error('Please upload a video file or enter a YouTube URL.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setYoutubeUrl(''); // Clear YouTube URL if file is selected
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
      setYoutubeUrl(''); // Clear YouTube URL if file is selected
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

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
    if (e.target.value.trim() !== '') {
      setSelectedFile(null); // Clear selected file if YouTube URL is being typed
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* YouTube URL Input */}
          <div className="flex items-center space-x-2">
            <Youtube className="w-6 h-6 text-red-500" />
            <Input
              type="text"
              placeholder="Paste YouTube URL here..."
              value={youtubeUrl}
              onChange={handleYoutubeUrlChange}
              className="flex-grow border-slate-200 focus:border-primary-300 focus:ring-primary-200 !text-slate-800 placeholder:text-slate-400"
              disabled={isLoading || selectedFile !== null}
            />
          </div>

          <div className="relative flex items-center justify-center py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative bg-white px-4 text-sm text-slate-500">OR</div>
          </div>

          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
                ${dragActive ? 'border-primary-400 bg-primary-50' : 'border-slate-300 hover:border-slate-400'}
                ${isLoading || youtubeUrl.trim() !== '' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isLoading && youtubeUrl.trim() === '' && fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-slate-600 font-medium">Drag & drop a video here</p>
              <p className="text-sm text-slate-500">or click to browse (MP4, MOV, AVI, etc.)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading || youtubeUrl.trim() !== ''}
              />
            </div>
          ) : (
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
                disabled={isLoading}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300"
            disabled={isLoading || (!selectedFile && !youtubeUrl.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Video...
              </>
            ) : (
              'Start Analysis'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default VideoInput;