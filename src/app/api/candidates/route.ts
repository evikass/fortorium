import { NextRequest, NextResponse } from 'next/server';

// База эмодзи для разных типов агентов
const AGENT_AVATARS: Record<string, string[]> = {
  writer: ['📝', '✍️', '📜', '📖', '✒️'],
  artist: ['🎨', '🖌️', '🖼️', '🎭', '🌈'],
  animator: ['🎬', '🎞️', '🎥', '📽️', '🎦'],
  voice: ['🎤', '🎙️', '🎵', '🎶', '🔊'],
  editor: ['✂️', '🎞️', '🎬', '💻', '🖥️'],
  blender: ['🧊', '🖥️', '💎', '🔮', '🌀']
};

// Шаблоны имён
const AGENT_NAMES: Record<string, { first: string[]; last: string[] }> = {
  writer: { first: ['Александр', 'Мария', 'Дмитрий', 'Анна', 'Иван'], last: ['Словесник', 'Перов', 'Страницева', 'Романова', 'Текстов'] },
  artist: { first: ['Виктор', 'Ольга', 'Артём', 'София', 'Максим'], last: ['Кистев', 'Красокина', 'Рисунков', 'Палитров', 'Цветов'] },
  animator: { first: ['Никита', 'Алиса', 'Кирилл', 'Вера', 'Арсений'], last: ['Движенин', 'Кадров', 'Мультов', 'Аниматов', 'Роликов'] },
  voice: { first: ['Глеб', 'Валерия', 'Роман', 'Кристина', 'Олег'], last: ['Голосов', 'Звуков', 'Тонов', 'Речев', 'Мелодиев'] },
  editor: { first: ['Павел', 'Наталья', 'Сергей', 'Екатерина', 'Андрей'], last: ['Монтажов', 'Кадров', 'Режиссёров', 'Сборов', 'Сценычев'] },
  blender: { first: ['Денис', 'Алина', 'Георгий', 'Варвара', 'Станислав'], last: ['Рендеров', 'Моделев', '3Деев', 'Полигональев', 'Шейдеров'] }
};

const ROLE_SKILLS: Record<string, string[]> = {
  writer: ['сюжет', 'диалоги', 'персонажи', 'драматургия', 'юмор', 'структура'],
  artist: ['рисование', 'композиция', 'цвет', 'персонажи', 'фоны', 'стилизация'],
  animator: ['движение', 'тайминг', 'сцены', 'эффекты', 'липсинк', 'камера'],
  voice: ['голос', 'эмоции', 'персонажи', 'интонация', 'диалоги', 'акценты'],
  editor: ['монтаж', 'звук', 'эффекты', 'цветокоррекция', 'сборка', 'переходы'],
  blender: ['моделирование', 'текстуры', 'освещение', 'рендер', 'анимация', 'ноды']
};

const ROLE_SPECS: Record<string, string[]> = {
  writer: ['комедия', 'драма', 'приключения', 'фэнтези', 'детские'],
  artist: ['2D', '3D', 'персонажи', 'фоны', 'концепт-арт'],
  animator: ['персонажи', 'эффекты', 'окружение', 'липсинк'],
  voice: ['мужской голос', 'женский голос', 'детский', 'закадровый'],
  editor: ['монтаж', 'цветокоррекция', 'звук', 'эффекты'],
  blender: ['моделирование', 'текстуры', 'освещение', 'рендер']
};

function generateCandidate(role: string) {
  const names = AGENT_NAMES[role] || AGENT_NAMES.writer;
  const avatars = AGENT_AVATARS[role] || ['🤖'];
  const skills = ROLE_SKILLS[role] || [];
  const specs = ROLE_SPECS[role] || [];

  const firstName = names.first[Math.floor(Math.random() * names.first.length)];
  const lastName = names.last[Math.floor(Math.random() * names.last.length)];

  return {
    id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${firstName} ${lastName}`,
    role,
    avatarEmoji: avatars[Math.floor(Math.random() * avatars.length)],
    skills: skills.sort(() => Math.random() - 0.5).slice(0, 3),
    specializations: specs.sort(() => Math.random() - 0.5).slice(0, 2),
    rating: 65 + Math.floor(Math.random() * 25),
    salary: 10 + Math.floor(Math.random() * 30),
    experience: ['2 года опыта', '3 года опыта', '5 лет опыта', '7 лет опыта'][Math.floor(Math.random() * 4)],
    description: [
      'Талантливый специалист с отличным портфолио',
      'Опытный профессионал с нестандартным подходом',
      'Креативный специалист с хорошими рекомендациями',
      'Универсальный профессионал с разносторонним опытом'
    ][Math.floor(Math.random() * 4)],
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

// GET - получить кандидатов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const count = parseInt(searchParams.get('count') || '5');
    
    // Генерируем кандидатов
    const roles = role ? [role] : ['writer', 'artist', 'animator', 'voice', 'editor', 'blender'];
    const candidates = [];
    
    for (let i = 0; i < count; i++) {
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      candidates.push(generateCandidate(randomRole));
    }
    
    return NextResponse.json({
      success: true,
      candidates,
      message: `HR нашёл ${candidates.length} кандидатов`
    });
  } catch (error) {
    console.error('Candidates error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST - утвердить или отклонить
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, candidate } = body;

    if (action === 'approve' && candidate) {
      // Создаём нанятого агента
      const hiredAgent = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: candidate.name,
        role: candidate.role,
        description: candidate.description,
        avatarEmoji: candidate.avatarEmoji || AGENT_AVATARS[candidate.role]?.[0] || '🤖',
        skills: candidate.skills || [],
        specializations: candidate.specializations || [],
        status: 'idle',
        mood: 80 + Math.floor(Math.random() * 20),
        energy: 90 + Math.floor(Math.random() * 10),
        level: 1,
        salary: candidate.salary || 15,
        quality: 50 + Math.floor(Math.random() * 30),
        speed: 50 + Math.floor(Math.random() * 30),
        hiredAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: `✅ ${candidate.name} принят в команду!`,
        agent: hiredAgent
      });
    }

    if (action === 'reject') {
      // Генерируем нового кандидата на замену
      const roles = ['writer', 'artist', 'animator', 'voice', 'editor', 'blender'];
      const newCandidate = generateCandidate(roles[Math.floor(Math.random() * roles.length)]);

      return NextResponse.json({
        success: true,
        message: `❌ Кандидат отклонён`,
        newCandidate
      });
    }

    if (action === 'generate') {
      // Сгенерировать новых кандидатов
      const { roles, count = 5 } = body;
      const roleList = roles || ['writer', 'artist', 'animator', 'voice', 'editor', 'blender'];
      const newCandidates = [];
      
      for (let i = 0; i < count; i++) {
        const role = roleList[Math.floor(Math.random() * roleList.length)];
        newCandidates.push(generateCandidate(role));
      }
      
      return NextResponse.json({
        success: true,
        candidates: newCandidates,
        message: `HR нашёл ${newCandidates.length} новых кандидатов`
      });
    }

    return NextResponse.json({ success: false, error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    console.error('Candidates action error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
