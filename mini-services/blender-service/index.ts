// Blender Service - WebSocket сервер для связи с домашним компьютером
import { serve } from 'bun';

const PORT = 3030;

// Хранилище подключений
const connections = new Map<string, WebSocket>();

// Обработка WebSocket соединений
const server = serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    
    if (url.pathname === '/ws') {
      const success = server.upgrade(req, {
        data: { id: crypto.randomUUID() }
      });
      
      if (success) {
        return undefined; // WebSocket connection
      }
      
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        connections: connections.size 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Blender Service', { status: 200 });
  },
  websocket: {
    open(ws) {
      const id = (ws.data as { id: string }).id;
      connections.set(id, ws);
      console.log(`[Blender Service] Client connected: ${id}`);
      
      // Отправляем подтверждение
      ws.send(JSON.stringify({
        type: 'connected',
        id,
        message: 'Connected to Blender Service'
      }));
    },
    
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString());
        console.log('[Blender Service] Received:', data.type);
        
        // Обработка разных типов сообщений
        switch (data.type) {
          case 'execute_script':
            // Отправляем скрипт на выполнение
            handleScriptExecution(ws, data);
            break;
            
          case 'render_frame':
            // Запуск рендера кадра
            handleRenderFrame(ws, data);
            break;
            
          case 'get_scene_info':
            // Получение информации о сцене
            handleGetSceneInfo(ws, data);
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: `Unknown message type: ${data.type}`
            }));
        }
      } catch (error) {
        console.error('[Blender Service] Error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON message'
        }));
      }
    },
    
    close(ws) {
      const id = (ws.data as { id: string }).id;
      connections.delete(id);
      console.log(`[Blender Service] Client disconnected: ${id}`);
    }
  }
});

// Обработчики
async function handleScriptExecution(ws: WebSocket, data: { script: string; action?: string }) {
  console.log('[Blender Service] Executing script...');
  
  // В реальной реализации здесь будет отправка на домашний компьютер
  // через HTTP запрос или другое WebSocket соединение
  
  ws.send(JSON.stringify({
    type: 'script_result',
    status: 'executing',
    action: data.action,
    message: 'Script sent to Blender host'
  }));
}

async function handleRenderFrame(ws: WebSocket, data: { frame: number; outputPath?: string }) {
  console.log(`[Blender Service] Rendering frame ${data.frame}...`);
  
  ws.send(JSON.stringify({
    type: 'render_started',
    frame: data.frame,
    message: 'Render started on Blender host'
  }));
}

async function handleGetSceneInfo(ws: WebSocket, data: { sceneName?: string }) {
  console.log('[Blender Service] Getting scene info...');
  
  ws.send(JSON.stringify({
    type: 'scene_info',
    message: 'Scene info request sent to Blender host'
  }));
}

console.log(`🎨 Blender Service running on port ${PORT}`);
console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
console.log(`Health check: http://localhost:${PORT}/health`);
