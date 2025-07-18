import React from 'react';

interface VideoDisplayProps {
  videoUrl: string | null;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ videoUrl }) => {
  if (!videoUrl) {
    return null;
  }

  // Check if it's a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  if (isYouTube) {
    // Extract YouTube video ID
    const youtubeIdMatch = videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : null;

    if (youtubeId) {
      return (
        <div>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded YouTube Video"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          ></iframe>
        </div>
      );
    }
  } else {
    // Assume it's a direct video URL (e.g., S3)
    return (
      <div>
        <video controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <source src={videoUrl} type="video/mp4" /> {/* Assuming MP4 for now */}
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return null;
};

export default VideoDisplay;