// File: ComfyUI/custom_nodes/ComfyUI-AutoBatchRunner/js/auto_runner_ui.js
// 機能: 起動時自動ロード / 右上固定UI / auto_runner_config.json 読み込み / ショートカット
// UI表示: [数字入力欄] [Start(Q)] [Stop(S)]

(async function () {
    // -------------------------
    // 設定セクション
    // -------------------------
    let CONFIG = {
        runs: 20,
        intervalMs: 2000,
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
        
        // 1. メインコンテナの作成
        const container = document.createElement('div');
        container.id = 'auto-batch-runner-ui';
        
        // CSSで画面右上に固定配置
        // ★★★ 変数説明の追加 ★★★
        const CSS_TOP_POSITION = '60px';  // 画面上端からの距離。この値を大きくすると下に移動します。
        const CSS_RIGHT_POSITION = '10px'; // 画面右端からの距離。この値を大きくすると左に移動します。
        const CSS_Z_INDEX = '99999';       // 重なり順。他の要素よりも手前に表示するための値です。
        // ★★★ 説明はここまで ★★★

        container.style.cssText = `
            position: fixed;
            top: ${CSS_TOP_POSITION};
            right: ${CSS_RIGHT_POSITION};
            z-index: ${CSS_Z_INDEX};
            padding: 8px;
            background-color: #333;
            border: 1px solid #555;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            display: flex;
            gap: 8px;
            align-items: center;
            color: white;
            font-family: sans-serif;
        `;
        
        // 2. 実行回数入力フィールド
        const runInput = document.createElement('input');
        runInput.id = 'auto-batch-run-count';
        runInput.type = 'number';
        runInput.min = '1';
        runInput.value = CONFIG.runs;
        runInput.placeholder = 'Runs'; 
        runInput.style.cssText = 'width: 70px; padding: 2px 5px; border-radius: 4px; border: 1px solid #555; background-color: #444; color: white; text-align: center;';

        // 3. 実行ボタン (Start)
        const startButton = document.createElement('button');
        startButton.textContent = 'Start(Q)'; 
        startButton.style.cssText = 'padding: 5px 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.1s;';
        startButton.onmouseover = () => startButton.style.backgroundColor = '#5cb85c';
        startButton.onmouseout = () => startButton.style.backgroundColor = '#4CAF50';
        startButton.onclick = () => {
            const count = parseInt(runInput.value, 10) || CONFIG.runs;
            window.app.autoBatchRun(count, CONFIG.intervalMs); 
        };
        
        // 4. 停止ボタン (Stop)
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop(S)'; 
        stopButton.style.cssText = 'padding: 5px 10px; background-color: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.1s;';
        stopButton.onmouseover = () => stopButton.style.backgroundColor = '#e64e40';
        stopButton.onmouseout = () => stopButton.style.backgroundColor = '#F44336';
        stopButton.onclick = () => {
            window.app.isAutoRunning = false;
            console.warn("[AutoBatchRun] STOPPED via UI Button");
        };

        // UIをコンテナに追加
        container.appendChild(runInput); 
        container.appendChild(startButton);
        container.appendChild(stopButton);
        
        targetMenu.appendChild(container);
    }

    createUI(); 
    console.log("[AutoBatchRun] UI LOADED and FIXED to top right (60px from top).");

    // -------------------------
    // ショートカット：Shift+Q で開始 / Shift+S で停止
    // -------------------------
    document.addEventListener("keydown", (e) => {
        const isInput = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
        if (isInput) return;

        const key = e.key.toUpperCase();
        const runInput = document.getElementById('auto-batch-run-count');
        const count = parseInt(runInput?.value, 10) || CONFIG.runs;

        if (key === CONFIG.startKey && e.shiftKey) {
            e.preventDefault();
            window.app.autoBatchRun(count, CONFIG.intervalMs);
            console.log("[AutoBatchRun] Started via Shift+Q");
        }

        if (key === CONFIG.stopKey && e.shiftKey) {
            e.preventDefault();
            window.app.isAutoRunning = false;
            console.warn("[AutoBatchRun] STOPPED via Shift+S");
        }
    });
})();
