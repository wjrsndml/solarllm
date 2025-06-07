"use client";

import { useState } from "react";
import { FlaskConical, Play, RotateCcw, TrendingUp, AlertCircle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

interface PerovskiteParams {
  // HTL参数
  HTL_material: string;
  HTL_thickness: number;
  HTL_conductivity: number;
  HTL_work_function: number;
  
  // ETL参数
  ETL_material: string;
  ETL_thickness: number;
  ETL_electron_mobility: number;
  ETL_conduction_band: number;
  
  // 钙钛矿层参数
  PSK_bandgap: number;
  PSK_thickness: number;
  PSK_grain_size: number;
  PSK_defect_density: number;
  PSK_electron_mobility: number;
  PSK_hole_mobility: number;
  
  // 工艺参数
  annealing_temperature: number;
  annealing_time: number;
  atmosphere: string;
  
  // 环境参数
  temperature: number;
  humidity: number;
  light_intensity: number;
}

interface PredictionResult {
  success: boolean;
  parameters?: {
    voc: number;
    jsc: number;
    ff: number;
    pce: number;
    vmp: number;
    jmp: number;
  };
  jv_curve?: Array<{ voltage: number; current: number; power: number }>;
  image_url?: string;
  error?: string;
  message?: string;
}

export default function PerovskiteTab() {
  const [params, setParams] = useState<PerovskiteParams>({
    // HTL参数
    HTL_material: "Spiro-OMeTAD",
    HTL_thickness: 200,
    HTL_conductivity: 1e-4,
    HTL_work_function: 5.1,
    
    // ETL参数
    ETL_material: "TiO2",
    ETL_thickness: 50,
    ETL_electron_mobility: 20,
    ETL_conduction_band: 4.0,
    
    // 钙钛矿层参数
    PSK_bandgap: 1.55,
    PSK_thickness: 500,
    PSK_grain_size: 1000,
    PSK_defect_density: 1e15,
    PSK_electron_mobility: 25,
    PSK_hole_mobility: 25,
    
    // 工艺参数
    annealing_temperature: 100,
    annealing_time: 10,
    atmosphere: "N2",
    
    // 环境参数
    temperature: 25,
    humidity: 50,
    light_intensity: 1000,
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('发送钙钛矿参数预测请求:', params);
      
      const response = await axios.post('/api/perovskite/predict', params, {
        timeout: 60000,
      });

      console.log('钙钛矿参数预测响应:', response.data);
      setResult(response.data);

    } catch (error) {
      console.error('钙钛矿参数预测错误:', error);
      
      let errorMessage = '参数预测失败';
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetParams = () => {
    setParams({
      HTL_material: "Spiro-OMeTAD",
      HTL_thickness: 200,
      HTL_conductivity: 1e-4,
      HTL_work_function: 5.1,
      ETL_material: "TiO2",
      ETL_thickness: 50,
      ETL_electron_mobility: 20,
      ETL_conduction_band: 4.0,
      PSK_bandgap: 1.55,
      PSK_thickness: 500,
      PSK_grain_size: 1000,
      PSK_defect_density: 1e15,
      PSK_electron_mobility: 25,
      PSK_hole_mobility: 25,
      annealing_temperature: 100,
      annealing_time: 10,
      atmosphere: "N2",
      temperature: 25,
      humidity: 50,
      light_intensity: 1000,
    });
    setResult(null);
  };

  const updateParam = (key: keyof PerovskiteParams, value: number | string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const paramGroups = [
    {
      title: "空穴传输层 (HTL)",
      icon: "🔴",
      params: [
        { key: "HTL_material" as keyof PerovskiteParams, label: "HTL材料", type: "select", options: ["Spiro-OMeTAD", "PTAA", "P3HT", "NiOx"] },
        { key: "HTL_thickness" as keyof PerovskiteParams, label: "厚度", unit: "nm", type: "number", min: 50, max: 500, step: 10 },
        { key: "HTL_conductivity" as keyof PerovskiteParams, label: "电导率", unit: "S/cm", type: "number", min: 1e-6, max: 1e-2, step: 1e-6 },
        { key: "HTL_work_function" as keyof PerovskiteParams, label: "功函数", unit: "eV", type: "number", min: 4.5, max: 5.5, step: 0.1 },
      ]
    },
    {
      title: "电子传输层 (ETL)",
      icon: "🔵",
      params: [
        { key: "ETL_material" as keyof PerovskiteParams, label: "ETL材料", type: "select", options: ["TiO2", "SnO2", "ZnO", "PCBM"] },
        { key: "ETL_thickness" as keyof PerovskiteParams, label: "厚度", unit: "nm", type: "number", min: 20, max: 200, step: 5 },
        { key: "ETL_electron_mobility" as keyof PerovskiteParams, label: "电子迁移率", unit: "cm²/V·s", type: "number", min: 1, max: 100, step: 1 },
        { key: "ETL_conduction_band" as keyof PerovskiteParams, label: "导带位置", unit: "eV", type: "number", min: 3.5, max: 4.5, step: 0.1 },
      ]
    },
    {
      title: "钙钛矿层 (PSK)",
      icon: "💎",
      params: [
        { key: "PSK_bandgap" as keyof PerovskiteParams, label: "带隙", unit: "eV", type: "number", min: 1.2, max: 2.0, step: 0.01 },
        { key: "PSK_thickness" as keyof PerovskiteParams, label: "厚度", unit: "nm", type: "number", min: 200, max: 1000, step: 10 },
        { key: "PSK_grain_size" as keyof PerovskiteParams, label: "晶粒尺寸", unit: "nm", type: "number", min: 100, max: 5000, step: 100 },
        { key: "PSK_defect_density" as keyof PerovskiteParams, label: "缺陷密度", unit: "cm⁻³", type: "number", min: 1e14, max: 1e17, step: 1e14 },
        { key: "PSK_electron_mobility" as keyof PerovskiteParams, label: "电子迁移率", unit: "cm²/V·s", type: "number", min: 1, max: 100, step: 1 },
        { key: "PSK_hole_mobility" as keyof PerovskiteParams, label: "空穴迁移率", unit: "cm²/V·s", type: "number", min: 1, max: 100, step: 1 },
      ]
    },
    {
      title: "工艺条件",
      icon: "🔥",
      params: [
        { key: "annealing_temperature" as keyof PerovskiteParams, label: "退火温度", unit: "°C", type: "number", min: 80, max: 150, step: 5 },
        { key: "annealing_time" as keyof PerovskiteParams, label: "退火时间", unit: "分钟", type: "number", min: 1, max: 60, step: 1 },
        { key: "atmosphere" as keyof PerovskiteParams, label: "气氛", type: "select", options: ["Air", "N2", "Ar", "Vacuum"] },
      ]
    },
    {
      title: "测试环境",
      icon: "🌡️",
      params: [
        { key: "temperature" as keyof PerovskiteParams, label: "温度", unit: "°C", type: "number", min: 15, max: 40, step: 1 },
        { key: "humidity" as keyof PerovskiteParams, label: "湿度", unit: "%", type: "number", min: 20, max: 80, step: 5 },
        { key: "light_intensity" as keyof PerovskiteParams, label: "光照强度", unit: "W/m²", type: "number", min: 500, max: 1500, step: 50 },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🧪 钙钛矿参数预测
            </h2>
            <p className="text-gray-600/80">基于器件结构和材料参数预测钙钛矿电池性能</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={resetParams}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4" />
            重置参数
          </button>
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                预测中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                开始预测
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 参数输入区域 */}
        <div className="space-y-6">
          {paramGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {param.label}
                      {param.unit && <span className="text-gray-500 ml-1">({param.unit})</span>}
                    </label>
                    
                    {param.type === "select" ? (
                      <select
                        value={params[param.key] as string}
                        onChange={(e) => updateParam(param.key, e.target.value)}
                        className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      >
                        {param.options?.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={params[param.key] as number}
                        onChange={(e) => updateParam(param.key, parseFloat(e.target.value) || 0)}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <FlaskConical className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看结果</p>
              </div>
            ) : result.success && result.parameters ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">开路电压 (Voc)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.parameters.voc.toFixed(3)} V
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">短路电流密度 (Jsc)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.parameters.jsc.toFixed(2)} mA/cm²
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">填充因子 (FF)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {(result.parameters.ff * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">最大功率点电压 (Vmp)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.parameters.vmp.toFixed(3)} V
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">功率转换效率</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {(result.parameters.pce * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="text-red-600 font-medium">预测失败</p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.error || result.message || '未知错误'}
                </p>
              </div>
            )}
          </div>

          {/* JV曲线图 */}
          {result?.success && result.jv_curve && (
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">J-V特性曲线</h3>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.jv_curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="voltage" 
                      stroke="#666"
                      label={{ value: '电压 (V)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      stroke="#666"
                      label={{ value: '电流密度 (mA/cm²)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${parseFloat(value).toFixed(3)} ${name === 'current' ? 'mA/cm²' : 'mW/cm²'}`,
                        name === 'current' ? '电流密度' : '功率密度'
                      ]}
                      labelFormatter={(value: any) => `电压: ${parseFloat(value).toFixed(3)} V`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={false}
                      name="current"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="power" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      dot={false}
                      name="power"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 生成的图片 */}
          {result?.success && result.image_url && (
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">仿真结果图</h3>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <img
                  src={result.image_url}
                  alt="钙钛矿参数预测结果"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-red-500 text-center p-4';
                    errorDiv.textContent = '图片加载失败';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 