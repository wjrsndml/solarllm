#!/bin/bash

# 停止后端服务的脚本
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

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       停止太阳能电池智能助手后端服务    ${NC}"
echo -e "${BLUE}=========================================${NC}"

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

# 停止后端服务
echo -e "\n${YELLOW}停止后端服务...${NC}"

# 查找所有与后端相关的进程
echo -e "${YELLOW}查找所有后端相关进程...${NC}"

# 获取记录的后端PID（如果存在）
if [ -f "$BACKEND_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$BACKEND_DIR/backend.pid")
else
    BACKEND_PID=""
fi

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

# 打印总结
echo -e "\n${GREEN}后端服务已停止!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}后端服务已停止${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

echo -e "\n${YELLOW}使用以下命令重新启动后端服务:${NC}"
echo -e "${BLUE}  ./start_backend.sh${NC}"

echo -e "\n${GREEN}感谢您的使用!${NC}" 