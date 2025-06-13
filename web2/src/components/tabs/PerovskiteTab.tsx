"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FlaskConical, Play, Download, RotateCcw, TrendingUp, AlertTriangle, Info, Zap } from "lucide-react";
import axios from "axios";

// 钙钛矿参数类型定义，基于web中的实现
interface PerovskiteParams {
  [key: string]: string | number | boolean;
  perovskite_type: string; // 钙钛矿能带类型，必需字段
}

interface PerovskiteResult {
  success: boolean;
  predictions?: {
    [key: string]: number;
  };
  jv_curve?: string; // base64图片数据
  error?: string;
  message?: string;
}

interface ParamConfig {
  key: string;
  label: string;
  unit?: string;
  description: string;
  min: number;
  max: number;
  step: number;
  group: string;
}

export default function PerovskiteTab() {
  // 钙钛矿参数定义，与web中perovskite_param_definitions保持一致
  const perovskiteParamDefinitions: { [key: string]: ParamConfig } = {
    // HTL Parameters
    'er_HTL_top': { key: 'er_HTL_top', label: 'HTL相对介电常数', min: 1, max: 10, step: 0.1, group: 'HTL', description: 'HTL层的相对介电常数' },
    'x_HTL_top': { key: 'x_HTL_top', label: 'HTL电子亲和能', unit: 'eV', min: 1, max: 5, step: 0.1, group: 'HTL', description: 'HTL层的电子亲和能' },
    'Eg_HTL_top': { key: 'Eg_HTL_top', label: 'HTL带隙', unit: 'eV', min: 1, max: 5, step: 0.1, group: 'HTL', description: 'HTL层的带隙宽度' },
    'Nc_HTL_top': { key: 'Nc_HTL_top', label: 'HTL导带有效态密度', unit: 'cm⁻³', min: 1e18, max: 1e22, step: 1e18, group: 'HTL', description: 'HTL导带有效态密度' },
    'Nv_HTL_top': { key: 'Nv_HTL_top', label: 'HTL价带有效态密度', unit: 'cm⁻³', min: 1e18, max: 1e22, step: 1e18, group: 'HTL', description: 'HTL价带有效态密度' },
    'mun_HTL_top': { key: 'mun_HTL_top', label: 'HTL电子迁移率', unit: 'cm²/Vs', min: 1e-6, max: 1e-2, step: 1e-6, group: 'HTL', description: 'HTL层中电子的迁移率' },
    'mup_HTL_top': { key: 'mup_HTL_top', label: 'HTL空穴迁移率', unit: 'cm²/Vs', min: 1e-4, max: 1, step: 1e-4, group: 'HTL', description: 'HTL层中空穴的迁移率' },
    'tn_HTL_top': { key: 'tn_HTL_top', label: 'HTL电子寿命', unit: 's', min: 1e-9, max: 1e-3, step: 1e-9, group: 'HTL', description: 'HTL层中电子的寿命' },
    'tp_HTL_top': { key: 'tp_HTL_top', label: 'HTL空穴寿命', unit: 's', min: 1e-9, max: 1e-3, step: 1e-9, group: 'HTL', description: 'HTL层中空穴的寿命' },
    't_HTL_top': { key: 't_HTL_top', label: 'HTL厚度', unit: 'μm', min: 0.01, max: 0.2, step: 0.001, group: 'HTL', description: 'HTL层的厚度' },
    'Na_HTL_top': { key: 'Na_HTL_top', label: 'HTL受主掺杂浓度', unit: 'cm⁻³', min: 1e16, max: 1e20, step: 1e16, group: 'HTL', description: 'HTL层受主掺杂浓度' },
    'Nt_HTL_top': { key: 'Nt_HTL_top', label: 'HTL缺陷态密度', unit: 'cm⁻³', min: 1e13, max: 1e18, step: 1e13, group: 'HTL', description: 'HTL层缺陷态密度' },
    
    // ETL Parameters
    'er_ETL_top': { key: 'er_ETL_top', label: 'ETL相对介电常数', min: 1, max: 20, step: 0.1, group: 'ETL', description: 'ETL层的相对介电常数' },
    'x_ETL_top': { key: 'x_ETL_top', label: 'ETL电子亲和能', unit: 'eV', min: 3, max: 6, step: 0.1, group: 'ETL', description: 'ETL层的电子亲和能' },
    'Eg_ETL_top': { key: 'Eg_ETL_top', label: 'ETL带隙', unit: 'eV', min: 1, max: 5, step: 0.1, group: 'ETL', description: 'ETL层的带隙宽度' },
    'Nc_ETL_top': { key: 'Nc_ETL_top', label: 'ETL导带有效态密度', unit: 'cm⁻³', min: 1e17, max: 1e21, step: 1e17, group: 'ETL', description: 'ETL导带有效态密度' },
    'Nv_ETL_top': { key: 'Nv_ETL_top', label: 'ETL价带有效态密度', unit: 'cm⁻³', min: 1e17, max: 1e21, step: 1e17, group: 'ETL', description: 'ETL价带有效态密度' },
    'mun_ETL_top': { key: 'mun_ETL_top', label: 'ETL电子迁移率', unit: 'cm²/Vs', min: 1, max: 1000, step: 10, group: 'ETL', description: 'ETL层中电子的迁移率' },
    'mup_ETL_top': { key: 'mup_ETL_top', label: 'ETL空穴迁移率', unit: 'cm²/Vs', min: 1, max: 1000, step: 10, group: 'ETL', description: 'ETL层中空穴的迁移率' },
    'tn_ETL_top': { key: 'tn_ETL_top', label: 'ETL电子寿命', unit: 's', min: 1e-9, max: 1e-4, step: 1e-9, group: 'ETL', description: 'ETL层中电子的寿命' },
    'tp_ETL_top': { key: 'tp_ETL_top', label: 'ETL空穴寿命', unit: 's', min: 1e-9, max: 1e-4, step: 1e-9, group: 'ETL', description: 'ETL层中空穴的寿命' },
    't_ETL_top': { key: 't_ETL_top', label: 'ETL厚度', unit: 'μm', min: 0.01, max: 0.2, step: 0.001, group: 'ETL', description: 'ETL层的厚度' },
    'Nd_ETL_top': { key: 'Nd_ETL_top', label: 'ETL施主掺杂浓度', unit: 'cm⁻³', min: 1e17, max: 1e21, step: 1e17, group: 'ETL', description: 'ETL层施主掺杂浓度' },
    'Nt_ETL_top': { key: 'Nt_ETL_top', label: 'ETL缺陷态密度', unit: 'cm⁻³', min: 1e13, max: 1e18, step: 1e13, group: 'ETL', description: 'ETL层缺陷态密度' },
    
    // PSK Parameters
    'er_PSK_top': { key: 'er_PSK_top', label: '钙钛矿相对介电常数', min: 1, max: 20, step: 0.1, group: 'PSK', description: '钙钛矿层的相对介电常数' },
    'x_PSK_top': { key: 'x_PSK_top', label: '钙钛矿电子亲和能', unit: 'eV', min: 3, max: 6, step: 0.1, group: 'PSK', description: '钙钛矿层的电子亲和能' },
    'Nc_PSK_top': { key: 'Nc_PSK_top', label: '钙钛矿导带有效态密度', unit: 'cm⁻³', min: 1e15, max: 1e19, step: 1e15, group: 'PSK', description: '钙钛矿导带有效态密度' },
    'Nv_PSK_top': { key: 'Nv_PSK_top', label: '钙钛矿价带有效态密度', unit: 'cm⁻³', min: 1e15, max: 1e19, step: 1e15, group: 'PSK', description: '钙钛矿价带有效态密度' },
    'mun_PSK_top': { key: 'mun_PSK_top', label: '钙钛矿电子迁移率', unit: 'cm²/Vs', min: 1, max: 100, step: 1, group: 'PSK', description: '钙钛矿层中电子的迁移率' },
    'mup_PSK_top': { key: 'mup_PSK_top', label: '钙钛矿空穴迁移率', unit: 'cm²/Vs', min: 1, max: 100, step: 1, group: 'PSK', description: '钙钛矿层中空穴的迁移率' },
    'tn_PSK_top': { key: 'tn_PSK_top', label: '钙钛矿电子寿命', unit: 's', min: 1e-9, max: 1e-5, step: 1e-9, group: 'PSK', description: '钙钛矿层中电子的寿命' },
    'tp_PSK_top': { key: 'tp_PSK_top', label: '钙钛矿空穴寿命', unit: 's', min: 1e-9, max: 1e-5, step: 1e-9, group: 'PSK', description: '钙钛矿层中空穴的寿命' },
    'Eg_PSK_top': { key: 'Eg_PSK_top', label: '钙钛矿带隙', unit: 'eV', min: 1, max: 2, step: 0.01, group: 'PSK', description: '钙钛矿层的带隙宽度' },
    't_PSK_top': { key: 't_PSK_top', label: '钙钛矿厚度', unit: 'μm', min: 0.1, max: 2, step: 0.01, group: 'PSK', description: '钙钛矿层的厚度' },
    'Nd_PSK_top': { key: 'Nd_PSK_top', label: '钙钛矿施主掺杂浓度', unit: 'cm⁻³', min: 1e14, max: 1e18, step: 1e14, group: 'PSK', description: '钙钛矿层施主掺杂浓度' },
    'Nt_PSK_top': { key: 'Nt_PSK_top', label: '钙钛矿缺陷态密度', unit: 'cm⁻³', min: 1e11, max: 1e16, step: 1e11, group: 'PSK', description: '钙钛矿层缺陷态密度' },
    
    // Device/Interface Parameters
    'Cap_area': { key: 'Cap_area', label: '器件面积', unit: 'cm²', min: 1e-18, max: 1e-15, step: 1e-18, group: 'Device', description: '太阳能电池器件的面积' },
    'Dit_top_HTL_PSK': { key: 'Dit_top_HTL_PSK', label: 'HTL/PSK界面缺陷密度', unit: 'cm⁻²', min: 1e8, max: 1e14, step: 1e8, group: 'Device', description: 'HTL与钙钛矿界面的缺陷密度' },
    'Dit_top_ETL_PSK': { key: 'Dit_top_ETL_PSK', label: 'ETL/PSK界面缺陷密度', unit: 'cm⁻²', min: 1e10, max: 1e15, step: 1e10, group: 'Device', description: 'ETL与钙钛矿界面的缺陷密度' }
  };

  const [params, setParams] = useState<PerovskiteParams>({ perovskite_type: "narrow" });
  const [defaultParams, setDefaultParams] = useState<PerovskiteParams | null>(null);
  const [result, setResult] = useState<PerovskiteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("就绪");
  const [activeTab, setActiveTab] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComputingRef = useRef(false);

  // 加载默认参数
  useEffect(() => {
    const loadDefaultParams = async () => {
      try {
        const response = await axios.get("/api/perovskite/default-params");
        const defaultData = response.data;
        setDefaultParams(defaultData);
        setParams(prev => ({ ...defaultData, perovskite_type: "narrow" }));
        console.log('加载钙钛矿默认参数成功:', defaultData);
      } catch (error) {
        console.error('加载钙钛矿默认参数失败:', error);
        // 使用硬编码的默认值
        const fallbackParams: PerovskiteParams = {
          perovskite_type: "narrow",
          er_HTL_top: 3.0,
          x_HTL_top: 2.2,
          Eg_HTL_top: 3.0
        };
        setDefaultParams(fallbackParams);
        setParams(fallbackParams);
      }
    };

    loadDefaultParams();
  }, []);

  // 格式化数值显示
  const formatValueForInput = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') {
      if (value === 0) return "0";
      if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
        return value.toExponential(2);
      }
      return value.toString();
    }
    return String(value);
  };

  const handleParamChange = (key: string, value: string) => {
    // 尝试解析为数值
    let processedValue: string | number = value;
    if (!isNaN(Number(value)) && value.trim() !== '') {
      processedValue = Number(value);
    }
    
    setParams(prev => ({ ...prev, [key]: processedValue }));
    
    // 触发防抖预测
    debouncedPredict();
  };

  const predict = async () => {
    if (isComputingRef.current) {
      return { result: null, jvImage: null };
    }

    setIsLoading(true);
    setSimulationStatus("计算中...");
    setResult(null);
    isComputingRef.current = true;
    
    try {
      console.log('发送钙钛矿参数预测请求:', params);
      
      const response = await axios.post("/api/perovskite/predict", params, {
        timeout: 60000,
      });

      console.log('钙钛矿参数预测响应:', response.data);
      
      // 确保添加success字段
      const resultData = {
        success: true,
        ...response.data
      };
      
      setResult(resultData);
      setSimulationStatus("完成");
      
      return {
        result: resultData,
        jvImage: resultData.jv_curve
      };

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

      const errorResult = {
        success: false,
        error: errorMessage
      };

      setResult(errorResult);
      setSimulationStatus(`出错 (${error instanceof Error ? error.constructor.name : 'Unknown'})`);
      
      return { result: errorResult, jvImage: null };
    } finally {
      setIsLoading(false);
      isComputingRef.current = false;
    }
  };

  // 防抖预测函数
  const debouncedPredict = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      predict();
    }, 500); // 使用500ms延迟
  }, [params]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const resetParams = () => {
    if (defaultParams) {
      setParams({ ...defaultParams, perovskite_type: "narrow" });
      setResult(null);
      setSimulationStatus("就绪");
    }
  };

  // 下载图片功能
  const downloadImage = () => {
    if (result?.jv_curve) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${result.jv_curve}`;
      link.download = 'perovskite_jv_curve.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 初始预测（组件加载后）
  useEffect(() => {
    if (defaultParams) {
      const timer = setTimeout(() => {
        predict();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [defaultParams]);

  // 参数分组
  const paramGroups: Record<string, ParamConfig[]> = {
    "HTL参数": Object.values(perovskiteParamDefinitions).filter(p => p.group === 'HTL'),
    "ETL参数": Object.values(perovskiteParamDefinitions).filter(p => p.group === 'ETL'),
    "钙钛矿层参数": Object.values(perovskiteParamDefinitions).filter(p => p.group === 'PSK'),
    "器件与界面参数": Object.values(perovskiteParamDefinitions).filter(p => p.group === 'Device')
  };

  const tabNames = Object.keys(paramGroups);
  const currentTabParams = paramGroups[tabNames[activeTab]] || [];

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
              💎 钙钛矿参数预测
            </h2>
            <p className="text-gray-600/80">通过调整器件参数预测钙钛矿太阳能电池的光伏性能</p>
            <p className="text-sm text-gray-500 italic">仿真状态: {simulationStatus}</p>
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
            onClick={predict}
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
        {/* 参数输入区域 - 分页式 */}
        <div className="gradient-card rounded-2xl p-6">
          {/* 钙钛矿类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              钙钛矿能带类型 <span className="text-purple-600 ml-1 text-xs">(type)</span>
            </label>
            <select
              value={params.perovskite_type || "narrow"}
              onChange={(e) => handleParamChange("perovskite_type", e.target.value)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-sm border-2 border-purple-200/60 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-purple-300 hover:shadow-md"
            >
              <option value="narrow">窄带隙 (narrow)</option>
              <option value="wide">宽带隙 (wide)</option>
            </select>
            <p className="text-xs text-gray-600 leading-relaxed mt-2">选择窄带隙或宽带隙对应的预设参数集</p>
          </div>

          {/* 标签页导航 */}
          <div className="flex flex-wrap border-b border-gray-200/50 mb-6">
            {tabNames.map((tabName, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                }`}
              >
                <span className="text-lg">
                  {index === 0 ? '🔴' : index === 1 ? '🔵' : index === 2 ? '💎' : '⚙️'}
                </span>
                <span className="hidden sm:inline">{tabName}</span>
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="min-h-[500px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">
                  {activeTab === 0 ? '🔴' : activeTab === 1 ? '🔵' : activeTab === 2 ? '💎' : '⚙️'}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{tabNames[activeTab]}</h3>
                  <p className="text-sm text-gray-600">
                    {currentTabParams.length} 个参数
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {currentTabParams.map((paramInfo: ParamConfig) => {
                  const currentValue = params[paramInfo.key] ?? "";
                  
                  return (
                    <div key={paramInfo.key} className="space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                      <label className="block text-sm font-medium text-gray-700">
                        {paramInfo.label}
                        {paramInfo.unit && <span className="text-gray-500 ml-1">({paramInfo.unit})</span>}
                        <span className="text-purple-600 ml-1 text-xs">(number)</span>
                      </label>
                      
                      <input
                        type="text"
                        value={formatValueForInput(currentValue)}
                        onChange={(e) => handleParamChange(paramInfo.key, e.target.value)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 backdrop-blur-sm border-2 border-purple-200/60 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-purple-300 hover:shadow-md"
                        placeholder="输入数值"
                      />
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>范围: {paramInfo.min} - {paramInfo.max}</span>
                        <span>步长: {paramInfo.step}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{paramInfo.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 标签页底部导航 */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200/50">
            <button
              onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
              disabled={activeTab === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              ← 上一页
            </button>
            
            <div className="flex gap-2">
              {tabNames.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeTab === index ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveTab(Math.min(tabNames.length - 1, activeTab + 1))}
              disabled={activeTab === tabNames.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              下一页 →
            </button>
          </div>
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">光伏性能参数</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看性能参数</p>
              </div>
            ) : result.success && result.predictions ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(result.predictions).map(([key, value]) => (
                    <div key={key} className="bg-white/40 rounded-lg p-4">
                      <div className="text-sm text-gray-600">{key.toUpperCase()}</div>
                      <div className="text-lg font-semibold text-gray-800">
                        {typeof value === 'number' ? value.toFixed(4) : value}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">性能评估</span>
                  </div>
                  <div className="text-lg font-bold text-purple-800">
                    {result.predictions.pce ? `转换效率: ${(result.predictions.pce * 100).toFixed(2)}%` : "计算完成"}
                  </div>
                </div>
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

          {/* JV曲线图 */}
          {result?.success && result.jv_curve && (
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Info className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">JV曲线</h3>
                </div>
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载图片
                </button>
              </div>
              
              <div className="bg-white/20 rounded-lg p-4">
                <img
                  src={`data:image/png;base64,${result.jv_curve}`}
                  alt="钙钛矿JV曲线"
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