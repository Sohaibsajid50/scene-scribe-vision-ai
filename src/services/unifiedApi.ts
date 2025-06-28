
interface UnifiedChatRequest {
  type: 'text' | 'video' | 'youtube';
  message?: string;
  youtube_url?: string;
  file?: File;
}

interface UnifiedChatResponse {
  response: string;
  file_id?: string;
  video_id?: string;
  message?: string;
}

class UnifiedAPIService {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async sendMessage(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const formData = new FormData();
    
    // Add the message/prompt
    if (request.message) {
      formData.append('message', request.message);
    }

    // Handle different input types
    switch (request.type) {
      case 'video':
        if (request.file) {
          formData.append('file', request.file);
          formData.append('prompt', request.message || 'Analyze this video');
          
          // Use the existing upload endpoint for now
          const uploadResponse = await fetch(`${this.baseURL}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          return uploadResponse.json();
        }
        break;

      case 'youtube':
        if (request.youtube_url) {
          const response = await fetch(`${this.baseURL}/youtube/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              youtube_url: request.youtube_url,
              prompt: request.message || 'Analyze this YouTube video',
            }),
          });

          if (!response.ok) {
            throw new Error(`YouTube analysis failed: ${response.statusText}`);
          }

          return response.json();
        }
        break;

      case 'text':
        // For text-only messages, we could use a general chat endpoint
        // For now, we'll return a placeholder response
        return {
          response: "I'm ready to help you analyze videos or YouTube content. Please upload a video or share a YouTube URL to get started!",
        };
    }

    throw new Error('Invalid request type or missing required data');
  }
}

export const unifiedApiService = new UnifiedAPIService();
export type { UnifiedChatRequest, UnifiedChatResponse };
