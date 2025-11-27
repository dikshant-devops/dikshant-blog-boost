export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
}

export interface ContactSubmission {
  Timestamp: string;
  Name: string;
  Email: string;
  Subject: string;
  Message: string;
  'IP Address'?: string;
  'User Agent'?: string;
}

export interface ContactAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RateLimitInfo {
  count: number;
  firstRequest: number;
}
