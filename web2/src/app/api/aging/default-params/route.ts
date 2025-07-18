import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/ip-utils';

export async function GET(request: NextRequest) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    
    console.log('获取钙钛矿老化默认参数');
    console.log('使用API地址:', apiBaseUrl);

    const response = await fetch(`${apiBaseUrl}/aging/default-params`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`老化默认参数API响应错误: ${response.status} ${response.statusText}`);
      // 如果API失败，返回硬编码的默认值
      return NextResponse.json({
        Cell_architecture: "n-i-p",
        Substrate_stack_sequence: "Glass/ITO",
        Substrate_thickness: 1.1,
        ETL_stack_sequence: "TiO2",
        ETL_thickness: 30,
        ETL_additives_compounds: "",
        ETL_deposition_procedure: "Solution processing",
        ETL_deposition_synthesis_atmosphere: "Air",
        ETL_deposition_solvents: "Ethanol",
        ETL_deposition_substrate_temperature: 25,
        ETL_deposition_thermal_annealing_temperature: 450,
        ETL_deposition_thermal_annealing_time: 30,
        ETL_deposition_thermal_annealing_atmosphere: "Air",
        ETL_storage_atmosphere: "Air",
        Perovskite_dimension_0D: false,
        Perovskite_dimension_2D: false,
        Perovskite_dimension_2D3D_mixture: false,
        Perovskite_dimension_3D: true,
        Perovskite_dimension_3D_with_2D_capping_layer: false,
        Perovskite_composition_a_ions: "MA; FA; Cs",
        Perovskite_composition_a_ions_coefficients: "0.15; 0.83; 0.02",
        Perovskite_composition_b_ions: "Pb",
        Perovskite_composition_b_ions_coefficients: "1",
        Perovskite_composition_c_ions: "I; Br",
        Perovskite_composition_c_ions_coefficients: "2.55; 0.45",
        Perovskite_composition_inorganic: false,
        Perovskite_composition_leadfree: false,
        Perovskite_additives_compounds: "",
        Perovskite_thickness: 500,
        Perovskite_band_gap: 1.6,
        Perovskite_pl_max: 780,
        Perovskite_deposition_number_of_deposition_steps: 1,
        Perovskite_deposition_procedure: "Solution processing",
        Perovskite_deposition_aggregation_state_of_reactants: "Liquid",
        Perovskite_deposition_synthesis_atmosphere: "N2",
        Perovskite_deposition_solvents: "DMF; DMSO",
        Perovskite_deposition_substrate_temperature: 25,
        Perovskite_deposition_quenching_induced_crystallisation: true,
        Perovskite_deposition_quenching_media: "Chlorobenzene",
        Perovskite_deposition_thermal_annealing_temperature: 100,
        Perovskite_deposition_thermal_annealing_time: 10,
        Perovskite_deposition_thermal_annealing_atmosphere: "N2",
        Perovskite_deposition_solvent_annealing: false,
        HTL_stack_sequence: "Spiro-OMeTAD",
        HTL_thickness_list: 200,
        HTL_additives_compounds: "Li-TFSI; tBP",
        HTL_deposition_procedure: "Solution processing",
        HTL_deposition_aggregation_state_of_reactants: "Liquid",
        HTL_deposition_synthesis_atmosphere: "Air",
        HTL_deposition_solvents: "Chlorobenzene",
        HTL_deposition_thermal_annealing_temperature: 0,
        HTL_deposition_thermal_annealing_time: 0,
        HTL_deposition_thermal_annealing_atmosphere: "Air",
        Backcontact_stack_sequence: "Au",
        Backcontact_thickness_list: 80,
        Backcontact_deposition_procedure: "Evaporation",
        Encapsulation: false,
        Encapsulation_stack_sequence: "",
        Encapsulation_edge_sealing_materials: "",
        Encapsulation_atmosphere_for_encapsulation: "",
        JV_default_Voc: 1.1,
        JV_default_Jsc: 22.5,
        JV_default_FF: 75,
        JV_default_PCE: 18.6,
        Stability_protocol: "ISOS-L-1",
        Stability_average_over_n_number_of_cells: 5,
        Stability_light_intensity: 1000,
        Stability_light_spectra: "AM1.5G",
        Stability_light_UV_filter: false,
        Stability_potential_bias_load_condition: "Open circuit",
        Stability_PCE_burn_in_observed: false,
        Stability_light_source_type: "Solar simulator",
        Stability_temperature_range: 85,
        Stability_atmosphere: "Air",
        Stability_relative_humidity_average_value: 85
      });
    }

    const data = await response.json();
    console.log('钙钛矿老化默认参数响应:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('获取钙钛矿老化默认参数错误:', error);
    
    // 出错时返回硬编码的默认值
    return NextResponse.json({
      Cell_architecture: "n-i-p",
      Substrate_stack_sequence: "Glass/ITO",
      Substrate_thickness: 1.1,
      ETL_stack_sequence: "TiO2",
      ETL_thickness: 30,
      // ... 其他默认参数
      Stability_temperature_range: 85,
      Stability_atmosphere: "Air", 
      Stability_relative_humidity_average_value: 85
    });
  }
} 