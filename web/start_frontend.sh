#!/bin/bash

# 前端服务启动脚本
# 使用优化的日志配置启动前端服务

# 清理旧的日志和PID文件
if [ -f "frontend.pid" ]; then
    OLD_PID=$(cat frontend.pid)
    if ps -p $OLD_PID > /dev/null; then
        echo "停止旧的前端进程 (PID: $OLD_PID)"
        kill $OLD_PID
        sleep 2
    fi
    rm -f frontend.pid
fi

# 如果前端日志文件过大，进行备份
if [ -f "frontend.log" ] && [ $(du -m frontend.log | cut -f1) -gt 10 ]; then
    echo "备份旧的日志文件"
    mv frontend.log "frontend.log.$(date '+%Y%m%d_%H%M%S')"
fi

# 启动前端服务
echo "启动前端服务..."
nohup npm run dev -- --host > frontend.log 2>&1 & echo $! > frontend.pid

# 启动监控脚本
echo "启动监控脚本..."
./monitor.sh > monitor.log 2>&1 &
MONITOR_PID=$!
echo $MONITOR_PID > monitor.pid

echo "前端服务已启动，PID: $(cat frontend.pid)"
echo "监控脚本已启动，PID: $MONITOR_PID"
echo "使用以下命令查看日志："
echo "  tail -f frontend.log    # 查看前端日志"
echo "  tail -f monitor.log     # 查看监控日志" 