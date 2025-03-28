import sys
from argparse import ArgumentParser

import uvicorn

from abc import ABC, abstractmethod
from argparse import ArgumentParser
import os


class BaseCLICommand(ABC):
    @staticmethod
    @abstractmethod
    def register_subcommand(parser: ArgumentParser):
        raise NotImplementedError()

    @abstractmethod
    def run(self):
        raise NotImplementedError()




def run_app_command_factory(args):
    return RunAppCommand(args.port, args.host, args.workers)


class RunAppCommand(BaseCLICommand):
    @staticmethod
    def register_subcommand(parser: ArgumentParser):
        run_app_parser = parser.add_parser(
            "app",
            description="✨ Run app",
        )
        run_app_parser.add_argument(
            "--port",
            type=int,
            default=10000,
            help="Port to run the app on",
            required=False,
        )
        run_app_parser.add_argument(
            "--host",
            type=str,
            default="127.0.0.1",
            help="Host to run the app on",
            required=False,
        )
        run_app_parser.add_argument(
            "--workers",
            type=int,
            default=1,
            help="Number of workers to run the app with",
            required=False,
        )
        run_app_parser.set_defaults(func=run_app_command_factory)

    def __init__(self, port, host, workers):
        self.port = port
        self.host = host
        self.workers = workers

    def run(self):
        print("Starting aiaio server.")

        try:
            # 检查app.py文件是否存在于当前目录
            if os.path.exists(os.path.join(os.path.dirname(__file__), "app.py")):
                # 直接使用相对路径
                app_path = "app:app"
            else:
                # 如果不存在，尝试使用原始路径
                app_path = "aiaio.app.app:app"
                print(f"警告：未在当前目录找到app.py，尝试使用原始导入路径：{app_path}")
                
            uvicorn.run(app_path, host=self.host, port=self.port, workers=self.workers)
        except KeyboardInterrupt:
            print("Server terminated by user.")
            sys.exit(0)
        except ImportError as e:
            print(f"错误：无法导入应用程序模块：{e}")
            print("请确保app.py文件位于正确的位置，或者修改run_app.py中的导入路径。")
            sys.exit(1)
