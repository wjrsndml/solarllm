"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Atom, Play, Download, RotateCcw, TrendingUp, AlertTriangle, Lightbulb, Zap } from "lucide-react";
import axios from "axios";

// 钙钛矿带隙预测参数类型定义，基于web中的实现
interface BandgapParams {
  perovskite_type: string;
  // MAPbIBr specific
  Br_percentage?: number;
  // CsMAFAPbIBr specific  
  Cs_ratio?: number;
  FA_ratio?: number;
  I_ratio?: number;
  // MAFA specific
  MA_ratio?: number;
  I_ratio_mafa?: number;
  // CsFA specific
  Cs_ratio_csfa?: number;
  I_ratio_csfa?: number;
}

interface BandgapResult {
  success: boolean;
  bandgap?: number;
  perovskite_type?: string;
  error?: string;
  message?: string;
}

interface PerovskiteTypeConfig {
  name: string;
  label: string;
  description: string;
  formula: string;
  params: Array<{
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    unit?: string;
    description: string;
  }>;
}

export default function BandgapTab() {
  // 钙钛矿类型配置，与web中保持一致
  const perovskiteTypes: Record<string, PerovskiteTypeConfig> = {
    "MAPbIBr": {
      name: "MAPbIBr",
      label: "MA铅碘溴钙钛矿",
      description: "通过调节Br的比例来调控带隙",
      formula: "CH₃NH₃Pb(I₁₋ₓBrₓ)₃",
      params: [
        {
          key: "Br_percentage",
          label: "Br 百分比",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.5,
          unit: "0-1",
          description: "溴离子在卤素离子中的比例，影响材料的带隙宽度"
        }
      ]
    },
    "CsMAFAPbIBr": {
      name: "CsMAFAPbIBr",
      label: "三阳离子铅碘溴钙钛矿",
      description: "Cs, MA, FA三种阳离子的混合钙钛矿",
      formula: "(Cs/MA/FA)Pb(I/Br)₃",
      params: [
        {
          key: "Cs_ratio",
          label: "Cs 比例",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.05,
          unit: "0-1",
          description: "Cs⁺在阳离子中的比例"
        },
        {
          key: "FA_ratio", 
          label: "FA 比例",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.46,
          unit: "0-1",
          description: "FA⁺在阳离子中的比例"
        },
        {
          key: "I_ratio",
          label: "I 比例",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.23,
          unit: "0-1",
          description: "I⁻在卤素离子中的比例"
        }
      ]
    },
    "MAFA": {
      name: "MAFA",
      label: "MA-FA混合钙钛矿",
      description: "MA和FA阳离子的二元混合钙钛矿",
      formula: "(MA₁₋ₓFAₓ)Pb(I₁₋ᵧBrᵧ)₃",
      params: [
        {
          key: "MA_ratio",
          label: "MA 比例",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.49,
          unit: "0-1",
          description: "MA⁺在阳离子中的比例"
        },
        {
          key: "I_ratio_mafa",
          label: "I 比例",
          min: 0,
          max: 1,
          step: 0.01,
          default: 0.88,
          unit: "0-1",
          description: "I⁻在卤素离子中的比例"
        }
      ]
    },
    // "CsFA": {
    //   name: "CsFA",
    //   label: "Cs-FA混合钙钛矿",
    //   description: "Cs和FA阳离子的二元混合钙钛矿",
    //   formula: "(Cs₁₋ₓFAₓ)Pb(I₁₋ᵧBrᵧ)₃",
    //   params: [
    //     {
    //       key: "Cs_ratio_csfa",
    //       label: "Cs 比例",
    //       min: 0,
    //       max: 1,
    //       step: 0.01,
    //       default: 0.2,
    //       unit: "0-1",
    //       description: "Cs⁺在阳离子中的比例"
    //     },
    //     {
    //       key: "I_ratio_csfa",
    //       label: "I 比例",
    //       min: 0,
    //       max: 1,
    //       step: 0.01,
    //       default: 0.7,
    //       unit: "0-1",
    //       description: "I⁻在卤素离子中的比例"
    //     }
    //   ]
    // }
  };

  const [params, setParams] = useState<BandgapParams>({ 
    perovskite_type: "MAPbIBr",
    Br_percentage: 0.5
  });
  const [result, setResult] = useState<BandgapResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("就绪");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComputingRef = useRef(false);

  // 获取当前钙钛矿类型的配置
  const currentConfig = perovskiteTypes[params.perovskite_type];

  // 初始化默认参数
  useEffect(() => {
    const initializeDefaultParams = () => {
      const config = perovskiteTypes[params.perovskite_type];
      if (config) {
        const defaultParams: BandgapParams = { perovskite_type: params.perovskite_type };
        config.params.forEach(param => {
          (defaultParams as any)[param.key] = param.default;
        });
        setParams(defaultParams);
      }
    };

    initializeDefaultParams();
  }, [params.perovskite_type]);

  const handleParamChange = (key: string, value: string | number) => {
    const processedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setParams(prev => ({ ...prev, [key]: processedValue }));
    
    // 触发防抖预测
    debouncedPredict();
  };

  const handleTypeChange = (newType: string) => {
    setParams({ perovskite_type: newType });
    setResult(null);
    setSimulationStatus("就绪");
  };

  const predict = async () => {
    if (isComputingRef.current) {
      return { result: null };
    }

    setIsLoading(true);
    setSimulationStatus("计算中...");
    setResult(null);
    isComputingRef.current = true;
    
    try {
      // 创建API请求参数，需要进行参数键名映射
      let apiParams = { ...params };
      
      // 修复MAFA类型的参数映射
      if (params.perovskite_type === 'MAFA') {
        apiParams = {
          perovskite_type: params.perovskite_type,
          MA_ratio: params.MA_ratio,
          I_ratio: params.I_ratio_mafa  // 映射为后端期望的I_ratio
        };
      }
      // 修复CsFA类型的参数映射  
      else if (params.perovskite_type === 'CsFA') {
        apiParams = {
          perovskite_type: params.perovskite_type,
          Cs_ratio: params.Cs_ratio_csfa,  // 映射为后端期望的Cs_ratio
          I_ratio: params.I_ratio_csfa     // 映射为后端期望的I_ratio
        };
      }
      
      console.log('发送钙钛矿带隙预测请求:', apiParams);
      
      const response = await axios.post("/api/bandgap/predict", apiParams, {
        timeout: 30000,
      });

      console.log('钙钛矿带隙预测响应:', response.data);
      
      // 确保添加success字段
      const resultData = {
        success: true,
        ...response.data
      };
      
      setResult(resultData);
      setSimulationStatus("完成");
      
      return { result: resultData };

    } catch (error) {
      console.error('钙钛矿带隙预测错误:', error);
      
      let errorMessage = '带隙预测失败';
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
      
      return { result: errorResult };
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
    const config = perovskiteTypes[params.perovskite_type];
    if (config) {
      const defaultParams: BandgapParams = { perovskite_type: params.perovskite_type };
      config.params.forEach(param => {
        (defaultParams as any)[param.key] = param.default;
      });
      setParams(defaultParams);
      setResult(null);
      setSimulationStatus("就绪");
    }
  };

  // 初始预测（组件加载后）
  useEffect(() => {
    const timer = setTimeout(() => {
      predict();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 格式化带隙值显示
  const formatBandgap = (value: number): string => {
    if (value < 1.0) return `${(value * 1000).toFixed(0)} meV`;
    return `${value.toFixed(4)} eV`;
  };

  // 计算对应的波长（nm）
  const calculateWavelength = (bandgap: number): number => {
    return 1240 / bandgap; // λ = hc/E = 1240/E(eV) nm
  };

  // 获取光谱区域描述
  const getSpectralRegion = (wavelength: number): string => {
    if (wavelength < 380) return "紫外光";
    if (wavelength < 450) return "紫光";
    if (wavelength < 495) return "蓝光";
    if (wavelength < 570) return "绿光";
    if (wavelength < 590) return "黄光";
    if (wavelength < 620) return "橙光";
    if (wavelength < 750) return "红光";
    if (wavelength < 1000) return "近红外";
    if (wavelength < 2500) return "短波红外";
    return "中红外";
  };

  // 获取应用建议
  const getApplicationSuggestion = (bandgap: number): { title: string; description: string; wavelength: number; spectralRegion: string } => {
    const wavelength = calculateWavelength(bandgap);
    const spectralRegion = getSpectralRegion(wavelength);
    
    if (bandgap < 1.2) {
      return {
        title: "近红外/红外光电器件",
        description: "适合近红外探测器、红外LED、热成像器件等应用",
        wavelength,
        spectralRegion
      };
    } else if (bandgap < 1.6) {
      return {
        title: "太阳能电池优选材料", 
        description: "理想的太阳能电池材料，具有优异的光吸收性能和载流子传输特性",
        wavelength,
        spectralRegion
      };
    } else if (bandgap < 2.0) {
      return {
        title: "可见光LED和激光器",
        description: "适合制备可见光LED、激光二极管和光电探测器",
        wavelength,
        spectralRegion
      };
    } else {
      return {
        title: "宽带隙光电器件",
        description: "适合紫外探测器、高能光子器件和透明导电电极",
        wavelength,
        spectralRegion
      };
    }
  };

  // 获取带隙颜色
  const getBandgapColor = (bandgap: number): string => {
    if (bandgap < 1.2) return "text-red-600";
    if (bandgap < 1.6) return "text-orange-600";
    if (bandgap < 2.0) return "text-green-600";
    return "text-blue-600";
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Atom className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              🔬 钙钛矿带隙预测
            </h2>
            <p className="text-gray-600/80">根据钙钛矿类型和组分比例预测材料的带隙宽度</p>
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
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
        <div className="gradient-card rounded-2xl p-6">
          {/* 钙钛矿类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              钙钛矿类型 <span className="text-indigo-600 ml-1 text-xs">(perovskite_type)</span>
            </label>
            <select
              value={params.perovskite_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 backdrop-blur-sm border-2 border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-indigo-300 hover:shadow-md"
            >
              {Object.entries(perovskiteTypes).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label} ({config.name})
                </option>
              ))}
            </select>
          </div>

          {/* 当前类型信息 */}
          {currentConfig && (
            <div className="mb-6 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🧪</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{currentConfig.label}</h3>
                  <p className="text-sm text-gray-600">{currentConfig.description}</p>
                </div>
              </div>
              
              <div className="bg-gray-100/80 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">分子式</div>
                <div className="font-mono text-lg text-gray-800">{currentConfig.formula}</div>
              </div>
            </div>
          )}

          {/* 参数输入 */}
          {currentConfig && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">组分参数</h3>
                  <p className="text-sm text-gray-600">调整下列参数来预测带隙</p>
                </div>
              </div>

              {currentConfig.params.map((paramConfig) => {
                const currentValue = ((params as any)[paramConfig.key] as number) ?? paramConfig.default;
                
                return (
                  <div key={paramConfig.key} className="space-y-3 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                    <label className="block text-sm font-medium text-gray-700">
                      {paramConfig.label}
                      {paramConfig.unit && <span className="text-gray-500 ml-1">({paramConfig.unit})</span>}
                      <span className="text-indigo-600 ml-1 text-xs">(number)</span>
                    </label>
                    
                    <input
                      type="number"
                      value={currentValue}
                      onChange={(e) => handleParamChange(paramConfig.key, e.target.value)}
                      min={paramConfig.min}
                      max={paramConfig.max}
                      step={paramConfig.step}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 backdrop-blur-sm border-2 border-indigo-200/60 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 text-lg font-medium text-gray-800 hover:border-indigo-300 hover:shadow-md"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>范围: {paramConfig.min} - {paramConfig.max}</span>
                      <span>步长: {paramConfig.step}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{paramConfig.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">带隙预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看带隙结果</p>
              </div>
            ) : result.success && result.bandgap !== undefined ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    <span className={getBandgapColor(result.bandgap)}>
                      {formatBandgap(result.bandgap)}
                    </span>
                  </div>
                  <div className="text-gray-600 text-lg">预测带隙</div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">钙钛矿类型</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.perovskite_type || params.perovskite_type}
                    </div>
                  </div>
                  
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">带隙分类</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.bandgap < 1.2 ? "极窄带隙" : 
                       result.bandgap < 1.6 ? "窄带隙" : 
                       result.bandgap < 2.0 ? "中等带隙" : "宽带隙"}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-800">光学特性与应用建议</span>
                  </div>
                  
                  {(() => {
                    const suggestion = getApplicationSuggestion(result.bandgap);
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/40 rounded-lg p-3">
                            <div className="text-xs text-indigo-700 font-medium">吸收边波长</div>
                            <div className="text-lg font-bold text-indigo-800">
                              {suggestion.wavelength.toFixed(1)} nm
                            </div>
                          </div>
                          <div className="bg-white/40 rounded-lg p-3">
                            <div className="text-xs text-indigo-700 font-medium">光谱区域</div>
                            <div className="text-lg font-bold text-indigo-800">
                              {suggestion.spectralRegion}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-indigo-800 mb-1">{suggestion.title}</div>
                          <div className="text-sm text-indigo-700">{suggestion.description}</div>
                        </div>
                        
                        <div className="text-xs text-indigo-600 bg-white/30 rounded p-2">
                          💡 提示：波长 λ = 1240/E(eV) nm，该材料可吸收波长小于 {suggestion.wavelength.toFixed(1)} nm 的光子
                        </div>
                      </div>
                    );
                  })()}
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

          {/* 参数说明 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-800">参数说明</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-white/30 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">MAPbIBr</div>
                <div>通过调节Br比例控制带隙，Br含量越高带隙越宽</div>
              </div>
              
              <div className="bg-white/30 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">CsMAFAPbIBr</div>
                <div>三阳离子体系，Cs提高稳定性，FA降低带隙，MA平衡性能</div>
              </div>
              
              <div className="bg-white/30 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">MAFA</div>
                <div>MA-FA混合体系，FA含量越高带隙越窄，稳定性更好</div>
              </div>
              
              <div className="bg-white/30 rounded-lg p-3">
                <div className="font-medium text-gray-800 mb-1">CsFA</div>
                <div>Cs-FA二元体系，结合了Cs的稳定性和FA的窄带隙特性</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 