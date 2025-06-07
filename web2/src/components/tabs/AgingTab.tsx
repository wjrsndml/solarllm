"use client";

import { useState } from "react";
import { Clock, Play, RotateCcw, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

interface AgingParams {
  // 环境条件
  temperature: number;
  humidity: number;
  light_intensity: number;
  
  // 材料组成
  MA_ratio: number;
  FA_ratio: number;
  Cs_ratio: number;
  Pb_ratio: number;
  I_ratio: number;
  Br_ratio: number;
  
  // 器件结构
  perovskite_thickness: number;
  ETL_thickness: number;
  HTL_thickness: number;
  
  // 封装参数
  encapsulation_type: string;
  UV_filter: boolean;
  moisture_barrier: boolean;
  
  // 测试条件
  aging_time: number;
  measurement_interval: number;
}

interface AgingResult {
  success: boolean;
  degradation_rate?: number;
  half_life?: number;
  stability_factors?: {
    thermal: number;
    moisture: number;
    light: number;
    overall: number;
  };
  aging_curve?: Array<{ time: number; efficiency: number; power: number }>;
  image_url?: string;
  error?: string;
  message?: string;
}

interface ParamConfig {
  key: keyof AgingParams;
  label: string;
  unit: string;
  type: "number" | "boolean" | "select";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export default function AgingTab() {
  const [params, setParams] = useState<AgingParams>({
    // 环境条件
    temperature: 85,
    humidity: 85,
    light_intensity: 1000,
    
    // 材料组成
    MA_ratio: 0.15,
    FA_ratio: 0.83,
    Cs_ratio: 0.02,
    Pb_ratio: 1.0,
    I_ratio: 2.55,
    Br_ratio: 0.45,
    
    // 器件结构
    perovskite_thickness: 500,
    ETL_thickness: 50,
    HTL_thickness: 200,
    
    // 封装参数
    encapsulation_type: "EVA",
    UV_filter: true,
    moisture_barrier: true,
    
    // 测试条件
    aging_time: 1000,
    measurement_interval: 24,
  });

  const [result, setResult] = useState<AgingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('发送钙钛矿老化预测请求:', params);
      
      const response = await axios.post('/api/aging/predict', params, {
        timeout: 60000,
      });

      console.log('钙钛矿老化预测响应:', response.data);
      setResult(response.data);

    } catch (error) {
      console.error('钙钛矿老化预测错误:', error);
      
      let errorMessage = '老化预测失败';
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
      temperature: 85,
      humidity: 85,
      light_intensity: 1000,
      MA_ratio: 0.15,
      FA_ratio: 0.83,
      Cs_ratio: 0.02,
      Pb_ratio: 1.0,
      I_ratio: 2.55,
      Br_ratio: 0.45,
      perovskite_thickness: 500,
      ETL_thickness: 50,
      HTL_thickness: 200,
      encapsulation_type: "EVA",
      UV_filter: true,
      moisture_barrier: true,
      aging_time: 1000,
      measurement_interval: 24,
    });
    setResult(null);
  };

  const updateParam = (key: keyof AgingParams, value: number | string | boolean) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const paramGroups: Array<{
    title: string;
    icon: string;
    collapsible: boolean;
    params: ParamConfig[];
  }> = [
    {
      title: "环境条件",
      icon: "🌡️",
      collapsible: true,
      params: [
        { key: "temperature", label: "温度", unit: "°C", type: "number", min: 25, max: 150, step: 1 },
        { key: "humidity", label: "相对湿度", unit: "%", type: "number", min: 0, max: 100, step: 1 },
        { key: "light_intensity", label: "光照强度", unit: "W/m²", type: "number", min: 0, max: 2000, step: 10 },
      ]
    },
    {
      title: "钙钛矿组成",
      icon: "🧪",
      collapsible: true,
      params: [
        { key: "MA_ratio", label: "MA比例", unit: "", type: "number", min: 0, max: 1, step: 0.01 },
        { key: "FA_ratio", label: "FA比例", unit: "", type: "number", min: 0, max: 1, step: 0.01 },
        { key: "Cs_ratio", label: "Cs比例", unit: "", type: "number", min: 0, max: 1, step: 0.01 },
        { key: "Pb_ratio", label: "Pb比例", unit: "", type: "number", min: 0, max: 2, step: 0.01 },
        { key: "I_ratio", label: "I比例", unit: "", type: "number", min: 0, max: 3, step: 0.01 },
        { key: "Br_ratio", label: "Br比例", unit: "", type: "number", min: 0, max: 3, step: 0.01 },
      ]
    },
    {
      title: "器件结构",
      icon: "🏗️",
      collapsible: true,
      params: [
        { key: "perovskite_thickness", label: "钙钛矿层厚度", unit: "nm", type: "number", min: 100, max: 1000, step: 10 },
        { key: "ETL_thickness", label: "电子传输层厚度", unit: "nm", type: "number", min: 10, max: 200, step: 5 },
        { key: "HTL_thickness", label: "空穴传输层厚度", unit: "nm", type: "number", min: 50, max: 500, step: 10 },
      ]
    },
    {
      title: "封装参数",
      icon: "📦",
      collapsible: true,
      params: [
        { key: "encapsulation_type", label: "封装材料", unit: "", type: "select", options: ["EVA", "POE", "TPU", "Glass"] },
        { key: "UV_filter", label: "UV滤光", unit: "", type: "boolean" },
        { key: "moisture_barrier", label: "防潮层", unit: "", type: "boolean" },
      ]
    },
    {
      title: "测试条件",
      icon: "⏱️",
      collapsible: false,
      params: [
        { key: "aging_time", label: "老化时间", unit: "小时", type: "number", min: 100, max: 10000, step: 100 },
        { key: "measurement_interval", label: "测量间隔", unit: "小时", type: "number", min: 1, max: 168, step: 1 },
      ]
    }
  ];

  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set([0, 1, 2, 3]));

  const toggleGroup = (index: number) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedGroups(newCollapsed);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ⏰ 钙钛矿老化预测
            </h2>
            <p className="text-gray-600/80">预测钙钛矿太阳能电池在不同环境下的稳定性和寿命</p>
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
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
        <div className="space-y-4 max-h-full overflow-y-auto">
          {paramGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="gradient-card rounded-2xl overflow-hidden">
              <button
                onClick={() => group.collapsible && toggleGroup(groupIndex)}
                className={`w-full flex items-center justify-between p-4 ${
                  group.collapsible ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
                </div>
                {group.collapsible && (
                  <div className={`transform transition-transform ${collapsedGroups.has(groupIndex) ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </button>
              
              {(!group.collapsible || !collapsedGroups.has(groupIndex)) && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.params.map((param) => (
                      <div key={param.key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {param.label}
                          {param.unit && <span className="text-gray-500 ml-1">({param.unit})</span>}
                        </label>
                        
                        {param.type === "boolean" ? (
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={params[param.key] as boolean}
                              onChange={(e) => updateParam(param.key, e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-600">启用</span>
                          </label>
                        ) : param.type === "select" ? (
                          <select
                            value={params[param.key] as string}
                            onChange={(e) => updateParam(param.key, e.target.value)}
                            className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
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
                            className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">老化预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看老化分析结果</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                {result.degradation_rate !== undefined && (
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">降解速率</div>
                    <div className="text-2xl font-bold text-red-600">
                      {(result.degradation_rate * 100).toFixed(2)}% / 1000h
                    </div>
                  </div>
                )}
                
                {result.half_life !== undefined && (
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">预期半衰期</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(result.half_life)} 小时
                    </div>
                    <div className="text-sm text-gray-500">
                      约 {(result.half_life / 24 / 365).toFixed(1)} 年
                    </div>
                  </div>
                )}

                {result.stability_factors && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">稳定性因子分析</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/30 rounded-lg p-3">
                        <div className="text-xs text-gray-600">热稳定性</div>
                        <div className="text-lg font-semibold text-red-600">
                          {(result.stability_factors.thermal * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-white/30 rounded-lg p-3">
                        <div className="text-xs text-gray-600">湿度稳定性</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {(result.stability_factors.moisture * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-white/30 rounded-lg p-3">
                        <div className="text-xs text-gray-600">光稳定性</div>
                        <div className="text-lg font-semibold text-yellow-600">
                          {(result.stability_factors.light * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-white/30 rounded-lg p-3">
                        <div className="text-xs text-gray-600">综合稳定性</div>
                        <div className="text-lg font-semibold text-green-600">
                          {(result.stability_factors.overall * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="text-red-600 font-medium">预测失败</p>
                <p className="text-sm text-gray-600 mt-1">
                  {result.error || result.message || '未知错误'}
                </p>
              </div>
            )}
          </div>

          {/* 老化曲线图 */}
          {result?.success && result.aging_curve && (
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">老化曲线</h3>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.aging_curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#666"
                      label={{ value: '时间 (小时)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      stroke="#666"
                      label={{ value: '效率保持率 (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${parseFloat(value).toFixed(2)}${name === 'efficiency' ? '%' : 'W'}`,
                        name === 'efficiency' ? '效率保持率' : '功率保持率'
                      ]}
                      labelFormatter={(value: any) => `时间: ${value} 小时`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      name="efficiency"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="power" 
                      stroke="#f59e0b" 
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
                <Info className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">老化分析图</h3>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <img
                  src={result.image_url}
                  alt="钙钛矿老化分析结果"
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