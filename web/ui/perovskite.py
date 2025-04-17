import gradio as gr
from api.perovskite import load_default_perovskite_params, call_perovskite_predict_api, debounced_predict

def build_perovskite_tab():
    with gr.Tab("钙钛矿电池参数预测"):
        default_perovskite_params = load_default_perovskite_params()
        with gr.Row():
            with gr.Column(scale=2):
                perovskite_jv_curve = gr.Image(label="钙钛矿JV曲线", height=350)
            with gr.Column(scale=1):
                perovskite_result_text = gr.Textbox(label="预测结果", lines=10)
                perovskite_loading_indicator = gr.Markdown("_仿真状态: 就绪_")
        perovskite_type_radio = gr.Radio(
            ["narrow", "wide"],
            label="钙钛矿类型",
            value="narrow",
            info="选择窄带隙或宽带隙模型"
        )
        perovskite_param_definitions = {
            'er_HTL_top': ('HTL相对介电常数', 1, 10, 0.1),
            'x_HTL_top': ('HTL电子亲和能 (eV)', 1, 5, 0.1),
            'Eg_HTL_top': ('HTL带隙 (eV)', 1, 5, 0.1),
            'Nc_HTL_top': ('HTL导带有效态密度 (cm^-3)', 1e18, 1e22, 1e18),
            'Nv_HTL_top': ('HTL价带有效态密度 (cm^-3)', 1e18, 1e22, 1e18),
            'mun_HTL_top': ('HTL电子迁移率 (cm²/Vs)', 1e-6, 1e-2, 1e-6),
            'mup_HTL_top': ('HTL空穴迁移率 (cm²/Vs)', 1e-4, 1, 1e-4),
            'tn_HTL_top': ('HTL电子寿命 (s)', 1e-9, 1e-3, 1e-9),
            'tp_HTL_top': ('HTL空穴寿命 (s)', 1e-9, 1e-3, 1e-9),
            'er_ETL_top': ('ETL相对介电常数', 1, 20, 0.1),
            'x_ETL_top': ('ETL电子亲和能 (eV)', 3, 6, 0.1),
            'Eg_ETL_top': ('ETL带隙 (eV)', 1, 5, 0.1),
            'Nc_ETL_top': ('ETL导带有效态密度 (cm^-3)', 1e17, 1e21, 1e17),
            'Nv_ETL_top': ('ETL价带有效态密度 (cm^-3)', 1e17, 1e21, 1e17),
            'mun_ETL_top': ('ETL电子迁移率 (cm²/Vs)', 1, 1000, 10),
            'mup_ETL_top': ('ETL空穴迁移率 (cm²/Vs)', 1, 1000, 10),
            'tn_ETL_top': ('ETL电子寿命 (s)', 1e-9, 1e-4, 1e-9),
            'tp_ETL_top': ('ETL空穴寿命 (s)', 1e-9, 1e-4, 1e-9),
            'er_PSK_top': ('钙钛矿相对介电常数', 1, 20, 0.1),
            'x_PSK_top': ('钙钛矿电子亲和能 (eV)', 3, 6, 0.1),
            'Nc_PSK_top': ('钙钛矿导带有效态密度 (cm^-3)', 1e15, 1e19, 1e15),
            'Nv_PSK_top': ('钙钛矿价带有效态密度 (cm^-3)', 1e15, 1e19, 1e15),
            'mun_PSK_top': ('钙钛矿电子迁移率 (cm²/Vs)', 1, 100, 1),
            'mup_PSK_top': ('钙钛矿空穴迁移率 (cm²/Vs)', 1, 100, 1),
            'tn_PSK_top': ('钙钛矿电子寿命 (s)', 1e-9, 1e-5, 1e-9),
            'tp_PSK_top': ('钙钛矿空穴寿命 (s)', 1e-9, 1e-5, 1e-9),
            'Eg_PSK_top': ('钙钛矿带隙 (eV)', 1, 2, 0.01),
            't_HTL_top': ('HTL厚度 (μm)', 0.01, 0.2, 0.001),
            't_PSK_top': ('钙钛矿厚度 (μm)', 0.1, 2, 0.01),
            't_ETL_top': ('ETL厚度 (μm)', 0.01, 0.2, 0.001),
            'Na_HTL_top': ('HTL受主掺杂浓度 (cm^-3)', 1e16, 1e20, 1e16),
            'Nd_PSK_top': ('钙钛矿施主掺杂浓度 (cm^-3)', 1e14, 1e18, 1e14),
            'Nd_ETL_top': ('ETL施主掺杂浓度 (cm^-3)', 1e17, 1e21, 1e17),
            'Nt_HTL_top': ('HTL缺陷态密度 (cm^-3)', 1e13, 1e18, 1e13),
            'Nt_PSK_top': ('钙钛矿缺陷态密度 (cm^-3)', 1e11, 1e16, 1e11),
            'Nt_ETL_top': ('ETL缺陷态密度 (cm^-3)', 1e13, 1e18, 1e13),
            'Cap_area': ('电容面积 (cm²)', 1e-18, 1e-15, 1e-18),
            'Dit_top_HTL_PSK': ('HTL/PSK界面缺陷密度 (cm^-2)', 1e8, 1e14, 1e8),
            'Dit_top_ETL_PSK': ('ETL/PSK界面缺陷密度 (cm^-2)', 1e10, 1e15, 1e10)
        }
        perovskite_input_controls = {}
        perovskite_input_displays = {}
        num_params = len(perovskite_param_definitions)
        mid_point = (num_params + 1) // 2
        param_items = list(perovskite_param_definitions.items())
        with gr.Accordion("参数设置", open=True):
            with gr.Row():
                with gr.Column():
                    for i, (name, (label, min_val, max_val, step)) in enumerate(param_items):
                        if i < mid_point:
                            default_val = default_perovskite_params.get(name, (min_val + max_val) / 2)
                            is_sci_notation = max_val / min_val > 1000 or max_val > 1e6 or min_val < 1e-3
                            if is_sci_notation:
                                with gr.Row():
                                    with gr.Column(scale=3):
                                        control = gr.Slider(minimum=min_val, maximum=max_val, value=default_val, label=label, step=step, scale=0)
                                    with gr.Column(scale=1):
                                        display = gr.Markdown(f"当前值: {default_val:.2e}")
                                        perovskite_input_displays[name] = display
                                        control.change(lambda x, l=label: f"当前值: {x:.2e}", [control], display)
                            else:
                                control = gr.Slider(minimum=min_val, maximum=max_val, value=default_val, label=label, step=step)
                            perovskite_input_controls[name] = control
                with gr.Column():
                    for i, (name, (label, min_val, max_val, step)) in enumerate(param_items):
                        if i >= mid_point:
                            default_val = default_perovskite_params.get(name, (min_val + max_val) / 2)
                            is_sci_notation = max_val / min_val > 1000 or max_val > 1e6 or min_val < 1e-3
                            if is_sci_notation:
                                with gr.Row():
                                    with gr.Column(scale=3):
                                        control = gr.Slider(minimum=min_val, maximum=max_val, value=default_val, label=label, step=step, scale=0)
                                    with gr.Column(scale=1):
                                        display = gr.Markdown(f"当前值: {default_val:.2e}")
                                        perovskite_input_displays[name] = display
                                        control.change(lambda x, l=label: f"当前值: {x:.2e}", [control], display)
                            else:
                                control = gr.Slider(minimum=min_val, maximum=max_val, value=default_val, label=label, step=step)
                            perovskite_input_controls[name] = control
        perovskite_ordered_controls = list(perovskite_input_controls.values())
        all_inputs = [perovskite_type_radio] + perovskite_ordered_controls
        debounced_perovskite_predict_fn = debounced_predict(call_perovskite_predict_api, delay_ms=500)
        for control in all_inputs:
            control.change(
                debounced_perovskite_predict_fn,
                inputs=all_inputs,
                outputs=[perovskite_result_text, perovskite_jv_curve],
                queue=True,
                show_progress=False
            )
        gr.Blocks().load(
            call_perovskite_predict_api,
            inputs=all_inputs,
            outputs=[perovskite_result_text, perovskite_jv_curve],
            queue=True,
            show_progress=False
        ) 