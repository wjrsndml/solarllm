<template>
  <div class="chat-container">
    <el-row :gutter="24">
      <el-col :span="18">
        <el-card class="chat-card card-shadow">
          <template #header>
            <div class="card-header">
              <h2>💬 AI对话助手</h2>
              <p>与太阳能电池AI专家交流，获取专业建议</p>
            </div>
          </template>
          
          <!-- 聊天区域 -->
          <div class="chat-area" ref="chatArea">
            <div 
              v-for="message in messages" 
              :key="message.id"
              :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
            >
              <div class="message-avatar">
                <el-icon v-if="message.role === 'user'">
                  <User />
                </el-icon>
                <div v-else class="ai-avatar">🤖</div>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-time">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
            
            <!-- 加载指示器 -->
            <div v-if="isLoading" class="message ai-message">
              <div class="message-avatar">
                <div class="ai-avatar">🤖</div>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 -->
          <div class="input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="输入您的问题..."
              @keydown.ctrl.enter="sendMessage"
              :disabled="isLoading"
              class="message-input"
            />
            <div class="input-actions">
              <div class="input-tips">
                <el-text type="info" size="small">按 Ctrl + Enter 发送</el-text>
              </div>
              <el-button
                type="primary"
                @click="sendMessage"
                :loading="isLoading"
                class="gradient-btn"
              >
                发送
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <!-- 模型选择 -->
        <el-card class="control-card card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <h3>🔧 模型配置</h3>
          </template>
          <div class="control-section">
            <el-form label-position="top">
              <el-form-item label="选择模型">
                <el-select
                  v-model="selectedModel"
                  @change="updateModel"
                  style="width: 100%"
                >
                  <el-option
                    v-for="model in availableModels"
                    :key="model"
                    :label="model"
                    :value="model"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
        
        <!-- 对话历史 -->
        <el-card class="control-card card-shadow">
          <template #header>
            <div class="history-header">
              <h3>📚 对话历史</h3>
              <el-button
                @click="newConversation"
                type="primary"
                size="small"
                class="gradient-btn"
              >
                新建对话
              </el-button>
            </div>
          </template>
          <div class="control-section">
            <el-select
              v-model="selectedConversation"
              @change="loadConversation"
              placeholder="选择历史对话"
              style="width: 100%; margin-bottom: 12px;"
            >
              <el-option
                v-for="conv in conversations"
                :key="conv.id"
                :label="conv.title"
                :value="conv.id"
              />
            </el-select>
            
            <div class="conversation-actions">
              <el-button @click="refreshConversations" size="small" style="width: 100%;">
                刷新列表
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import type { Message, Conversation } from '@/types'

const messages = ref<Message[]>([])
const conversations = ref<Conversation[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const selectedModel = ref('deepseek-chat')
const selectedConversation = ref('')
const chatArea = ref<HTMLElement>()

const availableModels = [
  'deepseek-chat',
  'gpt-3.5-turbo',
  'gpt-4',
  'claude-3',
]

onMounted(() => {
  loadConversations()
  // 显示欢迎消息
  const welcomeMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: '你好！我是太阳能电池AI助手。我可以帮助您解答关于太阳能电池技术的问题，包括硅电池、钙钛矿电池的原理、性能预测、工艺优化等。请随时向我提问！',
    timestamp: Date.now()
  }
  messages.value.push(welcomeMessage)
})

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  }
  
  messages.value.push(userMessage)
  inputMessage.value = ''
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const aiResponse: Message = {
      id: generateId(),
      role: 'assistant',
      content: `这是对"${userMessage.content}"的回复。在实际应用中，这里会是AI模型的真实回复。`,
      timestamp: Date.now()
    }
    
    messages.value.push(aiResponse)
    await scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
  }
}

const updateModel = (model: string) => {
  selectedModel.value = model
  // 在实际应用中，这里会调用API更新模型
  console.log('切换模型:', model)
}

const newConversation = () => {
  messages.value = []
  selectedConversation.value = ''
  const welcomeMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: '新的对话开始了！我是太阳能电池AI助手，有什么可以帮助您的吗？',
    timestamp: Date.now()
  }
  messages.value.push(welcomeMessage)
}

const loadConversation = (conversationId: string) => {
  // 在实际应用中，这里会从API加载对话历史
  console.log('加载对话:', conversationId)
}

const loadConversations = () => {
  // 模拟加载对话列表
  conversations.value = [
    {
      id: '1',
      title: '硅电池效率优化',
      messages: [],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000
    },
    {
      id: '2',
      title: '钙钛矿电池稳定性',
      messages: [],
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 172800000
    }
  ]
}

const refreshConversations = () => {
  loadConversations()
}

const formatMessage = (content: string) => {
  // 简单的markdown转换
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatArea.value) {
    chatArea.value.scrollTop = chatArea.value.scrollHeight
  }
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>
.chat-container {
  height: 100%;
}

.chat-card {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 1.5em;
}

.card-header p {
  margin: 0;
  color: #666;
  font-size: 0.9em;
}

.chat-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
}

.dark .chat-area {
  background: linear-gradient(to bottom, #2d3748, #1a202c);
}

.message {
  display: flex;
  margin-bottom: 20px;
  animation: slideIn 0.3s ease;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 12px;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  color: white;
}

.ai-avatar {
  background: linear-gradient(45deg, #4caf50, #81c784);
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  line-height: 1.5;
}

.user-message .message-text {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  color: white;
}

.dark .message-text {
  background: #2d3748;
  color: #e2e8f0;
}

.dark .user-message .message-text {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
}

.message-time {
  font-size: 0.75em;
  color: #999;
  margin-top: 4px;
  text-align: center;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #eee;
  background: rgba(248, 249, 250, 0.8);
}

.dark .input-area {
  border-top-color: #444;
  background: rgba(45, 55, 72, 0.8);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.control-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.dark .control-card {
  background: rgba(45, 55, 72, 0.9);
}

.control-section {
  padding: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  color: #1976d2;
}

.conversation-actions {
  display: flex;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style> 