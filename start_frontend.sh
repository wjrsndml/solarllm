#!/bin/bash

# 启动前端服务的脚本
# 作者：Claude
# 日期：$(date '+%Y-%m-%d')

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色
PYTHON_PATH="/home/gqh/miniconda3/envs/solarllm/bin/python"
# 设置路径
WORKSPACE_DIR="$(pwd)"
FRONTEND_DIR="${WORKSPACE_DIR}/web"
LOGS_DIR="${WORKSPACE_DIR}/logs"

# 创建日志目录
mkdir -p "${WORKSPACE_DIR}/logs"

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       启动太阳能电池智能助手前端服务    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 启动前端服务
echo -e "\n${YELLOW}启动前端服务...${NC}"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}错误: 前端目录不存在: $FRONTEND_DIR${NC}"
    exit 1
fi

# 进入前端目录
cd "$FRONTEND_DIR"



# 检查是否有旧的前端进程
if [ -f "frontend.pid" ]; then
    OLD_PID=$(cat frontend.pid)
    if ps -p $OLD_PID > /dev/null; then
        echo -e "${YELLOW}发现正在运行的前端进程 (PID: $OLD_PID)，正在停止...${NC}"
        kill $OLD_PID
        sleep 3
        
        # 检查进程是否已停止
        if ps -p $OLD_PID > /dev/null; then
            echo -e "${YELLOW}进程未响应，强制终止...${NC}"
            kill -9 $OLD_PID
            sleep 1
        fi
    fi
    rm -f frontend.pid
fi

# 如果前端日志文件过大，进行备份
if [ -f "frontend.log" ] && [ $(du -m frontend.log | cut -f1) -gt 10 ]; then
    echo -e "${YELLOW}备份旧的前端日志文件...${NC}"
    mv frontend.log "${LOGS_DIR}/frontend.log.$(date '+%Y%m%d_%H%M%S')"
    gzip "${LOGS_DIR}/frontend.log.$(date '+%Y%m%d_%H%M%S')" &
fi

# 启动前端服务
echo -e "${GREEN}启动前端服务...${NC}"
nohup $PYTHON_PATH app.py > /dev/null 2>&1 & echo $! > frontend.pid
FRONTEND_PID=$(cat frontend.pid)

# 等待前端服务启动
echo -e "${YELLOW}等待前端服务启动...${NC}"
sleep 5

# 检查前端服务是否成功启动
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}前端服务启动成功! (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}前端服务启动失败!${NC}"
    echo -e "${YELLOW}请检查日志文件: $FRONTEND_DIR/frontend.log${NC}"
    exit 1
fi

# 返回工作目录
cd "$WORKSPACE_DIR"

# 打印服务信息
echo -e "\n${GREEN}前端服务已成功启动!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}前端服务 (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# 打印访问信息
HOST_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}您可以通过以下地址访问应用:${NC}"
echo -e "${BLUE}http://$HOST_IP:5173${NC}"
echo -e "\n${YELLOW}使用以下命令查看日志:${NC}"
echo -e "${BLUE}  tail -f $FRONTEND_DIR/frontend.log  # 查看前端日志${NC}"

echo -e "\n${YELLOW}使用以下命令停止服务:${NC}"
echo -e "${BLUE}  ./stop_frontend.sh${NC}"

echo -e "\n${GREEN}祝您使用愉快!${NC}" 