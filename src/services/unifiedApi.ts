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

import { Job, Message, StatusResponse } from '@/models/api_models';

class UnifiedAPIService {
  private baseURL: string;
  private tokenKey = 'access_token';

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  async sendMessage(request: UnifiedChatRequest): Promise<UnifiedChatResponse> {
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.file) {
      formData.append('file', request.file);
    }

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getStatus(fileId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseURL}/api/status/${fileId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async continueChat(jobId: string, message: string): Promise<UnifiedChatResponse> {
    const formData = new FormData();
    formData.append('message', message);

    const response = await fetch(`${this.baseURL}/api/chat/${jobId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Chat continuation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getHistory(): Promise<Job[]> {
    const response = await fetch(`${this.baseURL}/api/history`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    return response.json();
  }

  async getChatHistory(jobId: string): Promise<Message[]> {
    const response = await fetch(`${this.baseURL}/api/history/${jobId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch chat history for job ${jobId}: ${response.statusText}`);
    }
    return response.json();
  }
}

export const unifiedApiService = new UnifiedAPIService();
export type { UnifiedChatRequest, UnifiedChatResponse, StatusResponse, Job, Message };

// Define Job and Message types here as they are used in the new methods