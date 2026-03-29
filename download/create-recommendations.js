const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

// Color palette: "Midnight Code" for tech/AI theme
const colors = {
  primary: "#020617",      // Midnight Black - titles
  body: "#1E293B",         // Deep Slate Blue - body text
  secondary: "#64748B",    // Cool Blue-Gray - subtitles
  accent: "#94A3B8",       // Steady Silver - UI/decor
  tableBg: "#F8FAFC",      // Glacial Blue-White
  tableBorder: "#CBD5E1"
};

const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: colors.tableBorder };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-1",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-2",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-3",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-4",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "ФОРТОРИУМ — Рекомендации по деплою", color: colors.secondary, size: 20 })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Страница ", color: colors.secondary, size: 20 }), 
          new TextRun({ children: [PageNumber.CURRENT], color: colors.secondary, size: 20 }), 
          new TextRun({ text: " из ", color: colors.secondary, size: 20 }), 
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: colors.secondary, size: 20 })
        ]
      })] })
    },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Рекомендации по предотвращению проблем кэширования Vercel")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "На основе анализа проекта ФОРТОРИУМ и best practices Next.js", color: colors.secondary, size: 22 })] }),

      // Section 1
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Введение в проблему")] }),
      
      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "В ходе разработки проекта ФОРТОРИУМ мы столкнулись с серьёзной проблемой: Vercel CDN кэшировал старые JavaScript-бандлы и продолжал отдавать их пользователям даже после многократных деплоев новой версии кода. Это приводило к тому, что Production URL отображал устаревший код с ошибками, в то время как Preview URL работал корректно. Данная проблема характерна для проектов с частыми обновлениями и может существенно замедлить процесс разработки и доставки функций конечным пользователям.", color: colors.body })] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Корень проблемы заключается в агрессивной стратегии кэширования Vercel, которая оптимизирована для производительности, но может создавать сложности при обновлении статических ресурсов. Браузеры пользователей также кэшируют ресурсы, что усугубляет ситуацию. Для решения этих проблем необходимо внедрить комплексный подход, включающий правильную конфигурацию Next.js, управление версиями и стратегии инвалидации кэша.", color: colors.body })] }),

      // Section 2
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Корневые причины проблемы кэширования")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Архитектура кэширования Vercel")] }),
      
      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Vercel использует многоуровневую систему кэширования, которая включает Edge Network CDN, региональные кэши и браузерный кэш. Каждый уровень независимо принимает решения о свежести контента на основе HTTP-заголовков Cache-Control и ETag. Когда деплой проходит успешно, Vercel обновляет контент в своём origen хранилище, но CDN-ноды по всему миру могут продолжать отдавать старые версии до истечения TTL (Time To Live) или принудительной инвалидации.", color: colors.body })] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Статические ресурсы (JavaScript, CSS, изображения) получают хэш-суффиксы в именах файлов, что теоретически должно гарантировать автоматическое обновление при изменении контента. Однако проблема возникает, когда изменяется логика загрузки этих ресурсов или когда старые точки входа продолжают запрашиваться из кэша. В нашем случае старые бандлы содержали код с несуществующими API endpoints, что приводило к ошибкам при загрузке приложения.", color: colors.body })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Факторы, усугубляющие проблему")] }),

      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Частые деплои: при быстрой итеративной разработке CDN не успевает синхронизироваться между регионами", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Отсутствие явного управления версиями: нет механизма принудительного обновления клиентского кода", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "localStorage с устаревшими данными: старые версии данных в локальном хранилище конфликтуют с новым кодом", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "Зависимость от внешних SDK: z-ai-web-dev-sdk требовал конфигурационный файл, отсутствующий на Vercel", color: colors.body })] }),

      // Section 3
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Рекомендуемые решения")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Конфигурация next.config.ts для контроля кэширования")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Правильная конфигурация Next.js является первым и наиболее важным шагом в борьбе с проблемами кэширования. Необходимо явно определить заголовки Cache-Control для различных типов ресурсов и настроить генерацию уникальных имён бандлов. Рекомендуется использовать следующие настройки в файле next.config.ts:", color: colors.body })] }),

      // Code block as table
      new Table({
        columnWidths: [9360],
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, left: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, right: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" } },
                shading: { fill: "1F2937", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun({ text: "// next.config.ts", color: "9CA3AF", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "const nextConfig = {", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  generateBuildId: async () => {", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    return Date.now().toString()", color: "A9FFE4", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  },", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  headers: async () => [{", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    source: '/:path*',", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    headers: [{ key: 'Cache-Control',", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "      value: 'public, max-age=0, must-revalidate' }]", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  }], output: 'standalone'", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "}", color: "E5E7EB", font: "Consolas", size: 20 })] })
                ]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Параметр generateBuildId создаёт уникальный идентификатор сборки на основе текущего времени, что гарантирует генерацию новых имён для chunk-файлов при каждом деплое. Заголовок Cache-Control со значением max-age=0, must-revalidate указывает CDN и браузерам всегда проверять актуальность ресурса перед использованием кэшированной версии.", color: colors.body })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Версионирование API и клиента")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Для обеспечения совместимости между клиентом и сервером рекомендуется внедрить механизм версионирования. Это позволяет gracefully обрабатывать ситуации, когда пользователь загружает страницу с устаревшим JavaScript-кодом. Версия клиента должна передаваться в каждом запросе к API, а сервер должен возвращать понятное сообщение об ошибке при несовместимости версий.", color: colors.body })] }),

      new Table({
        columnWidths: [9360],
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, left: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" }, right: { style: BorderStyle.SINGLE, size: 1, color: "4B5563" } },
                shading: { fill: "1F2937", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "// lib/version.ts", color: "9CA3AF", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "export const CLIENT_VERSION = process.env.npm_package_version", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "// Проверка версии при загрузке", color: "6B7280", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "export function checkVersion() {", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  const stored = localStorage.getItem('app_version')", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  if (stored && stored !== CLIENT_VERSION) {", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    localStorage.clear()", color: "A9FFE4", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    localStorage.setItem('app_version', CLIENT_VERSION)", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "    window.location.reload()", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "  }", color: "E5E7EB", font: "Consolas", size: 20 })] }),
                  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "}", color: "E5E7EB", font: "Consolas", size: 20 })] })
                ]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 200, after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Данный подход автоматически очищает localStorage при обнаружении несовместимости версий и перезагружает страницу для загрузки актуального кода. Это решает проблему конфликта между старыми данными в локальном хранилище и новой логикой приложения.", color: colors.body })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Работа с переменными окружения")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Одной из ключевых проблем, с которой мы столкнулись, была зависимость от z-ai-web-dev-sdk, требующего конфигурационный файл .z-ai-config, отсутствующий на серверах Vercel. Для решения подобных проблем рекомендуется использовать переменные окружения и прямые HTTP-запросы вместо SDK, которые могут иметь несовместимые зависимости с серверным окружением.", color: colors.body })] }),

      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Рекомендуемый подход для работы с API:", color: colors.body, bold: true })] }),

      new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 },
        children: [new TextRun({ text: "Использовать NEXT_PUBLIC_ префикс для клиентских переменных", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 },
        children: [new TextRun({ text: "Хранить секретные ключи в серверных переменных (без префикса)", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 },
        children: [new TextRun({ text: "Создавать API routes для проксирования запросов к внешним сервисам", color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "Не зависеть от файлов конфигурации, которые могут отсутствовать на продакшене", color: colors.body })] }),

      // Section 4
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Стратегии инвалидации кэша")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Программная инвалидация через API")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Vercel предоставляет API для программной инвалидации кэша, который можно использовать в CI/CD пайплайнах. Это позволяет гарантировать, что после успешного деплоя пользователи получат актуальную версию приложения. Рекомендуется создать скрипт, который будет выполняться после каждого деплоя и очищать кэш для критических маршрутов.", color: colors.body })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Использование Preview URL")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "При разработке и тестировании рекомендуется использовать Preview URL вместо Production URL. Preview URL генерируются для каждого Pull Request и не подвержены длительному кэшированию. Это позволяет быстро проверять изменения и откатываться при обнаружении проблем. Production URL следует обновлять только после тщательного тестирования на Preview URL.", color: colors.body })] }),

      // Section 5
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Чек-лист для предотвращения проблем")] }),

      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Перед каждым деплоем проверяйте следующие пункты:", color: colors.body })] }),

      new Table({
        columnWidths: [600, 8760],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "№", bold: true, color: colors.primary })] })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Проверка", bold: true, color: colors.primary })] })]
              })
            ]
          }),
          ...[
            "Обновлена версия в package.json",
            "Проверена работа на Preview URL",
            "Очищен localStorage в тестовом браузере",
            "Проверены переменные окружения на Vercel",
            "Протестированы все критические API endpoints",
            "Проверена генерация изображений",
            "Протестирована мобильная версия",
            "Проверена работа в разных браузерах"
          ].map((item, idx) => new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), color: colors.body })] })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: item, color: colors.body })] })]
              })
            ]
          }))
        ]
      }),

      // Section 6
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("6. Альтернативные решения")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Смена хостинг-провайдера")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Если проблемы с кэшированием Vercel сохраняются, рассмотрите альтернативные платформы для хостинга Next.js приложений. Netlify предлагает схожий функционал с более предсказуемым поведением кэша. Self-hosted решения на базе Docker контейнеров (например, на AWS, DigitalOcean или Railway) дают полный контроль над кэшированием и деплоем, хотя требуют больших усилий для настройки и поддержки.", color: colors.body })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Использование Service Workers")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Service Workers позволяют реализовать тонкий контроль над кэшированием на уровне браузера. Можно настроить стратегию Network First для HTML-страниц (всегда загружать с сервера) и Cache First для статических ресурсов с проверкой версий. Next.js PWA плагин упрощает интеграцию Service Workers в приложение.", color: colors.body })] }),

      // Section 7
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Заключение")] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Проблемы с кэшированием на Vercel требуют комплексного подхода, включающего правильную конфигурацию Next.js, версионирование клиента и API, грамотную работу с переменными окружения и стратегии инвалидации кэша. Внедрение описанных рекомендаций позволит существенно снизить риск возникновения подобных проблем в будущем и обеспечит более предсказуемый процесс деплоя.", color: colors.body })] }),

      new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.JUSTIFY,
        children: [new TextRun({ text: "Ключевые выводы из нашего опыта: всегда проверяйте работу на Preview URL перед обновлением Production, используйте версионирование для автоматического обновления клиентского кода, избегайте зависимостей от локальных конфигурационных файлов и реализуйте graceful degradation при несовместимости версий. Эти практики сделают процесс разработки более надёжным и предсказуемым.", color: colors.body })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/Vercel_Caching_Recommendations.docx", buffer);
  console.log("Document created: Vercel_Caching_Recommendations.docx");
});
