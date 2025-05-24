<template>
  <div class="perovskite-container">
    <el-card class="card-shadow">
      <template #header>
        <div class="card-header">
          <h2>🧪 钙钛矿电池参数预测</h2>
          <p>基于材料组分和工艺参数预测钙钛矿电池性能</p>
        </div>
      </template>
      
      <div class="content-area">
        <el-row :gutter="24">
          <el-col :span="14">
            <div class="form-section">
              <h3>🔬 材料与工艺参数</h3>
              <el-form :model="params" label-position="top">
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="材料组分" name="material">
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <el-form-item label="钙钛矿层厚度 (nm)">
                          <el-input-number v-model="params.thickness" :min="100" :max="1000" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="带隙 (eV)">
                          <el-input-number v-model="params.bandgap" :min="1.0" :max="2.0" :step="0.01" :precision="2" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                    
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <el-form-item label="载流子迁移率 (cm²/V·s)">
                          <el-input-number v-model="params.mobility" :min="1" :max="100" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="载流子寿命 (μs)">
                          <el-input-number v-model="params.lifetime" :min="0.1" :max="10" :step="0.1" :precision="1" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-tab-pane>
                  
                  <el-tab-pane label="界面层" name="interface">
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <el-form-item label="电子传输层类型">
                          <el-select v-model="params.etlType" style="width: 100%">
                            <el-option label="TiO2" value="TiO2" />
                            <el-option label="SnO2" value="SnO2" />
                            <el-option label="ZnO" value="ZnO" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="空穴传输层类型">
                          <el-select v-model="params.htlType" style="width: 100%">
                            <el-option label="Spiro-OMeTAD" value="Spiro-OMeTAD" />
                            <el-option label="PTAA" value="PTAA" />
                            <el-option label="P3HT" value="P3HT" />
                          </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <el-form-item label="ETL厚度 (nm)">
                          <el-input-number v-model="params.etlThickness" :min="10" :max="100" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="HTL厚度 (nm)">
                          <el-input-number v-model="params.htlThickness" :min="50" :max="300" style="width: 100%" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-tab-pane>
                </el-tabs>
                
                <el-form-item style="margin-top: 20px;">
                  <el-button type="primary" @click="predict" :loading="isLoading" class="gradient-btn">
                    开始预测
                  </el-button>
                  <el-button @click="reset">重置参数</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          
          <el-col :span="10">
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
                <el-icon size="48"><Operation /></el-icon>
                <p>配置参数并开始预测</p>
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
const activeTab = ref('material')

const params = ref({
  thickness: 500,
  bandgap: 1.55,
  mobility: 25,
  lifetime: 1.5,
  etlType: 'TiO2',
  htlType: 'Spiro-OMeTAD',
  etlThickness: 30,
  htlThickness: 150
})

const predict = async () => {
  isLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    result.value = `钙钛矿电池性能预测：

器件结构：
- 钙钛矿层: ${params.value.thickness} nm
- ETL: ${params.value.etlType} (${params.value.etlThickness} nm)
- HTL: ${params.value.htlType} (${params.value.htlThickness} nm)

材料特性：
- 带隙: ${params.value.bandgap} eV
- 载流子迁移率: ${params.value.mobility} cm²/V·s
- 载流子寿命: ${params.value.lifetime} μs

预测性能：
- 开路电压 (Voc): 1.12 V
- 短路电流密度 (Jsc): 24.8 mA/cm²
- 填充因子 (FF): 78.5%
- 转换效率 (η): 21.8%

优化建议：
1. 适当增加钙钛矿层厚度可提升光吸收
2. 优化界面层厚度以减少串联电阻
3. 考虑添加缓冲层改善界面质量`
  } catch (error) {
    console.error('预测失败:', error)
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  params.value = {
    thickness: 500,
    bandgap: 1.55,
    mobility: 25,
    lifetime: 1.5,
    etlType: 'TiO2',
    htlType: 'Spiro-OMeTAD',
    etlThickness: 30,
    htlThickness: 150
  }
  result.value = ''
}
</script>

<style scoped>
.perovskite-container {
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