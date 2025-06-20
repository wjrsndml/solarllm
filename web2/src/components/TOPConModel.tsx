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

interface LayerInfo {
  key: keyof SolarParams;
  label: string;
  unit: string;
  description: string;
  color: string;
}

export default function TOPConModel({ params, onParamChange }: TOPConModelProps) {
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editValue, setEditValue] = useState("");

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

  // 定义电池各层信息
  const layers: LayerInfo[] = [
    // 结构层
    { key: "Si_thk", label: "硅片厚度", unit: "μm", description: "硅片主体厚度", color: "#94a3b8" },
    { key: "t_SiO2", label: "SiO2层厚度", unit: "nm", description: "隔离氧化层厚度", color: "#f59e0b" },
    { key: "t_polySi_rear_P", label: "后表面PolySi厚度", unit: "μm", description: "背面多晶硅厚度", color: "#ef4444" },
    
    // 结深参数
    { key: "front_junc", label: "前表面结深度", unit: "μm", description: "正面结深度", color: "#3b82f6" },
    { key: "rear_junc", label: "后表面结深度", unit: "μm", description: "背面结深度", color: "#8b5cf6" },
    
    // 电阻参数
    { key: "resist_rear", label: "后表面电阻", unit: "Ω·cm", description: "背面接触电阻", color: "#06b6d4" },
    
    // 掺杂浓度
    { key: "Nd_top", label: "前表面掺杂浓度", unit: "cm⁻³", description: "正面掺杂区", color: "#10b981" },
    { key: "Nd_rear", label: "后表面掺杂浓度", unit: "cm⁻³", description: "背面掺杂区", color: "#f97316" },
    { key: "Nt_polySi_top", label: "前表面PolySi掺杂浓度", unit: "cm⁻³", description: "正面多晶硅", color: "#84cc16" },
    { key: "Nt_polySi_rear", label: "后表面PolySi掺杂浓度", unit: "cm⁻³", description: "背面多晶硅", color: "#ec4899" },
    
    // 界面缺陷密度
    { key: "Dit_Si_SiOx", label: "Si-SiOx界面缺陷密度", unit: "cm⁻²", description: "硅/氧化层界面", color: "#6366f1" },
    { key: "Dit_SiOx_Poly", label: "SiOx-Poly界面缺陷密度", unit: "cm⁻²", description: "氧化层/多晶硅界面", color: "#a855f7" },
    { key: "Dit_top", label: "顶部界面缺陷密度", unit: "cm⁻²", description: "顶部界面", color: "#14b8a6" },
  ];

  const handleLayerClick = (layer: LayerInfo) => {
    setSelectedLayer(layer);
    setEditValue(formatValue(params[layer.key]));
    setShowModal(true);
  };

  const handleSave = () => {
    if (selectedLayer) {
      const newValue = parseValue(editValue);
      onParamChange(selectedLayer.key, newValue);
      setShowModal(false);
      setSelectedLayer(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedLayer(null);
  };

  return (
    <>
      <div className="gradient-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">TOPCon电池结构</h3>
            <p className="text-sm text-gray-600">点击各层来修改参数</p>
          </div>
        </div>

        {/* 电池结构图 */}
        <div className="relative bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          {/* 光照箭头 */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="flex flex-col items-center">
              <div className="text-yellow-500 text-sm font-medium">☀️ 光照</div>
              <div className="flex space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-8 bg-yellow-400 opacity-60"></div>
                ))}
              </div>
            </div>
          </div>

          {/* 前表面电极 */}
          <div className="mt-12 mb-1">
            <div className="h-3 bg-gray-600 rounded-t-lg relative">
            </div>
          </div>

          {/* 前表面ARC层 */}
          <div 
            className="h-4 bg-blue-300 cursor-pointer hover:bg-blue-400 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Dit_top')!)}
          >
          </div>

          {/* 前表面掺杂区 */}
          <div 
            className="h-8 bg-green-400 cursor-pointer hover:bg-green-500 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Nd_top')!)}
          >
          </div>

          {/* 前表面结深度指示 */}
          <div 
            className="h-4 bg-blue-200 cursor-pointer hover:bg-blue-300 transition-colors relative border-t border-blue-400"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'front_junc')!)}
          >
          </div>

          {/* 硅片主体 */}
          <div 
            className="h-32 bg-slate-400 cursor-pointer hover:bg-slate-500 transition-colors relative flex items-center justify-center"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Si_thk')!)}
          >
            <div className="text-white font-bold text-2xl">Si</div>
          </div>

          {/* 后表面结深度指示 */}
          <div 
            className="h-4 bg-purple-200 cursor-pointer hover:bg-purple-300 transition-colors relative border-b border-purple-400"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'rear_junc')!)}
          >
          </div>

          {/* 后表面掺杂区 */}
          <div 
            className="h-8 bg-orange-400 cursor-pointer hover:bg-orange-500 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Nd_rear')!)}
          >
          </div>

          {/* SiO2隧穿氧化层 */}
          <div 
            className="h-3 bg-yellow-400 cursor-pointer hover:bg-yellow-500 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 't_SiO2')!)}
          >
          </div>

          {/* 界面缺陷指示 */}
          <div 
            className="h-2 bg-red-300 cursor-pointer hover:bg-red-400 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Dit_Si_SiOx')!)}
          >
          </div>

          {/* 后表面多晶硅层 */}
          <div 
            className="h-6 bg-red-500 cursor-pointer hover:bg-red-600 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 't_polySi_rear_P')!)}
          >
          </div>

          {/* 界面缺陷指示 */}
          <div 
            className="h-2 bg-purple-300 cursor-pointer hover:bg-purple-400 transition-colors relative"
            onClick={() => handleLayerClick(layers.find(l => l.key === 'Dit_SiOx_Poly')!)}
          >
          </div>

          {/* 后表面电极 */}
          <div className="mt-1">
            <div 
              className="h-3 bg-gray-600 rounded-b-lg relative cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleLayerClick(layers.find(l => l.key === 'resist_rear')!)}
            >
            </div>
          </div>
        </div>

        {/* 参数详情显示 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-3">当前参数值</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                <span className="font-medium">前电极</span>
              </div>
              <span className="text-gray-600">金属电极</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-300 rounded"></div>
                <span className="font-medium">ARC层</span>
              </div>
              <span className="text-blue-600 font-mono">{formatValue(params.Dit_top)} cm⁻²</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span className="font-medium">n+掺杂区</span>
              </div>
              <span className="text-green-600 font-mono">{formatValue(params.Nd_top)} cm⁻³</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span className="font-medium">前结深度</span>
              </div>
              <span className="text-blue-600 font-mono">{formatValue(params.front_junc)} μm</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded"></div>
                <span className="font-medium">硅片厚度</span>
              </div>
              <span className="text-slate-600 font-mono">{formatValue(params.Si_thk)} μm</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-200 rounded"></div>
                <span className="font-medium">后结深度</span>
              </div>
              <span className="text-purple-600 font-mono">{formatValue(params.rear_junc)} μm</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded"></div>
                <span className="font-medium">p+掺杂区</span>
              </div>
              <span className="text-orange-600 font-mono">{formatValue(params.Nd_rear)} cm⁻³</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span className="font-medium">SiO2层厚度</span>
              </div>
              <span className="text-yellow-600 font-mono">{formatValue(params.t_SiO2)} nm</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-300 rounded"></div>
                <span className="font-medium">Si-SiOx界面</span>
              </div>
              <span className="text-red-600 font-mono">{formatValue(params.Dit_Si_SiOx)} cm⁻²</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="font-medium">poly-Si层厚度</span>
              </div>
              <span className="text-red-600 font-mono">{formatValue(params.t_polySi_rear_P)} μm</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-300 rounded"></div>
                <span className="font-medium">SiOx-Poly界面</span>
              </div>
              <span className="text-purple-600 font-mono">{formatValue(params.Dit_SiOx_Poly)} cm⁻²</span>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                <span className="font-medium">后电极电阻</span>
              </div>
              <span className="text-gray-600 font-mono">{formatValue(params.resist_rear)} Ω·cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 参数编辑模态框 */}
      {showModal && selectedLayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedLayer.label}</h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{selectedLayer.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedLayer.color }}
                ></div>
                <span className="text-sm font-medium">单位: {selectedLayer.unit}</span>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                参数值
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                placeholder="输入数值"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 