export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  data?: any;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: string;
  trialEndsAt?: Date;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Model {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  capabilities?: any;
  latencyHint?: string;
  costEstimate?: string;
  company?: Company;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  createdAt: Date;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
  messages?: Message[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: User;
  project?: Project;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  recurrenceRule?: string;
  project?: Project;
}

export interface Message {
  id: string;
  userId: string;
  projectId?: string;
  content: string;
  modelId?: string;
  createdAt: Date;
  user?: User;
  project?: Project;
  model?: Model;
  messageAttachments?: Attachment[];
}

export interface Attachment {
  id: string;
  messageId: string;
  url: string;
  type: string;
  metadata?: any;
  message?: Message;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetId?: string;
  metadata?: any;
  createdAt: Date;
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name?: string;
}

export interface CreateProjectForm {
  title: string;
  description?: string;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  recurrenceRule?: string;
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: Date;
  recurrenceRule?: string;
}

export interface CreateMessageForm {
  content: string;
  projectId?: string;
  modelId?: string;
}

export interface CreateCompanyForm {
  name: string;
  logoUrl?: string;
}

export interface CreateModelForm {
  companyId: string;
  name: string;
  description?: string;
  capabilities?: any;
  latencyHint?: string;
  costEstimate?: string;
}