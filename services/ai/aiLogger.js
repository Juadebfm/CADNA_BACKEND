import AILog from '../../models/aiLogModel.js';
import crypto from 'crypto';

/**
 * Safe AI Logger - Logs AI operations without storing sensitive data
 * PRIVACY-FIRST: Anonymizes all student data
 */
class AILogger {
  /**
   * Log an AI operation (safe - no PII)
   */
  async logOperation({
    operation,
    provider,
    model,
    request,
    response,
    performance,
    cost,
    context,
    user
  }) {
    try {
      // Generate unique log ID
      const logId = this.generateLogId();

      // Anonymize context references
      const anonymizedContext = this.anonymizeContext(context);

      // Sanitize request data (remove actual content)
      const safeRequest = this.sanitizeRequest(request);

      // Sanitize response data (remove actual content)
      const safeResponse = this.sanitizeResponse(response);

      // Create log entry with safe property access
      const logEntry = await AILog.create({
        logId,
        operation,
        provider,
        model,
        request: safeRequest,
        response: safeResponse,
        performance: {
          startTime: performance?.startTime || new Date(),
          endTime: performance?.endTime || new Date(),
          duration: performance?.duration || 0,
          success: performance?.success !== false, // Default true
          errorCode: performance?.errorCode || null,
          errorMessage: this.sanitizeError(performance?.errorMessage)
        },
        cost: {
          promptTokens: cost?.promptTokens || 0,
          completionTokens: cost?.completionTokens || 0,
          totalTokens: cost?.totalTokens || 0,
          costUSD: cost?.costUSD || 0,
          isFree: cost?.isFree !== false // Default true
        },
        context: anonymizedContext,
        audit: {
          requestedBy: user?._id || null,
          ipAddress: this.hashIP(user?.ipAddress),
          userAgent: user?.userAgent || null,
          purpose: operation
        }
      });

      console.log(`📝 AI Log created: ${logId} (${operation})`);
      return { success: true, logId };
    } catch (error) {
      console.error('❌ Failed to log AI operation:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Stack:', error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Anonymize context references (privacy-safe)
   */
  anonymizeContext(context) {
    if (!context) return {};

    return {
      sessionRef: context.sessionId ? this.hashReference(context.sessionId) : null,
      examRef: context.examId ? this.hashReference(context.examId) : null,
      questionRef: context.questionId ? this.hashReference(context.questionId) : null,
      userRole: context.userRole || 'unknown'
    };
  }

  /**
   * Hash a reference (one-way, can't reverse)
   */
  hashReference(value) {
    if (!value) return null;
    return crypto
      .createHash('sha256')
      .update(value.toString())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Hash IP address (privacy)
   */
  hashIP(ipAddress) {
    if (!ipAddress) return null;
    return crypto
      .createHash('sha256')
      .update(ipAddress)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Sanitize request data - remove actual content
   */
  sanitizeRequest(request) {
    if (!request) return {};

    return {
      inputLength: request.inputText?.length || request.inputLength || 0,
      inputWordCount: request.inputText?.split(' ').length || request.inputWordCount || 0,
      inputType: request.inputType || 'unknown',
      questionType: request.questionType || 'unknown',
      hasRubric: request.hasRubric || false,
      maxScore: request.maxScore || null
    };
  }

  /**
   * Sanitize response data - remove actual content
   */
  sanitizeResponse(response) {
    if (!response) return {};

    return {
      outputLength: response.outputText?.length || response.outputLength || 0,
      outputWordCount: response.outputText?.split(' ').length || response.outputWordCount || 0,
      hasScore: response.hasScore || false,
      hasFeedback: response.hasFeedback || false,
      hasAnalysis: response.hasAnalysis || false
    };
  }

  /**
   * Sanitize error messages - remove API keys
   */
  sanitizeError(errorMessage) {
    if (!errorMessage) return null;

    let sanitized = errorMessage;

    // Remove Groq API keys
    sanitized = sanitized.replace(/gsk_[a-zA-Z0-9]{32,}/g, '[GROQ_KEY]');

    // Remove OpenAI API keys
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{32,}/g, '[OPENAI_KEY]');

    // Remove Anthropic API keys
    sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9-]{95}/g, '[ANTHROPIC_KEY]');

    return sanitized;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await AILog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$operation',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost.costUSD' },
            avgDuration: { $avg: '$performance.duration' },
            successRate: {
              $avg: { $cond: ['$performance.success', 1, 0] }
            }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return {
        success: true,
        period: `Last ${days} days`,
        stats
      };
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daily costs
   */
  async getDailyCosts(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const costs = await AILog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
              provider: '$provider'
            },
            totalCost: { $sum: '$cost.costUSD' },
            totalRequests: { $sum: 1 },
            totalTokens: { $sum: '$cost.totalTokens' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return {
        success: true,
        period: `Last ${days} days`,
        costs
      };
    } catch (error) {
      console.error('❌ Failed to get daily costs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if cost limit exceeded
   */
  async checkCostLimit() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await AILog.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$cost.costUSD' }
          }
        }
      ]);

      const currentCost = result[0]?.totalCost || 0;
      const limit = parseFloat(process.env.AI_DAILY_COST_LIMIT) || 10.0;

      return {
        success: true,
        currentCost,
        limit,
        exceeded: currentCost >= limit,
        remaining: Math.max(0, limit - currentCost)
      };
    } catch (error) {
      console.error('❌ Failed to check cost limit:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const aiLogger = new AILogger();
export default aiLogger;
