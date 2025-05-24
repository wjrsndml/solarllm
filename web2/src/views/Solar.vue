<template>
  <div class="solar-container">
    <el-row :gutter="24">
      <el-col :span="16">
        <el-card class="result-card card-shadow">
          <template #header>
            <div class="card-header">
              <h2>⚡ 硅电池参数预测结果</h2>
              <p>JV曲线和性能参数实时预测</p>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h3>📊 JV特性曲线</h3>
                <div class="chart-wrapper">
                  <v-chart
                    v-if="chartData"
                    :option="chartOptions"
                    :style="{ height: '400px' }"
                    :autoresize="true"
                  />
                  <div v-else class="chart-placeholder">
                    <el-icon size="48"><TrendCharts /></el-icon>
                    <p>调整参数查看JV曲线</p>
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="result-panel">
                <h3>📋 预测结果</h3>
                <div class="status-indicator">
                  <el-tag :type="statusType" size="large">
                    {{ loadingStatus }}
                  </el-tag>
                </div>
                
                <el-scrollbar height="360px">
                  <div class="result-content">
                    <div v-if="predictionResult" class="result-text">
                      {{ predictionResult }}
                    </div>
                    <div v-else class="result-placeholder">
                      <el-icon size="48"><Document /></el-icon>
                      <p>预测结果将在这里显示</p>
                    </div>
                  </div>
                </el-scrollbar>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="params-card card-shadow">
          <template #header>
            <div class="card-header">
              <h2>🔧 参数配置</h2>
              <el-button
                @click="resetParams"
                size="small"
                type="info"
              >
                重置默认值
              </el-button>
            </div>
          </template>
          
          <el-tabs v-model="activeTab" class="params-tabs">
            <!-- 物理参数 -->
            <el-tab-pane label="📏 物理尺寸" name="physical">
              <el-form label-position="top" class="param-form">
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      Si 厚度 (μm)
                      <el-tooltip content="硅片主体厚度，影响光吸收和载流子传输" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.Si_thk"
                    :min="50"
                    :max="500"
                    :step="10"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      SiO2 厚度 (nm)
                      <el-tooltip content="隔离氧化层厚度，影响界面钝化效果" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.t_SiO2"
                    :min="0.5"
                    :max="5"
                    :step="0.1"
                    :precision="1"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      背面 PolySi 厚度 (μm)
                      <el-tooltip content="背面多晶硅层厚度，影响背面钝化和导电性" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.t_polySi_rear_P"
                    :min="0.05"
                    :max="0.5"
                    :step="0.01"
                    :precision="2"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 结构参数 -->
            <el-tab-pane label="🔌 结与接触" name="junction">
              <el-form label-position="top" class="param-form">
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      前表面结深度 (μm)
                      <el-tooltip content="正面PN结深度，影响收集效率" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.front_junc"
                    :min="0.1"
                    :max="2"
                    :step="0.1"
                    :precision="1"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      后表面结深度 (μm)
                      <el-tooltip content="背面PN结深度，影响背面场效应" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.rear_junc"
                    :min="0.1"
                    :max="2"
                    :step="0.1"
                    :precision="1"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      后表面电阻 (Ω·cm)
                      <el-tooltip content="背面接触电阻，影响串联电阻" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <el-input-number
                    v-model="params.resist_rear"
                    :min="0.1"
                    :max="10"
                    :step="0.1"
                    :precision="1"
                    @change="debouncedPredict"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 掺杂参数 -->
            <el-tab-pane label="🧪 掺杂浓度" name="doping">
              <el-form label-position="top" class="param-form">
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      前表面掺杂浓度 (cm⁻³)
                      <el-tooltip content="正面掺杂区载流子浓度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Nd_top"
                      :min="1e18"
                      :max="1e21"
                      :step="1e18"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Nd_top) }} cm⁻³
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      后表面掺杂浓度 (cm⁻³)
                      <el-tooltip content="背面掺杂区载流子浓度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Nd_rear"
                      :min="1e18"
                      :max="1e21"
                      :step="1e18"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Nd_rear) }} cm⁻³
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      前表面 PolySi 掺杂 (cm⁻³)
                      <el-tooltip content="正面多晶硅层掺杂浓度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Nt_polySi_top"
                      :min="1e18"
                      :max="1e21"
                      :step="1e18"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Nt_polySi_top) }} cm⁻³
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      后表面 PolySi 掺杂 (cm⁻³)
                      <el-tooltip content="背面多晶硅层掺杂浓度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Nt_polySi_rear"
                      :min="1e18"
                      :max="1e21"
                      :step="1e18"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Nt_polySi_rear) }} cm⁻³
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <!-- 界面参数 -->
            <el-tab-pane label="🔬 界面缺陷" name="interface">
              <el-form label-position="top" class="param-form">
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      Si-SiOx 界面缺陷密度 (cm⁻²)
                      <el-tooltip content="硅/氧化层界面缺陷密度，影响界面复合" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Dit_Si_SiOx"
                      :min="1e9"
                      :max="1e12"
                      :step="1e9"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Dit_Si_SiOx) }} cm⁻²
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      SiOx-Poly 界面缺陷密度 (cm⁻²)
                      <el-tooltip content="氧化层/多晶硅界面缺陷密度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Dit_SiOx_Poly"
                      :min="1e9"
                      :max="1e12"
                      :step="1e9"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Dit_SiOx_Poly) }} cm⁻²
                    </div>
                  </div>
                </el-form-item>
                
                <el-form-item>
                  <template #label>
                    <span class="param-label">
                      顶部界面缺陷密度 (cm⁻²)
                      <el-tooltip content="顶部界面缺陷密度" placement="top">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </span>
                  </template>
                  <div class="scientific-input">
                    <el-input-number
                      v-model="params.Dit_top"
                      :min="1e9"
                      :max="1e12"
                      :step="1e9"
                      @change="debouncedPredict"
                      style="width: 100%"
                    />
                    <div class="scientific-display">
                      {{ formatScientific(params.Dit_top) }} cm⁻²
                    </div>
                  </div>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { 
  GridComponent, 
  TooltipComponent, 
  LegendComponent,
  DataZoomComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SolarParams } from '@/types'
import { debounce } from '@/utils/debounce'

// 注册ECharts组件
use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer
])

const activeTab = ref('physical')
const predictionResult = ref('')
const isLoading = ref(false)
const loadingStatus = ref('就绪')
const chartData = ref<any>(null)

// 默认参数
const defaultParams: SolarParams = {
  Si_thk: 180,
  t_SiO2: 1.4,
  t_polySi_rear_P: 0.1,
  front_junc: 0.5,
  rear_junc: 0.5,
  resist_rear: 1,
  Nd_top: 1e20,
  Nd_rear: 1e20,
  Nt_polySi_top: 1e19,
  Nt_polySi_rear: 1e20,
  Dit_Si_SiOx: 1e10,
  Dit_SiOx_Poly: 1e10,
  Dit_top: 1e10
}

const params = ref<SolarParams>({ ...defaultParams })

const statusType = computed(() => {
  switch (loadingStatus.value) {
    case '计算中...': return 'warning'
    case '完成': return 'success'
    case '出错': return 'danger'
    default: return 'info'
  }
})

const chartOptions = computed(() => {
  if (!chartData.value) return null
  
  return {
    title: {
      text: 'JV特性曲线',
      left: 'center',
      textStyle: {
        color: '#1976d2',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} mA/cm²'
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '电压 (V)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: {
        lineStyle: { color: '#666' }
      }
    },
    yAxis: {
      type: 'value',
      name: '电流密度 (mA/cm²)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLine: {
        lineStyle: { color: '#666' }
      }
    },
    series: [{
      name: 'JV曲线',
      type: 'line',
      data: chartData.value,
      smooth: true,
      lineStyle: {
        color: '#1976d2',
        width: 3
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
            { offset: 1, color: 'rgba(25, 118, 210, 0.05)' }
          ]
        }
      }
    }],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 20,
        bottom: 10
      }
    ]
  }
})

onMounted(() => {
  // 初始预测
  predictParams()
})

const predictParams = async () => {
  loadingStatus.value = '计算中...'
  isLoading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 模拟JV曲线数据
    const voltage = []
    const current = []
    for (let v = 0; v <= 0.7; v += 0.01) {
      voltage.push(v)
      // 简化的JV特性方程
      const i = 40 * (1 - Math.exp((v - 0.6) / 0.026)) - v * 0.5
      current.push([v, Math.max(i, -5)])
    }
    
    chartData.value = current
    
    // 模拟预测结果
    predictionResult.value = `硅电池仿真结果：

开路电压 (Voc): 0.672 V
短路电流密度 (Jsc): 39.8 mA/cm²
填充因子 (FF): 81.2%
转换效率 (η): 21.7%

最大功率点电压 (Vmp): 0.558 V
最大功率点电流密度 (Jmp): 38.9 mA/cm²
最大功率密度 (Pmp): 21.7 mW/cm²

串联电阻 (Rs): 0.85 Ω·cm²
并联电阻 (Rsh): 1250 Ω·cm²

仿真说明：
- 基于输入参数完成器件物理仿真
- JV曲线反映电池在标准测试条件下的性能
- 参数优化建议：适当降低界面缺陷密度可进一步提升效率`
    
    loadingStatus.value = '完成'
  } catch (error) {
    console.error('预测失败:', error)
    predictionResult.value = '预测过程中发生错误，请检查参数设置并重试。'
    loadingStatus.value = '出错'
  } finally {
    isLoading.value = false
  }
}

const debouncedPredict = debounce(predictParams, 800)

const resetParams = () => {
  params.value = { ...defaultParams }
  debouncedPredict()
}

const formatScientific = (value: number) => {
  return value.toExponential(2)
}
</script>

<style scoped>
.solar-container {
  height: 100%;
}

.result-card,
.params-card {
  height: calc(100vh - 140px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.dark .result-card,
.dark .params-card {
  background: rgba(45, 55, 72, 0.95);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #1976d2;
  font-size: 1.4em;
}

.card-header p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 0.9em;
}

.chart-container,
.result-panel {
  height: 100%;
}

.chart-container h3,
.result-panel h3 {
  margin: 0 0 16px 0;
  color: #1976d2;
  font-size: 1.2em;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 8px;
}

.chart-wrapper {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-placeholder,
.result-placeholder {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.dark .chart-placeholder,
.dark .result-placeholder {
  background: linear-gradient(135deg, #2d3748, #1a202c);
  border-color: #4a5568;
  color: #a0aec0;
}

.status-indicator {
  margin-bottom: 16px;
  text-align: center;
}

.result-content {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.dark .result-content {
  background: #2d3748;
}

.result-text {
  white-space: pre-line;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: #333;
}

.dark .result-text {
  color: #e2e8f0;
}

.params-tabs {
  height: calc(100% - 60px);
}

.params-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.param-form {
  padding: 8px 0;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #333;
}

.dark .param-label {
  color: #e2e8f0;
}

.param-label .el-icon {
  color: #1976d2;
  cursor: help;
}

.scientific-input {
  position: relative;
}

.scientific-display {
  font-size: 0.8em;
  color: #666;
  margin-top: 4px;
  text-align: right;
  font-family: monospace;
}

.dark .scientific-display {
  color: #a0aec0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .result-card,
  .params-card {
    height: auto;
    margin-bottom: 20px;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}
</style> 