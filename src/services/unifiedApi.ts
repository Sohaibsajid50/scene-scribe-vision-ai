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

interface StatusResponse {
  file_id: string;
  status: 'UPLOADING' | 'PROCESSING' | 'ACTIVE' | 'ERROR';
  progress?: number;
  message?: string;
  response?: string; // The final analysis response when status is ACTIVE
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

  async getStatus(fileId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseURL}/api/status/${fileId}`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
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
export type { UnifiedChatRequest, UnifiedChatResponse, StatusResponse };
