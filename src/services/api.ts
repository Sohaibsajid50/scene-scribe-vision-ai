
interface UploadResponse {
  file_id: string;
  message: string;
}

interface StatusResponse {
  file_id: string;
  status: 'UPLOADING' | 'PROCESSING' | 'ACTIVE' | 'ERROR';
  progress?: number;
  message?: string;
}

interface GenerateRequest {
  file_id: string;
  prompt: string;
}

interface GenerateResponse {
  response: string;
  timestamp?: number;
}

class APIService {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async uploadVideo(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getStatus(fileId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseURL}/status/${fileId}`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
    const response = await fetch(`${this.baseURL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new APIService();
export type { UploadResponse, StatusResponse, GenerateRequest, GenerateResponse };
