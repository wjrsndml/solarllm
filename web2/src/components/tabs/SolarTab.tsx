"use client";

import { useState, useEffect } from "react";
import { Play, Download, RotateCcw, TrendingUp, AlertCircle, Info } from "lucide-react";
import axios from "axios";

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

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatValue = (value: number): string => {
    if (value === 0) return "0";
    if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
      return value.toExponential(2);
    }
    return value.toString();
  };

  const handleParamChange = (key: keyof SolarParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    setParams(prev => ({ ...prev, [key]: numValue }));
  };

  const predict = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('发送硅电池预测请求:', params);
      
      const response = await axios.post("/api/solar/predict", params, {
        timeout: 60000,
      });

      console.log('硅电池预测响应:', response.data);
      setResult(response.data);

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
    setResult(null);
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

  const parameterGroups = [
    {
      title: "物理尺寸参数",
      icon: "📏",
      params: [
        { key: "Si_thk", label: "Si 厚度", unit: "μm", description: "硅片主体厚度" },
        { key: "t_SiO2", label: "SiO2 厚度", unit: "nm", description: "隔离氧化层厚度" },
        { key: "t_polySi_rear_P", label: "后表面 PolySi 厚度", unit: "μm", description: "背面多晶硅厚度" },
      ],
    },
    {
      title: "结与接触参数",
      icon: "🔗",
      params: [
        { key: "front_junc", label: "前表面结深度", unit: "μm", description: "正面结深度" },
        { key: "rear_junc", label: "后表面结深度", unit: "μm", description: "背面结深度" },
        { key: "resist_rear", label: "后表面电阻", unit: "Ω·cm", description: "背面接触电阻" },
      ],
    },
    {
      title: "掺杂浓度",
      icon: "⚛️",
      params: [
        { key: "Nd_top", label: "前表面掺杂浓度", unit: "cm⁻³", description: "正面掺杂区" },
        { key: "Nd_rear", label: "后表面掺杂浓度", unit: "cm⁻³", description: "背面掺杂区" },
        { key: "Nt_polySi_top", label: "前表面 PolySi 掺杂浓度", unit: "cm⁻³", description: "正面多晶硅" },
        { key: "Nt_polySi_rear", label: "后表面 PolySi 掺杂浓度", unit: "cm⁻³", description: "背面多晶硅" },
      ],
    },
    {
      title: "界面缺陷密度",
      icon: "🔬",
      params: [
        { key: "Dit_Si_SiOx", label: "Si-SiOx 界面缺陷密度", unit: "cm⁻²", description: "硅/氧化层界面" },
        { key: "Dit_SiOx_Poly", label: "SiOx-Poly 界面缺陷密度", unit: "cm⁻²", description: "氧化层/多晶硅界面" },
        { key: "Dit_top", label: "顶部界面缺陷密度", unit: "cm⁻²", description: "顶部界面" },
      ],
    },
  ];

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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 参数输入区域 */}
        <div className="space-y-6">
          {parameterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="gradient-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {group.params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {param.label}
                      {param.unit && <span className="text-gray-500 ml-1">({param.unit})</span>}
                    </label>
                    <input
                      type="text"
                      value={formatValue(params[param.key as keyof SolarParams])}
                      onChange={(e) => handleParamChange(param.key as keyof SolarParams, e.target.value)}
                      className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="输入数值"
                    />
                    <p className="text-xs text-gray-500">{param.description}</p>
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
                  <Info className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">J-V特性曲线</h3>
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
                  alt="硅电池J-V特性曲线"
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