"use client";

import { useState, useEffect } from "react";
import { Play, Download, RotateCcw } from "lucide-react";
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

  const [result, setResult] = useState("");
  const [jvCurve, setJvCurve] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("就绪");

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
    setStatus("计算中...");
    
    try {
      const response = await axios.post("/api/solar/predict", params);
      setResult(response.data.result);
      setJvCurve(response.data.jv_curve);
      setStatus("完成");
    } catch (error) {
      console.error("Prediction error:", error);
      setResult("预测出错，请检查参数设置");
      setStatus("出错");
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
    setResult("");
    setJvCurve(null);
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

  const parameterGroups = [
    {
      title: "物理尺寸参数",
      params: [
        { key: "Si_thk", label: "Si 厚度 (μm)", description: "硅片主体厚度" },
        { key: "t_SiO2", label: "SiO2 厚度 (nm)", description: "隔离氧化层厚度" },
        { key: "t_polySi_rear_P", label: "后表面 PolySi 厚度 (μm)", description: "背面多晶硅厚度" },
      ],
    },
    {
      title: "结与接触参数",
      params: [
        { key: "front_junc", label: "前表面结深度 (μm)", description: "正面结深度" },
        { key: "rear_junc", label: "后表面结深度 (μm)", description: "背面结深度" },
        { key: "resist_rear", label: "后表面电阻 (Ω·cm)", description: "背面接触电阻" },
      ],
    },
    {
      title: "掺杂浓度 (cm⁻³)",
      params: [
        { key: "Nd_top", label: "前表面掺杂浓度", description: "正面掺杂区" },
        { key: "Nd_rear", label: "后表面掺杂浓度", description: "背面掺杂区" },
        { key: "Nt_polySi_top", label: "前表面 PolySi 掺杂浓度", description: "正面多晶硅" },
        { key: "Nt_polySi_rear", label: "后表面 PolySi 掺杂浓度", description: "背面多晶硅" },
      ],
    },
    {
      title: "界面缺陷密度 (cm⁻²)",
      params: [
        { key: "Dit_Si_SiOx", label: "Si-SiOx 界面缺陷密度", description: "硅/氧化层界面" },
        { key: "Dit_SiOx_Poly", label: "SiOx-Poly 界面缺陷密度", description: "氧化层/多晶硅界面" },
        { key: "Dit_top", label: "顶部界面缺陷密度", description: "顶部界面" },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚡ 硅电池参数预测</h2>
          <p className="text-gray-600">通过调整参数预测硅太阳能电池性能</p>
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
          {/* 参数输入区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {parameterGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">{group.title}</h3>
                <div className="space-y-3">
                  {group.params.map((param) => (
                    <div key={param.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {param.label}
                      </label>
                      <input
                        type="text"
                        value={formatValue(params[param.key as keyof SolarParams])}
                        onChange={(e) => handleParamChange(param.key as keyof SolarParams, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入数值"
                      />
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 space-y-4">
          {/* JV曲线显示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">JV曲线</h3>
            <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              {jvCurve ? (
                <img
                  src={jvCurve}
                  alt="JV曲线"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    📊
                  </div>
                  <p className="text-sm">JV曲线将在这里显示</p>
                </div>
              )}
            </div>
            {jvCurve && (
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
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result}
                </pre>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <p className="text-sm">预测结果将在这里显示</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 