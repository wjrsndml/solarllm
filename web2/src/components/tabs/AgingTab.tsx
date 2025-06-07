"use client";

import { useState } from "react";
import { Play, Download, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

export default function AgingTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [agingCurve, setAgingCurve] = useState<string | null>(null);
  const [status, setStatus] = useState("就绪");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));

  // 简化的参数（只显示最重要的几个分类）
  const [params, setParams] = useState({
    // 电池架构
    cell_architecture: "n-i-p",
    substrate_type: "Glass",
    substrate_thickness: 1.1,
    
    // ETL参数
    etl_material: "TiO2",
    etl_thickness: 0.05,
    etl_annealing_temp: 450,
    
    // 钙钛矿层参数
    perovskite_composition: "MAPbI3",
    perovskite_thickness: 0.5,
    perovskite_bandgap: 1.55,
    perovskite_annealing_temp: 100,
    
    // HTL参数
    htl_material: "Spiro-OMeTAD",
    htl_thickness: 0.2,
    
    // 背电极
    back_contact: "Au",
    back_contact_thickness: 0.1,
    
    // 封装
    encapsulation: "Glass",
    edge_sealing: "UV-curable polymer",
    
    // 初始性能
    initial_voc: 1.1,
    initial_jsc: 22.0,
    initial_ff: 75.0,
    initial_pce: 18.0,
    
    // 稳定性测试条件
    light_intensity: 100,
    temperature: 85,
    humidity: 85,
    atmosphere: "Air",
    uv_filter: true,
  });

  const parameterGroups = [
    {
      title: "电池架构与基底",
      icon: "🏗️",
      params: [
        { key: "cell_architecture", label: "电池架构", type: "select", options: ["n-i-p", "p-i-n"], description: "电池结构类型" },
        { key: "substrate_type", label: "基底材料", type: "select", options: ["Glass", "PET", "ITO"], description: "基底基板材料" },
        { key: "substrate_thickness", label: "基底厚度 (mm)", type: "number", step: 0.1, description: "基底厚度" },
      ],
    },
    {
      title: "传输层参数",
      icon: "⚡",
      params: [
        { key: "etl_material", label: "ETL材料", type: "select", options: ["TiO2", "SnO2", "ZnO", "PCBM"], description: "电子传输层材料" },
        { key: "etl_thickness", label: "ETL厚度 (μm)", type: "number", step: 0.01, description: "电子传输层厚度" },
        { key: "etl_annealing_temp", label: "ETL退火温度 (°C)", type: "number", step: 10, description: "电子传输层退火温度" },
        { key: "htl_material", label: "HTL材料", type: "select", options: ["Spiro-OMeTAD", "PTAA", "P3HT", "NiOx"], description: "空穴传输层材料" },
        { key: "htl_thickness", label: "HTL厚度 (μm)", type: "number", step: 0.01, description: "空穴传输层厚度" },
      ],
    },
    {
      title: "钙钛矿层参数",
      icon: "💎",
      params: [
        { key: "perovskite_composition", label: "钙钛矿组分", type: "select", options: ["MAPbI3", "FAPbI3", "CsPbI3", "Mixed"], description: "钙钛矿材料组分" },
        { key: "perovskite_thickness", label: "钙钛矿厚度 (μm)", type: "number", step: 0.05, description: "活性层厚度" },
        { key: "perovskite_bandgap", label: "带隙 (eV)", type: "number", step: 0.01, description: "材料带隙" },
        { key: "perovskite_annealing_temp", label: "退火温度 (°C)", type: "number", step: 5, description: "钙钛矿层退火温度" },
      ],
    },
    {
      title: "电极与封装",
      icon: "🔌",
      params: [
        { key: "back_contact", label: "背电极材料", type: "select", options: ["Au", "Ag", "Al", "Cu"], description: "背面电极材料" },
        { key: "back_contact_thickness", label: "背电极厚度 (μm)", type: "number", step: 0.01, description: "背面电极厚度" },
        { key: "encapsulation", label: "封装材料", type: "select", options: ["Glass", "EVA", "POE", "None"], description: "封装保护材料" },
        { key: "edge_sealing", label: "边缘密封", type: "select", options: ["UV-curable polymer", "Butyl rubber", "Silicone", "None"], description: "边缘密封材料" },
      ],
    },
    {
      title: "初始性能参数",
      icon: "📊",
      params: [
        { key: "initial_voc", label: "开路电压 (V)", type: "number", step: 0.01, description: "初始开路电压" },
        { key: "initial_jsc", label: "短路电流密度 (mA/cm²)", type: "number", step: 0.1, description: "初始短路电流密度" },
        { key: "initial_ff", label: "填充因子 (%)", type: "number", step: 0.1, description: "初始填充因子" },
        { key: "initial_pce", label: "功率转换效率 (%)", type: "number", step: 0.1, description: "初始效率" },
      ],
    },
    {
      title: "稳定性测试条件",
      icon: "🌡️",
      params: [
        { key: "light_intensity", label: "光照强度 (mW/cm²)", type: "number", step: 10, description: "测试光照强度" },
        { key: "temperature", label: "测试温度 (°C)", type: "number", step: 5, description: "环境温度" },
        { key: "humidity", label: "相对湿度 (%)", type: "number", step: 5, description: "环境湿度" },
        { key: "atmosphere", label: "测试气氛", type: "select", options: ["Air", "N2", "Ar", "Vacuum"], description: "测试环境气氛" },
        { key: "uv_filter", label: "UV滤光片", type: "checkbox", description: "是否使用UV滤光片" },
      ],
    },
  ];

  const handleParamChange = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const predict = async () => {
    setIsLoading(true);
    setStatus("计算中...");
    
    try {
      const response = await axios.post("/api/aging/predict", params);
      setResult(response.data.result);
      setAgingCurve(response.data.aging_curve);
      setStatus("完成");
    } catch (error) {
      console.error("Aging prediction error:", error);
      setResult("预测出错，请检查参数设置");
      setStatus("出错");
    } finally {
      setIsLoading(false);
    }
  };

  const resetParams = () => {
    // 重置为默认值的逻辑
    setParams({
      cell_architecture: "n-i-p",
      substrate_type: "Glass",
      substrate_thickness: 1.1,
      etl_material: "TiO2",
      etl_thickness: 0.05,
      etl_annealing_temp: 450,
      perovskite_composition: "MAPbI3",
      perovskite_thickness: 0.5,
      perovskite_bandgap: 1.55,
      perovskite_annealing_temp: 100,
      htl_material: "Spiro-OMeTAD",
      htl_thickness: 0.2,
      back_contact: "Au",
      back_contact_thickness: 0.1,
      encapsulation: "Glass",
      edge_sealing: "UV-curable polymer",
      initial_voc: 1.1,
      initial_jsc: 22.0,
      initial_ff: 75.0,
      initial_pce: 18.0,
      light_intensity: 100,
      temperature: 85,
      humidity: 85,
      atmosphere: "Air",
      uv_filter: true,
    });
    setResult("");
    setAgingCurve(null);
    setStatus("就绪");
  };

  const toggleGroup = (groupIndex: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupIndex)) {
      newExpanded.delete(groupIndex);
    } else {
      newExpanded.add(groupIndex);
    }
    setExpandedGroups(newExpanded);
  };

  const renderParamInput = (param: any) => {
    const value = params[param.key as keyof typeof params];
    
    switch (param.type) {
      case "select":
        return (
          <select
            value={value as string}
            onChange={(e) => handleParamChange(param.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {param.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleParamChange(param.key, e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">启用</span>
          </label>
        );
      case "number":
      default:
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => handleParamChange(param.key, parseFloat(e.target.value) || 0)}
            step={param.step || 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入数值"
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⏳ 钙钛矿老化预测</h2>
          <p className="text-gray-600">预测钙钛矿太阳能电池的稳定性和老化特性</p>
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
            {isLoading ? "计算中..." : "开始预测"}
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
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* 参数输入区域 */}
          {parameterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-gray-50 rounded-lg">
              <button
                onClick={() => toggleGroup(groupIndex)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="font-semibold text-gray-800">{group.title}</h3>
                </div>
                {expandedGroups.has(groupIndex) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedGroups.has(groupIndex) && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.params.map((param) => (
                      <div key={param.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {param.label}
                        </label>
                        {renderParamInput(param)}
                        <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-80 space-y-4">
          {/* 老化曲线显示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">老化曲线</h3>
            <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              {agingCurve ? (
                <img
                  src={agingCurve}
                  alt="老化曲线"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    📈
                  </div>
                  <p className="text-sm">老化曲线将在这里显示</p>
                </div>
              )}
            </div>
            {agingCurve && (
              <button className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Download className="h-4 w-4" />
                下载图像
              </button>
            )}
          </div>

          {/* 预测结果 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">预测结果</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[200px]">
              {result ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result}
                </pre>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  <p className="text-sm">老化预测结果将在这里显示</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 