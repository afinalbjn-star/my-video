/**
 * Multi-Agent System Type Definitions
 * Advanced AI Agent Architecture with Specialist Agents
 */

export type AgentRole = 'coordinator' | 'planner' | 'coder' | 'researcher' | 'validator' | 'optimizer';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'retrying';

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: AgentRole;
  dependencies: string[];
  input: any;
  output?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: 'request' | 'response' | 'notification' | 'error';
  content: any;
  timestamp: Date;
  taskId?: string;
}

export interface AgentPerformance {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  cacheHitRate: number;
  lastActiveTime: Date;
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl: number;
  hits: number;
}

export interface SystemMetrics {
  totalTasks: number;
  activeAgents: number;
  systemLoad: number;
  averageResponseTime: number;
  errorRate: number;
  cacheEfficiency: number;
  uptime: number;
}