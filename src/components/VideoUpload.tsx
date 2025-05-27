import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Play } from 'lucide-react';
import FileUploadDialog from './FileUploadDialog';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        onVideoSelect(file);
      }
    }
  }, [onVideoSelect]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onVideoSelect(file);
    }
  }, [onVideoSelect]);

  const handleDialogFileSelect = (file: File) => {
    setSelectedFile(file);
    onVideoSelect(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card 
        className={`p-8 border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-slate-300 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center animate-float">
            <Upload className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">
              Upload your video
            </h3>
            <p className="text-slate-600 font-medium">
              Drag and drop your video file here, or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports MP4, MOV, AVI, and more • Max size: 500MB
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="cursor-pointer bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white"
            >
              Choose File
            </Button>

            {selectedFile && (
              <div className="bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onFileSelect={handleDialogFileSelect}
      />
    </div>
  );
};

export default VideoUpload;
