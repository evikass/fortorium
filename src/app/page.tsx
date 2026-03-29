'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wand2, Film, Bot, Play, Image, Loader2, CheckCircle, Circle, Sparkles, RefreshCw, Users, Clock, MapPin, Music, Sun, Moon, CloudSun, Download, Maximize2, Copy, ZoomIn, ZoomOut, FileImage } from 'lucide-react';
import { initVersionSystem, CLIENT_VERSION, forceReload } from '@/lib/version';

// Расширенные интерфейсы
interface Character {
  name: string;
  role?: string;
  description: string;
  emoji: string;
  appearance?: string;
  personality?: string[];
  motivation?: string;
  arc?: string;
}

interface Dialogue {
  character: string;
  line: string;
  emotion?: string;
  action?: string;
}

interface Scene {
  number: number;
  act?: number;
  title: string;
  location: string;
  timeOfDay?: string;
  description: string;
  duration: number;
  action: string;
  mood?: string;
  cameraWork?: string;
  lighting?: string;
  music?: string;
  soundEffects?: string[];
  visualEffects?: string;
  emotionalBeat?: string;
  dialogue: Dialogue[];
  image?: string;
  imageLoading?: boolean;
  imageError?: boolean;
}

interface Act {
  act: number;
  name: string;
  description: string;
  duration: number;
}

interface VisualStyle {
  colorPalette?: string[];
  lighting?: string;
  atmosphere?: string;
}

interface Conflicts {
  main?: string;
  internal?: string;
  external?: string;
}

interface Script {
  title: string;
  logline: string;
  synopsis?: string;
  style: string;
  genre?: string;
  targetAudience?: string;
  totalDuration: number;
  themes?: string[];
  mood?: string;
  visualStyle?: VisualStyle;
  characters: Character[];
  acts?: Act[];
  scenes: Scene[];
  conflicts?: Conflicts;
  resolution?: string;
  moral?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  icon: string;
  status: 'waiting' | 'working' | 'done';
  progress: number;
  message: string;
}

// SVG Agents Types
interface SVGLayer {
  id: number;
  agentId: string;
  agentName: string;
  agentIcon: string;
  svg: string;
  success: boolean;
  executionTime: number;
}

interface SVGResult {
  success: boolean;
  version: string;
  taskType: string;
  taskDescription: string | null;
  executionTime: number;
  composerTime: number;
  totalTime: number;
  storyboard: { frames: SVGLayer[] };
  finalScene: { svg: string; success: boolean };
  message: string;
}

export default function AnimationStudio() {
  const [projectName, setProjectName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [style, setStyle] = useState('ghibli');
  const [genre, setGenre] = useState('приключения');
  const [duration, setDuration] = useState(90);
  const [useGrok, setUseGrok] = useState(true); // true = Grok, false = обычный
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'characters' | 'svg'>('overview');
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: 'writer', name: 'Сценарист', icon: '📝', status: 'waiting', progress: 0, message: 'Ожидает задачу' },
    { id: 'artist', name: 'Художник', icon: '🎨', status: 'waiting', progress: 0, message: 'Ожидает сценарий' },
    { id: 'animator', name: 'Аниматор', icon: '🎬', status: 'waiting', progress: 0, message: 'Ожидает раскадровку' },
    { id: 'composer', name: 'Композитор', icon: '🎵', status: 'waiting', progress: 0, message: 'Ожидает анимацию' },
  ]);

  // SVG Agents State
  const [svgTaskType, setSvgTaskType] = useState<'scene' | 'banner' | 'ad' | 'social' | 'poster'>('scene');
  const [svgStyle, setSvgStyle] = useState<'ghibli' | 'disney' | 'anime' | 'pixar'>('ghibli');
  const [svgTimeOfDay, setSvgTimeOfDay] = useState<'день' | 'ночь' | 'вечер' | 'рассвет'>('день');
  const [svgDimensions, setSvgDimensions] = useState({ width: 1024, height: 576 });
  const [svgTaskDescription, setSvgTaskDescription] = useState('');
  const [svgCustomText, setSvgCustomText] = useState({
    title: '',
    subtitle: '',
    cta: 'Подробнее',
    price: '',
    hashtag: ''
  });
  const [svgLoading, setSvgLoading] = useState(false);
  const [svgResult, setSvgResult] = useState<SVGResult | null>(null);
  const [svgAgents, setSvgAgents] = useState<AgentStatus[]>([]);
  const [svgLogs, setSvgLogs] = useState<string[]>([]);
  const [svgZoom, setSvgZoom] = useState(100);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [fullscreenSvg, setFullscreenSvg] = useState<string | null>(null);

  useEffect(() => {
    const { needsReload, version } = initVersionSystem();
    console.log(`[Fortorium] Version: ${version}`);
    if (needsReload) setTimeout(() => forceReload(), 1500);
  }, []);

  const styles = [
    { value: 'ghibli', label: 'Studio Ghibli', icon: '🌸', desc: 'Мягкие акварельные тона, волшебная атмосфера' },
    { value: 'disney', label: 'Disney 2D', icon: '🏰', desc: 'Яркие цвета, мюзикл-формат' },
    { value: 'anime', label: 'Anime', icon: '⚡', desc: 'Динамичные сцены, японская эстетика' },
    { value: 'pixar', label: 'Pixar 3D', icon: '🧸', desc: 'Современная 3D анимация' },
  ];

  const genres = ['приключения', 'фэнтези', 'комедия', 'драма', 'сказка', 'фантастика'];

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
    console.log(msg);
  };

  const updateAgent = (id: string, updates: Partial<AgentStatus>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const getTimeOfDayIcon = (timeOfDay?: string) => {
    if (!timeOfDay) return <Sun className="w-4 h-4" />;
    if (timeOfDay.includes('ночь') || timeOfDay.includes('night')) return <Moon className="w-4 h-4" />;
    if (timeOfDay.includes('вечер') || timeOfDay.includes('evening')) return <CloudSun className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  const generateAll = async () => {
    if (!projectName || !projectIdea) return;
    
    setIsLoading(true);
    setScript(null);
    setLogs([]);
    setAgents(prev => prev.map(a => ({ ...a, status: 'waiting', progress: 0, message: a.id === 'writer' ? 'Начинаю работу...' : 'Ожидает' })));

    try {
      setCurrentPhase('Генерация сценария...');
      const apiLabel = useGrok ? 'Grok AI' : 'стандартный API';
      addLog(`📝 Запрос на генерацию сценария через ${apiLabel}...`);
      updateAgent('writer', { status: 'working', progress: 10, message: 'Анализирую идею...' });
      
      let generatedScript: Script | null = null;
      
      // Если выбран Grok - пробуем Grok-агент
      if (useGrok) {
        try {
          const grokRes = await fetch('/api/agents/scenarist-grok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: projectName,
              idea: projectIdea,
              style: style,
              genre: genre,
              duration: duration
            })
          });
          
          if (grokRes.ok) {
            const reader = grokRes.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              let fullContent = '';
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullContent += decoder.decode(value, { stream: true });
                updateAgent('writer', { progress: 10 + Math.min(40, fullContent.length / 100), message: 'Пишу сценарий...' });
              }
              
              const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                generatedScript = JSON.parse(jsonMatch[0]) as Script;
                addLog('✅ Сценарий создан через Grok AI!');
              }
            }
          } else {
            addLog(`⚠️ Grok AI вернул ошибку: ${grokRes.status}`);
          }
        } catch (grokError: any) {
          addLog(`⚠️ Grok AI недоступен: ${grokError.message}`);
        }
      }
      
      // Если Grok не сработал или не выбран - используем стандартный API
      if (!generatedScript) {
        if (useGrok) {
          addLog('📄 Пробую резервный API...');
        }
        updateAgent('writer', { progress: 30, message: 'Генерирую сценарий...' });
        
        const scriptRes = await fetch('/api/work', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'writer-1',
            agentRole: 'writer',
            taskType: 'generate_script',
            input: {
              title: projectName,
              idea: projectIdea,
              style: style,
              genre: genre,
              duration: duration,
              targetAudience: 'семейный просмотр'
            },
            projectContext: { style, genre }
          })
        });
        
        const scriptData = await scriptRes.json();
        addLog(`📄 Ответ получен: success=${scriptData.success}`);
        
        if (scriptData.success && scriptData.output?.script) {
          generatedScript = scriptData.output.script as Script;
          addLog('✅ Сценарий создан!');
        }
      }
      
      if (generatedScript) {
        addLog(`   📊 Сцен: ${generatedScript.scenes?.length || 0}`);
        addLog(`   👥 Персонажей: ${generatedScript.characters?.length || 0}`);
        addLog(`   🎭 Актов: ${generatedScript.acts?.length || 'нет'}`);
        addLog(`   📖 Темы: ${generatedScript.themes?.join(', ') || 'нет'}`);
        
        updateAgent('writer', { status: 'done', progress: 100, message: 'Сценарий готов!' });
        setScript(generatedScript);
        
        setCurrentPhase('Генерация изображений...');
        addLog('🎨 Начинаю генерацию раскадровки...');
        updateAgent('artist', { status: 'working', progress: 5, message: 'Создаю раскадровку...' });
        
        generateSceneImages(generatedScript);
      } else {
        addLog(`❌ Ошибка: Не удалось создать сценарий`);
        setCurrentPhase('Ошибка генерации');
      }
    } catch (error: any) {
      addLog(`❌ Ошибка: ${error.message}`);
      setCurrentPhase('Ошибка генерации');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSceneImages = async (scriptData: Script) => {
    if (!scriptData.scenes || scriptData.scenes.length === 0) {
      addLog('⚠️ Нет сцен для генерации');
      finishGeneration();
      return;
    }

    const stylePrompts: Record<string, string> = {
      ghibli: 'Studio Ghibli Miyazaki style watercolor magical anime',
      disney: 'Disney 2D animation vibrant colorful classic',
      anime: 'Japanese anime style vibrant stylized dynamic',
      pixar: 'Pixar 3D animation cinematic lighting detailed'
    };
    
    const stylePrompt = stylePrompts[style] || stylePrompts.ghibli;

    for (let i = 0; i < scriptData.scenes.length; i++) {
      const scene = scriptData.scenes[i];
      const progress = Math.round(((i + 1) / scriptData.scenes.length) * 100);
      updateAgent('artist', { progress, message: `Сцена ${i + 1}/${scriptData.scenes.length}` });
      addLog(`🖼️ Генерация сцены ${i + 1}: ${scene.title}`);
      
      setScript(prev => {
        if (!prev) return prev;
        const newScenes = [...prev.scenes];
        newScenes[i] = { ...newScenes[i], imageLoading: true };
        return { ...prev, scenes: newScenes };
      });
      
      try {
        const imagePrompt = `${stylePrompt}, ${scene.location}, ${scene.action}, ${scene.mood || 'cinematic'}, masterpiece`;
        
        if (i > 0) await new Promise(r => setTimeout(r, 2000));
        
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imagePrompt, style })
        });
        
        const imgData = await imgRes.json();
        
        if (imgData.success && imgData.imageUrl) {
          setScript(prev => {
            if (!prev) return prev;
            const newScenes = [...prev.scenes];
            newScenes[i] = { ...newScenes[i], image: imgData.imageUrl, imageLoading: false };
            return { ...prev, scenes: newScenes };
          });
          addLog(`✅ Изображение ${i + 1} готово (${imgData.gen})`);
        } else {
          setFallbackImage(i);
        }
      } catch (error: any) {
        addLog(`⚠️ Ошибка: ${error.message}`);
        setFallbackImage(i);
      }
    }
    
    finishGeneration();
  };

  const setFallbackImage = (index: number) => {
    const seed = Math.floor(Math.random() * 10000);
    setScript(prev => {
      if (!prev) return prev;
      const newScenes = [...prev.scenes];
      newScenes[index] = { ...newScenes[index], image: `https://picsum.photos/seed/${seed}/1024/576`, imageLoading: false, imageError: true };
      return { ...prev, scenes: newScenes };
    });
  };

  const finishGeneration = () => {
    updateAgent('artist', { status: 'done', progress: 100, message: 'Раскадровка готова!' });
    updateAgent('animator', { status: 'done', progress: 100, message: 'Готово!' });
    updateAgent('composer', { status: 'done', progress: 100, message: 'Готово!' });
    setCurrentPhase('Проект готов!');
    addLog('🎉 Генерация завершена!');
  };

  // SVG Generation
  const generateSVG = async () => {
    setSvgLoading(true);
    setSvgResult(null);
    setSvgLogs([]);
    
    const time = new Date().toLocaleTimeString();
    setSvgLogs([`[${time}] 🎨 Начинаю генерацию SVG...`]);
    setSvgLogs(prev => [...prev, `Тип задачи: ${svgTaskType}`]);
    if (svgTaskDescription) {
      setSvgLogs(prev => [...prev, `ТЗ: ${svgTaskDescription.substring(0, 100)}...`]);
    }
    
    // Initialize SVG agents
    const svgAgentList = [
      { id: 'palette', name: 'Палитра', icon: '🎨' },
      { id: 'background', name: 'Фон', icon: '🌄' },
      { id: 'perspective', name: 'Перспектива', icon: '📐' },
      { id: 'composition', name: 'Композиция', icon: '📊' },
      { id: 'lighting', name: 'Освещение', icon: '💡' },
      { id: 'details', name: 'Детали', icon: '✨' },
      { id: 'objects', name: 'Предметы', icon: '🪑' },
      { id: 'characters', name: 'Персонажи', icon: '👤' },
      { id: 'layout', name: 'Расстановка', icon: '📍' },
      { id: 'animation', name: 'Анимация', icon: '🎬' },
      { id: 'typography', name: 'Типографика', icon: '🔤' }
    ];
    
    setSvgAgents(svgAgentList.map(a => ({ ...a, status: 'working' as const, progress: 50, message: 'Генерация...' })));
    
    try {
      const res = await fetch('/api/agents/svg/coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: svgTaskType,
          taskDescription: svgTaskDescription,
          style: svgStyle,
          dimensions: svgDimensions,
          customText: svgCustomText,
          scene: {
            location: svgTaskType === 'scene' ? 'волшебный лес' : 'studio',
            timeOfDay: svgTimeOfDay,
            mood: 'сказочный'
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSvgResult(data);
        setSvgAgents(prev => prev.map(a => ({ ...a, status: 'done' as const, progress: 100, message: 'Готово!' })));
        setSvgLogs(prev => [...prev, `✅ Создано ${data.storyboard?.frames?.length || 11} слоёв`]);
        setSvgLogs(prev => [...prev, `⏱️ Время: ${data.totalTime}мс`]);
      } else {
        setSvgLogs(prev => [...prev, `❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`]);
        setSvgAgents(prev => prev.map(a => ({ ...a, status: 'waiting' as const, progress: 0, message: 'Ошибка' })));
      }
    } catch (error: any) {
      setSvgLogs(prev => [...prev, `❌ Ошибка: ${error.message}`]);
      setSvgAgents(prev => prev.map(a => ({ ...a, status: 'waiting' as const, progress: 0, message: 'Ошибка' })));
    } finally {
      setSvgLoading(false);
    }
  };

  const regenerateSVG = async () => {
    await generateSVG();
  };

  // SVG Export Functions
  const downloadSVG = (svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async (svgContent: string, filename: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
    img.src = url;
  };

  const copySVG = (svgContent: string) => {
    navigator.clipboard.writeText(svgContent);
  };

  const downloadAllLayers = () => {
    if (!svgResult) return;
    svgResult.storyboard.frames.forEach((frame, i) => {
      setTimeout(() => {
        downloadSVG(frame.svg, `layer-${i + 1}-${frame.agentId}`);
      }, i * 100);
    });
  };

  const regenerateImage = async (index: number) => {
    if (!script?.scenes[index]) return;
    
    const scene = script.scenes[index];
    setScript(prev => {
      if (!prev) return prev;
      const newScenes = [...prev.scenes];
      newScenes[index] = { ...newScenes[index], imageLoading: true };
      return { ...prev, scenes: newScenes };
    });
    
    const stylePrompts: Record<string, string> = {
      ghibli: 'Studio Ghibli Miyazaki style watercolor',
      disney: 'Disney 2D animation vibrant',
      anime: 'anime style Japanese',
      pixar: 'Pixar 3D animation cinematic'
    };
    
    try {
      const imgRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${stylePrompts[style]}, ${scene.location}, ${scene.action}`,
          style
        })
      });
      
      const imgData = await imgRes.json();
      if (imgData.success && imgData.imageUrl) {
        setScript(prev => {
          if (!prev) return prev;
          const newScenes = [...prev.scenes];
          newScenes[index] = { ...newScenes[index], image: imgData.imageUrl, imageLoading: false };
          return { ...prev, scenes: newScenes };
        });
      } else {
        setFallbackImage(index);
      }
    } catch {
      setFallbackImage(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">ФОРТОРИУМ</h1>
              <p className="text-xs text-white/50">AI Анимационная Студия v4.8.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentPhase && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                {currentPhase}
              </Badge>
            )}
            <Badge variant="outline" className="border-green-500/30 text-green-400">● Онлайн</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Project Form */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Film className="w-5 h-5" /> Создать новый проект
            </CardTitle>
            <CardDescription className="text-white/60">
              Опишите идею — AI создаст полноценный сценарий с персонажами, диалогами и раскадровкой
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">Название проекта</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Волшебное путешествие..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">Жанр</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <Button
                      key={g}
                      size="sm"
                      variant={genre === g ? 'default' : 'outline'}
                      onClick={() => setGenre(g)}
                      className={genre === g ? 'bg-purple-500' : 'border-white/20 text-white'}
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Стиль анимации</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {styles.map((s) => (
                  <Button
                    key={s.value}
                    variant={style === s.value ? 'default' : 'outline'}
                    onClick={() => setStyle(s.value)}
                    className={`h-auto py-3 flex-col ${style === s.value ? 'bg-purple-500' : 'border-white/20 text-white'}`}
                  >
                    <span className="text-2xl mb-1">{s.icon}</span>
                    <span className="text-xs">{s.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Переключатель сценариста */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    Сценарист
                  </label>
                  <p className="text-white/50 text-xs mt-1">
                    {useGrok 
                      ? 'Grok AI (xAI) — быстрый и качественный' 
                      : 'Стандартный API — резервный вариант'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!useGrok ? 'text-white' : 'text-white/40'}`}>
                    Стандарт
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseGrok(!useGrok)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      useGrok ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        useGrok ? 'left-8' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${useGrok ? 'text-white' : 'text-white/40'}`}>
                    Grok AI
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Длительность: {duration} сек</label>
              <input
                type="range"
                min="30"
                max="180"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-white/40 text-xs">
                <span>30 сек</span>
                <span>3 мин</span>
              </div>
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Описание идеи</label>
              <Textarea
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Кот-астронавт отправляется на Луну, чтобы найти пропавшего друга. По пути он встречает добрых инопланетян и учится верить в себя..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
              />
            </div>

            <Button
              onClick={generateAll}
              disabled={isLoading || !projectName || !projectIdea}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Генерация...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Сгенерировать проект</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Agents Status */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" /> AI-Агенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {agents.map((agent) => (
                <div key={agent.id} className={`p-3 rounded-lg border transition-all ${
                  agent.status === 'done' ? 'bg-green-500/10 border-green-500/30' :
                  agent.status === 'working' ? 'bg-purple-500/10 border-purple-500/30' :
                  'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{agent.name}</div>
                      <div className={`text-xs truncate ${
                        agent.status === 'done' ? 'text-green-400' :
                        agent.status === 'working' ? 'text-purple-400' : 'text-white/40'
                      }`}>
                        {agent.message}
                      </div>
                    </div>
                    {agent.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    {agent.status === 'working' && <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />}
                  </div>
                  {agent.status !== 'waiting' && <Progress value={agent.progress} className="h-1" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Логи процесса</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-green-400 max-h-32 overflow-y-auto">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {script && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: Film },
                { id: 'scenes', label: 'Сцены', icon: Image },
                { id: 'characters', label: 'Персонажи', icon: Users },
                { id: 'svg', label: 'SVG', icon: Wand2 },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={activeTab === tab.id ? 'bg-purple-500' : 'text-white/60'}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Title & Logline */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{script.title}</CardTitle>
                    <CardDescription className="text-lg text-white/70">{script.logline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {script.synopsis && (
                      <p className="text-white/80">{script.synopsis}</p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <Clock className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                        <div className="text-white text-xl font-bold">{script.totalDuration}с</div>
                        <div className="text-white/40 text-xs">Длительность</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <Users className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                        <div className="text-white text-xl font-bold">{script.characters?.length || 0}</div>
                        <div className="text-white/40 text-xs">Персонажей</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <Film className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                        <div className="text-white text-xl font-bold">{script.scenes?.length || 0}</div>
                        <div className="text-white/40 text-xs">Сцен</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg text-center">
                        <Music className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                        <div className="text-white text-xl font-bold">{script.acts?.length || 4}</div>
                        <div className="text-white/40 text-xs">Актов</div>
                      </div>
                    </div>

                    {/* Themes */}
                    {script.themes && script.themes.length > 0 && (
                      <div>
                        <h4 className="text-white/60 text-sm mb-2">Темы</h4>
                        <div className="flex flex-wrap gap-2">
                          {script.themes.map((theme, i) => (
                            <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-300">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conflicts */}
                    {script.conflicts && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {script.conflicts.main && (
                          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <div className="text-red-400 text-xs mb-1">Главный конфликт</div>
                            <div className="text-white text-sm">{script.conflicts.main}</div>
                          </div>
                        )}
                        {script.conflicts.internal && (
                          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                            <div className="text-amber-400 text-xs mb-1">Внутренний конфликт</div>
                            <div className="text-white text-sm">{script.conflicts.internal}</div>
                          </div>
                        )}
                        {script.conflicts.external && (
                          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                            <div className="text-blue-400 text-xs mb-1">Внешний конфликт</div>
                            <div className="text-white text-sm">{script.conflicts.external}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolution & Moral */}
                    {script.resolution && (
                      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                        <div className="text-green-400 text-xs mb-1">Развязка</div>
                        <div className="text-white text-sm">{script.resolution}</div>
                      </div>
                    )}
                    
                    {script.moral && (
                      <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                        <div className="text-purple-400 text-xs mb-1">Мораль истории</div>
                        <div className="text-white text-sm">{script.moral}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Visual Style */}
                {script.visualStyle && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Визуальный стиль</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {script.visualStyle.colorPalette && (
                          <div>
                            <div className="text-white/40 text-xs mb-2">Цветовая палитра</div>
                            <div className="flex gap-1">
                              {script.visualStyle.colorPalette.map((color, i) => (
                                <Badge key={i} variant="outline" className="border-white/20 text-white/80 text-xs">
                                  {color}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {script.visualStyle.lighting && (
                          <div>
                            <div className="text-white/40 text-xs mb-1">Освещение</div>
                            <div className="text-white text-sm">{script.visualStyle.lighting}</div>
                          </div>
                        )}
                        {script.visualStyle.atmosphere && (
                          <div>
                            <div className="text-white/40 text-xs mb-1">Атмосфера</div>
                            <div className="text-white text-sm">{script.visualStyle.atmosphere}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Acts */}
                {script.acts && script.acts.length > 0 && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Структура по актам</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {script.acts.map((act, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-white font-bold">
                              {act.act}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{act.name}</div>
                              <div className="text-white/60 text-xs">{act.description}</div>
                            </div>
                            <Badge variant="outline" className="border-white/20 text-white/60">
                              {act.duration}с
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Scenes Tab */}
            {activeTab === 'scenes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-lg font-bold">Раскадровка</h2>
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    {script.scenes?.filter(s => s.image).length || 0} / {script.scenes?.length || 0} изображений
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {script.scenes?.map((scene, i) => (
                    <Card key={i} className="bg-white/5 border-white/10 overflow-hidden">
                      <div className="aspect-video bg-black/50 relative">
                        {scene.imageLoading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                          </div>
                        ) : scene.image ? (
                          <>
                            <img
                              src={scene.image}
                              alt={scene.title}
                              className="w-full h-full object-cover"
                              onError={() => setFallbackImage(i)}
                            />
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              {getTimeOfDayIcon(scene.timeOfDay)}
                              <span>Сцена {scene.number}</span>
                            </div>
                            <button
                              onClick={() => regenerateImage(i)}
                              className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded hover:bg-black/90"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Button variant="ghost" onClick={() => regenerateImage(i)} className="text-white/40">
                              <Image className="w-6 h-6 mr-2" /> Сгенерировать
                            </Button>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-medium">{scene.title}</h4>
                            <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{scene.location}</span>
                              {scene.timeOfDay && <span>• {scene.timeOfDay}</span>}
                              <span>• {scene.duration}с</span>
                            </div>
                          </div>
                          {scene.act && (
                            <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                              Акт {scene.act}
                            </Badge>
                          )}
                        </div>

                        <p className="text-white/70 text-sm">{scene.description}</p>

                        {scene.action && (
                          <div className="bg-white/5 p-2 rounded text-sm">
                            <span className="text-amber-400">Действие:</span>{' '}
                            <span className="text-white/80">{scene.action}</span>
                          </div>
                        )}

                        {scene.mood && (
                          <div className="text-xs">
                            <span className="text-purple-400">Настроение:</span>{' '}
                            <span className="text-white/60">{scene.mood}</span>
                          </div>
                        )}

                        {scene.dialogue && scene.dialogue.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            {scene.dialogue.map((d, di) => (
                              <div key={di} className="text-sm">
                                <span className="text-purple-300 font-medium">{d.character}</span>
                                {d.emotion && <span className="text-purple-400/60 text-xs"> ({d.emotion})</span>}
                                <p className="text-white/70 mt-0.5">"{d.line}"</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {(scene.music || scene.visualEffects) && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                            {scene.music && (
                              <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-xs">
                                🎵 {scene.music}
                              </Badge>
                            )}
                            {scene.visualEffects && (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                                ✨ {scene.visualEffects}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {script.characters?.map((char, i) => (
                  <Card key={i} className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{char.emoji}</span>
                        <div>
                          <CardTitle className="text-white">{char.name}</CardTitle>
                          {char.role && (
                            <Badge variant="outline" className={`mt-1 text-xs ${
                              char.role === 'protagonist' ? 'border-green-500/30 text-green-400' :
                              char.role === 'antagonist' ? 'border-red-500/30 text-red-400' :
                              'border-blue-500/30 text-blue-400'
                            }`}>
                              {char.role === 'protagonist' ? 'Герой' : 
                               char.role === 'antagonist' ? 'Антагонист' : 'Второстепенный'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-white/70 text-sm">{char.description}</p>
                      
                      {char.appearance && (
                        <div>
                          <div className="text-white/40 text-xs mb-1">Внешность</div>
                          <p className="text-white/60 text-sm">{char.appearance}</p>
                        </div>
                      )}

                      {char.personality && char.personality.length > 0 && (
                        <div>
                          <div className="text-white/40 text-xs mb-1">Характер</div>
                          <div className="flex flex-wrap gap-1">
                            {char.personality.map((p, pi) => (
                              <Badge key={pi} variant="outline" className="border-white/20 text-white/60 text-xs">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {char.motivation && (
                        <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20">
                          <div className="text-amber-400 text-xs">Мотивация</div>
                          <p className="text-white/80 text-sm">{char.motivation}</p>
                        </div>
                      )}

                      {char.arc && (
                        <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                          <div className="text-purple-400 text-xs">Арка персонажа</div>
                          <p className="text-white/80 text-sm">{char.arc}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* SVG Tab */}
            {activeTab === 'svg' && (
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wand2 className="w-5 h-5" /> SVG Генератор
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Создание SVG-раскадровки с помощью 11 специализированных агентов
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Task Type Selection */}
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">Тип задачи</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'scene', label: '🎬 Сцена', desc: 'Кинематографическая сцена' },
                          { id: 'banner', label: '📐 Баннер', desc: 'Рекламный баннер' },
                          { id: 'ad', label: '📢 Реклама', desc: 'Рекламный креатив' },
                          { id: 'social', label: '📱 Соцсети', desc: 'Пост для соцсетей' },
                          { id: 'poster', label: '🖼️ Постер', desc: 'Афиша или плакат' },
                        ].map((t) => (
                          <Button
                            key={t.id}
                            size="sm"
                            variant={svgTaskType === t.id ? 'default' : 'outline'}
                            onClick={() => setSvgTaskType(t.id as any)}
                            className={svgTaskType === t.id ? 'bg-purple-500' : 'border-white/20 text-white'}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Style Selection */}
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">Визуальный стиль</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'ghibli', label: 'Ghibli', icon: '🌸', desc: 'Акварель' },
                          { id: 'disney', label: 'Disney', icon: '🏰', desc: 'Яркий' },
                          { id: 'anime', label: 'Anime', icon: '⚡', desc: 'Динамичный' },
                          { id: 'pixar', label: 'Pixar', icon: '🧸', desc: '3D стиль' },
                        ].map((s) => (
                          <Button
                            key={s.id}
                            size="sm"
                            variant={svgStyle === s.id ? 'default' : 'outline'}
                            onClick={() => setSvgStyle(s.id as any)}
                            className={svgStyle === s.id ? 'bg-purple-500' : 'border-white/20 text-white'}
                          >
                            {s.icon} {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Time of Day */}
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">Время суток</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'день', label: '☀️ День' },
                          { id: 'вечер', label: '🌅 Вечер' },
                          { id: 'ночь', label: '🌙 Ночь' },
                          { id: 'рассвет', label: '🌄 Рассвет' },
                        ].map((t) => (
                          <Button
                            key={t.id}
                            size="sm"
                            variant={svgTimeOfDay === t.id ? 'default' : 'outline'}
                            onClick={() => setSvgTimeOfDay(t.id as any)}
                            className={svgTimeOfDay === t.id ? 'bg-purple-500' : 'border-white/20 text-white'}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">Размер изображения</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { w: 1024, h: 576, label: '16:9 Широкий' },
                          { w: 800, h: 600, label: '4:3 Стандарт' },
                          { w: 600, h: 600, label: '1:1 Квадрат' },
                          { w: 576, h: 1024, label: '9:16 Истории' },
                        ].map((d) => (
                          <Button
                            key={`${d.w}x${d.h}`}
                            size="sm"
                            variant={svgDimensions.width === d.w ? 'default' : 'outline'}
                            onClick={() => setSvgDimensions({ width: d.w, height: d.h })}
                            className={svgDimensions.width === d.w ? 'bg-purple-500' : 'border-white/20 text-white'}
                          >
                            {d.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Technical Specification */}
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">
                        Техническое задание (ТЗ)
                      </label>
                      <Textarea
                        value={svgTaskDescription}
                        onChange={(e) => setSvgTaskDescription(e.target.value)}
                        placeholder="Опишите требования к изображению: стиль, цвета, настроение, ключевые элементы, целевая аудитория, бренд-требования..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                      />
                    </div>

                    {/* Custom Text Fields for Ads/Banners */}
                    {(svgTaskType === 'banner' || svgTaskType === 'ad' || svgTaskType === 'social' || svgTaskType === 'poster') && (
                      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-white/10 space-y-3">
                        <div className="text-white/60 text-sm mb-2">📝 Текст для контента</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Заголовок</label>
                            <Input
                              value={svgCustomText.title}
                              onChange={(e) => setSvgCustomText(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Название бренда или продукта"
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Подзаголовок</label>
                            <Input
                              value={svgCustomText.subtitle}
                              onChange={(e) => setSvgCustomText(prev => ({ ...prev, subtitle: e.target.value }))}
                              placeholder="Краткое описание"
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">CTA кнопка</label>
                            <Input
                              value={svgCustomText.cta}
                              onChange={(e) => setSvgCustomText(prev => ({ ...prev, cta: e.target.value }))}
                              placeholder="Подробнее"
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Цена (опционально)</label>
                            <Input
                              value={svgCustomText.price}
                              onChange={(e) => setSvgCustomText(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="990₽"
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                        </div>
                        {svgTaskType === 'social' && (
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Хэштег</label>
                            <Input
                              value={svgCustomText.hashtag}
                              onChange={(e) => setSvgCustomText(prev => ({ ...prev, hashtag: e.target.value }))}
                              placeholder="#форториум #анимация"
                              className="bg-white/5 border-white/10 text-white text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={generateSVG}
                      disabled={svgLoading}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
                    >
                      {svgLoading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Генерация SVG...</>
                      ) : (
                        <><Sparkles className="w-5 h-5 mr-2" /> Сгенерировать SVG</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* SVG Agents Status */}
                {svgAgents.length > 0 && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Bot className="w-4 h-4" /> SVG Агенты
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {svgAgents.map((agent) => (
                          <div key={agent.id} className={`p-2 rounded-lg border text-center transition-all ${
                            agent.status === 'done' ? 'bg-green-500/10 border-green-500/30' :
                            agent.status === 'working' ? 'bg-purple-500/10 border-purple-500/30' :
                            'bg-white/5 border-white/10'
                          }`}>
                            <span className="text-xl">{agent.icon}</span>
                            <div className="text-white text-xs mt-1 truncate">{agent.name}</div>
                            {agent.status === 'done' && <CheckCircle className="w-3 h-3 text-green-400 mx-auto mt-1" />}
                            {agent.status === 'working' && <Loader2 className="w-3 h-3 text-purple-400 animate-spin mx-auto mt-1" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SVG Logs */}
                {svgLogs.length > 0 && (
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-sm">Логи SVG генерации</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-black/30 p-3 rounded-lg font-mono text-xs text-green-400 max-h-32 overflow-y-auto">
                        {svgLogs.map((log, i) => <div key={i}>{log}</div>)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SVG Results */}
                {svgResult && (
                  <>
                    {/* Final Scene */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-sm">✨ Финальная сцена</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                              {svgResult.totalTime}мс
                            </Badge>
                            <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                              {svgDimensions.width}×{svgDimensions.height}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Zoom Controls */}
                        <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSvgZoom(Math.max(25, svgZoom - 25))}
                              className="text-white/60 hover:text-white h-8 w-8 p-0"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-white/60 text-xs w-12 text-center">{svgZoom}%</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSvgZoom(Math.min(200, svgZoom + 25))}
                              className="text-white/60 hover:text-white h-8 w-8 p-0"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFullscreenSvg(svgResult.finalScene.svg)}
                              className="text-white/60 hover:text-white h-8 px-2"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copySVG(svgResult.finalScene.svg)}
                              className="text-white/60 hover:text-white h-8 px-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadSVG(svgResult.finalScene.svg, `fortorium-${svgTaskType}-final`)}
                              className="text-white/60 hover:text-white h-8 px-2"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadPNG(svgResult.finalScene.svg, `fortorium-${svgTaskType}-final`)}
                              className="text-white/60 hover:text-white h-8 px-2"
                            >
                              <FileImage className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* SVG Preview */}
                        <div 
                          className="bg-black/30 rounded-lg overflow-auto flex items-center justify-center p-4"
                          style={{ minHeight: '300px' }}
                        >
                          <div 
                            style={{ transform: `scale(${svgZoom / 100})`, transformOrigin: 'center' }}
                            dangerouslySetInnerHTML={{ __html: svgResult.finalScene.svg }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Export Actions */}
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="py-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Button
                            onClick={() => downloadSVG(svgResult.finalScene.svg, `fortorium-${svgTaskType}`)}
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                          >
                            <Download className="w-4 h-4 mr-2" /> Скачать SVG
                          </Button>
                          <Button
                            onClick={() => downloadPNG(svgResult.finalScene.svg, `fortorium-${svgTaskType}`)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <FileImage className="w-4 h-4 mr-2" /> Скачать PNG
                          </Button>
                          <Button
                            onClick={() => copySVG(svgResult.finalScene.svg)}
                            variant="outline"
                            className="border-white/20 text-white"
                          >
                            <Copy className="w-4 h-4 mr-2" /> Копировать SVG
                          </Button>
                          <Button
                            onClick={downloadAllLayers}
                            variant="outline"
                            className="border-white/20 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" /> Все слои (11 SVG)
                          </Button>
                          <Button
                            onClick={regenerateSVG}
                            variant="outline"
                            className="border-purple-500/30 text-purple-300"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Пересоздать
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Storyboard Grid */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-sm">
                            🎬 Раскадровка ({svgResult.storyboard.frames.length} слоёв)
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedLayer(null)}
                            className="text-white/60"
                          >
                            Показать все
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {svgResult.storyboard.frames.map((frame) => (
                            <div 
                              key={frame.id} 
                              className={`bg-black/30 rounded-lg overflow-hidden border cursor-pointer transition-all hover:border-purple-500/50 ${
                                selectedLayer === frame.id ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-white/10'
                              }`}
                              onClick={() => setSelectedLayer(selectedLayer === frame.id ? null : frame.id)}
                            >
                              <div 
                                className="aspect-video"
                                dangerouslySetInnerHTML={{ __html: frame.svg }}
                              />
                              <div className="p-2 flex items-center gap-2">
                                <span>{frame.agentIcon}</span>
                                <span className="text-white/60 text-xs truncate flex-1">{frame.agentName}</span>
                                {frame.success && <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />}
                              </div>
                              {selectedLayer === frame.id && (
                                <div className="p-2 border-t border-white/10 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); downloadSVG(frame.svg, `layer-${frame.agentId}`); }}
                                    className="text-white/60 hover:text-white h-7 px-2 text-xs"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); setFullscreenSvg(frame.svg); }}
                                    className="text-white/60 hover:text-white h-7 px-2 text-xs"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Fullscreen Modal */}
                {fullscreenSvg && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setFullscreenSvg(null)}
                  >
                    <button
                      onClick={() => setFullscreenSvg(null)}
                      className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/10 rounded-full p-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div 
                      className="max-w-full max-h-full overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                      dangerouslySetInnerHTML={{ __html: fullscreenSvg }}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <Button
                        onClick={() => downloadSVG(fullscreenSvg, 'fortorium-fullscreen')}
                        className="bg-white/20 backdrop-blur"
                      >
                        <Download className="w-4 h-4 mr-2" /> Скачать SVG
                      </Button>
                      <Button
                        onClick={() => downloadPNG(fullscreenSvg, 'fortorium-fullscreen')}
                        className="bg-white/20 backdrop-blur"
                      >
                        <FileImage className="w-4 h-4 mr-2" /> Скачать PNG
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Play className="w-5 h-5 mr-2" /> Экспортировать проект
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!script && !isLoading && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-16">
              <div className="text-center text-white/40">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white/60 mb-2">Готовы создать шедевр?</h3>
                <p>Опишите идею и нажмите "Сгенерировать проект"</p>
                <p className="text-sm mt-2">AI создаст полноценный сценарий с персонажами, диалогами и раскадровкой</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
