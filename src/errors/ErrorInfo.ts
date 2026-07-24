export interface ErrorInfo {
  category: string;
  message: string;
  details?: Record<string, any>;
}
