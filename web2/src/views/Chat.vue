<template>
  <div class="chat-container">
    <el-row :gutter="24">
      <el-col :span="18">
        <el-card class="chat-card card-shadow">
          <template #header>
            <div class="card-header">
              <h2>💬 AI对话助手</h2>
              <p>与太阳能电池AI专家交流，获取专业建议</p>
              <div class="status-info">
                <el-tag :type="getStatusType()" size="small">
                  {{ chatStore.statusMessage }}
                </el-tag>
              </div>
            </div>
          </template>
          
          <!-- 聊天区域 -->
          <div class="chat-area" ref="chatArea">
            <div 
              v-for="message in chatStore.messages" 
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
                <div 
                  class="message-text" 
                  :class="{ 'error-message': message.error }"
                  v-html="chatStore.formatMessage(message.content)"
                ></div>
                
                <!-- 推理过程显示 -->
                <div v-if="message.reasoning" class="reasoning-content">
                  <el-collapse>
                    <el-collapse-item title="🧠 AI推理过程" name="reasoning">
                      <div class="reasoning-text">{{ message.reasoning }}</div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                
                <!-- 上下文信息显示 -->
                <div v-if="message.context && message.context.length > 0" class="context-content">
                  <el-collapse>
                    <el-collapse-item title="📚 参考上下文" name="context">
                      <div v-for="(ctx, index) in message.context" :key="index" class="context-item">
                        {{ ctx }}
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                
                <!-- 图像显示 -->
                <div v-if="message.images && message.images.length > 0" class="images-content">
                  <div v-for="(img, index) in message.images" :key="index" class="image-item">
                    <el-image
                      :src="getImageUrl(img)"
                      :alt="`图像 ${index + 1}`"
                      fit="contain"
                      style="max-width: 300px; max-height: 200px;"
                      :preview-src-list="[getImageUrl(img)]"
                      @error="handleImageError"
                    />
                  </div>
                </div>
                
                <div class="message-time">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
            
            <!-- 加载指示器 -->
            <div v-if="chatStore.isLoading" class="message ai-message">
              <div class="message-avatar">
                <div class="ai-avatar">🤖</div>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="typing-text">AI正在思考...</div>
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
              :disabled="chatStore.isLoading"
              class="message-input"
            />
            <div class="input-actions">
              <div class="input-tips">
                <el-text type="info" size="small">按 Ctrl + Enter 发送</el-text>
              </div>
              <el-button
                type="primary"
                @click="sendMessage"
                :loading="chatStore.isLoading"
                class="gradient-btn"
                :disabled="!inputMessage.trim()"
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
                  :model-value="chatStore.selectedModel"
                  @change="chatStore.switchModel"
                  style="width: 100%"
                  :disabled="chatStore.isLoading"
                >
                  <el-option
                    v-for="model in chatStore.availableModels"
                    :key="model.id"
                    :label="model.name"
                    :value="model.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="当前对话ID">
                <el-input
                  :model-value="chatStore.currentConversationId || '未创建'"
                  readonly
                  size="small"
                />
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
                @click="chatStore.createNewConversation"
                type="primary"
                size="small"
                class="gradient-btn"
                :loading="chatStore.isLoading"
              >
                新建对话
              </el-button>
            </div>
          </template>
          <div class="control-section">
            <el-select
              :model-value="selectedConversation"
              @change="loadConversation"
              placeholder="选择历史对话"
              style="width: 100%; margin-bottom: 12px;"
              :disabled="chatStore.isLoading"
            >
              <el-option
                v-for="conv in chatStore.conversations"
                :key="conv"
                :label="conv"
                :value="conv"
              />
            </el-select>
            
            <div class="conversation-actions">
              <el-button 
                @click="chatStore.refreshConversations" 
                size="small" 
                style="width: 48%;"
                :loading="chatStore.isLoading"
              >
                刷新列表
              </el-button>
              <el-button 
                @click="clearConversation" 
                size="small" 
                type="warning"
                style="width: 48%;"
                :disabled="chatStore.isLoading"
              >
                清空对话
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const inputMessage = ref('')
const selectedConversation = ref('')
const chatArea = ref<HTMLElement>()

onMounted(async () => {
  await chatStore.initialize()
  await scrollToBottom()
})

// 监听消息变化，自动滚动到底部
watch(
  () => chatStore.messages,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true }
)

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || chatStore.isLoading) return
  
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  await scrollToBottom()
  await chatStore.sendMessage(message)
  await scrollToBottom()
}

// 加载对话
const loadConversation = async (conversationId: string) => {
  if (!conversationId) return
  
  selectedConversation.value = conversationId
  await chatStore.loadConversation(conversationId)
  await scrollToBottom()
}

// 清空对话
const clearConversation = () => {
  chatStore.clearCurrentConversation()
  selectedConversation.value = ''
}

// 获取状态类型
const getStatusType = () => {
  const status = chatStore.statusMessage
  if (status.includes('错误') || status.includes('失败')) return 'danger'
  if (status.includes('发送中') || status.includes('中...')) return 'warning'
  if (status.includes('完成') || status.includes('成功')) return 'success'
  return 'info'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (chatArea.value) {
    chatArea.value.scrollTop = chatArea.value.scrollHeight
  }
}

// 获取图像URL
const getImageUrl = (img: any) => {
  if (typeof img === 'string') {
    return img
  }
  if (img && typeof img === 'object') {
    if (img.url) return img.url
    if (img.url_path) {
      // 构建完整的图像URL，使用与API相同的服务器地址
      return `http://10.10.20.62:8000${img.url_path}`
    }
  }
  return ''
}

// 处理图像加载错误
const handleImageError = (event: Event) => {
  console.error('图像加载失败:', event)
  const target = event.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
  }
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

.card-header {
  display: flex;
  flex-direction: column;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 1.5em;
}

.card-header p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.9em;
}

.status-info {
  margin-top: 8px;
}

.chat-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  max-height: calc(100vh - 300px);
  min-height: 400px;
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

.error-message {
  background: linear-gradient(45deg, #f44336, #ef5350) !important;
  color: white !important;
  border-left: 4px solid #d32f2f;
}

.dark .message-text {
  background: #2d3748;
  color: #e2e8f0;
}

.dark .user-message .message-text {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
}

.reasoning-content,
.context-content {
  margin-top: 8px;
  max-width: 100%;
}

.reasoning-text {
  padding: 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
  font-family: monospace;
  font-size: 0.9em;
  white-space: pre-wrap;
}

.dark .reasoning-text {
  background: #1a365d;
  color: #e2e8f0;
}

.context-item {
  padding: 8px;
  margin: 4px 0;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9em;
  border-left: 3px solid #28a745;
}

.dark .context-item {
  background: #2d3748;
  color: #e2e8f0;
}

.images-content {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  justify-content: space-between;
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

.typing-text {
  margin-top: 4px;
  font-size: 0.9em;
  color: #666;
  text-align: center;
}

.dark .typing-text {
  color: #a0aec0;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 768px) {
  .message-content {
    max-width: 95%;
  }
  
  .chat-card {
    height: calc(100vh - 120px);
  }
}
</style> 