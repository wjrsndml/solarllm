import gradio as gr
from api.aging import load_default_aging_params, predict_aging_curve, update_aging_params

def build_aging_tab():
    with gr.Tab("太阳能电池老化预测"):
        default_aging_params = load_default_aging_params()
        with gr.Row():
            with gr.Column(scale=2):
                aging_curve = gr.Image(label="老化曲线", height=350)
            with gr.Column(scale=1):
                aging_result_text = gr.Textbox(label="预测结果", lines=10)
                aging_loading_indicator = gr.Markdown("_老化预测状态: 就绪_")
        # 参数名列表（可根据实际API调整）
        aging_param_names = [
            'Cell_architecture', 'Substrate_stack_sequence', 'Substrate_thickness',
            'ETL_stack_sequence', 'ETL_thickness', 'ETL_additives_compounds',
            'ETL_deposition_procedure', 'ETL_deposition_synthesis_atmosphere',
            'ETL_deposition_solvents', 'ETL_deposition_substrate_temperature',
            'ETL_deposition_thermal_annealing_temperature', 'ETL_deposition_thermal_annealing_time',
            'ETL_deposition_thermal_annealing_atmosphere', 'ETL_storage_atmosphere',
            'Perovskite_dimension_0D', 'Perovskite_dimension_2D', 'Perovskite_dimension_2D3D_mixture',
            'Perovskite_dimension_3D', 'Perovskite_dimension_3D_with_2D_capping_layer',
            'Perovskite_composition_a_ions', 'Perovskite_composition_a_ions_coefficients',
            'Perovskite_composition_b_ions', 'Perovskite_composition_b_ions_coefficients',
            'Perovskite_composition_c_ions', 'Perovskite_composition_c_ions_coefficients',
            'Perovskite_composition_inorganic', 'Perovskite_composition_leadfree',
            'Perovskite_additives_compounds', 'Perovskite_thickness', 'Perovskite_band_gap',
            'Perovskite_pl_max', 'Perovskite_deposition_number_of_deposition_steps',
            'Perovskite_deposition_procedure', 'Perovskite_deposition_aggregation_state_of_reactants',
            'Perovskite_deposition_synthesis_atmosphere', 'Perovskite_deposition_solvents',
            'Perovskite_deposition_substrate_temperature', 'Perovskite_deposition_quenching_induced_crystallisation',
            'Perovskite_deposition_quenching_media', 'Perovskite_deposition_quenching_media_volume',
            'Perovskite_deposition_thermal_annealing_temperature', 'Perovskite_deposition_thermal_annealing_time',
            'Perovskite_deposition_thermal_annealing_atmosphere', 'Perovskite_deposition_solvent_annealing',
            'HTL_stack_sequence', 'HTL_thickness_list', 'HTL_additives_compounds',
            'HTL_deposition_procedure', 'HTL_deposition_aggregation_state_of_reactants',
            'HTL_deposition_synthesis_atmosphere', 'HTL_deposition_solvents',
            'HTL_deposition_thermal_annealing_temperature', 'HTL_deposition_thermal_annealing_time',
            'HTL_deposition_thermal_annealing_atmosphere', 'Backcontact_stack_sequence',
            'Backcontact_thickness_list', 'Backcontact_deposition_procedure',
            'Encapsulation', 'Encapsulation_stack_sequence', 'Encapsulation_edge_sealing_materials',
            'Encapsulation_atmosphere_for_encapsulation', 'JV_default_Voc', 'JV_default_Jsc',
            'JV_default_FF', 'JV_default_PCE', 'Stability_protocol',
            'Stability_average_over_n_number_of_cells', 'Stability_light_intensity',
            'Stability_light_spectra', 'Stability_light_UV_filter',
            'Stability_potential_bias_load_condition', 'Stability_PCE_burn_in_observed',
            'Stability_light_source_type', 'Stability_temperature_range',
            'Stability_atmosphere', 'Stability_relative_humidity_average_value'
        ]
        aging_param_controls = []
        for param in aging_param_names:
            default_val = default_aging_params.get(param, 1)
            control = gr.Slider(minimum=0, maximum=100, value=default_val, step=1, label=param)
            aging_param_controls.append(control)
        predict_btn = gr.Button("进行老化预测", variant="primary")
        def predict_with_aging_status(*args):
            aging_loading_indicator.value = "_老化预测状态: 计算中..._"
            try:
                params_dict = update_aging_params(*args)
                new_result_text, new_aging_curve = predict_aging_curve(params_dict)
                aging_loading_indicator.value = "_老化预测状态: 完成_"
                return new_result_text, new_aging_curve
            except Exception as e:
                aging_loading_indicator.value = "_老化预测状态: 出错_"
                return f"预测出错: {str(e)}", None
        predict_btn.click(
            predict_with_aging_status,
            aging_param_controls,
            [aging_result_text, aging_curve],
            queue=True
        )
        gr.Blocks().load(
            predict_with_aging_status,
            aging_param_controls,
            [aging_result_text, aging_curve],
            queue=True,
            show_progress=False
        ) 