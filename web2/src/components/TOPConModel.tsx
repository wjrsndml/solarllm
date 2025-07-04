"use client";

import { useState } from "react";
import { Settings, Info, X } from "lucide-react";

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

interface TOPConModelProps {
  params: SolarParams;
  onParamChange: (key: keyof SolarParams, value: number) => void;
}

interface LayerGroup {
  name: string;
  description: string;
  color: string;
  params: Array<{
    key: keyof SolarParams;
    label: string;
    unit: string;
  }>;
}

export default function TOPConModel({ params, onParamChange }: TOPConModelProps) {
  const [selectedGroup, setSelectedGroup] = useState<LayerGroup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editValues, setEditValues] = useState<{[key: string]: string}>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredText, setHoveredText] = useState<string>("");

  // 格式化数值显示
  const formatValue = (value: number): string => {
    if (value === 0) return "0";
    if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
      return value.toExponential(2);
    }
    return value.toString();
  };

  // 解析输入值
  const parseValue = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // 鼠标移动处理
  // 使用 pageX/pageY 获取相对于页面的坐标，避免滚动位置影响，同时减少偏移量
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.pageX, y: e.pageY });
  };

  // 定义电池层组
  const layerGroups: LayerGroup[] = [
    {
      name: "前表面系统",
      description: "前电极 + ARC钝化层 + n+发射极",
      color: "#3b82f6",
      params: [
        { key: "Dit_top", label: "ARC层界面缺陷密度", unit: "cm⁻²" },
        { key: "Nd_top", label: "n+掺杂浓度", unit: "cm⁻³" },
        { key: "Nt_polySi_top", label: "前PolySi掺杂浓度", unit: "cm⁻³" },
        { key: "front_junc", label: "前表面结深度", unit: "μm" },
      ]
    },
    {
      name: "硅片主体",
      description: "n型硅晶体衬底",
      color: "#64748b",
      params: [
        { key: "Si_thk", label: "硅片厚度", unit: "μm" },
      ]
    },
    {
      name: "后表面系统",
      description: "p++背表面场 + SiO2层 + poly-Si层 + 后电极",
      color: "#dc2626",
      params: [
        { key: "rear_junc", label: "后表面结深度", unit: "μm" },
        { key: "Nd_rear", label: "p++掺杂浓度", unit: "cm⁻³" },
        { key: "t_SiO2", label: "隧穿氧化层厚度", unit: "nm" },
        { key: "Dit_Si_SiOx", label: "Si-SiOx界面缺陷", unit: "cm⁻²" },
        { key: "t_polySi_rear_P", label: "poly-Si层厚度", unit: "μm" },
        { key: "Nt_polySi_rear", label: "后PolySi掺杂浓度", unit: "cm⁻³" },
        { key: "Dit_SiOx_Poly", label: "SiOx-Poly界面缺陷", unit: "cm⁻²" },
        { key: "resist_rear", label: "后表面接触电阻", unit: "Ω·cm" },
      ]
    }
  ];

  const handleGroupClick = (group: LayerGroup) => {
    setSelectedGroup(group);
    const initialValues: {[key: string]: string} = {};
    group.params.forEach(param => {
      initialValues[param.key] = formatValue(params[param.key]);
    });
    setEditValues(initialValues);
    setShowModal(true);
  };

  const handleValueChange = (key: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (selectedGroup) {
      selectedGroup.params.forEach(param => {
        const newValue = parseValue(editValues[param.key] || "0");
        onParamChange(param.key, newValue);
      });
      setShowModal(false);
      setSelectedGroup(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedGroup(null);
  };

  return (
    <>
      <div className="gradient-card rounded-2xl p-6" onMouseMove={handleMouseMove}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">硅电池结构模型</h3>
            <p className="text-sm text-gray-600">点击各部分修改参数</p>
          </div>
        </div>

        {/* 电池结构图 */}
        <div className="relative bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200 overflow-hidden">
          <svg width="100%" height="500" viewBox="0 0 800 500" className="border border-gray-300 rounded-lg bg-white">
            {/* 前表面金字塔纹理结构 */}
            <g 
              onClick={() => handleGroupClick(layerGroups[0])}
              className="cursor-pointer"
            >
              {/* 金字塔形状 - 只显示6个，更大 */}
              {[...Array(6)].map((_, i) => {
                const x = 100 + i * 100;
                const baseY = 120;
                const height = 40;
                return (
                  <polygon
                    key={i}
                    points={`${x},${baseY} ${x + 50},${baseY - height} ${x + 100},${baseY}`}
                    fill="#3b82f6"
                    stroke="#2563eb"
                    strokeWidth="1"
                    className="hover:fill-blue-500 transition-colors"
                    onMouseEnter={() => setHoveredText("金字塔纹理结构")}
                    onMouseLeave={() => setHoveredText("")}
                  />
                );
              })}
              
              {/* 前表面电极 - 左侧电极 */}
              <rect 
                x="150" 
                y="60" 
                width="80" 
                height="60" 
                fill="#C0C0C0" 
                stroke="#999" 
                strokeWidth="1"
                className="hover:fill-gray-300 transition-colors"
                onMouseEnter={() => setHoveredText("前表面Ag电极 (左)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 前表面电极 - 中间电极 */}
              <rect 
                x="360" 
                y="60" 
                width="80" 
                height="60" 
                fill="#C0C0C0" 
                stroke="#999" 
                strokeWidth="1"
                className="hover:fill-gray-300 transition-colors"
                onMouseEnter={() => setHoveredText("前表面Ag电极 (中)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 前表面电极 - 右侧电极 */}
              <rect 
                x="570" 
                y="60" 
                width="80" 
                height="60" 
                fill="#C0C0C0" 
                stroke="#999" 
                strokeWidth="1"
                className="hover:fill-gray-300 transition-colors"
                onMouseEnter={() => setHoveredText("前表面Ag电极 (右)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* ARC层 */}
              <rect 
                x="100" 
                y="120" 
                width="600" 
                height="15" 
                fill="#60a5fa" 
                className="hover:fill-blue-400 transition-colors"
                onMouseEnter={() => setHoveredText("ARC钝化层 (SiNₓ)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* n+发射极 */}
              <rect 
                x="100" 
                y="135" 
                width="600" 
                height="20" 
                fill="#3b82f6" 
                className="hover:fill-blue-500 transition-colors"
                onMouseEnter={() => setHoveredText("n⁺发射极")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 编辑图标 */}
              <circle cx="680" cy="100" r="12" fill="white" stroke="#3b82f6" strokeWidth="2"/>
              <text x="680" y="105" textAnchor="middle" className="text-sm fill-blue-600">⚙</text>
            </g>

            {/* 硅片主体 */}
            <g 
              onClick={() => handleGroupClick(layerGroups[1])}
              onMouseEnter={() => setHoveredText(`n型硅衬底 (c-Si) - 厚度: ${formatValue(params.Si_thk)} μm`)}
              onMouseLeave={() => setHoveredText("")}
              className="cursor-pointer"
            >
              <rect x="100" y="155" width="600" height="240" fill="#64748b" className="hover:fill-slate-500 transition-colors"/>
              
              {/* 晶体结构网格 */}
              <defs>
                <pattern id="crystal" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <rect width="30" height="30" fill="none" stroke="#475569" strokeWidth="0.8" opacity="0.4"/>
                  <circle cx="15" cy="15" r="2" fill="#475569" opacity="0.3"/>
                </pattern>
              </defs>
              <rect x="100" y="155" width="600" height="240" fill="url(#crystal)"/>
              
              <text x="400" y="260" textAnchor="middle" className="text-3xl font-bold fill-white">
                n型硅衬底 (c-Si)
              </text>
              <text x="400" y="285" textAnchor="middle" className="text-lg fill-white">
                厚度: {formatValue(params.Si_thk)} μm
              </text>
              
              {/* 编辑图标 */}
              <circle cx="680" cy="180" r="15" fill="white" stroke="#64748b" strokeWidth="2"/>
              <text x="680" y="186" textAnchor="middle" className="text-lg fill-slate-600">⚙</text>
            </g>

            {/* 后表面系统 */}
            <g 
              onClick={() => handleGroupClick(layerGroups[2])}
              className="cursor-pointer"
            >
              {/* p++背表面场 */}
              <rect 
                x="100" 
                y="395" 
                width="600" 
                height="12" 
                fill="#f97316" 
                className="hover:fill-orange-500 transition-colors"
                onMouseEnter={() => setHoveredText("p⁺⁺背表面场")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* SiO2隧穿氧化层 */}
              <rect 
                x="100" 
                y="407" 
                width="600" 
                height="6" 
                fill="#fbbf24" 
                className="hover:fill-yellow-400 transition-colors"
                onMouseEnter={() => setHoveredText("SiO₂隧穿氧化层")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* poly-Si层 */}
              <rect 
                x="100" 
                y="413" 
                width="600" 
                height="18" 
                fill="#dc2626" 
                className="hover:fill-red-500 transition-colors"
                onMouseEnter={() => setHoveredText("poly-Si钝化接触层")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 后钝化层 */}
              <rect 
                x="100" 
                y="431" 
                width="600" 
                height="10" 
                fill="#a855f7" 
                className="hover:fill-purple-500 transition-colors"
                onMouseEnter={() => setHoveredText("后钝化层")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 后表面电极 - 左侧电极 */}
              <rect 
                x="150" 
                y="441" 
                width="80" 
                height="25" 
                fill="#666" 
                stroke="#444" 
                strokeWidth="1"
                className="hover:fill-gray-500 transition-colors"
                onMouseEnter={() => setHoveredText("后表面Ag电极 (左)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 后表面电极 - 中间电极 */}
              <rect 
                x="360" 
                y="441" 
                width="80" 
                height="25" 
                fill="#666" 
                stroke="#444" 
                strokeWidth="1"
                className="hover:fill-gray-500 transition-colors"
                onMouseEnter={() => setHoveredText("后表面Ag电极 (中)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 后表面电极 - 右侧电极 */}
              <rect 
                x="570" 
                y="441" 
                width="80" 
                height="25" 
                fill="#666" 
                stroke="#444" 
                strokeWidth="1"
                className="hover:fill-gray-500 transition-colors"
                onMouseEnter={() => setHoveredText("后表面Ag电极 (右)")}
                onMouseLeave={() => setHoveredText("")}
              />
              
              {/* 编辑图标 */}
              <circle cx="680" cy="415" r="12" fill="white" stroke="#dc2626" strokeWidth="2"/>
              <text x="680" y="420" textAnchor="middle" className="text-sm fill-red-600">⚙</text>
            </g>
          </svg>
        </div>

        {/* 悬停提示框 */}
        {hoveredText && (
          <div 
            className="fixed z-50 bg-black text-white px-3 py-2 rounded-lg text-sm max-w-xs pointer-events-none"
            style={{
              left: mousePos.x-200,
              top: mousePos.y-200,
            }}
          >
            {hoveredText}
          </div>
        )}

        {/* 参数详情表格 */}
        <div className="mt-6 space-y-4">
          {layerGroups.map((group, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: group.color }}
                ></div>
                <h4 className="font-semibold text-gray-800">{group.name}</h4>
                <span className="text-sm text-gray-500">- {group.description}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.params.map((param, paramIndex) => (
                  <div key={paramIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{param.label}</span>
                    <span className="text-sm font-mono text-gray-900">
                      {formatValue(params[param.key])} {param.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 参数编辑模态框 */}
      {showModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: selectedGroup.color }}
                ></div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
                  <p className="text-sm text-gray-600">{selectedGroup.description}</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {selectedGroup.params.map((param, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {param.label} ({param.unit})
                  </label>
                  <input
                    type="text"
                    value={editValues[param.key] || ""}
                    onChange={(e) => handleValueChange(param.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="输入数值"
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500">
                支持科学计数法，如: 1e20, 1.5e-3
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}