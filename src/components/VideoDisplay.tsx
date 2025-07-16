
import React from 'react';

interface VideoDisplayProps {
  url: string;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ url }) => {
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId;
    if (url.includes('youtube.com/watch')) {
      videoId = new URL(url).searchParams.get('v');
    } else if (url.includes('youtu.be')) {
      videoId = new URL(url).pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (isYouTubeUrl(url)) {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) {
      return <p>Invalid YouTube URL</p>;
    }
    return (
      <div className="absolute inset-0 w-full h-full">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  return (
    <video controls className="absolute inset-0 w-full h-full object-contain">
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoDisplay;
