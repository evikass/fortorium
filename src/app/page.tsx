'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, Film, Bot, Play, Image, Loader2, CheckCircle, Circle, Sparkles, RefreshCw, 
  Users, Clock, MapPin, Music, Sun, Moon, CloudSun, Settings, Download, Github,
  Mic, Scissors, Monitor
} from 'lucide-react';
import { initVersionSystem, CLIENT_VERSION, forceReload } from '@/lib/version';

// Интерфейсы
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
  color: string;
  status: 'waiting' | 'working' | 'done';
  progress: number;
  message: string;
}

// Все агенты студии
const ALL_AGENTS = [
  { id: 'producer', name: 'Продюсер', icon: '🤖', color: 'bg-purple-500', desc: 'Координирует весь процесс' },
  { id: 'writer', name: 'Сценарист', icon: '📝', color: 'bg-blue-500', desc: 'Пишет сценарии и диалоги' },
  { id: 'artist', name: 'Художник', icon: '🎨', color: 'bg-pink-500', desc: 'Создаёт раскадровки' },
  { id: 'animator', name: 'Аниматор', icon: '🎬', color: 'bg-orange-500', desc: 'Оживляет кадры' },
  { id: 'voice', name: 'Озвучка', icon: '🎤', color: 'bg-green-500', desc: 'Генерирует голоса' },
  { id: 'editor', name: 'Монтажёр', icon: '✂️', color: 'bg-red-500', desc: 'Собирает ролик' },
  { id: 'blender', name: 'Blender', icon: '💻', color: 'bg-cyan-500', desc: '3D сцены' },
];

export default function AnimationStudio() {
  const [projectName, setProjectName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [style, setStyle] = useState('ghibli');
  const [genre, setGenre] = useState('приключения');
  const [duration, setDuration] = useState(90);
  const [useBlender, setUseBlender] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'demo' | 'agents' | 'pipeline'>('demo');
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'scenes' | 'characters'>('overview');
  
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: 'writer', name: 'Сценарист', icon: '📝', color: 'bg-blue-500', status: 'waiting', progress: 0, message: 'Ожидает задачу' },
    { id: 'artist', name: 'Художник', icon: '🎨', color: 'bg-pink-500', status: 'waiting', progress: 0, message: 'Ожидает сценарий' },
    { id: 'animator', name: 'Аниматор', icon: '🎬', color: 'bg-orange-500', status: 'waiting', progress: 0, message: 'Ожидает раскадровку' },
    { id: 'voice', name: 'Озвучка', icon: '🎤', color: 'bg-green-500', status: 'waiting', progress: 0, message: 'Ожидает анимацию' },
  ]);

  useEffect(() => {
    const { needsReload, version } = initVersionSystem();
    console.log(`[Fortorium] Version: ${version}`);
    if (needsReload) setTimeout(() => forceReload(), 1500);
  }, []);

  const styles = [
    { value: 'ghibli', label: 'Ghibli', icon: '🏯', desc: 'Миядзаки, акварель' },
    { value: 'disney', label: 'Disney', icon: '🏰', desc: 'Классика 2D' },
    { value: 'pixar', label: 'Pixar', icon: '🧸', desc: 'Современный 3D' },
    { value: 'anime', label: 'Anime', icon: '⚡', desc: 'Японский стиль' },
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
      addLog('📝 Запрос на генерацию сценария...');
      updateAgent('writer', { status: 'working', progress: 10, message: 'Анализирую идею...' });
      
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
      
      updateAgent('writer', { progress: 50, message: 'Создаю персонажей...' });
      
      const scriptData = await scriptRes.json();
      addLog(`📄 Ответ получен: success=${scriptData.success}`);
      
      if (scriptData.success && scriptData.output?.script) {
        const generatedScript: Script = scriptData.output.script;
        addLog(`✅ Сценарий создан!`);
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
        addLog(`❌ Ошибка: ${scriptData.error || 'Не удалось создать сценарий'}`);
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
    updateAgent('voice', { status: 'done', progress: 100, message: 'Готово!' });
    setCurrentPhase('Проект готов!');
    addLog('🎉 Генерация завершена!');
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
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
              🪄
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Animation Studio</h1>
              <p className="text-xs text-white/50">Мультиагентная анимационная студия v{CLIENT_VERSION}</p>
            </div>
          </div>
          
          {/* Agent Icons in Header */}
          <div className="hidden md:flex items-center gap-1">
            {ALL_AGENTS.map((agent) => (
              <div
                key={agent.id}
                className={`w-9 h-9 rounded-lg ${agent.color} flex items-center justify-center text-base opacity-80 hover:opacity-100 hover:scale-110 transition-all cursor-pointer`}
                title={agent.name}
              >
                {agent.icon}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {currentPhase && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                {currentPhase}
              </Badge>
            )}
            <Badge variant="outline" className="border-green-500/30 text-green-400">● Онлайн</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <section className="text-center py-8 mb-6">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Создавайте мультфильмы с помощью ИИ
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-4">
            Полностью автономная студия: от идеи до готового ролика. 7 ИИ-агентов работают вместе без участия людей.
          </p>
          <div className="flex gap-3 justify-center">
            <a 
              href="https://github.com/evikass/fortorium" 
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition"
            >
              <Github className="w-4 h-4" /> Исходный код
            </a>
          </div>
        </section>

        {/* Main Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 overflow-x-auto">
          {[
            { id: 'demo', label: '🎮 Демо' },
            { id: 'agents', label: '🤖 Агенты' },
            { id: 'pipeline', label: '🔄 Пайплайн' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeMainTab === tab.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Demo Tab */}
        {activeMainTab === 'demo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New Project Form */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl">
                    ➕
                  </div>
                  <div>
                    <CardTitle className="text-white">Новый проект</CardTitle>
                    <CardDescription className="text-white/60">Опишите идею для мультфильма</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-1 block">Название</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Кот-астронавт"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-1 block">Описание идеи</label>
                  <Textarea
                    value={projectIdea}
                    onChange={(e) => setProjectIdea(e.target.value)}
                    placeholder="Кот по имени Мурзик мечтает полететь на Луну. Однажды он находит старую ракету на свалке..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Стиль анимации</label>
                  <div className="grid grid-cols-4 gap-2">
                    {styles.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`p-3 rounded-xl text-center transition ${
                          style === s.value 
                            ? 'border-2 border-purple-500 bg-purple-500/10' 
                            : 'border-2 border-transparent bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xl mb-1">{s.icon}</div>
                        <div className="text-xs text-white font-medium">{s.label}</div>
                        <div className="text-[10px] text-white/50">{s.desc}</div>
                      </button>
                    ))}
                  </div>
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

                <div>
                  <label className="text-white/80 text-sm mb-1 block">Длительность: {duration} сек</label>
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-blender"
                    checked={useBlender}
                    onChange={(e) => setUseBlender(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="use-blender" className="text-white/80 text-sm">
                    Использовать Blender (3D сцены)
                  </label>
                </div>

                <Button
                  onClick={generateAll}
                  disabled={isLoading || !projectName || !projectIdea}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-11"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Генерация...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Создать проект</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Pipeline Preview */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl">
                    ▶️
                  </div>
                  <div>
                    <CardTitle className="text-white">Пайплайн</CardTitle>
                    <CardDescription className="text-white/60">Шаги создания мультфильма</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className={`w-11 h-11 rounded-xl ${agent.color} flex items-center justify-center text-xl`}>
                        {agent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{agent.name}</div>
                        <div className={`text-xs truncate ${
                          agent.status === 'done' ? 'text-green-400' :
                          agent.status === 'working' ? 'text-purple-400' : 'text-white/40'
                        }`}>
                          {agent.message}
                        </div>
                        {agent.status !== 'waiting' && (
                          <Progress value={agent.progress} className="h-1 mt-1" />
                        )}
                      </div>
                      {agent.status === 'done' && (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      )}
                      {agent.status === 'working' && (
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                  <div className="mt-4 p-3 bg-black/30 rounded-lg">
                    <div className="text-xs text-white/50 mb-2">Логи процесса:</div>
                    <div className="font-mono text-xs text-green-400 max-h-32 overflow-y-auto">
                      {logs.slice(-10).map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agents Tab */}
        {activeMainTab === 'agents' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-1">ИИ-Агенты студии</h3>
            <p className="text-white/50 mb-6">7 специализированных агентов работают вместе автономно</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_AGENTS.map((agent) => (
                <Card key={agent.id} className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                        {agent.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                          Активен
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/60 text-sm mb-3">{agent.desc}</p>
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-xs text-white/50 mb-2">Возможности:</div>
                      <ul className="text-xs text-white/70 space-y-1">
                        {agent.id === 'producer' && (
                          <>
                            <li>✓ Планирование проекта</li>
                            <li>✓ Создание задач</li>
                            <li>✓ Контроль качества</li>
                            <li>✓ Координация агентов</li>
                          </>
                        )}
                        {agent.id === 'writer' && (
                          <>
                            <li>✓ Написание сценариев</li>
                            <li>✓ Диалоги персонажей</li>
                            <li>✓ Описание сцен</li>
                            <li>✓ Адаптация стиля</li>
                          </>
                        )}
                        {agent.id === 'artist' && (
                          <>
                            <li>✓ Концепт-арты</li>
                            <li>✓ Раскадровки</li>
                            <li>✓ Дизайн персонажей</li>
                            <li>✓ Фоны и окружение</li>
                          </>
                        )}
                        {agent.id === 'animator' && (
                          <>
                            <li>✓ Анимация персонажей</li>
                            <li>✓ Синхронизация губ</li>
                            <li>✓ Движение камеры</li>
                            <li>✓ Спецэффекты</li>
                          </>
                        )}
                        {agent.id === 'voice' && (
                          <>
                            <li>✓ Генерация голосов</li>
                            <li>✓ Фоновая музыка</li>
                            <li>✓ Звуковые эффекты</li>
                            <li>✓ Эмоциональная окраска</li>
                          </>
                        )}
                        {agent.id === 'editor' && (
                          <>
                            <li>✓ Монтаж видео</li>
                            <li>✓ Добавление аудио</li>
                            <li>✓ Субтитры</li>
                            <li>✓ Экспорт</li>
                          </>
                        )}
                        {agent.id === 'blender' && (
                          <>
                            <li>✓ 3D моделирование</li>
                            <li>✓ Настройка освещения</li>
                            <li>✓ Анимация камеры</li>
                            <li>✓ Рендеринг</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeMainTab === 'pipeline' && (
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Пайплайн создания мультфильма</h3>
            <p className="text-white/50 mb-6">От идеи до готового ролика — автоматически</p>
            
            <div className="space-y-4">
              {[
                { step: 1, icon: '💡', title: 'Идея пользователя', desc: 'Пользователь описывает идею мультфильма в свободной форме', agent: '👤 Вы', color: 'from-blue-500 to-blue-600' },
                { step: 2, icon: '🤖', title: 'Продюсер создаёт план', desc: 'Разбиение на сцены, распределение задач между агентами', agent: '🤖 Продюсер', color: 'from-purple-500 to-purple-600' },
                { step: 3, icon: '📝', title: 'Сценарист пишет сценарий', desc: 'Детальный сценарий с диалогами и описаниями сцен', agent: '📝 Сценарист', color: 'from-blue-500 to-blue-600' },
                { step: 4, icon: '🎨', title: 'Художник создаёт раскадровку', desc: 'Генерация изображений для каждой сцены', agent: '🎨 Художник', color: 'from-pink-500 to-pink-600' },
                { step: 5, icon: '🎬', title: 'Аниматор оживляет кадры', desc: 'Превращение статичных изображений в анимацию', agent: '🎬 Аниматор', color: 'from-orange-500 to-orange-600' },
                { step: 6, icon: '🎤', title: 'Озвучка генерирует звук', desc: 'Голоса персонажей, фоновая музыка, эффекты', agent: '🎤 Озвучка', color: 'from-green-500 to-green-600' },
                { step: 7, icon: '✂️', title: 'Монтажёр собирает ролик', desc: 'Финальный монтаж, наложение звука, экспорт', agent: '✂️ Монтажёр', color: 'from-red-500 to-red-600' },
              ].map((item, i) => (
                <div key={item.step}>
                  <Card className="bg-white/5 border-white/10 flex items-center gap-4 p-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium">{item.icon} {item.title}</div>
                      <div className="text-white/50 text-sm">{item.desc}</div>
                    </div>
                    <div className="text-sm text-white/60 flex-shrink-0">{item.agent}</div>
                  </Card>
                  {i < 6 && <div className="text-center text-white/20 text-2xl py-1">↓</div>}
                </div>
              ))}
              
              <Card className="bg-white/5 border-2 border-green-500/50 flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-2xl flex-shrink-0">
                  ✅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium">🎥 Готовый мультфильм!</div>
                  <div className="text-white/50 text-sm">Скачайте результат или отправьте на доработку</div>
                </div>
                <div className="text-sm text-green-400 flex-shrink-0">🎉 Готово</div>
              </Card>
            </div>
          </div>
        )}

        {/* Results Section */}
        {script && activeMainTab === 'demo' && (
          <div className="mt-8 space-y-6">
            <div className="flex gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: Film },
                { id: 'scenes', label: 'Сцены', icon: Image },
                { id: 'characters', label: 'Персонажи', icon: Users },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeResultTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveResultTab(tab.id as any)}
                  className={activeResultTab === tab.id ? 'bg-purple-500' : 'text-white/60'}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeResultTab === 'overview' && (
              <div className="space-y-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{script.title}</CardTitle>
                    <CardDescription className="text-lg text-white/70">{script.logline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {script.synopsis && <p className="text-white/80">{script.synopsis}</p>}

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

                    {script.themes && script.themes.length > 0 && (
                      <div>
                        <div className="text-white/60 text-sm mb-2">Темы</div>
                        <div className="flex flex-wrap gap-2">
                          {script.themes.map((theme, i) => (
                            <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-300">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

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
              </div>
            )}

            {/* Scenes Tab */}
            {activeResultTab === 'scenes' && (
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
                            <img src={scene.image} alt={scene.title} className="w-full h-full object-cover" onError={() => setFallbackImage(i)} />
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              {getTimeOfDayIcon(scene.timeOfDay)}
                              <span>Сцена {scene.number}</span>
                            </div>
                            <button onClick={() => regenerateImage(i)} className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded hover:bg-black/90">
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
                        {scene.dialogue && scene.dialogue.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            {scene.dialogue.slice(0, 3).map((d, di) => (
                              <div key={di} className="text-sm">
                                <span className="text-purple-300 font-medium">{d.character}</span>
                                {d.emotion && <span className="text-purple-400/60 text-xs"> ({d.emotion})</span>}
                                <p className="text-white/70 mt-0.5">"{d.line}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Characters Tab */}
            {activeResultTab === 'characters' && (
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
                              {char.role === 'protagonist' ? 'Герой' : char.role === 'antagonist' ? 'Антагонист' : 'Второстепенный'}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-center pt-4">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                <Download className="w-5 h-5 mr-2" /> Экспортировать проект
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!script && !isLoading && activeMainTab === 'demo' && (
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardContent className="py-12">
              <div className="text-center text-white/40">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white/60 mb-2">Готовы создать шедевр?</h3>
                <p>Опишите идею и нажмите "Создать проект"</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-white/40 text-sm">
        AI Animation Studio © 2024 — Мультиагентная анимационная студия
      </footer>
    </div>
  );
}
