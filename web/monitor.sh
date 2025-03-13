#!/bin/bash

# 前端进程监控脚本
# 用于监控前端进程的状态，并在进程异常退出时记录日志

# 配置
LOG_FILE="monitor.log"
PID_FILE="frontend.pid"
FRONTEND_LOG="frontend.log"
CHECK_INTERVAL=10  # 检查间隔（秒）
MAX_RESTART_COUNT=3  # 最大重启次数
RESTART_TIMEOUT=300  # 重启超时时间（秒）
MAX_LOG_SIZE_MB=50  # 日志文件最大大小（MB）

# 日志轮转函数
rotate_log() {
    local log_file=$1
    local max_size_mb=$2
    
    # 检查日志文件是否存在
    if [ ! -f "$log_file" ]; then
        return
    fi
    
    # 获取日志文件大小（KB）
    local size_kb=$(du -k "$log_file" | cut -f1)
    local size_mb=$((size_kb / 1024))
    
    # 如果日志文件大小超过最大值，进行轮转
    if [ $size_mb -ge $max_size_mb ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 日志文件 $log_file 大小为 ${size_mb}MB，开始轮转" | tee -a "$LOG_FILE"
        
        # 创建带时间戳的备份文件
        local timestamp=$(date '+%Y%m%d_%H%M%S')
        local backup_file="${log_file}.${timestamp}"
        
        # 移动当前日志文件
        mv "$log_file" "$backup_file"
        
        # 压缩备份文件
        gzip "$backup_file" &
        
        # 创建新的日志文件
        touch "$log_file"
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 日志文件已轮转为 ${backup_file}.gz" | tee -a "$LOG_FILE"
        
        # 删除旧的日志文件（保留最近5个）
        ls -t "${log_file}."* | tail -n +6 | xargs -r rm
        
        return 0  # 表示进行了轮转
    fi
    
    return 1  # 表示没有进行轮转
}

# 初始化日志
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 启动前端进程监控" | tee -a "$LOG_FILE"

# 检查PID文件是否存在
if [ ! -f "$PID_FILE" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] PID文件不存在: $PID_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# 读取PID
PID=$(cat "$PID_FILE")
if [ -z "$PID" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] PID文件为空" | tee -a "$LOG_FILE"
    exit 1
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 监控前端进程 PID: $PID" | tee -a "$LOG_FILE"

# 记录系统信息
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 系统信息:" | tee -a "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $(uname -a)" | tee -a "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 内存使用情况:" | tee -a "$LOG_FILE"
free -h | while read line; do
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $line" | tee -a "$LOG_FILE"
done

# 记录进程启动信息
if ps -p $PID > /dev/null; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 进程正在运行" | tee -a "$LOG_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 进程详情:" | tee -a "$LOG_FILE"
    ps -f -p $PID | while read line; do
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $line" | tee -a "$LOG_FILE"
    done
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] 进程未运行" | tee -a "$LOG_FILE"
fi

# 监控循环
restart_count=0
last_restart_time=0
log_check_counter=0

while true; do
    # 每10次检查（约100秒）检查一次日志文件大小
    log_check_counter=$((log_check_counter + 1))
    if [ $log_check_counter -ge 10 ]; then
        log_check_counter=0
        
        # 检查并轮转前端日志
        rotate_log "$FRONTEND_LOG" $MAX_LOG_SIZE_MB
        
        # 检查并轮转监控日志
        rotate_log "$LOG_FILE" $MAX_LOG_SIZE_MB
    fi
    
    # 检查进程是否存在
    if ! ps -p $PID > /dev/null; then
        current_time=$(date +%s)
        
        # 记录进程退出信息
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] 前端进程已退出 (PID: $PID)" | tee -a "$LOG_FILE"
        
        # 检查日志文件中的最后错误
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 检查前端日志中的最后错误:" | tee -a "$LOG_FILE"
        if [ -f "$FRONTEND_LOG" ]; then
            tail -n 50 "$FRONTEND_LOG" | grep -i "error\|exception\|fail\|crash" | tail -n 10 | while read line; do
                echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] LOG: $line" | tee -a "$LOG_FILE"
            done
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] 前端日志文件不存在" | tee -a "$LOG_FILE"
        fi
        
        # 检查是否可以重启
        if [ $restart_count -lt $MAX_RESTART_COUNT ] && [ $((current_time - last_restart_time)) -gt $RESTART_TIMEOUT ]; then
            restart_count=$((restart_count + 1))
            last_restart_time=$current_time
            
            echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 尝试重启前端进程 (尝试 $restart_count/$MAX_RESTART_COUNT)" | tee -a "$LOG_FILE"
            
            # 启动前端进程
            nohup npm run dev -- --host > "$FRONTEND_LOG" 2>&1 & echo $! > "$PID_FILE"
            
            # 更新PID
            PID=$(cat "$PID_FILE")
            echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 前端进程已重启，新PID: $PID" | tee -a "$LOG_FILE"
            
            # 等待进程启动
            sleep 5
            
            # 检查进程是否成功启动
            if ps -p $PID > /dev/null; then
                echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 前端进程重启成功" | tee -a "$LOG_FILE"
            else
                echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] 前端进程重启失败" | tee -a "$LOG_FILE"
            fi
        else
            if [ $restart_count -ge $MAX_RESTART_COUNT ]; then
                echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] 达到最大重启次数 ($MAX_RESTART_COUNT)，停止重启" | tee -a "$LOG_FILE"
                echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 请手动检查前端服务" | tee -a "$LOG_FILE"
                exit 1
            else
                echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 重启冷却中，等待 $RESTART_TIMEOUT 秒后可再次重启" | tee -a "$LOG_FILE"
            fi
        fi
    else
        # 记录进程状态
        if [ $((RANDOM % 30)) -eq 0 ]; then  # 大约每5分钟记录一次（10秒间隔，1/30概率）
            echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 前端进程运行正常 (PID: $PID)" | tee -a "$LOG_FILE"
            
            # 记录进程资源使用情况
            cpu_usage=$(ps -p $PID -o %cpu | tail -n 1 | tr -d ' ')
            mem_usage=$(ps -p $PID -o %mem | tail -n 1 | tr -d ' ')
            vsz=$(ps -p $PID -o vsz | tail -n 1 | tr -d ' ')
            rss=$(ps -p $PID -o rss | tail -n 1 | tr -d ' ')
            
            echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] 资源使用: CPU=${cpu_usage}%, MEM=${mem_usage}%, VSZ=${vsz}KB, RSS=${rss}KB" | tee -a "$LOG_FILE"
            
            # 检查是否有异常的资源使用
            if (( $(echo "$cpu_usage > 90" | bc -l) )); then
                echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] CPU使用率异常高: ${cpu_usage}%" | tee -a "$LOG_FILE"
            fi
            
            if (( $(echo "$mem_usage > 80" | bc -l) )); then
                echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] 内存使用率异常高: ${mem_usage}%" | tee -a "$LOG_FILE"
            fi
        fi
    fi
    
    # 等待下一次检查
    sleep $CHECK_INTERVAL
done 