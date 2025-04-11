import requests
import json
from pprint import pprint

# API基础URL
BASE_URL = "http://localhost:8000"  # 请根据实际情况修改

def test_MAPbIBr_prediction():
    """测试MAPbIBr类型的带隙预测"""
    print("\n===== 测试MAPbIBr类型带隙预测 =====")
    
    url = f"{BASE_URL}/api/perovskite/predict-bandgap"
    
    # 测试案例1: Br百分比 = 0
    payload = {
        "perovskite_type": "MAPbIBr",
        "Br_percentage": 0
    }
    
    response = requests.post(url, json=payload)
    print(f"测试1 (Br = 0): 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例2: Br百分比 = 0.5
    payload = {
        "perovskite_type": "MAPbIBr",
        "Br_percentage": 0.5
    }
    
    response = requests.post(url, json=payload)
    print(f"测试2 (Br = 0.5): 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例3: Br百分比 = 1
    payload = {
        "perovskite_type": "MAPbIBr",
        "Br_percentage": 1
    }
    
    response = requests.post(url, json=payload)
    print(f"测试3 (Br = 1): 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例4: 缺少必要参数
    payload = {
        "perovskite_type": "MAPbIBr"
    }
    
    response = requests.post(url, json=payload)
    print(f"测试4 (缺少参数): 状态码 = {response.status_code}")
    pprint(response.json())

def test_CsMAFAPbIBr_prediction():
    """测试CsMAFAPbIBr类型的带隙预测"""
    print("\n===== 测试CsMAFAPbIBr类型带隙预测 =====")
    
    url = f"{BASE_URL}/api/perovskite/predict-bandgap"
    
    # 测试案例1: 不同比例组合
    payload = {
        "perovskite_type": "CsMAFAPbIBr",
        "Cs_ratio": 0.3,
        "FA_ratio": 0.4,
        "I_ratio": 0.8
    }
    
    response = requests.post(url, json=payload)
    print(f"测试1: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例2: 不同比例组合
    payload = {
        "perovskite_type": "CsMAFAPbIBr",
        "Cs_ratio": 0.1,
        "FA_ratio": 0.6,
        "I_ratio": 0.9
    }
    
    response = requests.post(url, json=payload)
    print(f"测试2: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例3: 缺少必要参数
    payload = {
        "perovskite_type": "CsMAFAPbIBr",
        "Cs_ratio": 0.3,
        "FA_ratio": 0.4
    }
    
    response = requests.post(url, json=payload)
    print(f"测试3 (缺少参数): 状态码 = {response.status_code}")
    pprint(response.json())

def test_MAFA_prediction():
    """测试MAFA类型的带隙预测"""
    print("\n===== 测试MAFA类型带隙预测 =====")
    
    url = f"{BASE_URL}/api/perovskite/predict-bandgap"
    
    # 测试案例1
    payload = {
        "perovskite_type": "MAFA",
        "MA_ratio": 0.3,
        "I_ratio": 0.7
    }
    
    response = requests.post(url, json=payload)
    print(f"测试1: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例2
    payload = {
        "perovskite_type": "MAFA",
        "MA_ratio": 0.5,
        "I_ratio": 0.5
    }
    
    response = requests.post(url, json=payload)
    print(f"测试2: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例3: 缺少必要参数
    payload = {
        "perovskite_type": "MAFA",
        "MA_ratio": 0.3
    }
    
    response = requests.post(url, json=payload)
    print(f"测试3 (缺少参数): 状态码 = {response.status_code}")
    pprint(response.json())

def test_CsFA_prediction():
    """测试CsFA类型的带隙预测"""
    print("\n===== 测试CsFA类型带隙预测 =====")
    
    url = f"{BASE_URL}/api/perovskite/predict-bandgap"
    
    # 测试案例1
    payload = {
        "perovskite_type": "CsFA",
        "Cs_ratio": 0.2,
        "I_ratio": 0.8
    }
    
    response = requests.post(url, json=payload)
    print(f"测试1: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例2
    payload = {
        "perovskite_type": "CsFA",
        "Cs_ratio": 0.4,
        "I_ratio": 0.6
    }
    
    response = requests.post(url, json=payload)
    print(f"测试2: 状态码 = {response.status_code}")
    pprint(response.json())
    
    # 测试案例3: 缺少必要参数
    payload = {
        "perovskite_type": "CsFA",
        "Cs_ratio": 0.3
    }
    
    response = requests.post(url, json=payload)
    print(f"测试3 (缺少参数): 状态码 = {response.status_code}")
    pprint(response.json())

def test_invalid_type():
    """测试无效的钙钛矿类型"""
    print("\n===== 测试无效的钙钛矿类型 =====")
    
    url = f"{BASE_URL}/api/perovskite/predict-bandgap"
    
    payload = {
        "perovskite_type": "InvalidType",
    }
    
    response = requests.post(url, json=payload)
    print(f"测试: 状态码 = {response.status_code}")
    pprint(response.json())

def run_all_tests():
    """运行所有测试"""
    test_MAPbIBr_prediction()
    test_CsMAFAPbIBr_prediction()
    test_MAFA_prediction()
    test_CsFA_prediction()
    test_invalid_type()

if __name__ == "__main__":
    run_all_tests()