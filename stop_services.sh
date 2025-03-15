#!/bin/bash

# 停止前后端服务的脚本
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
BACKEND_DIR="${WORKSPACE_DIR}/api"
FRONTEND_DIR="${WORKSPACE_DIR}/web"

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       停止太阳能电池智能助手服务        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# 检查服务状态文件
if [ -f "services.status" ]; then
    echo -e "${YELLOW}从状态文件加载服务信息...${NC}"
    source services.status
    echo -e "${GREEN}服务启动时间: $START_TIME${NC}"
else
    echo -e "${YELLOW}未找到服务状态文件，将尝试从PID文件中获取进程ID...${NC}"
    
    # 尝试从PID文件获取进程ID
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$BACKEND_DIR/backend.pid")
    fi
    
    if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_DIR/frontend.pid")
    fi
    
    if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$FRONTEND_DIR/monitor.pid")
    fi
fi

# 停止监控脚本
echo -e "\n${YELLOW}[1/3] 停止监控脚本...${NC}"
if [ -n "$MONITOR_PID" ] && ps -p $MONITOR_PID > /dev/null; then
    echo -e "${GREEN}停止监控脚本 (PID: $MONITOR_PID)...${NC}"
    kill $MONITOR_PID
    sleep 2
    
    # 检查进程是否已停止
    if ps -p $MONITOR_PID > /dev/null; then
        echo -e "${YELLOW}进程未响应，强制终止...${NC}"
        kill -9 $MONITOR_PID
        sleep 1
    fi
    
    echo -e "${GREEN}监控脚本已停止${NC}"
else
    # 尝试查找可能的监控进程
    if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$FRONTEND_DIR/monitor.pid")
        if ps -p $MONITOR_PID > /dev/null; then
            echo -e "${GREEN}停止监控脚本 (PID: $MONITOR_PID)...${NC}"
            kill $MONITOR_PID
            sleep 2
            
            # 检查进程是否已停止
            if ps -p $MONITOR_PID > /dev/null; then
                echo -e "${YELLOW}进程未响应，强制终止...${NC}"
                kill -9 $MONITOR_PID
                sleep 1
            fi
            
            echo -e "${GREEN}监控脚本已停止${NC}"
        else
            echo -e "${YELLOW}未找到运行中的监控脚本${NC}"
        fi
    else
        echo -e "${YELLOW}未找到监控脚本PID文件${NC}"
    fi
fi

# 清理监控脚本PID文件
if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
    rm -f "$FRONTEND_DIR/monitor.pid"
fi

# 停止前端服务
echo -e "\n${YELLOW}[2/3] 停止前端服务...${NC}"
if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}停止前端服务 (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID
    sleep 3
    
    # 检查进程是否已停止
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${YELLOW}进程未响应，强制终止...${NC}"
        kill -9 $FRONTEND_PID
        sleep 1
    fi
    
    echo -e "${GREEN}前端服务已停止${NC}"
else
    # 尝试查找可能的前端进程
    if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_DIR/frontend.pid")
        if ps -p $FRONTEND_PID > /dev/null; then
            echo -e "${GREEN}停止前端服务 (PID: $FRONTEND_PID)...${NC}"
            kill $FRONTEND_PID
            sleep 3
            
            # 检查进程是否已停止
            if ps -p $FRONTEND_PID > /dev/null; then
                echo -e "${YELLOW}进程未响应，强制终止...${NC}"
                kill -9 $FRONTEND_PID
                sleep 1
            fi
            
            echo -e "${GREEN}前端服务已停止${NC}"
        else
            echo -e "${YELLOW}未找到运行中的前端服务${NC}"
        fi
    else
        echo -e "${YELLOW}未找到前端服务PID文件${NC}"
    fi
    
    # 尝试查找并杀死所有npm进程
    NPM_PIDS=$(ps aux | grep 'npm run dev' | grep -v grep | awk '{print $2}')
    if [ -n "$NPM_PIDS" ]; then
        echo -e "${YELLOW}发现其他npm进程，正在停止...${NC}"
        for pid in $NPM_PIDS; do
            echo -e "${GREEN}停止npm进程 (PID: $pid)...${NC}"
            kill $pid
            sleep 1
        done
    fi
fi

# 清理前端PID文件
if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
    rm -f "$FRONTEND_DIR/frontend.pid"
fi

# 停止后端服务
echo -e "\n${YELLOW}[3/3] 停止后端服务...${NC}"
if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}停止后端服务 (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID
    sleep 3
    
    # 检查进程是否已停止
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "${YELLOW}进程未响应，强制终止...${NC}"
        kill -9 $BACKEND_PID
        sleep 1
    fi
    
    echo -e "${GREEN}后端服务已停止${NC}"
else
    # 尝试查找可能的后端进程
    if [ -f "$BACKEND_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$BACKEND_DIR/backend.pid")
        if ps -p $BACKEND_PID > /dev/null; then
            echo -e "${GREEN}停止后端服务 (PID: $BACKEND_PID)...${NC}"
            kill $BACKEND_PID
            sleep 3
            
            # 检查进程是否已停止
            if ps -p $BACKEND_PID > /dev/null; then
                echo -e "${YELLOW}进程未响应，强制终止...${NC}"
                kill -9 $BACKEND_PID
                sleep 1
            fi
            
            echo -e "${GREEN}后端服务已停止${NC}"
        else
            echo -e "${YELLOW}未找到运行中的后端服务${NC}"
        fi
    else
        echo -e "${YELLOW}未找到后端服务PID文件${NC}"
    fi
    
    # 尝试查找并杀死所有Python进程
    PYTHON_PIDS=$(ps aux | grep 'python.*main.py' | grep -v grep | awk '{print $2}')
    if [ -n "$PYTHON_PIDS" ]; then
        echo -e "${YELLOW}发现其他Python进程，正在停止...${NC}"
        for pid in $PYTHON_PIDS; do
            echo -e "${GREEN}停止Python进程 (PID: $pid)...${NC}"
            kill $pid
            sleep 1
        done
    fi
fi

# 清理后端PID文件
if [ -f "$BACKEND_DIR/backend.pid" ]; then
    rm -f "$BACKEND_DIR/backend.pid"
fi

# 清理服务状态文件
if [ -f "services.status" ]; then
    rm -f services.status
fi

# 打印总结
echo -e "\n${GREEN}所有服务已停止!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}后端服务已停止${NC}"
echo -e "${YELLOW}前端服务已停止${NC}"
echo -e "${YELLOW}监控脚本已停止${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

echo -e "\n${YELLOW}使用以下命令重新启动服务:${NC}"
echo -e "${BLUE}  ./start_services.sh${NC}"

echo -e "\n${GREEN}感谢您的使用!${NC}" 