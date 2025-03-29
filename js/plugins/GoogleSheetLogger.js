//=============================================================================
// GoogleSheetLogger.js
//=============================================================================

/*:
 * @plugindesc Integrates Google Sheet Logging for RPG Maker MV.
 * Logs player actions, results, and execution times automatically.
 *
 * @help
 * This plugin enables logging events or custom data directly to a Google Sheet.
 *
 * ----------------------------------------------------------------------------
 * Plugin Commands:
 * ----------------------------------------------------------------------------
 *   GoogleSheetLogger startActionTimer
 *     Starts the timer for an action.
 *
 *   GoogleSheetLogger endActionTimer <Action> <Result> <IsCorrect> <VarExpr>
 *     Ends the timer, calculates duration, and logs data automatically.
 *     - <Action>:    文字，表示本次行為名稱
 *     - <Result>:    文字，表示本次結果
 *     - <IsCorrect>: 'true' 或 'false'，用來表示是否正確 (也可不填或填其它)
 *     - <VarExpr>:   (可選) 任何 JS 表達式字串，會使用 eval() 執行並上傳
 *       例如：$gameVariables.value(2)
 *
 *   GoogleSheetLogger enable
 *     Enables the logger.
 *
 *   GoogleSheetLogger disable
 *     Disables the logger.
 *
 *   GoogleSheetLogger resetPlayerId
 *     Resets the local Player ID (for generating a new one).
 *
 * ----------------------------------------------------------------------------
 * Usage Example:
 * ----------------------------------------------------------------------------
 *   1) GoogleSheetLogger startActionTimer
 *      （開始計時）
 *
 *   2) GoogleSheetLogger endActionTimer 測試選擇 選一 true $gameVariables.value(1)
 *      （結束計時，並上傳 action='測試選擇'、result='選一'、isCorrect=true，
 *        同時把 eval($gameVariables.value(1)) 的結果上傳到變數欄）
 *
 * 在你的 Google Sheet 中，請新增一欄 "variableValue"（或對應欄位），
 * 就能接收此表達式的回傳值。
 */

//=============================================================================
// GoogleSheetLogger.js (CORS修正版)
//=============================================================================

/*:
 * @plugindesc Integrates Google Sheet Logging for RPG Maker MV.
 * Logs player actions, results, and execution times automatically.
 *
 * @help
 * Plugin Commands:
 *   GoogleSheetLogger startActionTimer
 *   GoogleSheetLogger endActionTimer <Action> <Result> <IsCorrect> <VarExpr>
 *   GoogleSheetLogger enable
 *   GoogleSheetLogger disable
 *   GoogleSheetLogger resetPlayerId
 */

//=============================================================================
// GoogleSheetLogger.js (修正版)
//=============================================================================

/*:
 * @plugindesc Integrates Google Sheet Logging for RPG Maker MV.
 * Logs player actions, results, and execution times automatically.
 *
 * @help
 * Plugin Commands:
 *   GoogleSheetLogger startActionTimer
 *   GoogleSheetLogger endActionTimer <Action> <Result> <IsCorrect> <VarExpr>
 *   GoogleSheetLogger enable
 *   GoogleSheetLogger disable
 *   GoogleSheetLogger resetPlayerId
 */

var Imported = Imported || {};
Imported.GoogleSheetLogger = true;

var GoogleSheetLogger = GoogleSheetLogger || {};
GoogleSheetLogger.parameters = PluginManager.parameters('GoogleSheetLogger');

(function () {
    'use strict';

    const Logger = GoogleSheetLogger;

    // Logger Enabled 開關
    Logger.enabled = true;

    // 設定您的 Apps Script 網址 (網頁應用程式 URL)
    Logger.logUrl = "https://script.google.com/macros/s/AKfycbxZurkqITyYJdz_5K4ctHFt85rY14Bf8CTkd6mQPKv_9GFdfB9qxW20fSa5h7zR6OQX/exec";

    // 初始化
    Logger.startTime = null;
    Logger.playerId = "";
    Logger.playerName = "";

    Logger.generateNewUniqueId = function () {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 10);
        return `ID_${timestamp}_${randomPart}`;
    };

    Logger.initializePlayerId = function () {
        if (!localStorage.getItem('GoogleSheetLogger_PlayerID')) {
            Logger.playerId = Logger.generateNewUniqueId();
            localStorage.setItem('GoogleSheetLogger_PlayerID', Logger.playerId);
        } else {
            Logger.playerId = localStorage.getItem('GoogleSheetLogger_PlayerID');
        }
    };

    Logger.resetPlayerId = function () {
        Logger.playerId = Logger.generateNewUniqueId();
        localStorage.setItem('GoogleSheetLogger_PlayerID', Logger.playerId);
    };

    Logger.updatePlayerName = function () {
        // 假設玩家名稱存在於 $gameVariables.value(1)
        const variableId = 1;
        const name = $gameVariables.value(variableId);
        Logger.playerName = name || "Mathematician";
    };

    /**
     * Logger.log:
     *  改用 text/plain 發送，以避免瀏覽器發 OPTIONS 預檢。
     */
    Logger.log = function (data) {
        if (!Logger.enabled) return;

        Logger.initializePlayerId();
        Logger.updatePlayerName();

        // 準備要送到後端的物件
        const payload = {
            playerId: Logger.playerId,
            playerName: Logger.playerName,
            action: data.action || "NoAction",
            result: data.result || "NoResult",
            isCorrect: data.isCorrect,         // true/false
            timeSpent: data.duration || 0,     // number
            variableValue: data.variableValue || ""
        };

        // 透過 fetch 並改用 text/plain
        fetch(Logger.logUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (res.ok) {
                    return res.text();
                } else {
                    throw new Error("HTTP status " + res.status);
                }
            })
            .then(text => {
                console.log("✅ 資料傳送成功: ", text);
            })
            .catch(err => {
                console.error("❌ 資料傳送失敗: ", err);
            });
    };

    // startActionTimer
    Logger.startActionTimer = function () {
        Logger.startTime = performance.now();
        console.log("Action timer started");
    };

    // endActionTimer
    Logger.endActionTimer = function (action, result, isCorrect, varExpr) {
        if (Logger.startTime === null) {
            console.error("Start timer was not called before end timer!");
            return;
        }
        const endTime = performance.now();
        const duration = ((endTime - Logger.startTime) / 1000).toFixed(2);
        Logger.startTime = null;

        let correctValue = null;
        if (isCorrect === 'true') correctValue = true;
        if (isCorrect === 'false') correctValue = false;

        let variableValue = "";
        if (varExpr) {
            try {
                variableValue = eval(varExpr);
            } catch (e) {
                variableValue = `EvalError: ${e}`;
            }
        }

        Logger.log({
            action: action,
            result: result,
            isCorrect: correctValue,
            duration: duration,
            variableValue: variableValue
        });
    };

    // 插件指令
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === 'GoogleSheetLogger') {
            switch (args[0]) {
                case 'startActionTimer':
                    Logger.startActionTimer();
                    break;
                case 'endActionTimer':
                    const [action, result, isCorrect, varExpr] = args.slice(1);
                    Logger.endActionTimer(action, result, isCorrect, varExpr);
                    break;
                case 'enable':
                    Logger.enabled = true;
                    break;
                case 'disable':
                    Logger.enabled = false;
                    break;
                case 'resetPlayerId':
                    Logger.resetPlayerId();
                    break;
            }
        }
    };
})();