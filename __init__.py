# File: ComfyUI/custom_nodes/ComfyUI_AutoBatchRunner/__init__.py
import os
import json

# JSフォルダをComfyUIに自動登録
WEB_DIRECTORY = "./js"

# 設定JSONの場所を 'auto_runner_config.json' に変更
CONFIG_DIR = os.path.dirname(os.path.realpath(__file__))
CONFIG_FILE = os.path.join(CONFIG_DIR, "auto_runner_config.json")
DEFAULT_CONFIG_FILE = os.path.join(CONFIG_DIR, "auto_runner_config.json.default")

# デフォルト設定を作成（初回起動時）
if not os.path.exists(CONFIG_FILE):
    default_config = {
        "auto_batch_runs": 4,
        "auto_batch_interval": 2000
    }
    with open(DEFAULT_CONFIG_FILE, "w") as f:
        json.dump(default_config, f, indent=4)
    with open(CONFIG_FILE, "w") as f:
        json.dump(default_config, f, indent=4)
    print("[AutoBatchRun] Default config created: auto_runner_config.json")

# ノード定義は空 (UI拡張のみのため)
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

print("[AutoBatchRun] Loaded - JS auto-load from ./js")
