// 参数配置：包含每个参数的范围、步长和显示标签
export interface ParamConfig {
  label: string;  // 显示名称
  min: number;    // 最小值
  max: number;    // 最大值
  step: number;   // 步长
  unit?: string;  // 单位（可选）
  scale?: 'linear' | 'log';  // 显示刻度（线性或对数）
  defaultValue: number; // 默认值
  description?: string; // 参数描述
}

// 所有太阳能电池参数的配置
export const paramConfigurations: Record<string, ParamConfig> = {
  Si_thk: {
    label: '硅片厚度',
    min: 100,
    max: 300,
    step: 10,
    unit: 'μm',
    scale: 'linear',
    defaultValue: 180,
    description: '硅片厚度影响电池的光吸收能力和成本'
  },
  t_SiO2: {
    label: '二氧化硅厚度',
    min: 0.1,
    max: 10,
    step: 0.001,
    unit: 'μm',
    scale: 'linear',
    defaultValue: 1.4,
    description: '钝化层厚度影响界面性能'
  },
  t_polySi_rear_P: {
    label: '背面多晶硅厚度',
    min: 10,
    max: 250,
    step: 10,
    unit: 'nm',
    scale: 'linear',
    defaultValue: 100,
    description: '背面多晶硅厚度影响背场形成和接触特性'
  },
  front_junc: {
    label: '前结',
    min: 0.1,
    max: 2.0,
    step: 0.1,
    unit: 'μm',
    scale: 'linear',
    defaultValue: 0.5,
    description: '前结深度影响载流子收集和表面钝化'
  },
  rear_junc: {
    label: '后结',
    min: 0.1,
    max: 2.0,
    step: 0.1,
    unit: 'μm',
    scale: 'linear',
    defaultValue: 0.5,
    description: '后结深度影响背面场效应和电子收集'
  },
  resist_rear: {
    label: '背面电阻',
    min: 10,
    max: 500,
    step: 10,
    unit: 'Ω/□',
    scale: 'linear',
    defaultValue: 100,
    description: '背面电阻影响载流子传输和串联电阻'
  },
  Nd_top: {
    label: '顶部掺杂浓度',
    min: 1e18,
    max: 1e21,
    step: 1e18,
    unit: 'cm⁻³',
    scale: 'log',
    defaultValue: 1e20,
    description: '顶部区域的掺杂浓度影响载流子浓度和迁移率'
  },
  Nd_rear: {
    label: '背面掺杂浓度',
    min: 1e18,
    max: 1e21,
    step: 1e18,
    unit: 'cm⁻³',
    scale: 'log',
    defaultValue: 1e20,
    description: '背面区域的掺杂浓度影响背场形成'
  },
  Nt_polySi_top: {
    label: '顶部缺陷态密度',
    min: 1e18,
    max: 1e21,
    step: 1e18,
    unit: 'cm⁻³',
    scale: 'log',
    defaultValue: 1e20,
    description: '顶部缺陷态密度影响接触电阻'
  },
  Nt_polySi_rear: {
    label: '背面缺陷态密度',
    min: 1e18,
    max: 1e21,
    step: 1e18,
    unit: 'cm⁻³',
    scale: 'log',
    defaultValue: 1e20,
    description: '背面缺陷态密度影响接触电阻和选择性'
  },
  Dit_Si_SiOx: {
    label: 'Si-SiOx界面态密度',
    min: 1e9,
    max: 1e12,
    step: 1e9,
    unit: 'cm⁻²eV⁻¹',
    scale: 'log',
    defaultValue: 1e10,
    description: 'Si-SiOx界面态密度影响表面复合'
  },
  Dit_SiOx_Poly: {
    label: 'SiOx-Poly界面态密度',
    min: 1e9,
    max: 1e12,
    step: 1e9,
    unit: 'cm⁻²eV⁻¹',
    scale: 'log',
    defaultValue: 1e10,
    description: 'SiOx-Poly界面态密度影响载流子传输'
  },
  Dit_top: {
    label: '顶部界面态密度',
    min: 1e9,
    max: 1e12,
    step: 1e9,
    unit: 'cm⁻²eV⁻¹',
    scale: 'log',
    defaultValue: 1e10,
    description: '顶部界面态密度影响表面钝化效果'
  }
};

// 输出参数配置
export interface OutputParamConfig {
  label: string;
  unit: string;
  description: string;
  color?: string;
}

export const outputParamConfigurations: Record<string, OutputParamConfig> = {
  Vm: {
    label: '最大功率点电压',
    unit: 'V',
    description: '最大功率点对应的电压值',
    color: '#1677ff'
  },
  Im: {
    label: '最大功率点电流密度',
    unit: 'mA/cm²',
    description: '最大功率点对应的电流密度',
    color: '#52c41a'
  },
  Voc: {
    label: '开路电压',
    unit: 'V',
    description: '电池在开路状态下的输出电压',
    color: '#fa8c16'
  },
  Jsc: {
    label: '短路电流密度',
    unit: 'mA/cm²',
    description: '电池在短路状态下的电流密度',
    color: '#eb2f96'
  },
  FF: {
    label: '填充因子',
    unit: '',
    description: '实际最大输出功率与理论最大功率的比值',
    color: '#722ed1'
  },
  Eff: {
    label: '效率',
    unit: '%',
    description: '太阳能电池的能量转换效率',
    color: '#f5222d'
  },
};
