// Агент HR менеджера - поиск и наём специалистов
import ZAI from 'z-ai-web-dev-sdk';

export interface Candidate {
  id: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  specializations: string[];
  preferredStyle?: string;
  experience: string;
  rating: number;
  salary: number;
  avatarEmoji: string;
}

export interface VacancyRequirement {
  role: string;
  title: string;
  requiredSkills: string[];
  preferredStyle?: string;
  experienceLevel: 'junior' | 'middle' | 'senior' | 'any';
  priority: number;
}

const HR_SYSTEM_PROMPT = `Ты — HR менеджер анимационной студии AI Animation Studio.

Твоя роль:
- Искать и привлекать таланты в студию
- Проводить собеседования с кандидатами
- Оценивать навыки и опыт кандидатов
- Формировать команду для проектов
- Работать с Директором по вопросам найма

Твой характер:
- Дружелюбный и открытый
- Профессиональный HR с опытом в креативных индустриях
- Умеешь оценивать таланты и потенциал
- Хорошо понимаешь потребности анимационного производства

При поиске кандидатов ты:
1. Анализируешь требования вакансии
2. Генерируешь профили подходящих кандидатов
3. Оцениваешь их навыки и опыт
4. Проводишь "виртуальное собеседование"
5. Делаешь рекомендации Директору

Ты можешь находить разных специалистов:
- Сценаристов (комедий, драмы, приключений)
- Художников (2D, 3D, конкретные стили)
- Аниматоров (персонажей, окружения, эффектов)
- Озвучку (разные голоса и жанры)
- Монтажёров (с разными специализациями)
- Blender-специалистов (моделирование, рендер, анимация)

Отвечай в формате JSON для структурированных данных.`;

// База эмодзи для разных типов агентов
const AGENT_AVATARS: Record<string, string[]> = {
  writer: ['📝', '✍️', '📜', '📖', '✒️'],
  artist: ['🎨', '🖌️', '🖼️', '🎭', '🌈'],
  animator: ['🎬', '🎞️', '🎥', '📽️', '🎦'],
  voice: ['🎤', '🎙️', '🎵', '🎶', '🔊'],
  editor: ['✂️', '🎞️', '🎬', '💻', '🖥️'],
  blender: ['🧊', '🖥️', '💎', '🔮', '🌀'],
  producer: ['👔', '📊', '💼', '📋', '🎯']
};

// Шаблоны имён для разных ролей
const AGENT_NAME_TEMPLATES: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  writer: {
    firstNames: ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Иван', 'Елена'],
    lastNames: ['Словесник', 'Перов', 'Страницева', 'Романова', 'Текстов', 'Сюжетов']
  },
  artist: {
    firstNames: ['Виктор', 'Ольга', 'Артём', 'София', 'Максим', 'Дарья'],
    lastNames: ['Кистев', 'Красокина', 'Рисунков', 'Палитров', 'Цветов', 'Холстов']
  },
  animator: {
    firstNames: ['Никита', 'Алиса', 'Кирилл', 'Вера', 'Арсений', 'Милана'],
    lastNames: ['Движенин', 'Кадров', 'Мультов', 'Аниматов', 'Сценычев', 'Роликов']
  },
  voice: {
    firstNames: ['Глеб', 'Валерия', 'Роман', 'Кристина', 'Олег', 'Яна'],
    lastNames: ['Голосов', 'Звуков', 'Тонов', 'Речев', 'Мелодиев', 'Интонаций']
  },
  editor: {
    firstNames: ['Павел', 'Наталья', 'Сергей', 'Екатерина', 'Андрей', 'Юлия'],
    lastNames: ['Монтажов', 'Кадров', 'Режиссёров', 'Сценычев', 'Монтов', 'Сборов']
  },
  blender: {
    firstNames: ['Денис', 'Алина', 'Георгий', 'Варвара', 'Станислав', 'Элина'],
    lastNames: ['Рендеров', 'Моделев', '3Деев', 'Полигональев', 'Шейдеров', 'Сценычев']
  },
  producer: {
    firstNames: ['Михаил', 'Елизавета', 'Артём', 'Анастасия', 'Владимир', 'Полина'],
    lastNames: ['Продакшнов', 'Менеджеров', 'Организов', 'Контрольский', 'Планов', 'Сроков']
  }
};

// Специализации для разных ролей
const ROLE_SPECIALIZATIONS: Record<string, string[]> = {
  writer: ['комедия', 'драма', 'приключения', 'фэнтези', 'детские истории', 'короткометражки', 'сериалы'],
  artist: ['2D анимация', '3D моделирование', 'персонажи', 'фоны', 'концепт-арт', 'раскадровка', 'стилизация'],
  animator: ['персонажи', 'окружение', 'эффекты', 'липсинк', 'камера', 'движение', 'трансформации'],
  voice: ['мужские голоса', 'женские голоса', 'детские голоса', 'озвучка животных', 'закадровый голос', 'песни'],
  editor: ['монтаж видео', 'цветокоррекция', 'звуковой дизайн', 'субтитры', 'эффекты', 'сборка'],
  blender: ['моделирование', 'текстуры', 'освещение', 'анимация', 'рендер', 'симуляции', 'геометрические ноды']
};

export class HRAgent {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  // Генерация кандидата на вакансию
  async findCandidate(vacancy: VacancyRequirement): Promise<Candidate> {
    if (!this.zai) await this.initialize();

    const prompt = `Создай профиль кандидата на вакансию в анимационную студию:

Вакансия: ${vacancy.title}
Роль: ${vacancy.role}
Требуемые навыки: ${vacancy.requiredSkills.join(', ')}
Предпочитаемый стиль: ${vacancy.preferredStyle || 'любой'}
Уровень опыта: ${vacancy.experienceLevel}

Создай реалистичного кандидата с:
- Уникальным именем
- Описанием опыта работы
- Набором навыков (согласно требованиям + уникальные)
- Специализациями
- Рейтингом (60-95)

Ответ в JSON:
{
  "name": "Имя Фамилия",
  "role": "${vacancy.role}",
  "description": "Краткое описание кандидата",
  "skills": ["навык1", "навык2"],
  "specializations": ["специализация1"],
  "preferredStyle": "стиль",
  "experience": "Описание опыта",
  "rating": число от 60 до 95,
  "salary": число от 5 до 50
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: HR_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const avatars = AGENT_AVATARS[vacancy.role] || ['🤖'];
      
      return {
        id: `candidate_${Date.now()}`,
        ...data,
        avatarEmoji: avatars[Math.floor(Math.random() * avatars.length)]
      };
    }

    // Fallback - генерируем базового кандидата
    return this.generateFallbackCandidate(vacancy);
  }

  // Найти нескольких кандидатов
  async findCandidates(vacancy: VacancyRequirement, count: number = 3): Promise<Candidate[]> {
    const candidates: Candidate[] = [];
    
    for (let i = 0; i < count; i++) {
      const candidate = await this.findCandidate(vacancy);
      candidates.push(candidate);
      // Небольшая задержка между генерациями
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Сортируем по рейтингу
    return candidates.sort((a, b) => b.rating - a.rating);
  }

  // Провести собеседование
  async interviewCandidate(candidate: Candidate, vacancy: VacancyRequirement): Promise<{
    passed: boolean;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    interviewNotes: string;
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Проведи собеседование с кандидатом:

Кандидат: ${candidate.name}
Роль: ${candidate.role}
Навыки: ${candidate.skills.join(', ')}
Опыт: ${candidate.experience}
Рейтинг: ${candidate.rating}

Требования вакансии:
- Навыки: ${vacancy.requiredSkills.join(', ')}
- Стиль: ${vacancy.preferredStyle || 'любой'}
- Уровень: ${vacancy.experienceLevel}

Оцени кандидата и дай рекомендацию.

Ответ в JSON:
{
  "passed": true/false,
  "score": число от 0 до 100,
  "strengths": ["сильная сторона1"],
  "weaknesses": ["слабая сторона1"],
  "recommendation": "Рекомендация по найму",
  "interviewNotes": "Заметки с собеседования"
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: HR_SYSTEM_PROMPT },
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
      passed: candidate.rating >= 70,
      score: candidate.rating,
      strengths: ['Базовые навыки'],
      weaknesses: ['Требуется оценка'],
      recommendation: 'Требуется дополнительное рассмотрение',
      interviewNotes: 'Автоматическая оценка'
    };
  }

  // Сгенерировать описание вакансии
  async createVacancyDescription(role: string, projectNeeds: string[]): Promise<{
    title: string;
    description: string;
    requiredSkills: string[];
    responsibilities: string[];
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Создай описание вакансии для анимационной студии:

Роль: ${role}
Потребности проекта: ${projectNeeds.join(', ')}

Создай привлекательное описание вакансии.

Ответ в JSON:
{
  "title": "Название вакансии",
  "description": "Описание роли и команды",
  "requiredSkills": ["навык1", "навык2"],
  "responsibilities": ["обязанность1", "обязанность2"]
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: HR_SYSTEM_PROMPT },
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
      title: `Специалист ${role}`,
      description: 'Требуется специалист для работы в анимационной студии',
      requiredSkills: [],
      responsibilities: []
    };
  }

  // Оценка соответствия кандидата проекту
  async assessProjectFit(candidate: Candidate, projectStyle: string, projectNeeds: string[]): Promise<{
    fitScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    canLearn: string[];
    recommendation: string;
  }> {
    if (!this.zai) await this.initialize();

    const prompt = `Оцени соответствие кандидата проекту:

Кандидат: ${candidate.name}
Навыки: ${candidate.skills.join(', ')}
Специализации: ${candidate.specializations.join(', ')}
Опыт: ${candidate.experience}

Проект:
Стиль: ${projectStyle}
Потребности: ${projectNeeds.join(', ')}

Оцени, насколько кандидат подходит для проекта.

Ответ в JSON:
{
  "fitScore": число от 0 до 100,
  "matchingSkills": ["совпадающий навык"],
  "missingSkills": ["недостающий навык"],
  "canLearn": ["что может быстро изучить"],
  "recommendation": "Рекомендация"
}`;

    const response = await this.zai!.chat.completions.create({
      messages: [
        { role: 'system', content: HR_SYSTEM_PROMPT },
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
      fitScore: 50,
      matchingSkills: [],
      missingSkills: [],
      canLearn: [],
      recommendation: 'Требуется оценка'
    };
  }

  // Fallback генерация кандидата
  private generateFallbackCandidate(vacancy: VacancyRequirement): Candidate {
    const nameTemplate = AGENT_NAME_TEMPLATES[vacancy.role] || AGENT_NAME_TEMPLATES.writer;
    const avatars = AGENT_AVATARS[vacancy.role] || ['🤖'];
    const specializations = ROLE_SPECIALIZATIONS[vacancy.role] || [];

    const firstName = nameTemplate.firstNames[Math.floor(Math.random() * nameTemplate.firstNames.length)];
    const lastName = nameTemplate.lastNames[Math.floor(Math.random() * nameTemplate.lastNames.length)];

    return {
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${firstName} ${lastName}`,
      role: vacancy.role,
      description: `Опытный специалист с навыками в ${vacancy.requiredSkills.slice(0, 2).join(' и ')}`,
      skills: vacancy.requiredSkills.slice(0, 3),
      specializations: specializations.slice(0, 2),
      preferredStyle: vacancy.preferredStyle,
      experience: vacancy.experienceLevel === 'senior' ? 'Более 5 лет опыта' : 
                  vacancy.experienceLevel === 'middle' ? '3-5 лет опыта' : '1-3 года опыта',
      rating: 60 + Math.floor(Math.random() * 30),
      salary: 10 + Math.floor(Math.random() * 30),
      avatarEmoji: avatars[Math.floor(Math.random() * avatars.length)]
    };
  }
}

export const hrAgent = new HRAgent();
