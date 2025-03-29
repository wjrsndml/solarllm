import socket
import requests

def get_local_ip():
    """获取本地IP地址"""
    try:
        # 创建一个临时socket连接，用于获取本地IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接到一个外部服务器（不需要真正建立连接）
        s.connect(("8.8.8.8", 80))
        # 获取本地IP
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip+":8000"
    except Exception as e:
        print(f"获取本地IP出错: {e}")
        return "无法获取本地IP"

def get_public_ip():
    """获取公网IP地址"""
    try:
        # 使用公共API获取外网IP
        response = requests.get("https://api.ipify.org?format=json", timeout=5)
        public_ip = response.json()["ip"]
        return public_ip
    except Exception as e:
        print(f"获取公网IP出错: {e}")
        return "无法获取公网IP"

if __name__ == "__main__":
    print(f"本地IP地址: {get_local_ip()}")
    print(f"公网IP地址: {get_public_ip()}")