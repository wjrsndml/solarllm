<template>
  <div class="aging-container">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <h2>⏳ 钙钛矿电池老化预测</h2>
          <p>基于AI模型预测钙钛矿电池的老化性能</p>
        </div>
      </template>
      
      <div class="content-area">
        <el-row :gutter="24">
          <el-col :span="12">
            <div class="form-section">
              <h3>📝 参数输入</h3>
              <el-form :model="params" label-position="top">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="温度 (°C)">
                      <el-input-number v-model="params.temperature" :min="20" :max="100" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="湿度 (%)">
                      <el-input-number v-model="params.humidity" :min="0" :max="100" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="光照强度 (mW/cm²)">
                      <el-input-number v-model="params.lightIntensity" :min="0" :max="200" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="测试时间 (小时)">
                      <el-input-number v-model="params.testTime" :min="1" :max="10000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item>
                  <el-button type="primary" @click="predict" :loading="isLoading" class="gradient-btn">
                    开始预测
                  </el-button>
                  <el-button @click="reset">重置参数</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="result-section">
              <h3>📊 预测结果</h3>
              <div v-if="result" class="result-content">
                <el-alert
                  title="预测完成"
                  type="success"
                  :closable="false"
                  show-icon
                />
                <div class="result-text">
                  {{ result }}
                </div>
              </div>
              <div v-else class="result-placeholder">
                <el-icon size="48"><Timer /></el-icon>
                <p>输入参数并点击预测按钮</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isLoading = ref(false)
const result = ref('')

const params = ref({
  temperature: 25,
  humidity: 50,
  lightIntensity: 100,
  testTime: 1000
})

const predict = async () => {
  isLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    result.value = `钙钛矿电池老化预测结果：

测试条件：
- 温度: ${params.value.temperature}°C
- 湿度: ${params.value.humidity}%
- 光照强度: ${params.value.lightIntensity} mW/cm²
- 测试时间: ${params.value.testTime} 小时

预测结果：
- 初始效率: 22.5%
- 预测最终效率: 18.7%
- 效率衰减率: 16.9%
- 预计T80寿命: 2,850 小时
- 主要衰减机制: 离子迁移和界面降解

建议：
1. 降低工作温度可显著延长寿命
2. 控制环境湿度在30%以下
3. 考虑添加封装保护层`
  } catch (error) {
    console.error('预测失败:', error)
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  params.value = {
    temperature: 25,
    humidity: 50,
    lightIntensity: 100,
    testTime: 1000
  }
  result.value = ''
}
</script>

<style scoped>
.aging-container {
  height: 100%;
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

.content-area {
  min-height: 500px;
}

.form-section,
.result-section {
  height: 100%;
}

.form-section h3,
.result-section h3 {
  margin: 0 0 20px 0;
  color: #1976d2;
  font-size: 1.2em;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 8px;
}

.result-content {
  margin-top: 16px;
}

.result-text {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
  white-space: pre-line;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.dark .result-text {
  background: #2d3748;
  color: #e2e8f0;
}

.result-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.dark .result-placeholder {
  background: linear-gradient(135deg, #2d3748, #1a202c);
  border-color: #4a5568;
  color: #a0aec0;
}
</style> 