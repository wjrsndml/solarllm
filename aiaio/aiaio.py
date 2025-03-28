import argparse
import sys

from run_app import RunAppCommand


def main():
    parser = argparse.ArgumentParser(
        "aiaio cli",
        usage="aiaio <command> [<args>]",
        epilog="For more information about a command, run: `aiaio <command> --help`",
    )
    parser.add_argument("--version", "-v", help="Display version", action="store_true")
    commands_parser = parser.add_subparsers(help="commands")

    # Register commands
    RunAppCommand.register_subcommand(commands_parser)

    # 检查是否在IDE中直接运行（没有命令行参数）
    if len(sys.argv) == 1:
        print("在IDE中直接运行模式，使用交互式设置...")
        
        # 以下是IDE中可以编辑的配置参数
        # ====== 在此处编辑参数 ======
        run_mode = "app"  # 运行模式，默认为"app"
        
        # 应用程序参数
        app_config = {
            "port": 10000,        # 端口号
            "host": "127.0.0.1",  # 主机地址 
            "workers": 1          # 工作进程数
        }
        # ====== 编辑参数结束 ======

        # 创建默认参数对象
        default_args = argparse.Namespace()
        
        if run_mode == "app":
            print(f"启动应用程序服务器...")
            print(f"配置信息: 端口={app_config['port']}, 主机={app_config['host']}, 工作进程={app_config['workers']}")
            
            # 设置应用参数
            default_args.port = app_config["port"]
            default_args.host = app_config["host"]
            default_args.workers = app_config["workers"]
            
            # 运行应用程序
            command = run_app_command_factory(default_args)
            command.run()
        else:
            print(f"未知的运行模式: {run_mode}")
            print("支持的模式: app")
            return
        
        return
    
    args = parser.parse_args()

    if not hasattr(args, "func"):
        parser.print_help()
        exit(1)

    command = args.func(args)
    command.run()


# 添加命令工厂函数的引用，用于直接运行模式
def run_app_command_factory(args):
    from run_app import run_app_command_factory
    return run_app_command_factory(args)


if __name__ == "__main__":
    main()
