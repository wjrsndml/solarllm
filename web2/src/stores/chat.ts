import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { Message, Conversation } from '@/types'
import { chatAPI, type ChatModel } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  // 状态定义
  const currentConversationId = ref<string | null>(null)
  const messages = ref<Message[]>([])
  const selectedModel = ref('deepseek-chat')
  const availableModels = ref<ChatModel[]>([])
  const conversations = ref<string[]>([])
  const isLoading = ref(false)
  const statusMessage = ref('就绪')

  // 初始化
  const initialize = async () => {
    try {
      // 加载可用模型
      const models = await chatAPI.getAvailableModels()
      availableModels.value = models
      
      // 设置默认模型
      if (models.length > 0) {
        selectedModel.value = models[0].id
      }

      // 加载对话历史
      await refreshConversations()

      // 显示欢迎消息
      if (messages.value.length === 0) {
        const welcomeMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '你好！我是太阳能电池AI助手。我可以帮助您解答关于太阳能电池技术的问题，包括硅电池、钙钛矿电池的原理、性能预测、工艺优化等。请随时向我提问！',
          timestamp: Date.now()
        }
        messages.value.push(welcomeMessage)
      }
    } catch (error) {
      console.error('初始化聊天失败:', error)
      statusMessage.value = '初始化失败'
    }
  }

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return

    try {
      isLoading.value = true
      statusMessage.value = '发送中...'

      // 添加用户消息
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now()
      }
      messages.value.push(userMessage)

      // 如果没有当前对话，创建新对话
      if (!currentConversationId.value) {
        const result = await chatAPI.createConversation()
        if (result.success && result.id) {
          currentConversationId.value = result.id
          statusMessage.value = result.message
        } else {
          throw new Error(result.message)
        }
      }

      // 准备发送给API的消息列表（不包括刚添加的用户消息，因为API会自己添加）
      const messagesForAPI = messages.value.slice(0, -1)

      // 发送消息并处理流式响应
      const messageGenerator = chatAPI.sendMessage(
        content,
        currentConversationId.value,
        selectedModel.value,
        messagesForAPI
      )

      // 创建助手消息用于实时更新
      let assistantMessage: Message | null = null

      for await (const event of messageGenerator) {
        switch (event.type) {
          case 'message':
            // 如果还没有助手消息，创建一个
            if (!assistantMessage) {
              assistantMessage = {
                id: generateId(),
                role: 'assistant',
                content: '',
                timestamp: Date.now()
              }
              messages.value.push(assistantMessage)
            }
            
            // 更新助手消息内容
            assistantMessage.content = event.content || ''
            if (event.reasoning) {
              assistantMessage.reasoning = event.reasoning
            }
            if (event.context) {
              assistantMessage.context = event.context
            }
            if (event.images) {
              assistantMessage.images = event.images
            }
            break

          case 'error':
            if (!assistantMessage) {
              assistantMessage = {
                id: generateId(),
                role: 'assistant',
                content: '',
                timestamp: Date.now()
              }
              messages.value.push(assistantMessage)
            }
            
            assistantMessage.content = `错误: ${event.error}`
            assistantMessage.error = true
            statusMessage.value = `发生错误: ${event.error}`
            break

          case 'done':
            if (assistantMessage) {
              assistantMessage.content = event.content || assistantMessage.content
            }
            statusMessage.value = '发送完成'
            break
        }
      }

      // 刷新对话列表
      await refreshConversations()
    } catch (error: any) {
      console.error('发送消息失败:', error)
      statusMessage.value = `发送失败: ${error.message}`
      
      // 添加错误消息
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `错误: ${error.message}`,
        timestamp: Date.now(),
        error: true
      }
      messages.value.push(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  // 创建新对话
  const createNewConversation = async () => {
    try {
      const result = await chatAPI.createConversation()
      if (result.success && result.id) {
        currentConversationId.value = result.id
        messages.value = []
        statusMessage.value = result.message

        // 添加欢迎消息
        const welcomeMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '新的对话开始了！我是太阳能电池AI助手，有什么可以帮助您的吗？',
          timestamp: Date.now()
        }
        messages.value.push(welcomeMessage)

        await refreshConversations()
      } else {
        statusMessage.value = result.message
      }
    } catch (error: any) {
      statusMessage.value = `创建对话失败: ${error.message}`
    }
  }

  // 加载对话
  const loadConversation = async (conversationId: string) => {
    if (!conversationId) return

    try {
      const result = await chatAPI.loadConversation(conversationId)
      if (result.success) {
        messages.value = result.messages
        currentConversationId.value = conversationId
        statusMessage.value = result.message
      } else {
        statusMessage.value = result.message
      }
    } catch (error: any) {
      statusMessage.value = `加载对话失败: ${error.message}`
    }
  }

  // 刷新对话列表
  const refreshConversations = async () => {
    try {
      const history = await chatAPI.getConversationHistory()
      conversations.value = history.map(conv => {
        const createdAt = new Date(conv.created_at).toLocaleDateString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(/\//g, '-')
        return `${createdAt} - ${conv.title}`
      })
    } catch (error) {
      console.error('刷新对话列表失败:', error)
    }
  }

  // 切换模型
  const switchModel = async (modelId: string) => {
    selectedModel.value = modelId
    statusMessage.value = `已切换到模型: ${modelId}`
    
    // 从可用模型中找到模型名称
    const model = availableModels.value.find(m => m.id === modelId)
    if (model) {
      statusMessage.value = `已切换到模型: ${model.name}`
    }
  }

  // 格式化消息内容（支持markdown）
  const formatMessage = (content: string): string => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
  }

  // 生成唯一ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 清空当前对话
  const clearCurrentConversation = () => {
    messages.value = []
    currentConversationId.value = null
    statusMessage.value = '就绪'
  }

  return {
    // 状态
    currentConversationId,
    messages,
    selectedModel,
    availableModels,
    conversations,
    isLoading,
    statusMessage,

    // 方法
    initialize,
    sendMessage,
    createNewConversation,
    loadConversation,
    refreshConversations,
    switchModel,
    formatMessage,
    clearCurrentConversation
  }
}) 