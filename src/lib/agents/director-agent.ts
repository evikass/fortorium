// Агент-директор - управляет всей студией
import ZAI from 'z-ai-web-dev-sdk';

export interface DirectorDecision {
  type: 'hire_agent' | 'fire_agent' | 'start_project' | 'set_priority' | 'allocate_budget';
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string;
}

export interface StudioStatus {
  activeProjects: number;
  hiredAgents: number;
  budget: number;
  reputation: number;
  pendingTasks: number;
}

const DIRECTOR_SYSTEM_PROMPT = `Ты — Директор анимационной студии AI Animation Studio.

Твоя роль:
- Управлять всей студией и принимать стратегические решения
- Определять приоритеты и распределять ресурсы
- Принимать решения о найме и увольнении агентов
- Контролировать бюджет и репутацию студии
- Взаимодействовать с HR отделом для поиска талантов

Твой характер:
- Профессиональный, но дружелюбный
- Стратегически мыслящий
- Заботишься о команде и качестве работы
- Принимаешь взвешенные решения

При анализе ситуации студии ты:
1. Оцениваешь текущие проекты и их статус
2. Анализируешь команду и её возможности
3. Определяешь узкие места и потребности
4. Принимаешь решения о найме новых специалистов
5. Расставляешь приоритеты

Отвечай в формате JSON для структурированных решений.`;

export class DirectorAgent {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  async analyzeStudioStatus(status: StudioStatus): Promise<{
    assessment: string;
    recommendations: DirectorDecision[];
    urgency: string;
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Проанализируй текущее состояние анимационной студии:

Активные проекты: ${status.activeProjects}
Нанятые агенты: ${status.hiredAgents}
Бюджет: ${status.budget}
Репутация: ${status.reputation}/100
Ожидающие задачи: ${status.pendingTasks}

Дай оценку состояния студии и рекомендации.

Ответ в формате JSON:
{
  "assessment": "Общая оценка состояния студии",
  "recommendations": [
    {
      "type": "hire_agent|fire_agent|start_project|set_priority|allocate_budget",
      "description": "Описание решения",
      "reasoning": "Обоснование",
      "priority": "low|medium|high|critical",
      "estimatedImpact": "Ожидаемое влияние"
    }
  ],
  "urgency": "Уровень срочности действий"
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      assessment: 'Требуется анализ',
      recommendations: [],
      urgency: 'medium'
    };
  }

  async decideHiring(projectNeeds: string[], currentTeam: string[]): Promise<{
    needsHire: boolean;
    requiredRoles: string[];
    priority: string;
    justification: string;
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Проанализируй потребность в найме для проекта:

Требования проекта: ${projectNeeds.join(', ')}
Текущая команда: ${currentTeam.join(', ')}

Определи, нужно ли нанимать новых специалистов.

Ответ в JSON:
{
  "needsHire": true/false,
  "requiredRoles": ["роль1", "роль2"],
  "priority": "low|medium|high",
  "justification": "Обоснование решения"
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      needsHire: false,
      requiredRoles: [],
      priority: 'low',
      justification: 'Не удалось определить'
    };
  }

  async generateDailyReport(projects: any[], agents: any[]): Promise<string> {
    if (!this.zai) await this.initialize();

    const prompt = `Составь ежедневный отчёт студии:

Проекты: ${JSON.stringify(projects)}
Агенты: ${JSON.stringify(agents)}

Напиши краткий профессиональный отчёт с:
1. Статус активных проектов
2. Состояние команды
3. Рекомендации на сегодня`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    return response.choices[0]?.message?.content || 'Отчёт недоступен';
  }

  async reviewHireRequest(candidate: {
    name: string;
    role: string;
    skills: string[];
    experience: string;
    salary: number;
  }): Promise<{
    approved: boolean;
    reasoning: string;
    suggestedSalary?: number;
    conditions?: string[];
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Рассмотри заявку на найм нового сотрудника:

Имя: ${candidate.name}
Роль: ${candidate.role}
Навыки: ${candidate.skills.join(', ')}
Опыт: ${candidate.experience}
Запрашиваемая зарплата: ${candidate.salary}

Прими решение о найме.

Ответ в JSON:
{
  "approved": true/false,
  "reasoning": "Обоснование решения",
  "suggestedSalary": число,
  "conditions": ["условие1", "условие2"]
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      approved: false,
      reasoning: 'Не удалось принять решение'
    };
  }
}

export const directorAgent = new DirectorAgent();
