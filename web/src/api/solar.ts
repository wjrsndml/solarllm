import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface SolarParams {
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
  Dit_Si_SiOx: number;  // maps to 'Dit Si-SiOx' in backend
  Dit_SiOx_Poly: number; // maps to 'Dit SiOx-Poly' in backend
  Dit_top: number;  // maps to 'Dit top' in backend
}

export interface SolarPredictions {
  Vm: number;
  Im: number;
  Voc: number;
  Jsc: number;
  FF: number;
  Eff: number;
}

export interface SolarPredictionResult {
  predictions: SolarPredictions;
  jv_curve: string;  // base64 encoded image
}

// 获取默认参数
export const getDefaultParams = async (): Promise<SolarParams> => {
  const response = await axios.get(`${API_URL}/solar/default-params`);
  return response.data;
};

// 使用给定参数预测太阳能电池性能
export const predictSolarParams = async (params: SolarParams): Promise<SolarPredictionResult> => {
  const response = await axios.post(`${API_URL}/solar/predict`, params);
  return response.data;
};
