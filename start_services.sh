#!/bin/bash

# 启动前后端服务的脚本
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
FRONTEND_DIR="${WORKSPACE_DIR}/web"

# 创建日志目录
mkdir -p "${WORKSPACE_DIR}/logs"
LOGS_DIR="${WORKSPACE_DIR}/logs"

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       启动太阳能电池智能助手服务        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 检查Python路径是否存在
if [ ! -f "$PYTHON_PATH" ]; then
    echo -e "${RED}错误: Python路径不存在: $PYTHON_PATH${NC}"
    echo -e "${YELLOW}请检查Python环境是否正确安装${NC}"
    exit 1
fi

# 启动后端服务
echo -e "\n${YELLOW}[1/3] 启动后端服务...${NC}"

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
nohup $PYTHON_PATH main.py > backend.log 2>&1 & echo $! > backend.pid
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

# 启动前端服务
echo -e "\n${YELLOW}[2/3] 启动前端服务...${NC}"

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
nohup npm run dev -- --host > frontend.log 2>&1 & echo $! > frontend.pid
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

# 启动监控脚本
echo -e "\n${YELLOW}[3/3] 启动监控脚本...${NC}"

# 检查监控脚本是否存在
if [ ! -f "monitor.sh" ]; then
    echo -e "${RED}错误: 监控脚本不存在: $FRONTEND_DIR/monitor.sh${NC}"
    echo -e "${YELLOW}跳过监控脚本启动${NC}"
else
    # 如果监控日志文件过大，进行备份
    if [ -f "monitor.log" ] && [ $(du -m monitor.log | cut -f1) -gt 5 ]; then
        echo -e "${YELLOW}备份旧的监控日志文件...${NC}"
        mv monitor.log "${LOGS_DIR}/monitor.log.$(date '+%Y%m%d_%H%M%S')"
        gzip "${LOGS_DIR}/monitor.log.$(date '+%Y%m%d_%H%M%S')" &
    fi

    # 启动监控脚本
    echo -e "${GREEN}启动监控脚本...${NC}"
    chmod +x monitor.sh
    ./monitor.sh > monitor.log 2>&1 &
    MONITOR_PID=$!
    echo $MONITOR_PID > monitor.pid

    echo -e "${GREEN}监控脚本启动成功! (PID: $MONITOR_PID)${NC}"
fi

# 返回工作目录
cd "$WORKSPACE_DIR"

# 创建服务状态文件
echo "BACKEND_PID=$BACKEND_PID" > services.status
echo "FRONTEND_PID=$FRONTEND_PID" >> services.status
if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
    MONITOR_PID=$(cat "$FRONTEND_DIR/monitor.pid")
    echo "MONITOR_PID=$MONITOR_PID" >> services.status
fi
echo "START_TIME=$(date '+%Y-%m-%d %H:%M:%S')" >> services.status

# 打印服务信息
echo -e "\n${GREEN}所有服务已成功启动!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}后端服务 (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}前端服务 (PID: $FRONTEND_PID)${NC}"
if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
    echo -e "${YELLOW}监控脚本 (PID: $MONITOR_PID)${NC}"
fi
echo -e "${BLUE}----------------------------------------${NC}"

# 打印访问信息
HOST_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}您可以通过以下地址访问应用:${NC}"
echo -e "${BLUE}http://$HOST_IP:5174${NC}"
echo -e "\n${YELLOW}使用以下命令查看日志:${NC}"
echo -e "${BLUE}  tail -f $BACKEND_DIR/backend.log    # 查看后端日志${NC}"
echo -e "${BLUE}  tail -f $FRONTEND_DIR/frontend.log  # 查看前端日志${NC}"
echo -e "${BLUE}  tail -f $FRONTEND_DIR/monitor.log   # 查看监控日志${NC}"

echo -e "\n${YELLOW}使用以下命令停止服务:${NC}"
echo -e "${BLUE}  ./stop_services.sh${NC}"

echo -e "\n${GREEN}祝您使用愉快!${NC}" 