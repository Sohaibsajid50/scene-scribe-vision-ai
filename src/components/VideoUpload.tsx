
import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Check, File } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import FileUploadDialog from './FileUploadDialog';

interface VideoUploadProps {
  onVideoSelect: (file: File, fileId: string) => void;
}

const VideoUpload = ({ onVideoSelect }: VideoUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const response = await apiService.uploadVideo(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      setTimeout(() => {
        toast.success('Video uploaded successfully!');
        onVideoSelect(file, response.file_id);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

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
        uploadFile(file);
      } else {
        toast.error('Please select a video file');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      uploadFile(file);
    }
  }, []);

  const handleDialogFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadFile(file);
  };

  const triggerFileSelect = () => {
    const input = document.getElementById('video-upload') as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card 
        className={`p-8 border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : uploadSuccess
            ? 'border-green-500 bg-green-50'
            : isHovering
            ? 'border-primary-400 shadow-md'
            : 'border-slate-300 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="text-center space-y-6">
          <div 
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isHovering && !uploadSuccess ? 'animate-bounce' : 'animate-float'
            } ${
              uploadSuccess 
                ? 'bg-green-500' 
                : 'bg-gradient-to-br from-primary-500 to-accent-500'
            }`}
          >
            {uploadSuccess ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <Upload className={`w-8 h-8 text-white ${isHovering ? 'scale-110 transition-transform' : ''}`} />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">
              {uploadSuccess ? 'Upload Complete!' : 'Upload your video'}
            </h3>
            <p className="text-slate-600 font-medium">
              {uploadSuccess 
                ? 'Your video has been uploaded successfully'
                : 'Drag and drop your video file here, or click to browse'
              }
            </p>
            {!uploadSuccess && (
              <p className="text-sm text-slate-500">
                Supports MP4, MOV, AVI, and more • Max size: 500MB
              </p>
            )}
          </div>

          {!uploadSuccess && (
            <div className="space-y-4">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
                disabled={isUploading}
              />
              <Button 
                onClick={triggerFileSelect}
                disabled={isUploading}
                className={`cursor-pointer bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white ${
                  isHovering ? 'scale-105 shadow-lg' : ''
                } transition-all duration-300`}
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-sm text-slate-600">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className={`rounded-lg p-4 border transition-all duration-300 ${
              uploadSuccess ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  uploadSuccess ? 'bg-green-100' : 'bg-primary-100'
                }`}>
                  {uploadSuccess ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <File className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800 truncate">{selectedFile.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    {uploadSuccess && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">Ready for analysis</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
