import { NextRequest, NextResponse } from 'next/server';

// In-memory хранилище (для serverless функций)
// В продакшене используйте Vercel KV, Upstash или PostgreSQL
declare global {
  var fortoriumStorage: {
    hiredAgents: Map<string, any>;
    candidates: Map<string, any>;
    projects: Map<string, any>;
    director: any;
  };
}

// Инициализация глобального хранилища
if (!globalThis.fortoriumStorage) {
  globalThis.fortoriumStorage = {
    hiredAgents: new Map(),
    candidates: new Map(),
    projects: new Map(),
    director: {
      name: 'Директор ФОРТОРИУМ',
      status: 'active',
      budget: 10000,
      reputation: 50
    }
  };
}

const storage = globalThis.fortoriumStorage;

// Роли и их приоритеты для найма
const ROLE_PRIORITIES: Record<string, { priority: number; reason: string }> = {
  writer: { priority: 1, reason: 'Сценарист нужен для создания сюжетов и диалогов' },
  artist: { priority: 2, reason: 'Художник создаёт визуальный стиль и раскадровки' },
  animator: { priority: 3, reason: 'Аниматор оживляет персонажей и сцены' },
  voice: { priority: 4, reason: 'Озвучка придаёт голос персонажам' },
  editor: { priority: 5, reason: 'Монтажёр собирает финальный ролик' },
  blender: { priority: 6, reason: '3D специалист для Blender-сцен' }
};

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    writer: 'Сценарист',
    artist: 'Художник',
    animator: 'Аниматор',
    voice: 'Озвучка',
    editor: 'Монтажёр',
    blender: 'Blender 3D'
  };
  return names[role] || role;
}

// Генерация решения директора
function generateDirectorDecision() {
  const hiredAgents = Array.from(storage.hiredAgents.values());
  const candidates = Array.from(storage.candidates.values()).filter(c => c.status === 'pending');
  const projects = Array.from(storage.projects.values());
  
  const decisions: string[] = [];
  const recommendations: string[] = [];
  
  const agentRoles = hiredAgents.map(a => a.role);
  const teamSize = hiredAgents.length;
  
  const missingRoles: string[] = [];
  for (const [role] of Object.entries(ROLE_PRIORITIES)) {
    if (!agentRoles.includes(role)) {
      missingRoles.push(role);
    }
  }
  
  if (teamSize === 0) {
    decisions.push('🎯 Студия пуста! Нужно нанять первых специалистов.');
    recommendations.push('Рекомендую начать со Сценариста и Художника.');
  } else if (missingRoles.length > 0) {
    const topMissing = missingRoles
      .sort((a, b) => ROLE_PRIORITIES[a].priority - ROLE_PRIORITIES[b].priority)[0];
    decisions.push(`⚠️ В команде не хватает: ${missingRoles.map(r => getRoleName(r)).join(', ')}.`);
    recommendations.push(`Приоритет: нанять ${getRoleName(topMissing)}. ${ROLE_PRIORITIES[topMissing].reason}`);
  } else {
    decisions.push('✅ Команда укомплектована по всем ключевым ролям.');
  }
  
  if (candidates.length > 0) {
    const topCandidate = candidates.sort((a, b) => b.rating - a.rating)[0];
    decisions.push(`📋 На рассмотрении ${candidates.length} кандидатов.`);
    recommendations.push(`Топ-кандидат: ${topCandidate.name} (${getRoleName(topCandidate.role)}) с рейтингом ${topCandidate.rating}.`);
  }
  
  if (projects.length === 0) {
    decisions.push('📽️ Нет активных проектов. Создайте первый проект!');
  } else {
    const activeProjects = projects.filter(p => p.status !== 'completed');
    decisions.push(`🎬 Активных проектов: ${activeProjects.length}.`);
  }
  
  if (teamSize > 0) {
    const avgMood = Math.round(hiredAgents.reduce((sum, a) => sum + (a.mood || 80), 0) / teamSize);
    const avgEnergy = Math.round(hiredAgents.reduce((sum, a) => sum + (a.energy || 100), 0) / teamSize);
    
    if (avgMood < 50) {
      decisions.push(`😔 Среднее настроение команды: ${avgMood}%. Нужно дать отдых или интересные задачи.`);
    } else if (avgMood >= 80) {
      decisions.push(`😊 Команда в отличном настроении: ${avgMood}%.`);
    }
    
    if (avgEnergy < 50) {
      decisions.push(`🔋 Энергия команды на исходе: ${avgEnergy}%. Рекомендую перерыв.`);
    }
  }
  
  return {
    status: teamSize > 0 ? 'active' : 'hiring',
    decisions,
    recommendations,
    teamAnalysis: {
      totalAgents: teamSize,
      missingRoles: missingRoles.map(r => ({ role: r, name: getRoleName(r) })),
      pendingApprovals: candidates.length
    },
    nextAction: missingRoles.length > 0 
      ? `hire_${missingRoles[0]}` 
      : candidates.length > 0 
        ? 'review_candidates' 
        : 'create_project'
  };
}

// GET - получить статус и решения директора
export async function GET() {
  try {
    const analysis = generateDirectorDecision();
    
    const report = `📊 **Отчёт Директора ФОРТОРИУМ**

${analysis.decisions.join('\n')}

💡 **Рекомендации:**
${analysis.recommendations.map(r => '• ' + r).join('\n')}

🎮 **Следующий шаг:** ${analysis.nextAction === 'review_candidates' ? 'Рассмотреть кандидатов на утверждение' : analysis.nextAction.startsWith('hire_') ? `Нанять ${getRoleName(analysis.nextAction.replace('hire_', ''))}` : 'Создать новый проект'}`;
    
    return NextResponse.json({
      success: true,
      report,
      analysis,
      director: storage.director,
      hiredAgents: Array.from(storage.hiredAgents.values()),
      candidates: Array.from(storage.candidates.values()).filter(c => c.status === 'pending')
    });
  } catch (error) {
    console.error('Director error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST - директор выполняет действие
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'analyze_project': {
        const { title, description, style } = data;
        
        const teamRecommendation = [
          { role: 'writer', reason: 'Напишет сценарий по вашей идее', priority: 1 },
          { role: 'artist', reason: 'Создаст раскадровку и визуальный стиль', priority: 2 },
          { role: 'animator', reason: 'Оживит сцены', priority: 3 },
          { role: 'voice', reason: 'Озвучит персонажей', priority: 4 },
          { role: 'editor', reason: 'Соберёт финальный ролик', priority: 5 }
        ];
        
        return NextResponse.json({
          success: true,
          message: `Проект "${title}" проанализирован. Рекомендуемая команда:`,
          teamRecommendation,
          estimatedTime: '2-4 недели для короткометражки'
        });
      }
      
      case 'team_meeting': {
        const agents = Array.from(storage.hiredAgents.values());
        
        if (agents.length === 0) {
          return NextResponse.json({
            success: true,
            message: '👥 Собрание не проведено - команда пуста. Нанмите первых специалистов!',
            attendees: []
          });
        }
        
        const meetingReport = agents.map(a => ({
          name: a.name,
          role: getRoleName(a.role),
          status: a.status,
          mood: a.mood,
          energy: a.energy,
          message: a.status === 'working' 
            ? 'Работаю над задачей' 
            : a.status === 'tired' 
              ? 'Нужен отдых' 
              : 'Готов к работе'
        }));
        
        return NextResponse.json({
          success: true,
          message: `👥 Собрание проведено! Присутствовало: ${agents.length} человек.`,
          attendees: meetingReport
        });
      }
      
      case 'sync_state': {
        // Синхронизация состояния с клиентом
        if (data.hiredAgents) {
          storage.hiredAgents.clear();
          data.hiredAgents.forEach((agent: any) => {
            storage.hiredAgents.set(agent.id, agent);
          });
        }
        if (data.candidates) {
          storage.candidates.clear();
          data.candidates.forEach((candidate: any) => {
            storage.candidates.set(candidate.id, candidate);
          });
        }
        if (data.projects) {
          storage.projects.clear();
          data.projects.forEach((project: any) => {
            storage.projects.set(project.id, project);
          });
        }
        
        return NextResponse.json({
          success: true,
          message: 'Состояние синхронизировано'
        });
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Неизвестное действие' }, { status: 400 });
    }
  } catch (error) {
    console.error('Director action error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
