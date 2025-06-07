"use client";

import { useState } from "react";
import { Atom, Play, RotateCcw, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import axios from "axios";

interface BandgapParams {
  MA_ratio: number;
  FA_ratio: number;
  Cs_ratio: number;
  Pb_ratio: number;
  Sn_ratio: number;
  I_ratio: number;
  Br_ratio: number;
  Cl_ratio: number;
}

interface BandgapResult {
  success: boolean;
  bandgap?: number;
  composition?: string;
  stability?: number;
  absorption_edge?: number;
  error?: string;
  message?: string;
}

export default function BandgapTab() {
  const [params, setParams] = useState<BandgapParams>({
    MA_ratio: 0.15,
    FA_ratio: 0.83,
    Cs_ratio: 0.02,
    Pb_ratio: 1.0,
    Sn_ratio: 0.0,
    I_ratio: 2.55,
    Br_ratio: 0.45,
    Cl_ratio: 0.0,
  });

  const [result, setResult] = useState<BandgapResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('发送钙钛矿带隙预测请求:', params);
      
      const response = await axios.post('/api/bandgap/predict', params, {
        timeout: 60000,
      });

      console.log('钙钛矿带隙预测响应:', response.data);
      setResult(response.data);

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
      MA_ratio: 0.15,
      FA_ratio: 0.83,
      Cs_ratio: 0.02,
      Pb_ratio: 1.0,
      Sn_ratio: 0.0,
      I_ratio: 2.55,
      Br_ratio: 0.45,
      Cl_ratio: 0.0,
    });
    setResult(null);
  };

  const updateParam = (key: keyof BandgapParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // 设置典型组分
  const setTypicalComposition = (type: string) => {
    switch (type) {
      case 'MAPbI3':
        setParams({
          MA_ratio: 1.0,
          FA_ratio: 0.0,
          Cs_ratio: 0.0,
          Pb_ratio: 1.0,
          Sn_ratio: 0.0,
          I_ratio: 3.0,
          Br_ratio: 0.0,
          Cl_ratio: 0.0,
        });
        break;
      case 'FAPbI3':
        setParams({
          MA_ratio: 0.0,
          FA_ratio: 1.0,
          Cs_ratio: 0.0,
          Pb_ratio: 1.0,
          Sn_ratio: 0.0,
          I_ratio: 3.0,
          Br_ratio: 0.0,
          Cl_ratio: 0.0,
        });
        break;
      case 'CsPbI3':
        setParams({
          MA_ratio: 0.0,
          FA_ratio: 0.0,
          Cs_ratio: 1.0,
          Pb_ratio: 1.0,
          Sn_ratio: 0.0,
          I_ratio: 3.0,
          Br_ratio: 0.0,
          Cl_ratio: 0.0,
        });
        break;
      default:
        break;
    }
  };

  // 验证组分比例
  const validateComposition = () => {
    const cationSum = params.MA_ratio + params.FA_ratio + params.Cs_ratio;
    const metalSum = params.Pb_ratio + params.Sn_ratio;
    const halideSum = params.I_ratio + params.Br_ratio + params.Cl_ratio;
    
    return {
      cationValid: Math.abs(cationSum - 1.0) < 0.01,
      metalValid: Math.abs(metalSum - 1.0) < 0.01,
      halideValid: Math.abs(halideSum - 3.0) < 0.01,
      cationSum,
      metalSum,
      halideSum
    };
  };

  const validation = validateComposition();

  const paramGroups = [
    {
      title: "阳离子 (A位)",
      icon: "🔴",
      description: "总和应为 1.0",
      params: [
        { key: "MA_ratio" as keyof BandgapParams, label: "MA (CH₃NH₃⁺)", min: 0, max: 1, step: 0.01 },
        { key: "FA_ratio" as keyof BandgapParams, label: "FA (HC(NH₂)₂⁺)", min: 0, max: 1, step: 0.01 },
        { key: "Cs_ratio" as keyof BandgapParams, label: "Cs⁺", min: 0, max: 1, step: 0.01 },
      ]
    },
    {
      title: "金属离子 (B位)",
      icon: "🔵",
      description: "总和应为 1.0",
      params: [
        { key: "Pb_ratio" as keyof BandgapParams, label: "Pb²⁺", min: 0, max: 1, step: 0.01 },
        { key: "Sn_ratio" as keyof BandgapParams, label: "Sn²⁺", min: 0, max: 1, step: 0.01 },
      ]
    },
    {
      title: "卤素离子 (X位)",
      icon: "🟡",
      description: "总和应为 3.0",
      params: [
        { key: "I_ratio" as keyof BandgapParams, label: "I⁻", min: 0, max: 3, step: 0.01 },
        { key: "Br_ratio" as keyof BandgapParams, label: "Br⁻", min: 0, max: 3, step: 0.01 },
        { key: "Cl_ratio" as keyof BandgapParams, label: "Cl⁻", min: 0, max: 3, step: 0.01 },
      ]
    }
  ];

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
              ⚛️ 钙钛矿带隙预测
            </h2>
            <p className="text-gray-600/80">基于组分比例预测钙钛矿材料的带隙能量</p>
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
            disabled={isLoading || !validation.cationValid || !validation.metalValid || !validation.halideValid}
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
        <div className="space-y-6">
          {/* 典型组分按钮 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">典型组分参考</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'MAPbI₃', key: 'MAPbI3', color: 'bg-red-500' },
                { name: 'FAPbI₃', key: 'FAPbI3', color: 'bg-green-500' },
                { name: 'CsPbI₃', key: 'CsPbI3', color: 'bg-blue-500' }
              ].map((comp) => (
                <button
                  key={comp.key}
                  onClick={() => setTypicalComposition(comp.key)}
                  className={`p-3 text-white rounded-lg hover:opacity-80 transition-all duration-300 ${comp.color}`}
                >
                  <div className="text-sm font-medium">{comp.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 组分参数 */}
          {paramGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="gradient-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
                    <p className="text-sm text-gray-600">{group.description}</p>
                  </div>
                </div>
                
                {/* 验证状态 */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  groupIndex === 0 ? (validation.cationValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                  groupIndex === 1 ? (validation.metalValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                  (validation.halideValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                }`}>
                  {groupIndex === 0 ? `总和: ${validation.cationSum.toFixed(2)}` :
                   groupIndex === 1 ? `总和: ${validation.metalSum.toFixed(2)}` :
                   `总和: ${validation.halideSum.toFixed(2)}`}
                </div>
              </div>
              
              <div className="space-y-4">
                {group.params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {param.label}
                      </label>
                      <span className="text-sm text-gray-500">
                        {params[param.key].toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={params[param.key]}
                        onChange={(e) => updateParam(param.key, parseFloat(e.target.value))}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <input
                        type="number"
                        value={params[param.key]}
                        onChange={(e) => updateParam(param.key, parseFloat(e.target.value) || 0)}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="w-20 px-2 py-1 text-sm bg-white/60 backdrop-blur-sm border border-white/40 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 结果显示区域 */}
        <div className="space-y-6">
          {/* 组分验证 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">组分验证</h3>
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                validation.cationValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <span className="text-sm font-medium">阳离子总和</span>
                <span className={`text-sm font-bold ${
                  validation.cationValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validation.cationSum.toFixed(3)} / 1.000
                </span>
              </div>
              
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                validation.metalValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <span className="text-sm font-medium">金属离子总和</span>
                <span className={`text-sm font-bold ${
                  validation.metalValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validation.metalSum.toFixed(3)} / 1.000
                </span>
              </div>
              
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                validation.halideValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <span className="text-sm font-medium">卤素离子总和</span>
                <span className={`text-sm font-bold ${
                  validation.halideValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validation.halideSum.toFixed(3)} / 3.000
                </span>
              </div>
            </div>
          </div>

          {/* 预测结果 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">带隙预测结果</h3>
            </div>

            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Atom className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>设置正确的组分比例后点击"开始预测"</p>
                {(!validation.cationValid || !validation.metalValid || !validation.halideValid) && (
                  <p className="text-sm text-red-500 mt-2">请确保所有组分比例正确</p>
                )}
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                {result.bandgap !== undefined && (
                  <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg p-6 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Atom className="h-6 w-6 text-indigo-600" />
                      <span className="font-semibold text-indigo-800">预测带隙</span>
                    </div>
                    <div className="text-3xl font-bold text-indigo-800">
                      {result.bandgap.toFixed(3)} eV
                    </div>
                  </div>
                )}

                {result.composition && (
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">化学式</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.composition}
                    </div>
                  </div>
                )}

                {result.stability !== undefined && (
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">稳定性评分</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {(result.stability * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {result.absorption_edge !== undefined && (
                  <div className="bg-white/40 rounded-lg p-4">
                    <div className="text-sm text-gray-600">吸收边 (nm)</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {result.absorption_edge.toFixed(0)} nm
                    </div>
                  </div>
                )}
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

          {/* 带隙范围参考 */}
          <div className="gradient-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">带隙范围参考</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-sm font-medium">MAPbI₃</span>
                <span className="text-sm font-bold text-red-700">~1.55 eV</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium">FAPbI₃</span>
                <span className="text-sm font-bold text-green-700">~1.48 eV</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium">CsPbI₃</span>
                <span className="text-sm font-bold text-blue-700">~1.73 eV</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm font-medium">MAPbBr₃</span>
                <span className="text-sm font-bold text-purple-700">~2.25 eV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 