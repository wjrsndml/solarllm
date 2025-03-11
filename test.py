import os

def remove_string_from_files(folder_path, target_string):
    """
    从指定文件夹中的所有txt文件中移除特定字符串
    
    参数:
    folder_path (str): 文件夹路径
    target_string (str): 需要移除的目标字符串
    
    返回:
    int: 处理的文件数量
    """
    processed_files = 0
    
    # 确保文件夹路径存在
    if not os.path.isdir(folder_path):
        print(f"错误: '{folder_path}' 不是有效的文件夹路径")
        return 0
    
    # 遍历文件夹中的所有文件
    for filename in os.listdir(folder_path):
        if filename.endswith('.txt'):
            file_path = os.path.join(folder_path, filename)
            
            try:
                # 读取文件内容
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # 检查文件中是否包含目标字符串
                if target_string in content:
                    # 移除目标字符串
                    modified_content = content.replace(target_string, '')
                    
                    # 将修改后的内容写回文件
                    with open(file_path, 'w', encoding='utf-8') as file:
                        file.write(modified_content)
                    
                    print(f"已处理: {filename}")
                    processed_files += 1
                else:
                    print(f"跳过: {filename} (未找到目标字符串)")
            
            except Exception as e:
                print(f"处理文件 '{filename}' 时出错: {str(e)}")
    
    return processed_files

# 直接在IDE中运行的代码部分
if __name__ == "__main__":
    # 在这里直接设置参数，无需命令行输入
    folder_path = r"txt"  # 替换为您的文件夹路径
    target_string = "| PVEducation Skip to main content English Espaol 한국어 Русский 简体中文 Bahasa Indonesia Go Leave this field blank Search form Search Main menu Instructions Welcome 1. Introduction 2. Properties of Sunlight 3. Semiconductors & Junctions 4. Solar Cell Operation 5. Design of Silicon Cells 6. Manufacturing Si Cells 7. Modules and Arrays 8. Characterization 9. Material Properties 10. Batteries 11. Appendices Korean Version PDF Equations Interactive Graphs References"  # 替换为您要移除的字符串
    
    print(f"开始处理文件夹: {folder_path}")
    print(f"要移除的字符串: '{target_string}'")
    print("-" * 40)
    
    # 执行字符串移除操作
    files_processed = remove_string_from_files(folder_path, target_string)
    
    # 输出处理结果
    print("-" * 40)
    print(f"操作完成: 已处理 {files_processed} 个文件")
    
    # 防止IDE自动关闭窗口，等待用户输入
    input("\n按Enter键退出...")