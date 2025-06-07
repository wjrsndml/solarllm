"use client";

import { useState, useEffect } from "react";
import { Play, Download, RotateCcw } from "lucide-react";
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

export default function BandgapTab() {
  const [params, setParams] = useState<BandgapParams>({
    MA_ratio: 0.5,
    FA_ratio: 0.5,
    Cs_ratio: 0.0,
    Pb_ratio: 1.0,
    Sn_ratio: 0.0,
    I_ratio: 2.5,
    Br_ratio: 0.5,
    Cl_ratio: 0.0,
  });

  const [result, setResult] = useState("");
  const [bandgapChart, setBandgapChart] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("就绪");
  const [predictedBandgap, setPredictedBandgap] = useState<number | null>(null);

  const handleParamChange = (key: keyof BandgapParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    setParams(prev => ({ ...prev, [key]: numValue }));
  };

  const predict = async () => {
    setIsLoading(true);
    setStatus("计算中...");
    
    try {
      const response = await axios.post("/api/bandgap/predict", params);
      setResult(response.data.result);
      setBandgapChart(response.data.bandgap_chart);
      setPredictedBandgap(response.data.predicted_bandgap);
      setStatus("完成");
    } catch (error) {
      console.error("Bandgap prediction error:", error);
      setResult("预测出错，请检查参数设置");
      setStatus("出错");
      setPredictedBandgap(null);
    } finally {
      setIsLoading(false);
    }
  };

  const resetParams = () => {
    setParams({
      MA_ratio: 0.5,
      FA_ratio: 0.5,
      Cs_ratio: 0.0,
      Pb_ratio: 1.0,
      Sn_ratio: 0.0,
      I_ratio: 2.5,
      Br_ratio: 0.5,
      Cl_ratio: 0.0,
    });
    setResult("");
    setBandgapChart(null);
    setPredictedBandgap(null);
    setStatus("就绪");
  };

  // 自动预测功能（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        predict();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [params]);

  // 检查组分总和
  const getTotalRatio = (type: 'cation' | 'metal' | 'halide') => {
    switch (type) {
      case 'cation':
        return params.MA_ratio + params.FA_ratio + params.Cs_ratio;
      case 'metal':
        return params.Pb_ratio + params.Sn_ratio;
      case 'halide':
        return params.I_ratio + params.Br_ratio + params.Cl_ratio;
      default:
        return 0;
    }
  };

  const parameterGroups = [
    {
      title: "阳离子组分 (A位)",
      icon: "🔴",
      params: [
        { key: "MA_ratio", label: "MA (甲胺) 比例", description: "甲基铵离子比例", min: 0, max: 1, step: 0.01 },
        { key: "FA_ratio", label: "FA (甲脒) 比例", description: "甲脒离子比例", min: 0, max: 1, step: 0.01 },
        { key: "Cs_ratio", label: "Cs (铯) 比例", description: "铯离子比例", min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      title: "金属离子组分 (B位)",
      icon: "🔵",
      params: [
        { key: "Pb_ratio", label: "Pb (铅) 比例", description: "铅离子比例", min: 0, max: 1, step: 0.01 },
        { key: "Sn_ratio", label: "Sn (锡) 比例", description: "锡离子比例", min: 0, max: 1, step: 0.01 },
      ],
    },
    {
      title: "卤素离子组分 (X位)",
      icon: "🟡",
      params: [
        { key: "I_ratio", label: "I (碘) 比例", description: "碘离子比例", min: 0, max: 3, step: 0.1 },
        { key: "Br_ratio", label: "Br (溴) 比例", description: "溴离子比例", min: 0, max: 3, step: 0.1 },
        { key: "Cl_ratio", label: "Cl (氯) 比例", description: "氯离子比例", min: 0, max: 3, step: 0.1 },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💎 钙钛矿带隙预测</h2>
          <p className="text-gray-600">基于组分比例预测钙钛矿材料的能带隙</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1 rounded-full ${
            status === "计算中..." ? "bg-yellow-100 text-yellow-800" :
            status === "完成" ? "bg-green-100 text-green-800" :
            status === "出错" ? "bg-red-100 text-red-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            状态: {status}
          </span>
          {predictedBandgap && (
            <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              预测带隙: {predictedBandgap.toFixed(3)} eV
            </div>
          )}
          <button
            onClick={predict}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Play className="h-4 w-4" />
            {isLoading ? "计算中..." : "立即预测"}
          </button>
          <button
            onClick={resetParams}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            重置参数
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6">
        <div className="flex-1 space-y-6">
          {/* 组分比例输入 */}
          {parameterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="font-semibold text-gray-800">{group.title}</h3>
                </div>
                <div className="text-sm text-gray-600">
                  总和: {getTotalRatio(
                    groupIndex === 0 ? 'cation' : 
                    groupIndex === 1 ? 'metal' : 'halide'
                  ).toFixed(2)}
                  {groupIndex < 2 && getTotalRatio(
                    groupIndex === 0 ? 'cation' : 'metal'
                  ) !== 1.0 && (
                    <span className="text-red-500 ml-2">⚠️ 应为1.0</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.params.map((param) => (
                  <div key={param.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label}
                    </label>
                    <input
                      type="number"
                      value={params[param.key as keyof BandgapParams]}
                      onChange={(e) => handleParamChange(param.key as keyof BandgapParams, e.target.value)}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入比例"
                    />
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 组分验证提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">📋 组分配比说明</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• A位离子 (MA + FA + Cs) 总和应为 1.0</p>
              <p>• B位离子 (Pb + Sn) 总和应为 1.0</p>
              <p>• X位离子 (I + Br + Cl) 总和通常为 3.0</p>
              <p>• 常见组合: MAPbI₃, FAPbI₃, CsPbI₃, 或混合组分</p>
            </div>
          </div>
        </div>

        <div className="w-80 space-y-4">
          {/* 带隙图表显示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">带隙分析图</h3>
            <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              {bandgapChart ? (
                <img
                  src={bandgapChart}
                  alt="带隙分析图"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    📈
                  </div>
                  <p className="text-sm">带隙分析图将在这里显示</p>
                </div>
              )}
            </div>
            {bandgapChart && (
              <button className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Download className="h-4 w-4" />
                下载图像
              </button>
            )}
          </div>

          {/* 预测结果 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">预测结果</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[120px]">
              {result ? (
                <div className="space-y-3">
                  {predictedBandgap && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {predictedBandgap.toFixed(3)} eV
                        </div>
                        <div className="text-sm text-blue-500">预测带隙</div>
                      </div>
                    </div>
                  )}
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {result}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <p className="text-sm">带隙预测结果将在这里显示</p>
                </div>
              )}
            </div>
          </div>

          {/* 典型组分参考 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">典型组分参考</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setParams({
                  MA_ratio: 1, FA_ratio: 0, Cs_ratio: 0,
                  Pb_ratio: 1, Sn_ratio: 0,
                  I_ratio: 3, Br_ratio: 0, Cl_ratio: 0
                })}
                className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">MAPbI₃</div>
                <div className="text-xs text-gray-500">带隙 ~1.55 eV</div>
              </button>
              <button
                onClick={() => setParams({
                  MA_ratio: 0, FA_ratio: 1, Cs_ratio: 0,
                  Pb_ratio: 1, Sn_ratio: 0,
                  I_ratio: 3, Br_ratio: 0, Cl_ratio: 0
                })}
                className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">FAPbI₃</div>
                <div className="text-xs text-gray-500">带隙 ~1.48 eV</div>
              </button>
              <button
                onClick={() => setParams({
                  MA_ratio: 0, FA_ratio: 0, Cs_ratio: 1,
                  Pb_ratio: 1, Sn_ratio: 0,
                  I_ratio: 3, Br_ratio: 0, Cl_ratio: 0
                })}
                className="w-full text-left p-2 bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">CsPbI₃</div>
                <div className="text-xs text-gray-500">带隙 ~1.73 eV</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 