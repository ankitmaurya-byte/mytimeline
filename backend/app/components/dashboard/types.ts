export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  responseTime?: number;
  error?: string;
  checks: {
    database: { status: string; responseTime: number; error?: string };
    system: { status: string; memory: Record<string, string> };
  };
}

export interface ProjectStats {
  totalRoutes: number;
  apiEndpoints: number;
  middleware: number;
  databaseModels: number;
  services: number;
  utilities: number;
}

export interface TestResult {
  endpoint: string;
  status: number;
  responseTime: number;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface DatabaseStats {
  collections: number;
  documents: number;
  indexes: number;
  size: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  premiumUsers: number;
}

export interface UserLite {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  verified?: boolean;
}
