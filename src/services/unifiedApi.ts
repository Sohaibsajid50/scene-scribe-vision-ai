interface UnifiedChatRequest {
  message: string;
  file?: File;
}

interface UnifiedChatResponse {
  response: string;
  content_type?: 'video' | 'youtube' | 'text';
  video_url?: string;
  file_id?: string;
}

class UnifiedAPIService {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async sendMessage(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.file) {
      formData.append('file', request.file);
    }

    // Send to single endpoint - let backend agent orchestration handle routing
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Keep existing method for follow-up questions in analysis page
  async continueChat(message: string, context?: any): Promise<UnifiedChatResponse> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat continuation failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const unifiedApiService = new UnifiedAPIService();
export type { UnifiedChatRequest, UnifiedChatResponse };
