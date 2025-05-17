import gradio as gr
from api.solar import load_default_solar_params, predict_solar_params, debounced_predict
import os

def build_solar_tab():
    with gr.Tab("太阳能电池参数预测"):
        default_params = load_default_solar_params()
        with gr.Row():
            # with gr.Column(scale=1):
            #     # 3D模型展示
            #     gr.Markdown("### TOPCon 电池结构3D模型")
            #     model3d_path = os.path.abspath("/home/gqh/code/project/solarllm/TOPCon.glb")
            #     gr.Model3D(model3d_path, label="TOPCon 结构")
            # with gr.Column():
            jv_curve = gr.Image(label="JV曲线")
            with gr.Column():
                result_text = gr.Textbox(label="预测结果", lines=10)
                loading_indicator = gr.Markdown("_仿真状态: 就绪_")
        with gr.Row():
            with gr.Column():
                gr.Markdown("## 输入参数 (拖动滑块自动更新仿真结果)")
                Si_thk = gr.Slider(minimum=100, maximum=300, value=default_params.get('Si_thk', 180), label="Si 厚度 (μm) [对应: 硅片主体]", step=1)
                t_SiO2 = gr.Slider(minimum=0.5, maximum=5, value=default_params.get('t_SiO2', 1.4), label="SiO2 厚度 (nm) [对应: 隔离氧化层]", step=0.1)
                t_polySi_rear_P = gr.Slider(minimum=0.01, maximum=0.3, value=default_params.get('t_polySi_rear_P', 0.1), label="后表面 PolySi 厚度 (μm) [对应: 背面多晶硅]", step=0.01)
                front_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('front_junc', 0.5), label="前表面结深度 (μm) [对应: 正面结]", step=0.1)
                rear_junc = gr.Slider(minimum=0.1, maximum=2, value=default_params.get('rear_junc', 0.5), label="后表面结深度 (μm) [对应: 背面结]", step=0.1)
                resist_rear = gr.Slider(minimum=0.01, maximum=3, value=default_params.get('resist_rear', 1), label="后表面电阻 (Ω·cm) [对应: 背面接触]", step=0.01)
            with gr.Column():
                gr.Markdown("## 掺杂与界面参数")
                Nd_top = gr.Slider(minimum=1e18, maximum=1e21, value=default_params.get('Nd_top', 1e20), label="前表面掺杂浓度 (cm^-3) [对应: 正面掺杂区]", step=1e19, scale=0)
                Nd_top_display = gr.Markdown(f"当前值: {default_params.get('Nd_top', 1e20):.2e} cm^-3")
                Nd_rear = gr.Slider(minimum=1e18, maximum=1e21, value=default_params.get('Nd_rear', 1e20), label="后表面掺杂浓度 (cm^-3) [对应: 背面掺杂区]", step=1e19, scale=0)
                Nd_rear_display = gr.Markdown(f"当前值: {default_params.get('Nd_rear', 1e20):.2e} cm^-3")
                Nt_polySi_top = gr.Slider(minimum=1e14, maximum=1e20, value=default_params.get('Nt_polySi_top', 1e19), label="前表面 PolySi 掺杂浓度 (cm^-3) [对应: 正面多晶硅]", step=1e19, scale=0)
                Nt_polySi_top_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_top', 1e19):.2e} cm^-3")
                Nt_polySi_rear = gr.Slider(minimum=1e14, maximum=1e22, value=default_params.get('Nt_polySi_rear', 1e20), label="后表面 PolySi 掺杂浓度 (cm^-3) [对应: 背面多晶硅]", step=1e19, scale=0)
                Nt_polySi_rear_display = gr.Markdown(f"当前值: {default_params.get('Nt_polySi_rear', 1e20):.2e} cm^-3")
                Dit_Si_SiOx = gr.Slider(minimum=5, maximum=5e16, value=default_params.get('Dit_Si_SiOx', 1e10), label="Si-SiOx 界面缺陷密度 (cm^-2) [对应: 硅/氧化层界面]", step=1e9, scale=0)
                Dit_Si_SiOx_display = gr.Markdown(f"当前值: {default_params.get('Dit_Si_SiOx', 1e10):.2e} cm^-2")
                Dit_SiOx_Poly = gr.Slider(minimum=5, maximum=5e16, value=default_params.get('Dit_SiOx_Poly', 1e10), label="SiOx-Poly 界面缺陷密度 (cm^-2) [对应: 氧化层/多晶硅界面]", step=1e9, scale=0)
                Dit_SiOx_Poly_display = gr.Markdown(f"当前值: {default_params.get('Dit_SiOx_Poly', 1e10):.2e} cm^-2")
                Dit_top = gr.Slider(minimum=5, maximum=5e14, value=default_params.get('Dit_top', 1e10), label="顶部界面缺陷密度 (cm^-2) [对应: 顶部界面]", step=1e9, scale=0)
                Dit_top_display = gr.Markdown(f"当前值: {default_params.get('Dit_top', 1e10):.2e} cm^-2")
        input_params = [Si_thk, t_SiO2, t_polySi_rear_P, front_junc, rear_junc, resist_rear, Nd_top, Nd_rear, Nt_polySi_top, Nt_polySi_rear, Dit_Si_SiOx, Dit_SiOx_Poly, Dit_top]
        def predict_with_status(*args):
            loading_indicator.value = "_仿真状态: 计算中..._"
            try:
                new_result_text, new_jv_curve = predict_solar_params(*args)
                loading_indicator.value = "_仿真状态: 完成_"
                return new_result_text, new_jv_curve
            except Exception as e:
                loading_indicator.value = "_仿真状态: 出错_"
                return f"预测出错: {str(e)}", None
        debounced_predict_fn = debounced_predict(predict_with_status, delay_ms=500)
        Nd_top.change(lambda x: f"当前值: {x:.2e} cm^-3", Nd_top, Nd_top_display)
        Nd_rear.change(lambda x: f"当前值: {x:.2e} cm^-3", Nd_rear, Nd_rear_display)
        Nt_polySi_top.change(lambda x: f"当前值: {x:.2e} cm^-3", Nt_polySi_top, Nt_polySi_top_display)
        Nt_polySi_rear.change(lambda x: f"当前值: {x:.2e} cm^-3", Nt_polySi_rear, Nt_polySi_rear_display)
        Dit_Si_SiOx.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_Si_SiOx, Dit_Si_SiOx_display)
        Dit_SiOx_Poly.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_SiOx_Poly, Dit_SiOx_Poly_display)
        Dit_top.change(lambda x: f"当前值: {x:.2e} cm^-2", Dit_top, Dit_top_display)
        for param in input_params:
            param.change(
                debounced_predict_fn,
                input_params,
                [result_text, jv_curve],
                queue=True,
                show_progress=False
            )
        gr.Blocks().load(
            predict_with_status,
            input_params,
            [result_text, jv_curve],
            queue=True,
            show_progress=False
        ) 