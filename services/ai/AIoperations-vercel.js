import aiService from './AIService-vercel.js';
import prompts from './prompts-vercel.js';
import aiLogger from './aiLogger.js';

/**
 * AI Operations - High-level functions for exam features
 * This is what you'll use in your controllers
 * NOW WITH SAFE LOGGING (Task 2)
 */
class AIOperations {
  /**
   * Grade an essay answer
   */
  async gradeEssay({ question, answer, rubric, maxScore = 100, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('essayGrading')) {
      return {
        success: false,
        error: 'Essay grading feature is disabled',
        code: 'FEATURE_DISABLED'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.gradeEssay({
        question,
        answer,
        rubric,
        maxScore
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.3, // Lower for consistent grading
          maxTokens: 1500
        }
      });

      const endTime = Date.now();

      // LOG OPERATION 
      if (user) {
        await aiLogger.logOperation({
          operation: 'grade_essay',
          provider: result.provider,
          model: result.model,
          request: { question, answer, rubric, maxScore },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success,
            errorCode: result.code,
            errorMessage: result.error
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context: {
            ...context,
            userRole: user.role
          },
          user
        });
      }

      if (!result.success) {
        return result;
      }

      // Parse JSON response
      const gradingResult = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        model: result.model,
        result: gradingResult,
        usage: result.usage,
        cost: result.cost,
        duration: endTime - startTime
      };
    } catch (error) {
      console.error('Essay grading error:', error);
      
      //  LOG ERROR
      if (user) {
        await aiLogger.logOperation({
          operation: 'grade_essay',
          provider: provider || 'unknown',
          model: 'unknown',
          request: { question, answer, rubric, maxScore },
          response: null,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(),
            duration: Date.now() - startTime,
            success: false,
            errorCode: 'GRADING_ERROR',
            errorMessage: error.message
          },
          cost: { costUSD: 0, isFree: false },
          context,
          user
        });
      }

      return {
        success: false,
        error: error.message,
        code: 'GRADING_ERROR'
      };
    }
  }

  /**
   * Grade a short answer
   */
  async gradeShortAnswer({ question, answer, correctAnswer, maxScore = 10, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('essayGrading')) {
      return {
        success: false,
        error: 'Grading feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.gradeShortAnswer({
        question,
        answer,
        correctAnswer,
        maxScore
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.2,
          maxTokens: 500
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'grade_short_answer',
          provider: result.provider,
          model: result.model,
          request: { question, answer, correctAnswer, maxScore },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const gradingResult = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: gradingResult,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect if answer was AI-generated
   */
  async detectAI({ answer, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('cheatingDetection')) {
      return {
        success: false,
        error: 'AI detection feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.detectAI({ answer });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.3,
          maxTokens: 1000
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'detect_ai',
          provider: result.provider,
          model: result.model,
          request: { answer },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const detectionResult = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: detectionResult,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect plagiarism between two answers
   */
  async detectPlagiarism({ answer1, answer2, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('plagiarismDetection')) {
      return {
        success: false,
        error: 'Plagiarism detection feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.detectPlagiarism({
        answer1,
        answer2
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.2,
          maxTokens: 1000
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'detect_plagiarism',
          provider: result.provider,
          model: result.model,
          request: { answer1, answer2 },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const plagiarismResult = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: plagiarismResult,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze exam behavior for suspicious patterns
   */
  async analyzeBehavior({ behaviors, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('behaviorAnalysis')) {
      return {
        success: false,
        error: 'Behavior analysis feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.analyzeBehavior({ behaviors });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.3,
          maxTokens: 800
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'analyze_behavior',
          provider: result.provider,
          model: result.model,
          request: { behaviors },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const analysisResult = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: analysisResult,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate exam questions
   */
  async generateQuestions({ topic, difficulty = 'medium', count = 5, questionTypes = ['multiple-choice'], provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('questionGeneration')) {
      return {
        success: false,
        error: 'Question generation feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.generateQuestions({
        topic,
        difficulty,
        count,
        questionTypes
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.7, // Higher for creativity
          maxTokens: 2000
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'generate_questions',
          provider: result.provider,
          model: result.model,
          request: { topic, difficulty, count, questionTypes },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const generatedQuestions = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: generatedQuestions,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate similar questions
   */
  async generateSimilar({ existingQuestion, count = 3, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('questionGeneration')) {
      return {
        success: false,
        error: 'Question generation feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.generateSimilar({
        existingQuestion,
        count
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.7,
          maxTokens: 1500
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'generate_similar',
          provider: result.provider,
          model: result.model,
          request: { existingQuestion, count },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const similarQuestions = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: similarQuestions,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Improve a question based on feedback
   */
  async improveQuestion({ question, feedback, provider = null, user = null, context = {} }) {
    const startTime = Date.now();

    if (!aiService.isFeatureEnabled('questionGeneration')) {
      return {
        success: false,
        error: 'Question generation feature is disabled'
      };
    }

    try {
      const { systemPrompt, prompt } = prompts.improveQuestion({
        question,
        feedback
      });

      const result = await aiService.generate({
        systemPrompt,
        prompt,
        options: {
          provider,
          temperature: 0.5,
          maxTokens: 1000
        }
      });

      const endTime = Date.now();

      // LOG OPERATION
      if (user) {
        await aiLogger.logOperation({
          operation: 'improve_question',
          provider: result.provider,
          model: result.model,
          request: { question, feedback },
          response: result,
          performance: {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: endTime - startTime,
            success: result.success
          },
          cost: {
            promptTokens: result.usage?.promptTokens,
            completionTokens: result.usage?.completionTokens,
            totalTokens: result.usage?.totalTokens,
            costUSD: result.cost,
            isFree: result.isFree
          },
          context,
          user
        });
      }

      if (!result.success) {
        return result;
      }

      const improvedQuestion = this.parseJSON(result.content);

      return {
        success: true,
        provider: result.provider,
        result: improvedQuestion,
        usage: result.usage,
        cost: result.cost
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse JSON response (handles markdown code blocks)
   */
  parseJSON(content) {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();
      
      // Remove ```json and ``` if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/, '').replace(/```\s*$/, '');
      }

      return JSON.parse(cleaned.trim());
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Get AI service status
   */
  getStatus() {
    return aiService.getStatus();
  }

  /**
   * Get usage statistics (from logs)
   */
  async getUsageStats(days = 7) {
    return aiLogger.getUsageStats(days);
  }

  /**
   * Get daily costs
   */
  async getDailyCosts(days = 30) {
    return aiLogger.getDailyCosts(days);
  }

  /**
   * Check cost limit
   */
  async checkCostLimit() {
    return aiLogger.checkCostLimit();
  }
}

// Export singleton
const aiOperations = new AIOperations();
export default aiOperations;
