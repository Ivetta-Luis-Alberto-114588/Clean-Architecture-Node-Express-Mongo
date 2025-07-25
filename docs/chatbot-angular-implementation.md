# 🤖 Implementación de Chatbot en Angular - Guía Completa

## 📋 Resumen

Esta guía te explica paso a paso cómo implementar un chatbot en Angular que se conecte al sistema MCP optimizado del backend.

---

## 🎯 Endpoint Principal para el Chatbot

### **URL del Endpoint**
```
POST http://localhost:3000/api/mcp/anthropic
```

### **Headers Requeridos**
```typescript
{
  'Content-Type': 'application/json',
  'x-session-id': 'tu-session-id-unico'  // IMPORTANTE para tracking
}
```

### **Body de la Request**
```typescript
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Tu pregunta aquí"
    }
  ],
  "tools": [  // OPCIONAL - Solo si quieres usar herramientas específicas
    {
      "name": "get_products",
      "description": "Buscar productos",
      "input_schema": {
        "type": "object",
        "properties": {
          "search": { "type": "string" }
        }
      }
    }
  ]
}
```

---

## 🛠️ Implementación Angular Paso a Paso

### **1. Crear el Servicio del Chatbot**

```typescript
// src/app/core/services/chatbot.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  tools?: any[];
}

export interface AnthropicResponse {
  id: string;
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    name?: string;
    input?: any;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  _guardrails?: {
    sessionId: string;
    processed: boolean;
    timestamp: string;
  };
}

export interface GuardrailsError {
  error: string;
  reason: string;
  message: string;
  suggestions: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly baseUrl = environment.apiUrl + '/api/mcp'; // http://localhost:3000/api/mcp
  private sessionId: string;
  
  // Estado del chat
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.sessionId = this.generateSessionId();
    this.initializeChat();
  }

  // Generar ID de sesión único
  private generateSessionId(): string {
    return `angular-chatbot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Inicializar chat con mensaje de bienvenida
  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual de e-commerce. Puedo ayudarte con información sobre productos, pedidos, clientes y más. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    };
    
    this.messagesSubject.next([welcomeMessage]);
  }

  // Enviar mensaje del usuario
  public sendMessage(userMessage: string): void {
    if (!userMessage.trim()) return;

    const currentMessages = this.messagesSubject.value;
    
    // Agregar mensaje del usuario
    const userChatMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date()
    };

    // Agregar mensaje de loading del asistente
    const loadingMessage: ChatMessage = {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      content: 'Escribiendo...',
      timestamp: new Date(),
      isLoading: true
    };

    this.messagesSubject.next([...currentMessages, userChatMessage, loadingMessage]);
    this.isLoadingSubject.next(true);

    // Preparar request para Claude
    const anthropicRequest: AnthropicRequest = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: this.buildMessageHistory(userMessage)
    };

    // Agregar herramientas si la consulta parece requerir datos específicos
    if (this.shouldUseTools(userMessage)) {
      anthropicRequest.tools = this.getAvailableTools();
    }

    // Enviar a Claude
    this.callAnthropicAPI(anthropicRequest, loadingMessage.id);
  }

  // Construir historial de mensajes para Claude
  private buildMessageHistory(newMessage: string): Array<{role: 'user' | 'assistant'; content: string}> {
    const currentMessages = this.messagesSubject.value;
    
    // Tomar los últimos 10 mensajes para contexto
    const recentMessages = currentMessages
      .filter(msg => !msg.isLoading && !msg.error)
      .slice(-10)
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

    // Agregar nuevo mensaje del usuario
    recentMessages.push({
      role: 'user',
      content: newMessage
    });

    return recentMessages;
  }

  // Determinar si usar herramientas
  private shouldUseTools(message: string): boolean {
    const toolKeywords = ['busca', 'buscar', 'search', 'encuentra', 'muestra', 'lista', 'cuántos', 'cuántas'];
    const lowerMessage = message.toLowerCase();
    return toolKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Obtener herramientas disponibles
  private getAvailableTools(): any[] {
    return [
      {
        name: 'get_products',
        description: 'Buscar productos en el inventario',
        input_schema: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Término de búsqueda' },
            limit: { type: 'number', description: 'Límite de resultados' }
          }
        }
      },
      {
        name: 'search_customers',
        description: 'Buscar clientes por nombre, email o teléfono',
        input_schema: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Término de búsqueda' },
            limit: { type: 'number', description: 'Límite de resultados' }
          }
        }
      }
    ];
  }

  // Llamar a la API de Anthropic
  private callAnthropicAPI(request: AnthropicRequest, loadingMessageId: string): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-session-id': this.sessionId
    });

    this.http.post<AnthropicResponse>(`${this.baseUrl}/anthropic`, request, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error en API:', error);
          
          // Manejar errores de guardarriles
          if (error.status === 400 && error.error?.error === 'Request blocked by guardrails') {
            return of({ 
              isBlocked: true, 
              error: error.error as GuardrailsError 
            });
          }
          
          // Error general
          return of({ 
            isError: true, 
            error: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.' 
          });
        })
      )
      .subscribe((response: any) => {
        this.handleAPIResponse(response, loadingMessageId);
      });
  }

  // Manejar respuesta de la API
  private handleAPIResponse(response: any, loadingMessageId: string): void {
    const currentMessages = this.messagesSubject.value;
    const messageIndex = currentMessages.findIndex(msg => msg.id === loadingMessageId);
    
    if (messageIndex === -1) return;

    let assistantMessage: ChatMessage;

    if (response.isBlocked) {
      // Mensaje bloqueado por guardarriles
      assistantMessage = {
        id: loadingMessageId,
        role: 'assistant',
        content: response.error.message,
        timestamp: new Date(),
        error: true
      };
    } else if (response.isError) {
      // Error general
      assistantMessage = {
        id: loadingMessageId,
        role: 'assistant',
        content: response.error,
        timestamp: new Date(),
        error: true
      };
    } else {
      // Respuesta exitosa
      const content = this.extractContentFromResponse(response);
      assistantMessage = {
        id: loadingMessageId,
        role: 'assistant',
        content: content,
        timestamp: new Date()
      };
    }

    // Actualizar mensaje
    const updatedMessages = [...currentMessages];
    updatedMessages[messageIndex] = assistantMessage;
    
    this.messagesSubject.next(updatedMessages);
    this.isLoadingSubject.next(false);
  }

  // Extraer contenido de la respuesta de Claude
  private extractContentFromResponse(response: AnthropicResponse): string {
    if (!response.content || response.content.length === 0) {
      return 'Lo siento, no pude generar una respuesta.';
    }

    // Combinar contenido de texto
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // Si hay uso de herramientas, agregar información
    const toolUse = response.content.find(item => item.type === 'tool_use');
    if (toolUse) {
      return textContent + '\n\n🔍 Consultando datos específicos...';
    }

    return textContent || 'Respuesta recibida pero sin contenido.';
  }

  // Limpiar chat
  public clearChat(): void {
    this.sessionId = this.generateSessionId();
    this.initializeChat();
  }

  // Obtener ID de sesión actual
  public getCurrentSessionId(): string {
    return this.sessionId;
  }

  // Verificar salud del sistema MCP
  public checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }
}
```

### **2. Crear el Componente del Chatbot**

```typescript
// src/app/features/chatbot/chatbot.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage } from '../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  isLoading = false;
  messageControl = new FormControl('', [Validators.required, Validators.minLength(1)]);
  
  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Suscribirse a mensajes
    this.subscriptions.add(
      this.chatbotService.messages$.subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      })
    );

    // Suscribirse a estado de loading
    this.subscriptions.add(
      this.chatbotService.isLoading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );

    // Verificar salud del sistema
    this.checkSystemHealth();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Enviar mensaje
  onSendMessage(): void {
    if (this.messageControl.valid && !this.isLoading) {
      const message = this.messageControl.value?.trim();
      if (message) {
        this.chatbotService.sendMessage(message);
        this.messageControl.reset();
        this.messageInput.nativeElement.focus();
      }
    }
  }

  // Manejar Enter en el input
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  // Limpiar chat
  onClearChat(): void {
    this.chatbotService.clearChat();
  }

  // Scroll automático
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Verificar salud del sistema
  private checkSystemHealth(): void {
    this.chatbotService.checkHealth().subscribe({
      next: (health) => {
        console.log('Sistema MCP saludable:', health);
      },
      error: (error) => {
        console.error('Sistema MCP no disponible:', error);
      }
    });
  }

  // Formatear timestamp
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Sugerencias rápidas
  onQuickSuggestion(suggestion: string): void {
    this.messageControl.setValue(suggestion);
    this.onSendMessage();
  }

  // Sugerencias predefinidas
  quickSuggestions = [
    '¿Qué productos de lomito tienen?',
    '¿Cómo hago un pedido?',
    'Busca empanadas',
    '¿Cuáles son los precios?'
  ];
}
```

### **3. Template del Componente**

```html
<!-- src/app/features/chatbot/chatbot.component.html -->

<div class="chatbot-container">
  <!-- Header del Chat -->
  <div class="chat-header">
    <div class="header-info">
      <h3>🤖 Asistente Virtual</h3>
      <p class="status" [class.loading]="isLoading">
        {{ isLoading ? 'Escribiendo...' : 'En línea' }}
      </p>
    </div>
    <button class="clear-btn" (click)="onClearChat()" [disabled]="isLoading">
      🗑️ Limpiar
    </button>
  </div>

  <!-- Mensajes -->
  <div class="messages-container" #messagesContainer>
    <div 
      *ngFor="let message of messages; trackBy: trackByMessageId"
      class="message"
      [class.user-message]="message.role === 'user'"
      [class.assistant-message]="message.role === 'assistant'"
      [class.loading-message]="message.isLoading"
      [class.error-message]="message.error"
    >
      <div class="message-content">
        <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
    </div>

    <!-- Indicador de typing -->
    <div *ngIf="isLoading" class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>

  <!-- Sugerencias Rápidas -->
  <div class="quick-suggestions" *ngIf="messages.length <= 1">
    <p>Sugerencias:</p>
    <div class="suggestions-grid">
      <button 
        *ngFor="let suggestion of quickSuggestions"
        class="suggestion-btn"
        (click)="onQuickSuggestion(suggestion)"
        [disabled]="isLoading"
      >
        {{ suggestion }}
      </button>
    </div>
  </div>

  <!-- Input de Mensaje -->
  <div class="input-container">
    <div class="input-wrapper">
      <textarea
        #messageInput
        [formControl]="messageControl"
        placeholder="Escribe tu mensaje aquí... (Enter para enviar)"
        class="message-input"
        rows="1"
        (keypress)="onKeyPress($event)"
        [disabled]="isLoading"
      ></textarea>
      
      <button 
        class="send-btn"
        (click)="onSendMessage()"
        [disabled]="!messageControl.valid || isLoading"
      >
        <span *ngIf="!isLoading">📤</span>
        <span *ngIf="isLoading" class="spinner">⏳</span>
      </button>
    </div>
  </div>
</div>
```

### **4. Estilos del Componente**

```scss
// src/app/features/chatbot/chatbot.component.scss

.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

// Header
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;

  .header-info h3 {
    margin: 0;
    font-size: 18px;
  }

  .status {
    margin: 4px 0 0 0;
    font-size: 12px;
    opacity: 0.9;

    &.loading {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  .clear-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Mensajes
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 16px;
  display: flex;

  &.user-message {
    justify-content: flex-end;

    .message-content {
      background: #007bff;
      color: white;
      border-radius: 18px 18px 4px 18px;
      max-width: 70%;
    }
  }

  &.assistant-message {
    justify-content: flex-start;

    .message-content {
      background: #f1f3f5;
      color: #333;
      border-radius: 18px 18px 18px 4px;
      max-width: 80%;
    }

    &.loading-message .message-content {
      background: #e3f2fd;
      animation: pulse 1.5s ease-in-out infinite;
    }

    &.error-message .message-content {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }
  }
}

.message-content {
  padding: 12px 16px;
  word-wrap: break-word;

  .message-text {
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .message-time {
    font-size: 11px;
    opacity: 0.7;
    text-align: right;
  }
}

// Typing indicator
.typing-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  span {
    height: 8px;
    width: 8px;
    background: #007bff;
    border-radius: 50%;
    margin-right: 4px;
    animation: typing 1.4s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

// Sugerencias
.quick-suggestions {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;

  p {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .suggestion-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 8px 12px;
    border-radius: 16px;
    cursor: pointer;
    font-size: 12px;
    text-align: left;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: #f0f0f0;
      border-color: #007bff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Input
.input-container {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
  border-radius: 0 0 12px 12px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  padding: 12px 16px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s ease;
  max-height: 100px;

  &:focus {
    outline: none;
    border-color: #007bff;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
}

.send-btn {
  background: #007bff;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 18px;

  &:hover:not(:disabled) {
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
}

// Animaciones
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 768px) {
  .chatbot-container {
    height: 100vh;
    border-radius: 0;
  }

  .quick-suggestions .suggestions-grid {
    grid-template-columns: 1fr;
  }
}
```

### **5. Método Auxiliar para Formatear Mensajes**

```typescript
// Agregar al ChatbotComponent

trackByMessageId(index: number, message: ChatMessage): string {
  return message.id;
}

formatMessage(content: string): string {
  // Convertir URLs en links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  content = content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
  
  // Convertir saltos de línea
  content = content.replace(/\n/g, '<br>');
  
  return content;
}
```

---

## 📱 Ejemplos de Uso

### **Consulta Simple**
```typescript
// Usuario escribe: "¿Qué productos de lomito tienen?"
// 
// Request enviado:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "¿Qué productos de lomito tienen?"
    }
  ]
}

// Respuesta:
{
  "id": "msg_123",
  "content": [
    {
      "type": "text",
      "text": "Tenemos varios productos de lomito disponibles:\n\n1. Lomito completo\n2. Lomito simple\n3. Lomito al plato\n4. Lomito combo\n\n¿Te gustaría más detalles sobre alguno en particular?"
    }
  ],
  "_guardrails": {
    "sessionId": "angular-chatbot-123",
    "processed": true
  }
}
```

### **Consulta con Herramientas**
```typescript
// Usuario escribe: "Busca productos de lomito con precios"
//
// Request enviado:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user", 
      "content": "Busca productos de lomito con precios"
    }
  ],
  "tools": [
    {
      "name": "get_products",
      "description": "Buscar productos en el inventario",
      "input_schema": {
        "type": "object",
        "properties": {
          "search": { "type": "string" }
        }
      }
    }
  ]
}

// Claude usará la herramienta automáticamente
```

---

## 🚀 Integración en tu App

### **En tu Module**
```typescript
// app.module.ts o feature.module.ts
import { ChatbotComponent } from './features/chatbot/chatbot.component';
import { ChatbotService } from './core/services/chatbot.service';

@NgModule({
  declarations: [ChatbotComponent],
  providers: [ChatbotService],
  // ...
})
```

### **En tu Template Principal**
```html
<!-- Botón flotante para abrir el chat -->
<button class="chat-fab" (click)="toggleChat()">
  💬
</button>

<!-- Modal/Sidebar del chat -->
<div class="chat-modal" *ngIf="showChat">
  <app-chatbot></app-chatbot>
</div>
```

---

## ⚙️ Variables de Environment

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

---

## 🎯 Resultados Esperados

### ✅ **Consulta Permitida**
- ✅ Respuesta rápida y contextual
- ✅ Uso automático de herramientas cuando necesario
- ✅ Tracking de sesión incluido

### ❌ **Consulta Bloqueada**
- ❌ Mensaje educado de redirección
- ❌ No rompe la experiencia del usuario
- ❌ Sugiere temas válidos

### 📊 **Funcionalidades Extra**
- 🔄 Historial de conversación
- ⚡ Sugerencias rápidas
- 📱 Diseño responsive
- 🎨 Interfaz moderna

**¡Tu chatbot está listo para usar!** 🚀

---

*Esta implementación te da un chatbot completo y funcional que aprovecha todo el poder del sistema MCP optimizado.*
