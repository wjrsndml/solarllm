<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside 
      :width="isCollapse ? '64px' : '250px'" 
      class="sidebar"
    >
      <div class="logo-area">
        <div class="logo-icon">🔵</div>
        <transition name="fade">
          <div v-if="!isCollapse" class="logo-text">
            <h2>太阳能AI助手</h2>
            <p>智能预测与分析平台</p>
          </div>
        </transition>
      </div>
      
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
      >
        <el-menu-item
          v-for="route in routes"
          :key="route.path"
          :index="route.path"
          class="menu-item"
        >
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <template #title>
            <span>{{ route.meta.title }}</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapse ? 'Expand' : 'Fold'"
            @click="toggleSidebar"
            circle
            size="large"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentRoute?.meta?.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-tooltip content="切换主题" placement="bottom">
            <el-button
              :icon="themeStore.theme === 'dark' ? 'Sunny' : 'Moon'"
              @click="themeStore.toggleTheme()"
              circle
              size="large"
            />
          </el-tooltip>
          
          <el-tooltip content="项目信息" placement="bottom">
            <el-button
              icon="InfoFilled"
              @click="showInfo = true"
              circle
              size="large"
            />
          </el-tooltip>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <div class="content-wrapper">
          <transition name="slide" mode="out-in">
            <router-view />
          </transition>
        </div>
      </el-main>
    </el-container>

    <!-- 信息对话框 -->
    <el-dialog
      v-model="showInfo"
      title="关于太阳能AI助手"
      width="500px"
      align-center
    >
      <div class="info-content">
        <h3>🔵 太阳能AI助手</h3>
        <p>一个现代化的太阳能电池智能预测与分析平台</p>
        
        <h4>主要功能：</h4>
        <ul>
          <li>💬 AI智能对话助手</li>
          <li>⚡ 硅电池参数预测与JV曲线生成</li>
          <li>⏳ 钙钛矿电池老化性能预测</li>
          <li>🧪 钙钛矿电池参数智能预测</li>
          <li>🔷 钙钛矿材料带隙计算</li>
        </ul>
        
        <h4>技术特色：</h4>
        <ul>
          <li>🎨 现代化Vue 3 + TypeScript前端</li>
          <li>📱 响应式设计，支持多设备</li>
          <li>🌓 深浅色主题自由切换</li>
          <li>📊 实时数据可视化</li>
          <li>⚡ 高性能防抖预测</li>
        </ul>
      </div>
      
      <template #footer>
        <el-button @click="showInfo = false" type="primary">
          知道了
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const themeStore = useThemeStore()

const isCollapse = ref(false)
const showInfo = ref(false)

const currentRoute = computed(() => route)

const routes = [
  {
    path: '/chat',
    meta: { title: 'AI对话', icon: 'ChatLineRound', description: '智能对话助手' }
  },
  {
    path: '/solar',
    meta: { title: '硅电池参数预测', icon: 'Sunny', description: '硅电池JV曲线预测' }
  },
  {
    path: '/aging',
    meta: { title: '钙钛矿电池老化预测', icon: 'Timer', description: '电池老化性能预测' }
  },
  {
    path: '/perovskite',
    meta: { title: '钙钛矿电池参数预测', icon: 'Operation', description: '钙钛矿电池性能预测' }
  },
  {
    path: '/bandgap',
    meta: { title: '钙钛矿带隙预测', icon: 'Promotion', description: '钙钛矿材料带隙计算' }
  }
]

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dark .layout-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
}

.sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.dark .sidebar {
  background: rgba(45, 55, 72, 0.95);
  border-right-color: rgba(255, 255, 255, 0.1);
}

.logo-area {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.dark .logo-area {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 2em;
  flex-shrink: 0;
}

.logo-text h2 {
  margin: 0;
  font-size: 1.3em;
  color: #1976d2;
  font-weight: bold;
}

.logo-text p {
  margin: 0;
  font-size: 0.9em;
  color: #666;
  opacity: 0.8;
}

.dark .logo-text h2 {
  color: #64b5f6;
}

.dark .logo-text p {
  color: #ccc;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.menu-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: linear-gradient(45deg, #e3f2fd, #bbdefb);
  transform: translateX(2px);
}

.menu-item.is-active {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  color: white;
}

.header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .header {
  background: rgba(45, 55, 72, 0.9);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  padding: 24px;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.info-content h3 {
  color: #1976d2;
  margin-bottom: 8px;
}

.info-content h4 {
  margin: 16px 0 8px 0;
  color: #333;
}

.dark .info-content h4 {
  color: #fff;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
}

.info-content li {
  margin: 4px 0;
  color: #666;
}

.dark .info-content li {
  color: #ccc;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style> 