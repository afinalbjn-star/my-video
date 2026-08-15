/**
 * Advanced Error Handling and Recovery System
 * Sophisticated error detection, classification, and recovery strategies
 */

export enum ErrorType {
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  VALIDATION_ERROR = 'validation_error',
  RESOURCE_ERROR = 'resource_error',
  NETWORK_ERROR = 'network_error',
  AGENT_ERROR = 'agent_error',
  COORDINATOR_ERROR = 'coordinator_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecord {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: ErrorContext;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
  recoveryStrategy?: string;
  occurrences: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  resolved: boolean;
}

export interface RecoveryStrategy {
  name: string;
  canHandle: (error: Error, context: ErrorContext) => boolean;
  execute: (error: Error, context: ErrorContext) => Promise<boolean>;
  maxAttempts: number;
  cooldownPeriod: number; // milliseconds
}

export class AdvancedErrorHandler {
  private errorRecords: Map<string, ErrorRecord>;
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy[]>;
  private errorPatterns: Map<string, ErrorType>;
  private activeRecoveries: Map<string, boolean>;

  constructor() {
    this.errorRecords = new Map();
    this.recoveryStrategies = new Map();
    this.errorPatterns = new Map();
    this.activeRecoveries = new Map();
    
    this.setupErrorPatterns();
    this.setupRecoveryStrategies();
  }

  /**
   * Setup error pattern recognition
   */
  private setupErrorPatterns(): void {
    this.errorPatterns.set('timeout', ErrorType.TIMEOUT_ERROR);
    this.errorPatterns.set('504', ErrorType.API_ERROR);
    this.errorPatterns.set('503', ErrorType.API_ERROR);
    this.errorPatterns.set('502', ErrorType.API_ERROR);
    this.errorPatterns.set('500', ErrorType.API_ERROR);
    this.errorPatterns.set('429', ErrorType.API_ERROR);
    this.errorPatterns.set('ECONNREFUSED', ErrorType.NETWORK_ERROR);
    this.errorPatterns.set('ENOTFOUND', ErrorType.NETWORK_ERROR);
    this.errorPatterns.set('validation', ErrorType.VALIDATION_ERROR);
    this.errorPatterns.set('parse', ErrorType.VALIDATION_ERROR);
    this.errorPatterns.set('agent', ErrorType.AGENT_ERROR);
    this.errorPatterns.set('coordinator', ErrorType.COORDINATOR_ERROR);
    this.errorPatterns.set('memory', ErrorType.RESOURCE_ERROR);
    this.errorPatterns.set('disk', ErrorType.RESOURCE_ERROR);
  }

  /**
   * Setup recovery strategies for different error types
   */
  private setupRecoveryStrategies(): void {
    // API Error Recovery
    this.addRecoveryStrategy(ErrorType.API_ERROR, {
      name: 'exponential_backoff',
      canHandle: (error, context) => true,
      execute: async (error, context) => {
        const delay = Math.min(1000 * Math.pow(2, this.getOccurrenceCount(error, context)), 30000);
        await this.sleep(delay);
        return true;
      },
      maxAttempts: 5,
      cooldownPeriod: 60000
    });

    this.addRecoveryStrategy(ErrorType.API_ERROR, {
      name: 'model_fallback',
      canHandle: (error, context) => context.metadata?.supportsModelFallback === true,
      execute: async (error, context) => {
        // Signal to use fallback model
        context.metadata!.useFallbackModel = true;
        return true;
      },
      maxAttempts: 2,
      cooldownPeriod: 30000
    });

    // Timeout Error Recovery
    this.addRecoveryStrategy(ErrorType.TIMEOUT_ERROR, {
      name: 'increase_timeout',
      canHandle: (error, context) => context.metadata?.currentTimeout !== undefined,
      execute: async (error, context) => {
        const currentTimeout = context.metadata!.currentTimeout || 120000;
        context.metadata!.currentTimeout = Math.min(currentTimeout * 1.5, 300000); // Max 5 minutes
        return true;
      },
      maxAttempts: 3,
      cooldownPeriod: 0
    });

    // Validation Error Recovery
    this.addRecoveryStrategy(ErrorType.VALIDATION_ERROR, {
      name: 'data_sanitization',
      canHandle: (error, context) => context.metadata?.input !== undefined,
      execute: async (error, context) => {
        try {
          // Attempt to sanitize and fix the data
          const sanitized = this.sanitizeData(context.metadata!.input);
          context.metadata!.input = sanitized;
          return true;
        } catch {
          return false;
        }
      },
      maxAttempts: 2,
      cooldownPeriod: 0
    });

    // Network Error Recovery
    this.addRecoveryStrategy(ErrorType.NETWORK_ERROR, {
      name: 'connection_retry',
      canHandle: (error, context) => true,
      execute: async (error, context) => {
        await this.sleep(2000); // Wait 2 seconds before retry
        return true;
      },
      maxAttempts: 3,
      cooldownPeriod: 10000
    });

    // Agent Error Recovery
    this.addRecoveryStrategy(ErrorType.AGENT_ERROR, {
      name: 'agent_restart',
      canHandle: (error, context) => context.metadata?.agentId !== undefined,
      execute: async (error, context) => {
        // Signal to restart the agent
        context.metadata!.restartAgent = true;
        return true;
      },
      maxAttempts: 2,
      cooldownPeriod: 5000
    });

    // Resource Error Recovery
    this.addRecoveryStrategy(ErrorType.RESOURCE_ERROR, {
      name: 'resource_cleanup',
      canHandle: (error, context) => true,
      execute: async (error, context) => {
        // Signal to cleanup resources
        context.metadata!.cleanupResources = true;
        await this.sleep(1000);
        return true;
      },
      maxAttempts: 3,
      cooldownPeriod: 15000
    });
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(errorType: ErrorType, strategy: RecoveryStrategy): void {
    if (!this.recoveryStrategies.has(errorType)) {
      this.recoveryStrategies.set(errorType, []);
    }
    this.recoveryStrategies.get(errorType)!.push(strategy);
  }

  /**
   * Classify error type from message
   */
  private classifyError(message: string): ErrorType {
    const lowerMessage = message.toLowerCase();
    
    for (const [pattern, type] of this.errorPatterns) {
      if (lowerMessage.includes(pattern)) {
        return type;
      }
    }
    
    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(errorType: ErrorType, context: ErrorContext): ErrorSeverity {
    // Critical errors that need immediate attention
    if (errorType === ErrorType.RESOURCE_ERROR) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (errorType === ErrorType.COORDINATOR_ERROR || errorType === ErrorType.AGENT_ERROR) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (errorType === ErrorType.API_ERROR || errorType === ErrorType.TIMEOUT_ERROR) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity for validation and network errors
    return ErrorSeverity.LOW;
  }

  /**
   * Get or create error record
   */
  private getOrCreateErrorRecord(
    error: Error,
    errorType: ErrorType,
    severity: ErrorSeverity,
    context: ErrorContext
  ): ErrorRecord {
    const errorKey = `${context.component}-${context.operation}-${error.message}`;
    
    let record = this.errorRecords.get(errorKey);
    
    if (!record) {
      record = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: errorType,
        severity,
        message: error.message,
        stack: error.stack,
        context,
        recoveryAttempted: false,
        occurrences: 0,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        resolved: false
      };
      this.errorRecords.set(errorKey, record);
    }
    
    record.occurrences++;
    record.lastOccurrence = new Date();
    record.resolved = false;
    
    return record;
  }

  /**
   * Get occurrence count for specific error
   */
  private getOccurrenceCount(error: Error, context: ErrorContext): number {
    const errorKey = `${context.component}-${context.operation}-${error.message}`;
    const record = this.errorRecords.get(errorKey);
    return record?.occurrences || 0;
  }

  /**
   * Sanitize data to fix validation errors
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/\s+/g, ' ');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          try {
            sanitized[key] = this.sanitizeData(data[key]);
          } catch {
            // Skip problematic fields
            sanitized[key] = null;
          }
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle error with automatic recovery
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    attemptRecovery: boolean = true
  ): Promise<{ handled: boolean; recovered: boolean; errorRecord: ErrorRecord }> {
    // Classify error
    const errorType = this.classifyError(error.message);
    const severity = this.determineSeverity(errorType, context);
    
    // Create error record
    const errorRecord = this.getOrCreateErrorRecord(error, errorType, severity, context);
    
    console.error(`[${severity.toUpperCase()}] ${errorType}: ${error.message}`, {
      component: context.component,
      operation: context.operation,
      occurrences: errorRecord.occurrences
    });

    // Attempt recovery if enabled
    if (attemptRecovery && !errorRecord.recoveryAttempted) {
      const recovered = await this.attemptRecovery(error, errorType, context, errorRecord);
      errorRecord.recoveryAttempted = true;
      errorRecord.recoverySuccessful = recovered;
      
      if (recovered) {
        errorRecord.resolved = true;
        console.log(`✅ Recovery successful for ${errorType} using strategy: ${errorRecord.recoveryStrategy}`);
      }
    }

    return {
      handled: true,
      recovered: errorRecord.recoverySuccessful || false,
      errorRecord
    };
  }

  /**
   * Attempt recovery using available strategies
   */
  private async attemptRecovery(
    error: Error,
    errorType: ErrorType,
    context: ErrorContext,
    errorRecord: ErrorRecord
  ): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(errorType) || [];
    const recoveryKey = `${errorType}-${context.operation}`;
    
    // Check if recovery is currently in progress
    if (this.activeRecoveries.get(recoveryKey)) {
      return false;
    }

    // Check cooldown period
    const lastRecovery = errorRecord.lastOccurrence;
    const timeSinceLastRecovery = Date.now() - lastRecovery.getTime();
    
    for (const strategy of strategies) {
      // Check if strategy can handle this error
      if (!strategy.canHandle(error, context)) {
        continue;
      }

      // Check max attempts
      if (errorRecord.occurrences > strategy.maxAttempts) {
        console.log(`⚠️ Max attempts reached for strategy: ${strategy.name}`);
        continue;
      }

      // Check cooldown
      if (timeSinceLastRecovery < strategy.cooldownPeriod) {
        console.log(`⏳ Cooldown period active for strategy: ${strategy.name}`);
        continue;
      }

      // Mark recovery as active
      this.activeRecoveries.set(recoveryKey, true);
      errorRecord.recoveryStrategy = strategy.name;

      try {
        console.log(`🔧 Attempting recovery strategy: ${strategy.name}`);
        const success = await strategy.execute(error, context);
        
        if (success) {
          console.log(`✅ Recovery strategy succeeded: ${strategy.name}`);
          return true;
        } else {
          console.log(`❌ Recovery strategy failed: ${strategy.name}`);
        }
      } catch (recoveryError) {
        console.error(`💥 Recovery strategy error: ${strategy.name}`, recoveryError);
      } finally {
        this.activeRecoveries.delete(recoveryKey);
      }
    }

    return false;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    unresolvedErrors: number;
    recoveryRate: number;
  } {
    const records = Array.from(this.errorRecords.values());
    
    const errorsByType: Record<ErrorType, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);
    
    let totalRecoveryAttempts = 0;
    let successfulRecoveries = 0;

    for (const record of records) {
      errorsByType[record.type]++;
      errorsBySeverity[record.severity]++;
      
      if (record.recoveryAttempted) {
        totalRecoveryAttempts++;
        if (record.recoverySuccessful) {
          successfulRecoveries++;
        }
      }
    }

    return {
      totalErrors: records.length,
      errorsByType,
      errorsBySeverity,
      unresolvedErrors: records.filter(r => !r.resolved).length,
      recoveryRate: totalRecoveryAttempts > 0 ? successfulRecoveries / totalRecoveryAttempts : 0
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 20): ErrorRecord[] {
    return Array.from(this.errorRecords.values())
      .sort((a, b) => b.lastOccurrence.getTime() - a.lastOccurrence.getTime())
      .slice(0, limit);
  }

  /**
   * Resolve error record
   */
  resolveError(errorId: string): void {
    const record = Array.from(this.errorRecords.values()).find(r => r.id === errorId);
    if (record) {
      record.resolved = true;
      console.log(`✅ Error resolved: ${errorId}`);
    }
  }

  /**
   * Clear old error records
   */
  clearOldErrors(olderThan: Date = new Date(Date.now() - 86400000)): void {
    for (const [key, record] of this.errorRecords) {
      if (record.lastOccurrence < olderThan && record.resolved) {
        this.errorRecords.delete(key);
      }
    }
  }

  /**
   * Export error report
   */
  exportErrorReport(): string {
    const stats = this.getErrorStats();
    const recentErrors = this.getRecentErrors(10);
    
    return `
=== ERROR HANDLING REPORT ===
Generated: ${new Date().toISOString()}

SUMMARY:
- Total Errors: ${stats.totalErrors}
- Unresolved Errors: ${stats.unresolvedErrors}
- Recovery Rate: ${(stats.recoveryRate * 100).toFixed(1)}%

ERRORS BY TYPE:
${Object.entries(stats.errorsByType).map(([type, count]) => 
  `- ${type}: ${count}`
).join('\n')}

ERRORS BY SEVERITY:
${Object.entries(stats.errorsBySeverity).map(([severity, count]) => 
  `- ${severity}: ${count}`
).join('\n')}

RECENT ERRORS:
${recentErrors.map(e => 
  `[${e.severity.toUpperCase()}] ${e.type}: ${e.message}
  Component: ${e.context.component}
  Operation: ${e.context.operation}
  Occurrences: ${e.occurrences}
  Recovery: ${e.recoveryAttempted ? (e.recoverySuccessful ? '✅ Success' : '❌ Failed') : 'Not attempted'}
  Strategy: ${e.recoveryStrategy || 'N/A'}
  Last Occurrence: ${e.lastOccurrence.toISOString()}`
).join('\n\n')}
`;
  }
}