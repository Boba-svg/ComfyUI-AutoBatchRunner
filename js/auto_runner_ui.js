// File: ComfyUI/custom_nodes/ComfyUI-AutoBatchRunner/js/auto_runner_ui.js
// 機能: 起動時自動ロード / 右上固定UI / auto_runner_config.json 読み込み / ショートカット
// UI表示: [秒数]秒 [枚数]枚 [Start(Q)] [Stop(S)]

(async function () {
    // -------------------------
    // 設定セクション
    // -------------------------
    let CONFIG = {
        runs: 1000,
        intervalMs: 10000,
        startKey: "Q",
        stopKey: "S"
    };
    
    // 設定ロード
    async function loadConfig() {
        try {
            const res = await fetch('/extensions/ComfyUI-AutoBatchRunner/auto_runner_config.json');
            const config = await res.json();
            
            CONFIG.runs = config.auto_batch_runs ?? CONFIG.runs;
            CONFIG.intervalMs = config.auto_batch_interval ?? CONFIG.intervalMs;
            
            console.log("[AutoBatchRun] Config loaded:", CONFIG);
        } catch (e) {
            console.warn("[AutoBatchRun] Config load failed, using defaults");
        }
    }

    // -------------------------
    // ComfyUIロード待ち
    // -------------------------
    while (!window.app || !app.queuePrompt) {
        await new Promise(r => setTimeout(r, 100));
    }
    await loadConfig();
    console.log("[AutoBatchRun] ComfyUI loaded & Config applied");

    // -------------------------
    // autoBatchRun 関数定義
    // -------------------------
    window.app.autoBatchRun = async function (count = CONFIG.runs, intervalMs = CONFIG.intervalMs) {
        if (window.app.isAutoRunning) {
            console.warn("[AutoBatchRun] Already running.");
            return;
        }
        window.app.isAutoRunning = true;
        console.log(`[AutoBatchRun] START: ${count} runs, interval ${intervalMs}ms`);

        for (let i = 0; i < count; i++) {
            if (!window.app.isAutoRunning) {
                console.log("[AutoBatchRun] STOPPED by user.");
                break;
            }
            console.log(`[AutoBatchRun] Run ${i + 1}/${count}`);
            try {
                await window.app.queuePrompt();
            } catch (e) {
                console.error("[AutoBatchRun] queuePrompt error:", e);
                window.app.isAutoRunning = false;
                break;
            }
            if (i < count - 1) {
                await new Promise(r => setTimeout(r, intervalMs));
            }
        }

        window.app.isAutoRunning = false;
        console.log("[AutoBatchRun] FINISHED");
    };

    // -------------------------
    // UI要素の作成と固定配置
    // -------------------------
    function createUI() {
        const targetMenu = document.body;
        
        const existingUi = document.getElementById('auto-batch-runner-ui');
        if (existingUi) {
            existingUi.remove();
        }
        
        const container = document.createElement('div');
        container.id = 'auto-batch-runner-ui';

        container.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            z-index: 99999;
            padding: 8px;
            background-color: #333;
            border: 1px solid #555;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            display: flex;
            gap: 6px;
            align-items: center;
            color: white;
            font-family: sans-serif;
        `;
        
        // Interval(sec) 入力フィールド
        const intervalInput = document.createElement('input');
        intervalInput.id = 'auto-batch-interval';
        intervalInput.type = 'number';
        intervalInput.min = '0.01';
        intervalInput.step = '0.01';
        intervalInput.value = (CONFIG.intervalMs / 1000).toFixed(2);
        intervalInput.placeholder = 'Sec';
        intervalInput.style.cssText = 'width: 60px; padding: 2px 5px; border-radius: 4px; border: 1px solid #555; background-color: #444; color: white; text-align: center;';

        // 追加：ラベル「秒」
        const secLabel = document.createElement('span');
        secLabel.textContent = "秒";

        // Runs 入力フィールド
        const runInput = document.createElement('input');
        runInput.id = 'auto-batch-run-count';
        runInput.type = 'number';
        runInput.min = '1';
        runInput.value = CONFIG.runs;
        runInput.placeholder = 'Runs'; 
        runInput.style.cssText = intervalInput.style.cssText;

        // 追加：ラベル「枚」
        const countLabel = document.createElement('span');
        countLabel.textContent = "枚";

        // Start ボタン
        const startButton = document.createElement('button');
        startButton.textContent = 'Start(Q)'; 
        startButton.style.cssText = 'padding: 5px 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;';
        startButton.onclick = () => {
            const sec = parseFloat(intervalInput.value) || (CONFIG.intervalMs / 1000);
            const intervalMs = Math.max(sec * 1000, 1);
            const count = parseInt(runInput.value, 10) || CONFIG.runs;
            window.app.autoBatchRun(count, intervalMs);
        };
        
        // Stop ボタン
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop(S)'; 
        stopButton.style.cssText = 'padding: 5px 10px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;';
        stopButton.onclick = () => {
            window.app.isAutoRunning = false;
            console.warn("[AutoBatchRun] STOPPED via UI Button");
        };

        // UIをコンテナに追加
        container.appendChild(intervalInput);
        container.appendChild(secLabel);  // ← 追加
        container.appendChild(runInput); 
        container.appendChild(countLabel); // ← 追加
        container.appendChild(startButton);
        container.appendChild(stopButton);
        
        targetMenu.appendChild(container);
    }

    createUI(); 
    console.log("[AutoBatchRun] UI LOADED and FIXED to top right.");

    // -------------------------
    // ショートカット：Shift+Q / Shift+S
    // -------------------------
    document.addEventListener("keydown", (e) => {
        const isInput = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
        if (isInput) return;

        const key = e.key.toUpperCase();
        const runInput = document.getElementById('auto-batch-run-count');
        const intervalInput = document.getElementById('auto-batch-interval');

        const sec = parseFloat(intervalInput?.value) || (CONFIG.intervalMs / 1000);
        const intervalMs = Math.max(sec * 1000, 1);
        const count = parseInt(runInput?.value, 10) || CONFIG.runs;

        if (key === CONFIG.startKey && e.shiftKey) {
            e.preventDefault();
            window.app.autoBatchRun(count, intervalMs);
        }

        if (key === CONFIG.stopKey && e.shiftKey) {
            e.preventDefault();
            window.app.isAutoRunning = false;
        }
    });
})();
