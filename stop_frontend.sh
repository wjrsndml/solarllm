#!/bin/bash

# 停止前端服务的脚本
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
FRONTEND_DIR="${WORKSPACE_DIR}/web"

# 打印标题
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}       停止太阳能电池智能助手前端服务    ${NC}"
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

# 停止前端服务
echo -e "\n${YELLOW}停止前端服务...${NC}"

# 查找所有与前端相关的进程
echo -e "${YELLOW}查找所有前端相关进程...${NC}"

# 获取记录的前端PID（如果存在）
if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_DIR/frontend.pid")
else
    FRONTEND_PID=""
fi

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

# 打印总结
echo -e "\n${GREEN}前端服务已停止!${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
echo -e "${YELLOW}前端服务已停止${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

echo -e "\n${YELLOW}使用以下命令重新启动前端服务:${NC}"
echo -e "${BLUE}  ./start_frontend.sh${NC}"

echo -e "\n${GREEN}感谢您的使用!${NC}" 