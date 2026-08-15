/**
 * Agent Coordinator
 * Central orchestrator for multi-agent system with intelligent task distribution
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './base-agent';
import { 
  PlannerAgent, 
  CoderAgent, 
  ResearcherAgent, 
  ValidatorAgent, 
  OptimizerAgent 
} from './specialist-agents';
import { 
  AgentTask, 
  AgentRole, 
  TaskPriority, 
  TaskStatus, 
  AgentMessage, 
  SystemMetrics,
  AgentConfig 
} from './agent-types';

export class AgentCoordinator {
  private agents: Map<AgentRole, BaseAgent>;
  private taskQueue: AgentTask[];
  private activeTasks: Map<string, AgentTask>;
  private completedTasks: AgentTask[];
  private messageBus: AgentMessage[];
  private systemStartTime: Date;
  private metrics: SystemMetrics;

  constructor() {
    // Initialize specialist agents
    this.agents = new Map([
      ['planner', new PlannerAgent()],
      ['coder', new CoderAgent()],
      ['researcher', new ResearcherAgent()],
      ['validator', new ValidatorAgent()],
      ['optimizer', new OptimizerAgent()],
    ]);

    this.taskQueue = [];
    this.activeTasks = new Map();
    this.completedTasks = [];
    this.messageBus = [];
    this.systemStartTime = new Date();
    this.metrics = {
      totalTasks: 0,
      activeAgents: 0,
      systemLoad: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cacheEfficiency: 0,
      uptime: 0,
    };

    // Start metrics update interval
    this.startMetricsUpdate();
  }

  /**
   * Get available agent roles
   */
  getAvailableAgents(): AgentRole[] {
    return Array.from(this.agents.keys()).filter(role => 
      this.agents.get(role)?.isAgentActive()
    );
  }

  /**
   * Get agent by role
   */
  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getRole(), agent);
  }

  /**
   * Submit a new task to the coordinator
   */
  async submitTask(
    type: string,
    description: string,
    input: any,
    options?: {
      priority?: TaskPriority;
      assignedTo?: AgentRole;
      dependencies?: string[];
      maxRetries?: number;
    }
  ): Promise<string> {
    const task: AgentTask = {
      id: uuidv4(),
      type,
      description,
      priority: options?.priority || 'medium',
      status: 'pending',
      dependencies: options?.dependencies || [],
      input,
      retryCount: 0,
      maxRetries: options?.maxRetries || 3,
      createdAt: new Date(),
    };

    // Auto-assign if specified
    if (options?.assignedTo) {
      task.assignedTo = options.assignedTo;
      task.status = 'assigned';
    }

    this.taskQueue.push(task);
    this.metrics.totalTasks++;

    // Process task immediately if high priority
    if (task.priority === 'high' || task.priority === 'critical') {
      await this.processTaskQueue();
    }

    return task.id;
  }

  /**
   * Process task queue with intelligent distribution
   */
  private async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const task = this.findNextTask();
      if (!task) break;

      // Check dependencies
      if (!this.areDependenciesMet(task)) {
        continue;
      }

      // Assign to appropriate agent
      const agent = this.assignAgent(task);
      if (!agent) {
        task.status = 'failed';
        task.error = 'No suitable agent available';
        this.completedTasks.push(task);
        continue;
      }

      // Move to active tasks
      task.status = 'in_progress';
      task.startedAt = new Date();
      task.assignedTo = agent.getRole();
      this.activeTasks.set(task.id, task);
      this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);

      // Execute task asynchronously
      this.executeTask(task, agent).catch(error => {
        console.error(`Task execution failed: ${task.id}`, error);
      });
    }
  }

  /**
   * Find next task based on priority and dependencies
   */
  private findNextTask(): AgentTask | null {
    // Sort by priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    const sortedTasks = [...this.taskQueue].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return sortedTasks[0] || null;
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: AgentTask): boolean {
    if (task.dependencies.length === 0) return true;

    return task.dependencies.every(depId => {
      const completedTask = this.completedTasks.find(t => t.id === depId);
      return completedTask && completedTask.status === 'completed';
    });
  }

  /**
   * Assign appropriate agent for task
   */
  private assignAgent(task: AgentTask): BaseAgent | undefined {
    // If already assigned, use that agent
    if (task.assignedTo) {
      const agent = this.agents.get(task.assignedTo);
      if (agent?.isAgentActive()) return agent;
    }

    // Auto-assign based on task type
    const taskTypeMapping: Record<string, AgentRole> = {
      'planning': 'planner',
      'code_generation': 'coder',
      'code_optimization': 'coder',
      'research': 'researcher',
      'validation': 'validator',
      'optimization': 'optimizer',
      'web_research': 'researcher',
    };

    const suggestedRole = taskTypeMapping[task.type];
    if (suggestedRole) {
      const agent = this.agents.get(suggestedRole);
      if (agent?.isAgentActive()) return agent;
    }

    // Fallback to least loaded agent
    return this.getLeastLoadedAgent();
  }

  /**
   * Get agent with lowest current load
   */
  private getLeastLoadedAgent(): BaseAgent | undefined {
    let leastLoaded: BaseAgent | undefined;
    let minLoad = Infinity;

    for (const agent of this.agents.values()) {
      if (!agent.isAgentActive()) continue;

      const perf = agent.getPerformance();
      const load = perf.totalTasks - perf.completedTasks;
      
      if (load < minLoad) {
        minLoad = load;
        leastLoaded = agent;
      }
    }

    return leastLoaded;
  }

  /**
   * Execute task with error handling and retry logic
   */
  private async executeTask(task: AgentTask, agent: BaseAgent): Promise<void> {
    try {
      this.sendMessage({
        id: uuidv4(),
        from: 'coordinator',
        to: agent.getRole(),
        type: 'request',
        content: task,
        timestamp: new Date(),
        taskId: task.id,
      });

      const result = await agent.executeTask(task);

      task.output = result;
      task.status = 'completed';
      task.completedAt = new Date();

      this.sendMessage({
        id: uuidv4(),
        from: agent.getRole(),
        to: 'coordinator',
        type: 'response',
        content: result,
        timestamp: new Date(),
        taskId: task.id,
      });

    } catch (error: any) {
      task.error = error.message;
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        task.status = 'retrying';
        this.taskQueue.push(task);
        
        this.sendMessage({
          id: uuidv4(),
          from: agent.getRole(),
          to: 'coordinator',
          type: 'error',
          content: { error: error.message, retryCount: task.retryCount },
          timestamp: new Date(),
          taskId: task.id,
        });
      } else {
        task.status = 'failed';
        this.sendMessage({
          id: uuidv4(),
          from: agent.getRole(),
          to: 'coordinator',
          type: 'error',
          content: { error: error.message, final: true },
          timestamp: new Date(),
          taskId: task.id,
        });
      }
    } finally {
      this.activeTasks.delete(task.id);
      this.completedTasks.push(task);
      
      // Process next tasks
      this.processTaskQueue();
    }
  }

  /**
   * Send message through the message bus
   */
  private sendMessage(message: AgentMessage): void {
    this.messageBus.push(message);
    
    // Keep only last 1000 messages
    if (this.messageBus.length > 1000) {
      this.messageBus = this.messageBus.slice(-1000);
    }
  }

  /**
   * Get task status by ID
   */
  getTaskStatus(taskId: string): AgentTask | undefined {
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) return activeTask;

    const queuedTask = this.taskQueue.find(t => t.id === taskId);
    if (queuedTask) return queuedTask;

    return this.completedTasks.find(t => t.id === taskId);
  }

  /**
   * Get all tasks with optional filter
   */
  getTasks(filter?: { status?: TaskStatus; assignedTo?: AgentRole }): AgentTask[] {
    let tasks = [...this.taskQueue, ...Array.from(this.activeTasks.values()), ...this.completedTasks];

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }

    if (filter?.assignedTo) {
      tasks = tasks.filter(t => t.assignedTo === filter.assignedTo);
    }

    return tasks;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(): Map<AgentRole, any> {
    const performance = new Map();
    
    for (const [role, agent] of this.agents) {
      performance.set(role, {
        config: agent.getConfig(),
        performance: agent.getPerformance(),
        cacheStats: agent.getCacheStats(),
        isActive: agent.isAgentActive(),
      });
    }

    return performance;
  }

  /**
   * Update system metrics periodically
   */
  private startMetricsUpdate(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update system metrics
   */
  private updateMetrics(): void {
    const now = new Date();
    this.metrics.uptime = now.getTime() - this.systemStartTime.getTime();
    
    // Count active agents
    this.metrics.activeAgents = Array.from(this.agents.values()).filter(a => a.isAgentActive()).length;
    
    // Calculate system load
    const totalAgentLoad = Array.from(this.agents.values())
      .reduce((sum, agent) => {
        const perf = agent.getPerformance();
        return sum + (perf.totalTasks - perf.completedTasks);
      }, 0);
    this.metrics.systemLoad = totalAgentLoad / this.metrics.activeAgents;

    // Calculate average response time
    const allResponseTimes = Array.from(this.agents.values())
      .map(agent => agent.getPerformance().averageResponseTime);
    this.metrics.averageResponseTime = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;

    // Calculate error rate
    const totalTasks = this.metrics.totalTasks;
    const failedTasks = this.completedTasks.filter(t => t.status === 'failed').length;
    this.metrics.errorRate = totalTasks > 0 ? failedTasks / totalTasks : 0;

    // Calculate cache efficiency
    const allCacheRates = Array.from(this.agents.values())
      .map(agent => agent.getPerformance().cacheHitRate);
    this.metrics.cacheEfficiency = allCacheRates.reduce((a, b) => a + b, 0) / allCacheRates.length;
  }

  /**
   * Execute complex workflow with multiple agents
   */
  async executeWorkflow(
    workflowName: string,
    steps: Array<{
      type: string;
      description: string;
      input: any;
      assignedTo?: AgentRole;
    }>
  ): Promise<Map<string, any>> {
    const results = new Map();
    const taskIds: string[] = [];

    // Submit all tasks
    for (const step of steps) {
      const taskId = await this.submitTask(
        step.type,
        step.description,
        step.input,
        { assignedTo: step.assignedTo, priority: 'high' }
      );
      taskIds.push(taskId);
    }

    // Wait for all tasks to complete
    for (const taskId of taskIds) {
      await this.waitForTaskCompletion(taskId);
      const task = this.getTaskStatus(taskId);
      if (task) {
        results.set(taskId, task.output);
      }
    }

    return results;
  }

  /**
   * Wait for task completion
   */
  private async waitForTaskCompletion(taskId: string, timeout: number = 300000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const task = this.getTaskStatus(taskId);
      if (!task) throw new Error('Task not found');
      
      if (task.status === 'completed' || task.status === 'failed') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Task timeout');
  }

  /**
   * Clear completed tasks (for memory management)
   */
  clearCompletedTasks(olderThan?: Date): void {
    const cutoff = olderThan || new Date(Date.now() - 3600000); // 1 hour default
    
    this.completedTasks = this.completedTasks.filter(
      task => task.completedAt && task.completedAt > cutoff
    );
  }

  /**
   * Shutdown coordinator gracefully
   */
  async shutdown(): Promise<void> {
    // Wait for active tasks to complete
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeTasks.size > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Clear caches
    for (const agent of this.agents.values()) {
      agent.clearCache();
    }

    console.log('Agent Coordinator shutdown complete');
  }
}