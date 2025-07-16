import React from 'react';
import { useNavigate } from 'react-router-dom';
import VideoHistory from '@/components/VideoHistory';
import ModernHeader from '@/components/ModernHeader';
import { Job } from '@/models/api_models';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const handleVideoSelect = (job: Job) => {
    // Navigate to the UniversalAnalysis page with the job details
    navigate('/analysis', {
      state: {
        analysisData: {
          contentType: job.job_type.toLowerCase(),
          videoUrl: job.source_url,
          conversationId: job.id,
          originalMessage: job.prompt,
          // If you need to pass the actual video file, you'd need to re-fetch it or handle it differently
          // For now, we rely on videoUrl for YouTube and potentially S3 URLs
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ModernHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        <VideoHistory onVideoSelect={handleVideoSelect} />
      </main>
    </div>
  );
};

export default HistoryPage;
