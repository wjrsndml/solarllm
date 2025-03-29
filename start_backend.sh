#!/bin/bash

# 启动后端服务的脚本
# 作者：Claude
# 日期：$(date '+%Y-%m-%d')

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 设置路径
WORKSPACE_DIR="$(pwd)"
PYTHON_PATH="/home/gqh/miniconda3/envs/solarllm/bin/python"
BACKEND_DIR="${WORKSPACE_DIR}/api"
LOGS_DIR="${WORKSPACE_DIR}/logs"

# 创建日志目录
mkdir -p "${WORKSPACE_DIR}/logs"

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       启动太阳能电池智能助手后端服务    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 检查Python路径是否存在
if [ ! -f "$PYTHON_PATH" ]; then
    echo -e "${RED}错误: Python路径不存在: $PYTHON_PATH${NC}"
    echo -e "${YELLOW}请检查Python环境是否正确安装${NC}"
    exit 1
fi

# 启动后端服务
echo -e "\n${YELLOW}启动后端服务...${NC}"

# 检查后端目录是否存在
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}错误: 后端目录不存在: $BACKEND_DIR${NC}"
    exit 1
fi

# 进入后端目录
cd "$BACKEND_DIR"

# 检查是否有旧的后端进程
if [ -f "backend.pid" ]; then
    OLD_PID=$(cat backend.pid)
    if ps -p $OLD_PID > /dev/null; then
        echo -e "${YELLOW}发现正在运行的后端进程 (PID: $OLD_PID)，正在停止...${NC}"
        kill $OLD_PID
        sleep 3
        
        # 检查进程是否已停止
        if ps -p $OLD_PID > /dev/null; then
            echo -e "${YELLOW}进程未响应，强制终止...${NC}"
            kill -9 $OLD_PID
            sleep 1
        fi
    fi
    rm -f backend.pid
fi

# 如果后端日志文件过大，进行备份
if [ -f "backend.log" ] && [ $(du -m backend.log | cut -f1) -gt 10 ]; then
    echo -e "${YELLOW}备份旧的后端日志文件...${NC}"
    mv backend.log "${LOGS_DIR}/backend.log.$(date '+%Y%m%d_%H%M%S')"
    gzip "${LOGS_DIR}/backend.log.$(date '+%Y%m%d_%H%M%S')" &
fi

# 启动后端服务
echo -e "${GREEN}启动后端服务...${NC}"
nohup $PYTHON_PATH main.py > nohup.log 2>&1 & echo $! > backend.pid
BACKEND_PID=$(cat backend.pid)

# 等待后端服务启动
echo -e "${YELLOW}等待后端服务启动...${NC}"
sleep 5

# 检查后端服务是否成功启动
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}后端服务启动成功! (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}后端服务启动失败!${NC}"
    echo -e "${YELLOW}请检查日志文件: $BACKEND_DIR/backend.log${NC}"
    exit 1
fi

# 返回工作目录
cd "$WORKSPACE_DIR"

# 打印服务信息
echo -e "\n${GREEN}后端服务已成功启动!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}后端服务 (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# 打印访问信息
HOST_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}后端API服务地址:${NC}"
echo -e "${BLUE}http://$HOST_IP:8000${NC}"
echo -e "\n${YELLOW}使用以下命令查看日志:${NC}"
echo -e "${BLUE}  tail -f $BACKEND_DIR/backend.log    # 查看后端日志${NC}"

echo -e "\n${YELLOW}使用以下命令停止服务:${NC}"
echo -e "${BLUE}  ./stop_backend.sh${NC}"

echo -e "\n${GREEN}祝您使用愉快!${NC}" 