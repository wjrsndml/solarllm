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

# 定义一个函数来终止进程及其所有子进程
kill_process_tree() {
    local pid=$1
    local signal=${2:-TERM}
    
    # 如果PID不存在，直接返回
    if [ -z "$pid" ] || ! ps -p $pid > /dev/null; then
        return
    fi
    
    echo -e "${YELLOW}终止进程 $pid 及其所有子进程...${NC}"
    
    # 获取所有子进程
    local children=$(pgrep -P $pid)
    
    # 递归终止所有子进程
    for child in $children; do
        kill_process_tree $child $signal
    done
    
    # 终止主进程
    echo -e "${GREEN}发送 $signal 信号到进程 $pid${NC}"
    kill -$signal $pid 2>/dev/null
}

# 停止监控脚本
echo -e "\n${YELLOW}[1/3] 停止监控脚本...${NC}"
if [ -n "$MONITOR_PID" ] && ps -p $MONITOR_PID > /dev/null; then
    echo -e "${GREEN}停止监控脚本 (PID: $MONITOR_PID)...${NC}"
    kill_process_tree $MONITOR_PID
    sleep 2
    
    # 检查进程是否已停止
    if ps -p $MONITOR_PID > /dev/null; then
        echo -e "${YELLOW}进程未响应，强制终止...${NC}"
        kill_process_tree $MONITOR_PID KILL
        sleep 1
    fi
    
    echo -e "${GREEN}监控脚本已停止${NC}"
else
    # 尝试查找可能的监控进程
    if [ -f "$FRONTEND_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$FRONTEND_DIR/monitor.pid")
        if ps -p $MONITOR_PID > /dev/null; then
            echo -e "${GREEN}停止监控脚本 (PID: $MONITOR_PID)...${NC}"
            kill_process_tree $MONITOR_PID
            sleep 2
            
            # 检查进程是否已停止
            if ps -p $MONITOR_PID > /dev/null; then
                echo -e "${YELLOW}进程未响应，强制终止...${NC}"
                kill_process_tree $MONITOR_PID KILL
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

# 查找所有与前端相关的进程
echo -e "${YELLOW}查找所有前端相关进程...${NC}"

# 查找所有npm进程
NPM_PIDS=$(ps aux | grep -E 'npm run dev|node.*vite' | grep -v grep | awk '{print $2}')
NODE_PIDS=$(ps aux | grep -E 'node.*dev-server|node.*vite' | grep -v grep | awk '{print $2}')
VITE_PIDS=$(ps aux | grep -E 'vite' | grep -v grep | awk '{print $2}')

# 合并所有找到的PID
ALL_FRONTEND_PIDS="$NPM_PIDS $NODE_PIDS $VITE_PIDS"

# 如果有记录的前端PID，也加入列表
if [ -n "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
    ALL_FRONTEND_PIDS="$FRONTEND_PID $ALL_FRONTEND_PIDS"
fi

# 去重
ALL_FRONTEND_PIDS=$(echo "$ALL_FRONTEND_PIDS" | tr ' ' '\n' | sort -u | tr '\n' ' ')

# 终止所有前端相关进程
if [ -n "$ALL_FRONTEND_PIDS" ]; then
    echo -e "${GREEN}找到以下前端相关进程: $ALL_FRONTEND_PIDS${NC}"
    for pid in $ALL_FRONTEND_PIDS; do
        echo -e "${GREEN}停止前端进程 (PID: $pid)...${NC}"
        kill_process_tree $pid
        sleep 1
    done
    
    # 检查是否有进程仍在运行
    STILL_RUNNING=""
    for pid in $ALL_FRONTEND_PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            STILL_RUNNING="$STILL_RUNNING $pid"
        fi
    done
    
    # 强制终止仍在运行的进程
    if [ -n "$STILL_RUNNING" ]; then
        echo -e "${YELLOW}以下进程仍在运行，强制终止: $STILL_RUNNING${NC}"
        for pid in $STILL_RUNNING; do
            echo -e "${RED}强制终止进程 (PID: $pid)...${NC}"
            kill_process_tree $pid KILL
            sleep 1
        done
    fi
    
    echo -e "${GREEN}所有前端进程已停止${NC}"
else
    echo -e "${YELLOW}未找到运行中的前端进程${NC}"
fi

# 清理前端PID文件
if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
    rm -f "$FRONTEND_DIR/frontend.pid"
fi

# 停止后端服务
echo -e "\n${YELLOW}[3/3] 停止后端服务...${NC}"

# 查找所有与后端相关的进程
echo -e "${YELLOW}查找所有后端相关进程...${NC}"

# 查找所有Python进程
PYTHON_PIDS=$(ps aux | grep -E "python.*$BACKEND_DIR.*main.py|python.*$BACKEND_DIR.*api" | grep -v grep | awk '{print $2}')
UVICORN_PIDS=$(ps aux | grep -E "uvicorn.*$BACKEND_DIR" | grep -v grep | awk '{print $2}')

# 合并所有找到的PID
ALL_BACKEND_PIDS="$PYTHON_PIDS $UVICORN_PIDS"

# 如果有记录的后端PID，也加入列表
if [ -n "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
    ALL_BACKEND_PIDS="$BACKEND_PID $ALL_BACKEND_PIDS"
fi

# 去重
ALL_BACKEND_PIDS=$(echo "$ALL_BACKEND_PIDS" | tr ' ' '\n' | sort -u | tr '\n' ' ')

# 终止所有后端相关进程
if [ -n "$ALL_BACKEND_PIDS" ]; then
    echo -e "${GREEN}找到以下后端相关进程: $ALL_BACKEND_PIDS${NC}"
    for pid in $ALL_BACKEND_PIDS; do
        echo -e "${GREEN}停止后端进程 (PID: $pid)...${NC}"
        kill_process_tree $pid
        sleep 1
    done
    
    # 检查是否有进程仍在运行
    STILL_RUNNING=""
    for pid in $ALL_BACKEND_PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            STILL_RUNNING="$STILL_RUNNING $pid"
        fi
    done
    
    # 强制终止仍在运行的进程
    if [ -n "$STILL_RUNNING" ]; then
        echo -e "${YELLOW}以下进程仍在运行，强制终止: $STILL_RUNNING${NC}"
        for pid in $STILL_RUNNING; do
            echo -e "${RED}强制终止进程 (PID: $pid)...${NC}"
            kill_process_tree $pid KILL
            sleep 1
        done
    fi
    
    echo -e "${GREEN}所有后端进程已停止${NC}"
else
    echo -e "${YELLOW}未找到运行中的后端进程${NC}"
fi

# 清理后端PID文件
if [ -f "$BACKEND_DIR/backend.pid" ]; then
    rm -f "$BACKEND_DIR/backend.pid"
fi

# 检查端口占用情况
echo -e "\n${YELLOW}检查端口占用情况...${NC}"

# 检查前端端口(5173/5174)
FRONTEND_PORT_PIDS=$(lsof -t -i:5173,5174 2>/dev/null)
if [ -n "$FRONTEND_PORT_PIDS" ]; then
    echo -e "${RED}发现仍有进程占用前端端口 (5173/5174): $FRONTEND_PORT_PIDS${NC}"
    echo -e "${YELLOW}正在强制终止这些进程...${NC}"
    for pid in $FRONTEND_PORT_PIDS; do
        echo -e "${RED}强制终止占用端口的进程 (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
    done
    echo -e "${GREEN}前端端口已释放${NC}"
else
    echo -e "${GREEN}前端端口 (5173/5174) 未被占用${NC}"
fi

# 检查后端端口(8000)
BACKEND_PORT_PIDS=$(lsof -t -i:8000 2>/dev/null)
if [ -n "$BACKEND_PORT_PIDS" ]; then
    echo -e "${RED}发现仍有进程占用后端端口 (8000): $BACKEND_PORT_PIDS${NC}"
    echo -e "${YELLOW}正在强制终止这些进程...${NC}"
    for pid in $BACKEND_PORT_PIDS; do
        echo -e "${RED}强制终止占用端口的进程 (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null
    done
    echo -e "${GREEN}后端端口已释放${NC}"
else
    echo -e "${GREEN}后端端口 (8000) 未被占用${NC}"
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