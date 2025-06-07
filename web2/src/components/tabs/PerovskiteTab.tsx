"use client";

import { useState, useEffect } from "react";
import { Play, Download, RotateCcw } from "lucide-react";
import axios from "axios";

interface PerovskiteParams {
  perovskite_type: "narrow" | "wide";
  // HTL Parameters
  er_HTL_top: number;
  x_HTL_top: number;
  Eg_HTL_top: number;
  Nc_HTL_top: number;
  Nv_HTL_top: number;
  mun_HTL_top: number;
  mup_HTL_top: number;
  tn_HTL_top: number;
  tp_HTL_top: number;
  t_HTL_top: number;
  Na_HTL_top: number;
  Nt_HTL_top: number;
  // ETL Parameters
  er_ETL_top: number;
  x_ETL_top: number;
  Eg_ETL_top: number;
  Nc_ETL_top: number;
  Nv_ETL_top: number;
  mun_ETL_top: number;
  mup_ETL_top: number;
  tn_ETL_top: number;
  tp_ETL_top: number;
  t_ETL_top: number;
  Nd_ETL_top: number;
  Nt_ETL_top: number;
  // PSK Parameters
  er_PSK_top: number;
  x_PSK_top: number;
  Nc_PSK_top: number;
  Nv_PSK_top: number;
  mun_PSK_top: number;
  mup_PSK_top: number;
  tn_PSK_top: number;
  tp_PSK_top: number;
  Eg_PSK_top: number;
  t_PSK_top: number;
  Nd_PSK_top: number;
  Nt_PSK_top: number;
  // Device Parameters
  Cap_area: number;
  Dit_top_HTL_PSK: number;
  Dit_top_ETL_PSK: number;
}

export default function PerovskiteTab() {
  const [params, setParams] = useState<PerovskiteParams>({
    perovskite_type: "narrow",
    // HTL Parameters
    er_HTL_top: 3.0,
    x_HTL_top: 2.2,
    Eg_HTL_top: 3.0,
    Nc_HTL_top: 2.5e19,
    Nv_HTL_top: 1.8e19,
    mun_HTL_top: 2e-4,
    mup_HTL_top: 2e-4,
    tn_HTL_top: 1e-7,
    tp_HTL_top: 1e-7,
    t_HTL_top: 0.2,
    Na_HTL_top: 1.8e18,
    Nt_HTL_top: 1.5e15,
    // ETL Parameters
    er_ETL_top: 9.0,
    x_ETL_top: 4.0,
    Eg_ETL_top: 3.2,
    Nc_ETL_top: 2.2e18,
    Nv_ETL_top: 1.8e19,
    mun_ETL_top: 20,
    mup_ETL_top: 10,
    tn_ETL_top: 1e-7,
    tp_ETL_top: 1e-8,
    t_ETL_top: 0.05,
    Nd_ETL_top: 1e18,
    Nt_ETL_top: 1e15,
    // PSK Parameters
    er_PSK_top: 6.5,
    x_PSK_top: 3.9,
    Nc_PSK_top: 2.2e18,
    Nv_PSK_top: 1.8e18,
    mun_PSK_top: 10,
    mup_PSK_top: 10,
    tn_PSK_top: 1e-7,
    tp_PSK_top: 1e-7,
    Eg_PSK_top: 1.55,
    t_PSK_top: 0.5,
    Nd_PSK_top: 1e16,
    Nt_PSK_top: 1e13,
    // Device Parameters
    Cap_area: 1e-16,
    Dit_top_HTL_PSK: 1e11,
    Dit_top_ETL_PSK: 1e12,
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

  const handleParamChange = (key: keyof PerovskiteParams, value: string | number) => {
    if (key === "perovskite_type") {
      setParams(prev => ({ ...prev, [key]: value as "narrow" | "wide" }));
    } else {
      const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
      setParams(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const predict = async () => {
    setIsLoading(true);
    setStatus("计算中...");
    
    try {
      const response = await axios.post("/api/perovskite/predict", params);
      setResult(response.data.result);
      setJvCurve(response.data.jv_curve);
      setStatus("完成");
    } catch (error) {
      console.error("Perovskite prediction error:", error);
      setResult("预测出错，请检查参数设置");
      setStatus("出错");
    } finally {
      setIsLoading(false);
    }
  };

  const resetParams = () => {
    setParams({
      perovskite_type: "narrow",
      er_HTL_top: 3.0,
      x_HTL_top: 2.2,
      Eg_HTL_top: 3.0,
      Nc_HTL_top: 2.5e19,
      Nv_HTL_top: 1.8e19,
      mun_HTL_top: 2e-4,
      mup_HTL_top: 2e-4,
      tn_HTL_top: 1e-7,
      tp_HTL_top: 1e-7,
      t_HTL_top: 0.2,
      Na_HTL_top: 1.8e18,
      Nt_HTL_top: 1.5e15,
      er_ETL_top: 9.0,
      x_ETL_top: 4.0,
      Eg_ETL_top: 3.2,
      Nc_ETL_top: 2.2e18,
      Nv_ETL_top: 1.8e19,
      mun_ETL_top: 20,
      mup_ETL_top: 10,
      tn_ETL_top: 1e-7,
      tp_ETL_top: 1e-8,
      t_ETL_top: 0.05,
      Nd_ETL_top: 1e18,
      Nt_ETL_top: 1e15,
      er_PSK_top: 6.5,
      x_PSK_top: 3.9,
      Nc_PSK_top: 2.2e18,
      Nv_PSK_top: 1.8e18,
      mun_PSK_top: 10,
      mup_PSK_top: 10,
      tn_PSK_top: 1e-7,
      tp_PSK_top: 1e-7,
      Eg_PSK_top: 1.55,
      t_PSK_top: 0.5,
      Nd_PSK_top: 1e16,
      Nt_PSK_top: 1e13,
      Cap_area: 1e-16,
      Dit_top_HTL_PSK: 1e11,
      Dit_top_ETL_PSK: 1e12,
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
      title: "能带类型",
      icon: "🔷",
      params: [
        { key: "perovskite_type", label: "钙钛矿能带类型", type: "select", options: ["narrow", "wide"], description: "选择窄带隙或宽带隙对应的预设参数集" },
      ],
    },
    {
      title: "HTL参数 (空穴传输层)",
      icon: "🔴",
      params: [
        { key: "er_HTL_top", label: "HTL相对介电常数", type: "number", min: 1, max: 10, step: 0.1, description: "HTL层的相对介电常数" },
        { key: "x_HTL_top", label: "HTL电子亲和能 (eV)", type: "number", min: 1, max: 5, step: 0.1, description: "HTL层的电子亲和能" },
        { key: "Eg_HTL_top", label: "HTL带隙 (eV)", type: "number", min: 1, max: 5, step: 0.1, description: "HTL层的能带隙" },
        { key: "Nc_HTL_top", label: "HTL导带有效态密度 (cm⁻³)", type: "number", min: 1e18, max: 1e22, step: 1e18, description: "HTL导带有效状态密度" },
        { key: "Nv_HTL_top", label: "HTL价带有效态密度 (cm⁻³)", type: "number", min: 1e18, max: 1e22, step: 1e18, description: "HTL价带有效状态密度" },
        { key: "mun_HTL_top", label: "HTL电子迁移率 (cm²/Vs)", type: "number", min: 1e-6, max: 1e-2, step: 1e-6, description: "HTL电子迁移率" },
        { key: "mup_HTL_top", label: "HTL空穴迁移率 (cm²/Vs)", type: "number", min: 1e-4, max: 1, step: 1e-4, description: "HTL空穴迁移率" },
        { key: "tn_HTL_top", label: "HTL电子寿命 (s)", type: "number", min: 1e-9, max: 1e-3, step: 1e-9, description: "HTL电子载流子寿命" },
        { key: "tp_HTL_top", label: "HTL空穴寿命 (s)", type: "number", min: 1e-9, max: 1e-3, step: 1e-9, description: "HTL空穴载流子寿命" },
        { key: "t_HTL_top", label: "HTL厚度 (μm)", type: "number", min: 0.01, max: 0.2, step: 0.001, description: "HTL层厚度" },
        { key: "Na_HTL_top", label: "HTL受主掺杂浓度 (cm⁻³)", type: "number", min: 1e16, max: 1e20, step: 1e16, description: "HTL受主掺杂浓度" },
        { key: "Nt_HTL_top", label: "HTL缺陷态密度 (cm⁻³)", type: "number", min: 1e13, max: 1e18, step: 1e13, description: "HTL缺陷态密度" },
      ],
    },
    {
      title: "ETL参数 (电子传输层)",
      icon: "🔵",
      params: [
        { key: "er_ETL_top", label: "ETL相对介电常数", type: "number", min: 1, max: 20, step: 0.1, description: "ETL层的相对介电常数" },
        { key: "x_ETL_top", label: "ETL电子亲和能 (eV)", type: "number", min: 3, max: 6, step: 0.1, description: "ETL层的电子亲和能" },
        { key: "Eg_ETL_top", label: "ETL带隙 (eV)", type: "number", min: 1, max: 5, step: 0.1, description: "ETL层的能带隙" },
        { key: "Nc_ETL_top", label: "ETL导带有效态密度 (cm⁻³)", type: "number", min: 1e17, max: 1e21, step: 1e17, description: "ETL导带有效状态密度" },
        { key: "Nv_ETL_top", label: "ETL价带有效态密度 (cm⁻³)", type: "number", min: 1e17, max: 1e21, step: 1e17, description: "ETL价带有效状态密度" },
        { key: "mun_ETL_top", label: "ETL电子迁移率 (cm²/Vs)", type: "number", min: 1, max: 1000, step: 10, description: "ETL电子迁移率" },
        { key: "mup_ETL_top", label: "ETL空穴迁移率 (cm²/Vs)", type: "number", min: 1, max: 1000, step: 10, description: "ETL空穴迁移率" },
        { key: "tn_ETL_top", label: "ETL电子寿命 (s)", type: "number", min: 1e-9, max: 1e-4, step: 1e-9, description: "ETL电子载流子寿命" },
        { key: "tp_ETL_top", label: "ETL空穴寿命 (s)", type: "number", min: 1e-9, max: 1e-4, step: 1e-9, description: "ETL空穴载流子寿命" },
        { key: "t_ETL_top", label: "ETL厚度 (μm)", type: "number", min: 0.01, max: 0.2, step: 0.001, description: "ETL层厚度" },
        { key: "Nd_ETL_top", label: "ETL施主掺杂浓度 (cm⁻³)", type: "number", min: 1e17, max: 1e21, step: 1e17, description: "ETL施主掺杂浓度" },
        { key: "Nt_ETL_top", label: "ETL缺陷态密度 (cm⁻³)", type: "number", min: 1e13, max: 1e18, step: 1e13, description: "ETL缺陷态密度" },
      ],
    },
    {
      title: "钙钛矿层参数",
      icon: "💎",
      params: [
        { key: "er_PSK_top", label: "钙钛矿相对介电常数", type: "number", min: 1, max: 20, step: 0.1, description: "钙钛矿的相对介电常数" },
        { key: "x_PSK_top", label: "钙钛矿电子亲和能 (eV)", type: "number", min: 3, max: 6, step: 0.1, description: "钙钛矿的电子亲和能" },
        { key: "Nc_PSK_top", label: "钙钛矿导带有效态密度 (cm⁻³)", type: "number", min: 1e15, max: 1e19, step: 1e15, description: "钙钛矿导带有效状态密度" },
        { key: "Nv_PSK_top", label: "钙钛矿价带有效态密度 (cm⁻³)", type: "number", min: 1e15, max: 1e19, step: 1e15, description: "钙钛矿价带有效状态密度" },
        { key: "mun_PSK_top", label: "钙钛矿电子迁移率 (cm²/Vs)", type: "number", min: 1, max: 100, step: 1, description: "钙钛矿电子迁移率" },
        { key: "mup_PSK_top", label: "钙钛矿空穴迁移率 (cm²/Vs)", type: "number", min: 1, max: 100, step: 1, description: "钙钛矿空穴迁移率" },
        { key: "tn_PSK_top", label: "钙钛矿电子寿命 (s)", type: "number", min: 1e-9, max: 1e-5, step: 1e-9, description: "钙钛矿电子载流子寿命" },
        { key: "tp_PSK_top", label: "钙钛矿空穴寿命 (s)", type: "number", min: 1e-9, max: 1e-5, step: 1e-9, description: "钙钛矿空穴载流子寿命" },
        { key: "Eg_PSK_top", label: "钙钛矿带隙 (eV)", type: "number", min: 1, max: 2, step: 0.01, description: "钙钛矿能带隙" },
        { key: "t_PSK_top", label: "钙钛矿厚度 (μm)", type: "number", min: 0.1, max: 2, step: 0.01, description: "钙钛矿活性层厚度" },
        { key: "Nd_PSK_top", label: "钙钛矿施主掺杂浓度 (cm⁻³)", type: "number", min: 1e14, max: 1e18, step: 1e14, description: "钙钛矿施主掺杂浓度" },
        { key: "Nt_PSK_top", label: "钙钛矿缺陷态密度 (cm⁻³)", type: "number", min: 1e11, max: 1e16, step: 1e11, description: "钙钛矿缺陷态密度" },
      ],
    },
    {
      title: "器件与界面参数",
      icon: "⚙️",
      params: [
        { key: "Cap_area", label: "器件面积 (cm²)", type: "number", min: 1e-18, max: 1e-15, step: 1e-18, description: "器件有效面积" },
        { key: "Dit_top_HTL_PSK", label: "HTL/PSK界面缺陷密度 (cm⁻²)", type: "number", min: 1e8, max: 1e14, step: 1e8, description: "HTL与钙钛矿界面缺陷密度" },
        { key: "Dit_top_ETL_PSK", label: "ETL/PSK界面缺陷密度 (cm⁻²)", type: "number", min: 1e10, max: 1e15, step: 1e10, description: "ETL与钙钛矿界面缺陷密度" },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🧪 钙钛矿参数预测</h2>
          <p className="text-gray-600">通过调整器件参数预测钙钛矿太阳能电池性能</p>
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
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* 参数输入区域 */}
          {parameterGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">{group.icon}</span>
                <h3 className="font-semibold text-gray-800">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.params.map((param) => (
                  <div key={param.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label}
                    </label>
                    {param.type === "select" ? (
                      <select
                        value={params[param.key as keyof PerovskiteParams] as string}
                        onChange={(e) => handleParamChange(param.key as keyof PerovskiteParams, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {"options" in param && param.options?.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formatValue(params[param.key as keyof PerovskiteParams] as number)}
                        onChange={(e) => handleParamChange(param.key as keyof PerovskiteParams, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入数值"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="w-80 space-y-4">
          {/* JV曲线显示 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">钙钛矿JV曲线</h3>
            <div className="h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              {jvCurve ? (
                <img
                  src={jvCurve}
                  alt="钙钛矿JV曲线"
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
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[200px]">
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