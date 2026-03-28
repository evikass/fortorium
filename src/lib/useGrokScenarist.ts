'use client';

import { useState, useCallback } from 'react';
import { useChat } from 'ai/react';

interface ScriptParams {
  title: string;
  idea: string;
  genre: string;
  style: string;
  duration: number;
}

interface Scene {
  number: number;
  act: number;
  title: string;
  location: string;
  timeOfDay: string;
  description: string;
  action: string;
  mood: string;
  cameraWork: string;
  lighting: string;
  music: string;
  soundEffects: string[];
  duration: number;
  visualEffects: string;
  emotionalBeat: string;
  characters: string[];
  dialogue: Array<{
    character: string;
    line: string;
    emotion: string;
    action: string;
  }>;
}

interface Character {
  name: string;
  role: string;
  description: string;
  appearance: string;
  personality: string[];
  motivation: string;
  arc: string;
  emoji: string;
}

interface Script {
  title: string;
  logline: string;
  synopsis: string;
  style: string;
  genre: string;
  totalDuration: number;
  themes: string[];
  mood: string;
  visualStyle: {
    colorPalette: string[];
    lighting: string;
    atmosphere: string;
  };
  characters: Character[];
  acts: Array<{
    act: number;
    name: string;
    description: string;
    duration: number;
  }>;
  scenes: Scene[];
  conflicts: {
    main: string;
    internal: string;
    external: string;
  };
  resolution: string;
  moral: string;
}

export function useGrokScenarist() {
  const [script, setScript] = useState<Script | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState('');

  const generateScript = useCallback(async (params: ScriptParams): Promise<Script | null> => {
    setIsGenerating(true);
    setError(null);
    setScript(null);
    setRawContent('');

    try {
      const response = await fetch('/api/agents/scenarist-grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setRawContent(fullContent);
      }

      // Извлекаем JSON из ответа
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedScript = JSON.parse(jsonMatch[0]) as Script;
        setScript(parsedScript);
        return parsedScript;
      } else {
        throw new Error('Could not parse JSON from response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useGrokScenarist] Error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScript(null);
    setError(null);
    setRawContent('');
    setIsGenerating(false);
  }, []);

  return {
    script,
    isGenerating,
    error,
    rawContent,
    generateScript,
    reset,
  };
}

// Альтернативная версия с useChat для стриминга
export function useGrokScenaristStream() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, data } = useChat({
    api: '/api/agents/scenarist-grok',
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    data,
  };
}
