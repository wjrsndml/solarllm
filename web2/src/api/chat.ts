import { request } from './client'
import type { Message, Conversation, ApiResponse } from '@/types'

// Chat API 接口定义
export interface ChatModel {
  id: string
  name: string
}

export interface ChatRequest {
  conversation_id: string | null
  model: string
  messages: Message[]
}

export interface SSEEvent {
  type: 'content' | 'reasoning' | 'context' | 'image' | 'error' | 'done'
  content: any
}

export interface ConversationResponse {
  id: string
  title: string
  messages: any[]
  created_at: string
}

class ChatAPI {
  private baseURL = '/api'

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<ChatModel[]> {
    try {
      // 后端直接返回 { models: ChatModel[] } 格式
      const response = await request.get<{ models: ChatModel[] }>('/models')
      console.log('🔧 获取模型响应:', response)
      
      // 如果response直接是数据（后端不包装ApiResponse）
      if (response && typeof response === 'object' && 'models' in response && Array.isArray(response.models)) {
        return response.models
      }
      
      // 如果response是包装的ApiResponse格式
      if (response && typeof response === 'object' && 'data' in response && response.data?.models) {
        return response.data.models
      }
      
      return [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }]
    } catch (error) {
      console.error('获取模型失败:', error)
      return [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }]
    }
  }

  /**
   * 创建新对话
   */
  async createConversation(): Promise<{ success: boolean; id?: string; message: string }> {
    try {
      // 后端直接返回对话对象
      const response = await request.post<ConversationResponse>('/chat/create')
      console.log('🔧 创建对话响应:', response)
      
      // 如果response直接是对话对象
      if (response && typeof response === 'object' && 'id' in response && typeof response.id === 'string') {
        return {
          success: true,
          id: response.id,
          message: `已创建新对话, ID: ${response.id}`
        }
      }
      
      // 如果response是包装的ApiResponse格式
      if (response && typeof response === 'object' && 'data' in response && response.data?.id) {
        return {
          success: true,
          id: response.data.id,
          message: `已创建新对话, ID: ${response.data.id}`
        }
      }
      
      return { success: false, message: '创建对话失败：响应格式不正确' }
    } catch (error: any) {
      console.error('创建对话失败:', error)
      return { success: false, message: `创建对话出错: ${error.message}` }
    }
  }

  /**
   * 获取对话历史列表
   */
  async getConversationHistory(): Promise<ConversationResponse[]> {
    try {
      // 后端直接返回对话数组
      const response = await request.get<ConversationResponse[]>('/chat/history')
      console.log('🔧 获取历史响应:', response)
      
      // 如果response直接是数组
      if (Array.isArray(response)) {
        return response
      }
      
      // 如果response是包装的ApiResponse格式
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data
      }
      
      console.warn('历史对话响应格式不正确:', response)
      return []
    } catch (error) {
      console.error('获取历史对话失败:', error)
      return []
    }
  }

  /**
   * 加载指定对话
   */
  async loadConversation(conversationId: string): Promise<{ 
    success: boolean; 
    messages: Message[]; 
    message: string 
  }> {
    try {
      const history = await this.getConversationHistory()
      console.log('🔧 查找对话:', conversationId, '在历史记录中:', history)
      
      const conversation = history.find(conv => {
        const createdAt = new Date(conv.created_at).toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(/\//g, '-')
        const title = `${createdAt} - ${conv.title}`
        console.log('🔧 比较对话标题:', title, '目标:', conversationId)
        return title === conversationId
      })

      if (!conversation) {
        return { success: false, messages: [], message: '未找到对话' }
      }

      const messages: Message[] = []
      for (const msg of conversation.messages) {
        if (typeof msg === 'object' && msg.role && msg.content) {
          if (msg.role !== 'system') {
            messages.push({
              id: this.generateId(),
              role: msg.role,
              content: msg.content,
              timestamp: Date.now()
            })
          }
        } else if (Array.isArray(msg) && msg.length === 2) {
          // 处理旧格式 [user_msg, assistant_msg]
          messages.push({
            id: this.generateId(),
            role: 'user',
            content: msg[0],
            timestamp: Date.now()
          })
          if (msg[1]) {
            messages.push({
              id: this.generateId(),
              role: 'assistant',
              content: msg[1],
              timestamp: Date.now()
            })
          }
        }
      }

      return {
        success: true,
        messages,
        message: `已加载对话: ${conversation.title}`
      }
    } catch (error: any) {
      console.error('加载对话失败:', error)
      return { 
        success: false, 
        messages: [], 
        message: `加载对话出错: ${error.message}` 
      }
    }
  }

  /**
   * 发送消息 - SSE流式响应
   */
  async *sendMessage(
    message: string,
    conversationId: string | null,
    model: string,
    messages: Message[]
  ): AsyncGenerator<{
    type: 'message' | 'error' | 'done'
    content?: string
    reasoning?: string
    context?: any[]
    images?: any[]
    error?: string
  }> {
    try {
      const requestData: ChatRequest = {
        conversation_id: conversationId,
        model,
        messages: [
          ...messages,
          {
            id: this.generateId(),
            role: 'user',
            content: message,
            timestamp: Date.now()
          }
        ]
      }

      console.log('🔧 发送消息请求:', requestData)

      const response = await fetch(`${this.baseURL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestData)
      })

      console.log('🔧 SSE响应状态:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let assistantContent = ''
      let reasoning = ''
      let context: any[] = []
      let images: any[] = []

      try {
        let messageCount = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('🔧 SSE流结束，共处理', messageCount, '条消息')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          console.log('🔧 接收到SSE数据块:', chunk)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.trim() === '') continue // 跳过空行
            
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.slice(6).trim()
                if (dataStr === '') continue // 跳过空数据
                
                const eventData: SSEEvent = JSON.parse(dataStr)
                console.log('🔧 SSE事件:', eventData)
                messageCount++
                
                switch (eventData.type) {
                  case 'content':
                    assistantContent += eventData.content
                    yield {
                      type: 'message',
                      content: assistantContent,
                      reasoning,
                      context,
                      images
                    }
                    break
                  
                  case 'reasoning':
                    reasoning += eventData.content
                    yield {
                      type: 'message',
                      content: assistantContent,
                      reasoning,
                      context,
                      images
                    }
                    break
                  
                  case 'context':
                    context = eventData.content
                    yield {
                      type: 'message',
                      content: assistantContent,
                      reasoning,
                      context,
                      images
                    }
                    break
                  
                  case 'image':
                    images.push(eventData.content)
                    const urlPath = eventData.content?.url_path
                    if (urlPath) {
                      const fullUrl = `http://10.10.20.62:8000${urlPath}`
                      assistantContent += `\n\n![图像 ${images.length}](${fullUrl})`
                      yield {
                        type: 'message',
                        content: assistantContent,
                        reasoning,
                        context,
                        images
                      }
                    }
                    break
                  
                  case 'error':
                    console.error('🔧 SSE错误事件:', eventData.content)
                    yield { type: 'error', error: eventData.content }
                    return
                  
                  case 'done':
                    console.log('🔧 SSE完成事件，最终内容长度:', assistantContent.length)
                    yield {
                      type: 'done',
                      content: assistantContent,
                      reasoning,
                      context,
                      images
                    }
                    return
                }
              } catch (parseError) {
                console.warn('解析SSE数据失败:', parseError, '原始数据:', line)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        console.log('🔧 SSE连接已关闭')
      }

      yield { type: 'done', content: assistantContent }
    } catch (error: any) {
      console.error('发送消息失败:', error)
      yield { type: 'error', error: error.message }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export const chatAPI = new ChatAPI() 