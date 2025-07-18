import { Optional } from '@tanstack/react-query/build/modern/utils';
import { UUID } from 'crypto';

export enum JobStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    ACTIVE = "ACTIVE",
    ERROR = "ERROR",
}

export enum JobType {
    VIDEO = "VIDEO",
    YOUTUBE = "YOUTUBE",
    TEXT = "TEXT",
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface TokenData {
    email?: string;
}

export interface UserBase {
    email: string;
}

export interface UserCreate extends UserBase {
    first_name: string;
    last_name: string;
    password: string;
}

export interface UserCreateGoogle extends UserBase {
    google_id: string;
}



export interface User extends UserBase {
    id: number;
    first_name: string;
    last_name: string;
    is_active: boolean;
}

export interface Message {
    id: number;
    job_id: string;
    sender: string; // "USER" or "AI"
    content: string;
    created_at: string;
}

export interface ChatRequest {
    message: string;
    file_name?: string;
}

export interface ChatResponse {
    response: string;
    conversation_id: string;
}

export interface StatusResponse {
  file_id: string;
  status: 'UPLOADING' | 'PROCESSING' | 'ACTIVE' | 'ERROR';
  progress?: number;
  message?: string;
  response?: string; // The final analysis response when status is ACTIVE
}

export interface Job {
    id: string;
    user_id: number;
    title: string;
    prompt: string;
    status: JobStatus;
    job_type: JobType;
    current_agent: string;
    gemini_file_id?: string;
    source_url?: string;
    created_at: string;
    updated_at: string;
    messages?: Message[];
}
