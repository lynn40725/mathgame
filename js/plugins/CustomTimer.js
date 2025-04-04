/*:
 * @plugindesc 計時器插件：可自由開始/停止，結果存入指定變數
 * @author 
 *
 * @help
 * ============================================================================
 * 使用方法：
 * ============================================================================
 * 1. 將本檔命名為 CustomTimer.js 放到 js/plugins 中
 * 2. 在「插件管理」中啟用
 * 3. 接著可使用以下「插件指令」：
 * 
 *   CustomTimer start
 *     - 開始累積時間
 * 
 *   CustomTimer stop
 *     - 暫停/停止累積時間
 * 
 *   CustomTimer reset
 *     - 重設計時器(歸零)
 * 
 * ============================================================================
 * 設定說明：
 * - 本插件默認把累計秒數存到第 18 號變數。若要改成別的，請修改下方屬性。
 * - 每張地圖 / Scene_Map 更新時，若計時器在運作，就會以 frame 計算。
 * - 每 60 frame = 1 秒
 * ============================================================================
 */

(function() {

    // 你想把時間記到哪個變數ID？(預設 18)
    const TIMER_VARIABLE_ID = 18;

    // 內部狀態
    let _timerRunning = false;   // 是否在計算中
    let _accumulatedFrames = 0;  // 累積的 frames(1秒=60 frames)

    //--------------------------------------------------------------------------
    // 每幀都更新(只要在地圖場景中)
    //--------------------------------------------------------------------------
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);

        if (_timerRunning) {
            // 累加 frames
            _accumulatedFrames++;
            // 將秒數寫入變數(取整數秒)
            const sec = Math.floor(_accumulatedFrames / 60);
            $gameVariables.setValue(TIMER_VARIABLE_ID, sec);
        }
    };

    //--------------------------------------------------------------------------
    // 解析插件指令
    //--------------------------------------------------------------------------
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === "CustomTimer") {
            switch (args[0]) {
                case "start":
                    _timerRunning = true;
                    break;
                case "stop":
                    _timerRunning = false;
                    break;
                case "reset":
                    _accumulatedFrames = 0;
                    $gameVariables.setValue(TIMER_VARIABLE_ID, 0);
                    break;
            }
        }
    };

})();
