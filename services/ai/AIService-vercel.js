import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import Groq from 'groq-sdk';

/**
 * AI Service using Vercel AI SDK
 * Supports multiple providers with automatic fallback
 */
class AIService {
  constructor() {
    this.primaryProvider = process.env.AI_PROVIDER || 'groq';
    this.fallbackProvider = process.env.AI_FALLBACK_PROVIDER || 'openai';
    
    // Feature flags
    this.features = {
      essayGrading: process.env.AI_ESSAY_GRADING_ENABLED === 'true',
      cheatingDetection: process.env.AI_CHEATING_DETECTION_ENABLED === 'true',
      questionGeneration: process.env.AI_QUESTION_GENERATION_ENABLED === 'true',
      plagiarismDetection: process.env.AI_PLAGIARISM_DETECTION_ENABLED === 'true',
      behaviorAnalysis: process.env.AI_BEHAVIOR_ANALYSIS_ENABLED === 'true'
    };

    // Settings
    this.settings = {
      temperature: parseFloat(process.env.AI_DEFAULT_TEMPERATURE) || 0.7,
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
      timeout: parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000,
      maxRetries: parseInt(process.env.AI_MAX_RETRIES) || 2
    };

    // Initialize providers
    this.providers = {};
    this.isInitialized = false;

    // Usage tracking
    this.usageStats = {
      totalRequests: 0,
      totalCost: 0,
      requestsByProvider: {},
      errors: 0
    };
  }

  /**
   * Initialize all configured AI providers
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing AI Service with Vercel AI SDK...');

      // Initialize Groq (FREE tier)
      if (process.env.GROQ_API_KEY) {
        this.providers.groq = {
          client: new Groq({ apiKey: process.env.GROQ_API_KEY }),
          model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
          type: 'groq',
          cost: 0 // FREE!
        };
        console.log('  ✅ Groq initialized (FREE tier)');
      }

      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.providers.openai = {
          client: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          type: 'openai'
        };
        console.log('  ✅ OpenAI initialized');
      }

      // Initialize Anthropic (Claude)
      if (process.env.ANTHROPIC_API_KEY) {
        this.providers.anthropic = {
          client: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          type: 'anthropic'
        };
        console.log('  ✅ Anthropic (Claude) initialized');
      }

      // Initialize Google Gemini
      if (process.env.GOOGLE_API_KEY) {
        this.providers.google = {
          client: createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY }),
          model: process.env.GOOGLE_MODEL || 'gemini-1.5-flash',
          type: 'google'
        };
        console.log('  ✅ Google Gemini initialized');
      }

      // Initialize Mock provider (always available)
      this.providers.mock = {
        type: 'mock'
      };
      console.log('  ✅ Mock provider initialized');

      this.isInitialized = true;
      console.log(`✅ AI Service ready! Primary: ${this.primaryProvider}, Fallback: ${this.fallbackProvider}`);
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error.message);
      // Fallback to mock
      this.primaryProvider = 'mock';
      this.fallbackProvider = 'none';
      this.isInitialized = true;
      console.log('⚠️  Running in mock mode');
    }
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Generate text using AI with automatic provider fallback
   */
  async generate({ prompt, systemPrompt, options = {} }) {
    await this.ensureInitialized();

    const startTime = Date.now();
    let provider = options.provider || this.primaryProvider;
    let attempt = 0;
    const maxAttempts = 2; // Try primary, then fallback

    while (attempt < maxAttempts) {
      try {
        const providerConfig = this.providers[provider];

        if (!providerConfig) {
          throw new Error(`Provider '${provider}' not configured`);
        }

        // Handle mock provider
        if (provider === 'mock') {
          return this.generateMock({ prompt, systemPrompt });
        }

        // Handle Groq (different API)
        if (provider === 'groq') {
          return await this.generateWithGroq({
            prompt,
            systemPrompt,
            options,
            providerConfig
          });
        }

        // Handle Vercel AI SDK providers (OpenAI, Anthropic, Google)
        const messages = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const result = await generateText({
          model: providerConfig.client(providerConfig.model),
          messages,
          temperature: options.temperature || this.settings.temperature,
          maxTokens: options.maxTokens || this.settings.maxTokens,
          maxRetries: this.settings.maxRetries
        });

        const duration = Date.now() - startTime;
        const cost = this.calculateCost(provider, result.usage);

        // Track usage
        this.trackUsage(provider, cost);

        return {
          success: true,
          provider,
          model: providerConfig.model,
          content: result.text,
          usage: result.usage,
          cost,
          duration
        };

      } catch (error) {
        console.error(`❌ Error with ${provider}:`, error.message);
        this.usageStats.errors++;

        // Try fallback provider
        if (attempt === 0 && this.fallbackProvider && this.fallbackProvider !== 'none') {
          console.log(`🔄 Falling back to ${this.fallbackProvider}...`);
          provider = this.fallbackProvider;
          attempt++;
        } else {
          // No fallback, return error
          return {
            success: false,
            provider,
            error: error.message,
            code: error.code || 'AI_GENERATION_ERROR',
            duration: Date.now() - startTime
          };
        }
      }
    }
  }

  /**
   * Generate text using Groq (different API than Vercel AI SDK)
   */
  async generateWithGroq({ prompt, systemPrompt, options, providerConfig }) {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await providerConfig.client.chat.completions.create({
      model: providerConfig.model,
      messages,
      temperature: options.temperature || this.settings.temperature,
      max_tokens: options.maxTokens || this.settings.maxTokens
    });

    return {
      success: true,
      provider: 'groq',
      model: providerConfig.model,
      content: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      cost: 0, // FREE!
      duration: 0,
      isFree: true
    };
  }

  /**
   * Generate mock response (for testing)
   */
  async generateMock({ prompt, systemPrompt }) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    const promptLower = prompt.toLowerCase();
    let content = 'Mock AI response.';

    // Generate contextual mock based on prompt
    if (promptLower.includes('grade') && promptLower.includes('essay')) {
      content = JSON.stringify({
        score: 85,
        maxScore: 100,
        feedback: 'This is a mock grading response. Good understanding demonstrated with clear structure.',
        strengths: ['Clear thesis', 'Good organization', 'Proper evidence'],
        improvements: ['Add more examples', 'Develop counterarguments', 'Stronger conclusion']
      });
    } else if (promptLower.includes('detect') && promptLower.includes('ai')) {
      content = JSON.stringify({
        isAIGenerated: false,
        confidence: 0.23,
        analysis: 'Mock AI detection: Text appears to be human-written with natural inconsistencies.',
        verdict: 'likely_human'
      });
    } else if (promptLower.includes('plagiarism')) {
      content = JSON.stringify({
        similarity: 15,
        isPlagiarized: false,
        matchingPhrases: [],
        verdict: 'original'
      });
    } else if (promptLower.includes('generate') && promptLower.includes('question')) {
      content = JSON.stringify({
        questions: [{
          type: 'multiple-choice',
          question: 'Mock question: What is the powerhouse of the cell?',
          options: [
            { text: 'Mitochondria', value: 'mitochondria', isCorrect: true },
            { text: 'Nucleus', value: 'nucleus', isCorrect: false }
          ],
          correctAnswer: 'mitochondria',
          difficulty: 'easy',
          points: 2
        }]
      });
    }

    return {
      success: true,
      provider: 'mock',
      model: 'mock-v1',
      content,
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      cost: 0,
      duration: 500,
      isMock: true
    };
  }

  /**
   * Calculate cost based on provider and usage
   */
  calculateCost(provider, usage) {
    if (!usage) return 0;

    const pricing = {
      openai: {
        'gpt-4o': { input: 2.50, output: 10.00 },
        'gpt-4o-mini': { input: 0.150, output: 0.600 },
        'gpt-4-turbo': { input: 10.00, output: 30.00 }
      },
      anthropic: {
        'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
        'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
        'claude-3-opus-20240229': { input: 15.00, output: 75.00 }
      },
      google: {
        'gemini-1.5-pro': { input: 1.25, output: 5.00 },
        'gemini-1.5-flash': { input: 0.075, output: 0.30 }
      },
      groq: { input: 0, output: 0 } // FREE!
    };

    const providerPricing = pricing[provider];
    if (!providerPricing) return 0;

    const model = this.providers[provider]?.model;
    const modelPricing = providerPricing[model] || providerPricing;

    if (typeof modelPricing === 'object') {
      const inputCost = (usage.promptTokens / 1000000) * modelPricing.input;
      const outputCost = (usage.completionTokens / 1000000) * modelPricing.output;
      return parseFloat((inputCost + outputCost).toFixed(6));
    }

    return 0;
  }

  /**
   * Track usage statistics
   */
  trackUsage(provider, cost) {
    this.usageStats.totalRequests++;
    this.usageStats.totalCost += cost;
    this.usageStats.requestsByProvider[provider] = 
      (this.usageStats.requestsByProvider[provider] || 0) + 1;
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.features[feature] === true;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      primaryProvider: this.primaryProvider,
      fallbackProvider: this.fallbackProvider,
      availableProviders: Object.keys(this.providers),
      features: this.features,
      settings: this.settings,
      usage: this.usageStats
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.usageStats = {
      totalRequests: 0,
      totalCost: 0,
      requestsByProvider: {},
      errors: 0
    };
  }
}

// Export singleton
const aiService = new AIService();
export default aiService;
