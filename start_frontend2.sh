#!/bin/bash

# 检查是否已经有frontend2进程在运行
if pgrep -f "next-server.*3000" > /dev/null; then
    echo "Frontend2服务已经在运行中..."
    echo "如果需要重启，请先运行 ./stop_frontend2.sh"
    exit 1
fi

# 进入web2目录
cd web2

echo "正在启动Frontend2服务..."
echo "工作目录: $(pwd)"
echo "时间: $(date)"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "错误: 未找到package.json文件，请确保在正确的目录中"
    exit 1
fi

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "未找到node_modules，正在安装依赖..."
    npm install
fi

# 使用nohup在后台运行，输出重定向到日志文件
nohup npm run dev > frontend2.log 2>&1 &

# 获取进程ID
PID=$!
echo $PID > frontend2.pid

echo "Frontend2服务已启动!"
echo "进程ID: $PID"
echo "访问地址: http://localhost:3000"
echo "日志文件: web2/frontend2.log"
echo "PID文件: web2/frontend2.pid"
echo ""
echo "使用以下命令:"
echo "  查看日志: tail -f web2/frontend2.log"
echo "  停止服务: ./stop_frontend2.sh"
echo "  查看状态: ps aux | grep next-server"

# 等待几秒确保服务启动
sleep 3

# 检查进程是否还在运行
if ps -p $PID > /dev/null; then
    echo ""
    echo "✅ 服务启动成功!"
else
    echo ""
    echo "❌ 服务启动失败，请检查日志: tail -f web2/frontend2.log"
fi 