export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
