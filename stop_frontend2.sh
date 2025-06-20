#!/bin/bash

echo "正在停止Frontend2服务..."

# 方法1: 通过PID文件停止
if [ -f "web2/frontend2.pid" ]; then
    PID=$(cat web2/frontend2.pid)
    echo "从PID文件读取进程ID: $PID"
    
    if ps -p $PID > /dev/null; then
        echo "正在杀死进程 $PID..."
        kill $PID
        
        # 等待进程结束
        sleep 2
        
        # 如果还在运行，强制杀死
        if ps -p $PID > /dev/null; then
            echo "进程仍在运行，强制杀死..."
            kill -9 $PID
        fi
        
        echo "✅ 通过PID文件成功停止服务"
    else
        echo "⚠️  PID文件中的进程已不存在"
    fi
    
    # 删除PID文件
    rm -f web2/frontend2.pid
else
    echo "⚠️  未找到PID文件"
fi

# 方法2: 通过进程名停止（备用方法）
echo ""
echo "检查是否还有相关进程..."
PIDS=$(pgrep -f "next-server.*3000")

if [ ! -z "$PIDS" ]; then
    echo "发现相关进程: $PIDS"
    echo "正在停止这些进程..."
    
    for pid in $PIDS; do
        echo "杀死进程: $pid"
        kill $pid 2>/dev/null
    done
    
    # 等待进程结束
    sleep 2
    
    # 检查是否还有进程，如果有则强制杀死
    REMAINING_PIDS=$(pgrep -f "next-server.*3000")
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo "强制杀死剩余进程: $REMAINING_PIDS"
        for pid in $REMAINING_PIDS; do
            kill -9 $pid 2>/dev/null
        done
    fi
    
    echo "✅ 通过进程名成功停止服务"
else
    echo "ℹ️  没有找到运行中的Frontend2进程"
fi

# 方法3: 杀死所有占用3000端口的进程
echo ""
echo "检查3000端口占用情况..."
PORT_PIDS=$(lsof -ti:3000 2>/dev/null)

if [ ! -z "$PORT_PIDS" ]; then
    echo "发现占用3000端口的进程: $PORT_PIDS"
    for pid in $PORT_PIDS; do
        echo "杀死占用端口的进程: $pid"
        kill -9 $pid 2>/dev/null
    done
    echo "✅ 成功释放3000端口"
else
    echo "ℹ️  3000端口未被占用"
fi

echo ""
echo "Frontend2服务停止完成!"
echo ""
echo "验证命令:"
echo "  检查进程: ps aux | grep next-server"
echo "  检查端口: lsof -i:3000" 