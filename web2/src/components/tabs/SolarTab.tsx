"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Download, RotateCcw, TrendingUp, AlertCircle, Info } from "lucide-react";
import axios from "axios";
import AIChat from "@/components/AIChat";
import TOPConModel from "@/components/TOPConModel";

interface SolarParams {
  Si_thk: number;
  t_SiO2: number;
  t_polySi_rear_P: number;
  front_junc: number;
  rear_junc: number;
  resist_rear: number;
  Nd_top: number;
  Nd_rear: number;
  Nt_polySi_top: number;
  Nt_polySi_rear: number;
  Dit_Si_SiOx: number;
  Dit_SiOx_Poly: number;
  Dit_top: number;
}

interface PredictionResult {
  success: boolean;
  predictions?: {
    Vm: number;
    Im: number;
    Voc: number;
    Jsc: number;
    FF: number;
    Eff: number;
  };
  jv_curve?: string; // base64 图片数据
  error?: string;
  message?: string;
}

export default function SolarTab() {
  const [params, setParams] = useState<SolarParams>({
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
    Dit_top: 1e10,
  });

  const [defaultParams, setDefaultParams] = useState<SolarParams | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("就绪");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComputingRef = useRef(false);

  // 加载默认参数
  useEffect(() => {
    const loadDefaultParams = async () => {
      try {
        const response = await axios.get("/api/solar/default-params");
        const defaultData = response.data;
        setDefaultParams(defaultData);
        setParams(defaultData);
        console.log('加载默认参数成功:', defaultData);
      } catch (error) {
        console.error('加载默认参数失败:', error);
        // 使用硬编码的默认值
        const fallbackParams = {
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
          Dit_top: 1e10,
        };
        setDefaultParams(fallbackParams);
        setParams(fallbackParams);
      }
    };

    loadDefaultParams();
  }, []);

  // 格式化数值显示：科学计数法用于大数和小数
  const formatValueForInput = (value: number): string => {
    if (value === 0) return "0";
    if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
      return value.toExponential(2);
    }
    return value.toString();
  };

  // 格式化数值显示：用于显示当前值
  const formatValueForDisplay = (value: number): string => {
    if (value === 0) return "0";
    if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
      return value.toExponential(2);
    }
    return value.toString();
  };

  // AI对话专用的预测函数
  const predictWithParams = async (simulationParams: SolarParams) => {
    if (isComputingRef.current) {
      return { success: false, error: "正在计算中，请等待完成" };
    }

    setIsLoading(true);
    setSimulationStatus("计算中...");
    isComputingRef.current = true;
    
    try {
      console.log('发送硅电池预测请求:', simulationParams);
      
      const response = await axios.post("/api/solar/predict", simulationParams, {
        timeout: 60000,
      });

      console.log('硅电池预测响应:', response.data);
      
      // 确保添加success字段
      const resultData = {
        success: true,
        ...response.data
      };
      
      // 只有在预测成功时才更新UI状态
      if (resultData.success) {
        setParams(simulationParams);
        setResult(resultData);
        setSimulationStatus("完成");
      }
      
      return resultData;

    } catch (error) {
      console.error('硅电池预测错误:', error);
      
      let errorMessage = '预测失败';
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

      setSimulationStatus(`出错 (${error instanceof Error ? error.constructor.name : 'Unknown'})`);
      
      return errorResult;
    } finally {
      setIsLoading(false);
      isComputingRef.current = false;
    }
  };

  // 原有的预测函数
  const predict = async () => {
    if (isComputingRef.current) {
      return { success: false, error: "正在计算中，请等待完成" };
    }

    setIsLoading(true);
    setSimulationStatus("计算中...");
    setResult(null);
    isComputingRef.current = true;
    
    try {
      console.log('发送硅电池预测请求:', params);
      
      const response = await axios.post("/api/solar/predict", params, {
        timeout: 60000,
      });

      console.log('硅电池预测响应:', response.data);
      
      // 确保添加success字段
      const resultData = {
        success: true,
        ...response.data
      };
      
      setResult(resultData);
      setSimulationStatus("完成");
      
      return resultData;

    } catch (error) {
      console.error('硅电池预测错误:', error);
      
      let errorMessage = '预测失败';
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
      
      return errorResult;
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
    }, 500); // 500ms 延迟
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
    if (result?.jv_curve) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${result.jv_curve}`;
      link.download = 'jv_curve.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 初始预测（组件加载后）
  useEffect(() => {
    if (defaultParams) {
      // 延迟一点时间确保UI完全加载
      const timer = setTimeout(() => {
        predict();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [defaultParams]);

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ⚡ 硅电池参数预测
            </h2>
            <p className="text-gray-600/80">通过调整参数预测硅太阳能电池性能</p>
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
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：TOPCon电池模型 */}
                  <div>
          <TOPConModel
            params={params}
            onParamChange={(key, value) => {
              setParams(prev => ({ ...prev, [key]: value }));
              // 触发防抖预测
              debouncedPredict();
            }}
          />
        </div>

        {/* 中间：结果显示区域 */}
        <div className="space-y-6">
          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>点击"开始预测"查看结果</p>
              </div>
            ) : result.success && result.predictions ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">开路电压 (Voc)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.predictions.Voc.toFixed(3)} V
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">短路电流密度 (Jsc)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.predictions.Jsc.toFixed(2)} mA/cm²
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">填充因子 (FF)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.predictions.FF.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">最大功率点电压 (Vm)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.predictions.Vm.toFixed(3)} V
                    </div>
                  </div>
                  <div className="bg-white/40 rounded-lg p-3">
                    <div className="text-sm text-gray-600">最大功率点电流 (Im)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.predictions.Im.toFixed(2)} mA/cm²
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">转换效率</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {result.predictions.Eff.toFixed(2)}%
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">J-V 特性曲线</h3>
                </div>
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-300"
                >
                  <Download className="h-4 w-4" />
                  下载图片
                </button>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <img
                  src={`data:image/png;base64,${result.jv_curve}`}
                  alt="J-V Curve"
                  className="w-full h-auto max-h-96 object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* 右侧：AI对话区域 */}
        <div className="flex flex-col h-full">
          <AIChat
            pageType="solar"
            currentParams={params}
            onSimulation={predictWithParams}
            className="flex-1 h-full max-h-[calc(100vh-200px)]"
          />
        </div>
      </div>
    </div>
  );
} 