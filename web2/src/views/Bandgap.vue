<template>
  <div class="bandgap-container">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <h2>🔷 钙钛矿带隙预测</h2>
          <p>基于材料组分计算钙钛矿材料的带隙值</p>
        </div>
      </template>
      
      <div class="content-area">
        <el-row :gutter="24">
          <el-col :span="16">
            <div class="form-section">
              <h3>⚗️ 材料组分配置</h3>
              <el-form :model="params" label-position="top">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="A位阳离子">
                      <el-select v-model="params.aCation" style="width: 100%">
                        <el-option label="MA (甲胺)" value="MA" />
                        <el-option label="FA (甲脒)" value="FA" />
                        <el-option label="Cs (铯)" value="Cs" />
                        <el-option label="Rb (铷)" value="Rb" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="B位金属离子">
                      <el-select v-model="params.bCation" style="width: 100%">
                        <el-option label="Pb (铅)" value="Pb" />
                        <el-option label="Sn (锡)" value="Sn" />
                        <el-option label="Ge (锗)" value="Ge" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="X位卤素离子">
                      <el-select v-model="params.xAnion" style="width: 100%">
                        <el-option label="I (碘)" value="I" />
                        <el-option label="Br (溴)" value="Br" />
                        <el-option label="Cl (氯)" value="Cl" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-divider content-position="left">混合比例 (可选)</el-divider>
                
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="A位混合比例">
                      <el-slider
                        v-model="params.aMixRatio"
                        :min="0"
                        :max="100"
                        show-input
                        :format-tooltip="(val) => `${val}%`"
                      />
                      <div class="ratio-label">
                        {{ params.aCation }}: {{ params.aMixRatio }}% / 其他: {{ 100 - params.aMixRatio }}%
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="X位混合比例">
                      <el-slider
                        v-model="params.xMixRatio"
                        :min="0"
                        :max="100"
                        show-input
                        :format-tooltip="(val) => `${val}%`"
                      />
                      <div class="ratio-label">
                        {{ params.xAnion }}: {{ params.xMixRatio }}% / 其他: {{ 100 - params.xMixRatio }}%
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item style="margin-top: 30px;">
                  <el-button type="primary" @click="predict" :loading="isLoading" class="gradient-btn">
                    计算带隙
                  </el-button>
                  <el-button @click="reset">重置参数</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="result-section">
              <h3>📊 计算结果</h3>
              <div v-if="result" class="result-content">
                <el-alert
                  title="计算完成"
                  type="success"
                  :closable="false"
                  show-icon
                />
                <div class="bandgap-display">
                  <div class="bandgap-value">
                    {{ result.bandgap }} eV
                  </div>
                  <div class="bandgap-label">预测带隙值</div>
                </div>
                <div class="result-details">
                  <h4>材料信息：</h4>
                  <p><strong>化学式：</strong> {{ result.formula }}</p>
                  <p><strong>晶体结构：</strong> {{ result.structure }}</p>
                  <p><strong>稳定性：</strong> {{ result.stability }}</p>
                  
                  <h4>光学特性：</h4>
                  <p><strong>吸收边：</strong> {{ result.absorptionEdge }} nm</p>
                  <p><strong>理论效率：</strong> {{ result.theoreticalEfficiency }}%</p>
                  
                  <h4>应用建议：</h4>
                  <p>{{ result.recommendation }}</p>
                </div>
              </div>
              <div v-else class="result-placeholder">
                <el-icon size="48"><Promotion /></el-icon>
                <p>选择材料组分并计算带隙</p>
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
const result = ref<any>(null)

const params = ref({
  aCation: 'MA',
  bCation: 'Pb',
  xAnion: 'I',
  aMixRatio: 100,
  xMixRatio: 100
})

const predict = async () => {
  isLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 简化的带隙计算逻辑
    let bandgap = 1.55 // 基础值 MAPbI3
    
    // 根据组分调整带隙
    if (params.value.aCation === 'FA') bandgap -= 0.02
    if (params.value.aCation === 'Cs') bandgap += 0.15
    if (params.value.bCation === 'Sn') bandgap -= 0.35
    if (params.value.xAnion === 'Br') bandgap += 0.75
    if (params.value.xAnion === 'Cl') bandgap += 1.45
    
    // 混合比例影响
    if (params.value.aMixRatio < 100) {
      bandgap += (100 - params.value.aMixRatio) * 0.001
    }
    if (params.value.xMixRatio < 100) {
      bandgap += (100 - params.value.xMixRatio) * 0.005
    }
    
    const formula = `${params.value.aCation}${params.value.bCation}${params.value.xAnion}3`
    const absorptionEdge = Math.round(1240 / bandgap)
    const theoreticalEfficiency = Math.min(33.7 * (1 - 0.3 * Math.abs(bandgap - 1.34)), 31)
    
    result.value = {
      bandgap: bandgap.toFixed(3),
      formula,
      structure: '立方钙钛矿结构',
      stability: bandgap > 1.2 && bandgap < 2.0 ? '稳定' : '相对不稳定',
      absorptionEdge,
      theoreticalEfficiency: theoreticalEfficiency.toFixed(1),
      recommendation: bandgap >= 1.1 && bandgap <= 1.8 
        ? '适合用于单结太阳能电池' 
        : bandgap > 1.8 
        ? '适合用于叠层电池的顶电池' 
        : '带隙偏小，可能存在稳定性问题'
    }
  } catch (error) {
    console.error('计算失败:', error)
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  params.value = {
    aCation: 'MA',
    bCation: 'Pb',
    xAnion: 'I',
    aMixRatio: 100,
    xMixRatio: 100
  }
  result.value = null
}
</script>

<style scoped>
.bandgap-container {
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
  min-height: 600px;
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

.ratio-label {
  font-size: 0.85em;
  color: #666;
  margin-top: 8px;
  text-align: center;
}

.result-content {
  margin-top: 16px;
}

.bandgap-display {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
}

.bandgap-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 8px;
}

.bandgap-label {
  font-size: 1em;
  color: #666;
}

.result-details {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.result-details h4 {
  margin: 16px 0 8px 0;
  color: #1976d2;
  font-size: 1em;
}

.result-details h4:first-child {
  margin-top: 0;
}

.result-details p {
  margin: 4px 0;
  font-size: 0.9em;
  line-height: 1.5;
}

.dark .result-details {
  background: #2d3748;
  color: #e2e8f0;
}

.dark .bandgap-display {
  background: linear-gradient(135deg, #2d3748, #4a5568);
}

.dark .bandgap-label {
  color: #a0aec0;
}

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

.dark .result-placeholder {
  background: linear-gradient(135deg, #2d3748, #1a202c);
  border-color: #4a5568;
  color: #a0aec0;
}
</style> 