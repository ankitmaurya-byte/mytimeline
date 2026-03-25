export interface CustomError extends Error {
  errorCode?: string;
  message: string;
  response?: {
    data?: any;
    status?: number;
    statusText?: string;
  };
  request?: any;
  config?: any;
}
