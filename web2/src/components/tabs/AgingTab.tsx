"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Play, Download, RotateCcw, TrendingDown, AlertTriangle, Info } from "lucide-react";
import axios from "axios";

// 所有老化参数的类型定义，基于web中的实现
interface AgingParams {
  [key: string]: string | number | boolean;
}

interface AgingResult {
  success: boolean;
  curve_data?: {
    x_values: number[];
    y_values: number[];
    file_path?: string;
  };
  curve_image?: string; // base64 图片数据
  error?: string;
  message?: string;
}

interface ParamConfig {
  key: string;
  label: string;
  unit?: string;
  description: string;
  type: "text" | "number" | "boolean";
  step?: number;
}

export default function AgingTab() {
  // 所有老化参数名，与web中保持一致
  const agingParamNames = [
    'Cell_architecture', 'Substrate_stack_sequence', 'Substrate_thickness',
    'ETL_stack_sequence', 'ETL_thickness', 'ETL_additives_compounds',
    'ETL_deposition_procedure', 'ETL_deposition_synthesis_atmosphere',
    'ETL_deposition_solvents', 'ETL_deposition_substrate_temperature',
    'ETL_deposition_thermal_annealing_temperature', 'ETL_deposition_thermal_annealing_time',
    'ETL_deposition_thermal_annealing_atmosphere', 'ETL_storage_atmosphere',
    'Perovskite_dimension_0D', 'Perovskite_dimension_2D', 'Perovskite_dimension_2D3D_mixture',
    'Perovskite_dimension_3D', 'Perovskite_dimension_3D_with_2D_capping_layer',
    'Perovskite_composition_a_ions', 'Perovskite_composition_a_ions_coefficients',
    'Perovskite_composition_b_ions', 'Perovskite_composition_b_ions_coefficients',
    'Perovskite_composition_c_ions', 'Perovskite_composition_c_ions_coefficients',
    'Perovskite_composition_inorganic', 'Perovskite_composition_leadfree',
    'Perovskite_additives_compounds', 'Perovskite_thickness', 'Perovskite_band_gap',
    'Perovskite_pl_max', 'Perovskite_deposition_number_of_deposition_steps',
    'Perovskite_deposition_procedure', 'Perovskite_deposition_aggregation_state_of_reactants',
    'Perovskite_deposition_synthesis_atmosphere', 'Perovskite_deposition_solvents',
    'Perovskite_deposition_substrate_temperature', 'Perovskite_deposition_quenching_induced_crystallisation',
    'Perovskite_deposition_quenching_media', 'Perovskite_deposition_thermal_annealing_temperature',
    'Perovskite_deposition_thermal_annealing_time', 'Perovskite_deposition_thermal_annealing_atmosphere',
    'Perovskite_deposition_solvent_annealing', 'HTL_stack_sequence', 'HTL_thickness_list',
    'HTL_additives_compounds', 'HTL_deposition_procedure', 'HTL_deposition_aggregation_state_of_reactants',
    'HTL_deposition_synthesis_atmosphere', 'HTL_deposition_solvents',
    'HTL_deposition_thermal_annealing_temperature', 'HTL_deposition_thermal_annealing_time',
    'HTL_deposition_thermal_annealing_atmosphere', 'Backcontact_stack_sequence',
    'Backcontact_thickness_list', 'Backcontact_deposition_procedure',
    'Encapsulation', 'Encapsulation_stack_sequence', 'Encapsulation_edge_sealing_materials',
    'Encapsulation_atmosphere_for_encapsulation', 'JV_default_Voc', 'JV_default_Jsc',
    'JV_default_FF', 'JV_default_PCE', 'Stability_protocol',
    'Stability_average_over_n_number_of_cells', 'Stability_light_intensity',
    'Stability_light_spectra', 'Stability_light_UV_filter',
    'Stability_potential_bias_load_condition', 'Stability_PCE_burn_in_observed',
    'Stability_light_source_type', 'Stability_temperature_range',
    'Stability_atmosphere', 'Stability_relative_humidity_average_value'
  ];

  const [params, setParams] = useState<AgingParams>({});
  const [defaultParams, setDefaultParams] = useState<AgingParams | null>(null);
  const [result, setResult] = useState<AgingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("就绪");
  const [activeTab, setActiveTab] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComputingRef = useRef(false);

  // 加载默认参数
  useEffect(() => {
    const loadDefaultParams = async () => {
      try {
        const response = await axios.get("/api/aging/default-params");
        const defaultData = response.data;
        setDefaultParams(defaultData);
        setParams(defaultData);
        console.log('加载老化默认参数成功:', defaultData);
      } catch (error) {
        console.error('加载老化默认参数失败:', error);
        // 使用硬编码的默认值
        const fallbackParams: AgingParams = {};
        agingParamNames.forEach(name => {
          if (name.includes('temperature')) {
            fallbackParams[name] = 85;
          } else if (name.includes('thickness')) {
            fallbackParams[name] = 100;
          } else if (name.includes('dimension') || name.includes('_observed') || name.includes('_filter')) {
            fallbackParams[name] = false;
          } else {
            fallbackParams[name] = "";
          }
        });
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
    // 尝试解析为数值或布尔值
    let processedValue: string | number | boolean = value;
    
    if (value.toLowerCase() === 'true') {
      processedValue = true;
    } else if (value.toLowerCase() === 'false') {
      processedValue = false;
    } else if (!isNaN(Number(value)) && value.trim() !== '') {
      processedValue = Number(value);
    }
    
    setParams(prev => ({ ...prev, [key]: processedValue }));
    
    // 触发防抖预测
    debouncedPredict();
  };

  const predict = async () => {
    if (isComputingRef.current) {
      return { result: null, curveImage: null };
    }

    setIsLoading(true);
    setSimulationStatus("计算中...");
    setResult(null);
    isComputingRef.current = true;
    
    try {
      console.log('发送钙钛矿老化预测请求:', params);
      
      const response = await axios.post("/api/aging/predict", params, {
        timeout: 120000, // 老化预测可能需要更长时间
      });

      console.log('钙钛矿老化预测响应:', response.data);
      
      // 确保添加success字段
      const resultData = {
        success: true,
        ...response.data
      };
      
      setResult(resultData);
      setSimulationStatus("完成");
      
      return {
        result: resultData,
        curveImage: resultData.curve_image
      };

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

      const errorResult = {
        success: false,
        error: errorMessage
      };

      setResult(errorResult);
      setSimulationStatus(`出错 (${error instanceof Error ? error.constructor.name : 'Unknown'})`);
      
      return { result: errorResult, curveImage: null };
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
    }, 1000); // 老化预测使用1秒延迟，因为参数较多
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
      setParams(defaultParams);
      setResult(null);
      setSimulationStatus("就绪");
    }
  };

  // 下载图片功能
  const downloadImage = () => {
    if (result?.curve_image) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${result.curve_image}`;
      link.download = 'aging_curve.png';
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

  // 参数分组，每页显示12个参数
  const paramsPerPage = 12;
  const totalPages = Math.ceil(agingParamNames.length / paramsPerPage);
  
  const getCurrentPageParams = () => {
    const startIndex = activeTab * paramsPerPage;
    const endIndex = Math.min(startIndex + paramsPerPage, agingParamNames.length);
    return agingParamNames.slice(startIndex, endIndex);
  };

  // 获取参数的友好显示名称和描述
  const getParamDisplayInfo = (paramName: string): ParamConfig => {
    const parts = paramName.split('_');
    const category = parts[0];
    const field = parts.slice(1).join(' ');
    
    return {
      key: paramName,
      label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
      description: `${category} - ${field}`,
      type: paramName.includes('dimension') || paramName.includes('_observed') || paramName.includes('_filter') ? 'boolean' : 
            paramName.includes('thickness') || paramName.includes('temperature') || paramName.includes('time') || 
            paramName.includes('intensity') || paramName.includes('gap') || paramName.includes('Voc') || 
            paramName.includes('Jsc') || paramName.includes('FF') || paramName.includes('PCE') ? 'number' : 'text',
      step: paramName.includes('temperature') ? 1 : 
            paramName.includes('thickness') ? 10 : 
            paramName.includes('time') ? 1 : 0.01
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              🔬 钙钛矿老化预测
            </h2>
            <p className="text-gray-600/80">通过调整参数预测钙钛矿太阳能电池的长期稳定性</p>
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
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
          {/* 标签页导航 */}
          <div className="flex flex-wrap border-b border-gray-200/50 mb-6">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                }`}
              >
                <span className="text-lg">📋</span>
                <span className="hidden sm:inline">参数组 {index + 1}</span>
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="min-h-[500px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📋</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">参数组 {activeTab + 1}</h3>
                  <p className="text-sm text-gray-600">
                    第 {activeTab * paramsPerPage + 1} - {Math.min((activeTab + 1) * paramsPerPage, agingParamNames.length)} 个参数
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {getCurrentPageParams().map((paramName) => {
                  const paramInfo = getParamDisplayInfo(paramName);
                  const currentValue = params[paramName] ?? "";
                  
                  return (
                    <div key={paramName} className="space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                      <label className="block text-sm font-medium text-gray-700">
                        {paramInfo.label}
                        <span className="text-orange-600 ml-1 text-xs">({paramInfo.type})</span>
                      </label>
                      
                      {paramInfo.type === 'boolean' ? (
                        <select
                          value={formatValueForInput(currentValue)}
                          onChange={(e) => handleParamChange(paramName, e.target.value)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm border-2 border-orange-200/60 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-orange-300 hover:shadow-md"
                        >
                          <option value="false">False</option>
                          <option value="true">True</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formatValueForInput(currentValue)}
                          onChange={(e) => handleParamChange(paramName, e.target.value)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm border-2 border-orange-200/60 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-orange-300 hover:shadow-md"
                          placeholder={paramInfo.type === 'number' ? "输入数值" : "输入文本"}
                        />
                      )}
                      
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
              {Array.from({ length: totalPages }, (_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeTab === index ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveTab(Math.min(totalPages - 1, activeTab + 1))}
              disabled={activeTab === totalPages - 1}
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
              <TrendingDown className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">老化预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看老化曲线</p>
              </div>
            ) : result.success && result.curve_data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">初始效率</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {(result.curve_data.y_values[0] * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">最终效率</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {(result.curve_data.y_values[result.curve_data.y_values.length - 1] * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">效率保持率</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {((result.curve_data.y_values[result.curve_data.y_values.length - 1] / result.curve_data.y_values[0]) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">稳定性评估</span>
                  </div>
                  <div className="text-lg font-bold text-orange-800">
                    {result.curve_data.y_values.length > 0 ? "数据收集完成" : "无数据"}
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

          {/* 老化曲线图 */}
          {result?.success && result.curve_image && (
            <div className="gradient-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Info className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">老化曲线</h3>
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
                  src={`data:image/png;base64,${result.curve_image}`}
                  alt="钙钛矿老化曲线"
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