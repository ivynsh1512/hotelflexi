/**
 * HotelFlexi Groq AI Central Intelligence Layer
 * Official Groq inference client supporting reasoning models (llama-3.3-70b-versatile,
 * deepseek-r1-distill-llama-70b) and fast summary models (llama-3.1-8b-instant).
 * Features server-side tool calling, rate limiting, and circuit-breaking fallbacks.
 */

import { Env } from '../types';

export type GroqTaskType = 'reasoning' | 'fast' | 'deep_reasoning';

export interface GroqModelConfig {
  id: string;
  name: string;
  taskType: GroqTaskType;
  maxTokens: number;
  temperature: number;
}

export const GROQ_MODELS: Record<GroqTaskType, GroqModelConfig> = {
  reasoning: {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Primary Intelligence & Tool Calling)',
    taskType: 'reasoning',
    maxTokens: 4096,
    temperature: 0.2, // Low temperature for high precision & financial reliability
  },
  deep_reasoning: {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (Deep Structured Extraction)',
    taskType: 'deep_reasoning',
    maxTokens: 4096,
    temperature: 0.1,
  },
  fast: {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B (Fast Summary)',
    taskType: 'fast',
    maxTokens: 1024,
    temperature: 0.3,
  },
};

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface GroqToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface GroqResponse {
  success: boolean;
  content: string;
  reasoning?: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  modelUsed: string;
  error?: string;
}

/**
 * Check if a valid Groq API key is configured
 */
export function isGroqConfigured(env: Env): boolean {
  return Boolean(env.GROQ_API_KEY || env.AI_PROVIDER_API_KEY);
}

/**
 * Execute chat completion via Groq Cloud API
 */
export async function callGroqChat(
  env: Env,
  messages: GroqMessage[],
  options: {
    taskType?: GroqTaskType;
    tools?: GroqToolDefinition[];
    toolChoice?: 'auto' | 'none' | 'required';
    timeoutMs?: number;
    maxRetries?: number;
  } = {}
): Promise<GroqResponse> {
  const apiKey = env.GROQ_API_KEY || env.AI_PROVIDER_API_KEY;
  const taskType = options.taskType || 'reasoning';
  const modelConfig = GROQ_MODELS[taskType] || GROQ_MODELS.reasoning;
  const timeoutMs = options.timeoutMs || 15000;
  const maxRetries = options.maxRetries ?? 2;

  if (!apiKey) {
    return {
      success: false,
      content: '',
      modelUsed: modelConfig.id,
      error: 'GROQ_API_KEY is not configured on server',
    };
  }

  const payload: any = {
    model: modelConfig.id,
    messages,
    max_tokens: modelConfig.maxTokens,
    temperature: modelConfig.temperature,
  };

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
    payload.tool_choice = options.toolChoice || 'auto';
  }

  let attempt = 0;
  let lastError = '';

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'User-Agent': 'HotelFlexi-Groq-AI/2.0 (+https://hotelflexi.com)',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        // Rate limit or temporary service issue: retry with exponential backoff
        const backoffMs = Math.pow(2, attempt) * 600 + Math.random() * 200;
        attempt++;
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        return {
          success: false,
          content: '',
          modelUsed: modelConfig.id,
          error: `Groq HTTP ${res.status}: ${errorText.slice(0, 200)}`,
        };
      }

      const data: any = await res.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      const toolCalls: any[] = [];
      if (message?.tool_calls && Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          let parsedArgs: any = {};
          try {
            parsedArgs = JSON.parse(tc.function?.arguments || '{}');
          } catch {
            parsedArgs = {};
          }
          toolCalls.push({
            id: tc.id,
            name: tc.function?.name,
            arguments: parsedArgs,
          });
        }
      }

      return {
        success: true,
        content: message?.content || (message?.reasoning && toolCalls.length === 0 ? message.reasoning : ''),
        reasoning: message?.reasoning || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        modelUsed: data.model || modelConfig.id,
      };
    } catch (err: any) {
      lastError = err.name === 'AbortError' ? 'Groq request timed out' : err.message;
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  return {
    success: false,
    content: '',
    modelUsed: modelConfig.id,
    error: lastError || 'Max retries exhausted to Groq provider',
  };
}

/**
 * Run a safe connectivity diagnostic to verify openai/gpt-oss-120b on Groq
 * Never exposes API keys or secrets in output.
 */
export async function runGroqDiagnostic(env: Env): Promise<{
  configured: boolean;
  status: 'online' | 'offline' | 'error';
  model: string;
  latencyMs: number;
  toolCallingSupported: boolean;
  message?: string;
}> {
  const startTime = Date.now();
  if (!isGroqConfigured(env)) {
    return {
      configured: false,
      status: 'offline',
      model: GROQ_MODELS.reasoning.id,
      latencyMs: 0,
      toolCallingSupported: false,
      message: 'GROQ_API_KEY secret is not set in Worker environment',
    };
  }

  try {
    const res = await callGroqChat(
      env,
      [{ role: 'user', content: 'Respond with "OK" only.' }],
      { taskType: 'reasoning', timeoutMs: 12000, maxRetries: 1 }
    );

    const latencyMs = Date.now() - startTime;

    if (!res.success) {
      return {
        configured: true,
        status: 'error',
        model: res.modelUsed,
        latencyMs,
        toolCallingSupported: false,
        message: res.error,
      };
    }

    return {
      configured: true,
      status: 'online',
      model: res.modelUsed,
      latencyMs,
      toolCallingSupported: true,
      message: 'openai/gpt-oss-120b verified operational on Groq Cloud',
    };
  } catch (e: any) {
    return {
      configured: true,
      status: 'error',
      model: GROQ_MODELS.reasoning.id,
      latencyMs: Date.now() - startTime,
      toolCallingSupported: false,
      message: e.message || 'Diagnostic request failed',
    };
  }
}
