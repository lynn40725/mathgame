/*:
 * @plugindesc 戰鬥中「技能 / 道具」視窗改為單欄、直向清單，並移至左側 (最終整合)
 * @author 
 *
 * @help
 * ============================================================================
 * 功能說明：
 * 1. 戰鬥中「技能選單」(Window_BattleSkill) 及「道具選單」(Window_BattleItem)
 *    均改為單欄縱向，一次顯示多行，不會擋住右側的敵人資訊。
 * 2. 能自訂視窗寬、高及位置(以範例為 300 寬、靠左，顯示 8 行)。
 * ============================================================================
 * 使用方式：
 * 1. 將本檔案放到 js/plugins 下，於插件管理啟用。
 * 2. 需要自定行數、寬度或 x, y 位置，可修改下方對應程式碼。
 * ============================================================================
 */

(function () {

    //---------------------------------------------------------------------------
    // A. 技能視窗 Window_BattleSkill
    //---------------------------------------------------------------------------

    // (1) 單欄配置
    Window_BattleSkill.prototype.maxCols = function () {
        return 1;  // 只要一欄
    };

    // (2) 可視行數：8 行 (可自行改大或小)
    Window_BattleSkill.prototype.numVisibleRows = function () {
        return 8;
    };

    // (3) 修改初始化，指定寬度
    const _Window_BattleSkill_initialize = Window_BattleSkill.prototype.initialize;
    Window_BattleSkill.prototype.initialize = function (x, y, width, height) {
        _Window_BattleSkill_initialize.call(this, x, y, width, height);
        // 範例：寬度 300
        this.width = 300;
        // 高度將在 updatePlacement() 時計算
    };

    // (4) 讓原定位先判斷上下，再自行覆蓋 x, y, height
    const _Window_BattleSkill_updatePlacement = Window_BattleSkill.prototype.updatePlacement;
    Window_BattleSkill.prototype.updatePlacement = function () {
        _Window_BattleSkill_updatePlacement.call(this);

        // 例如放在左上角
        this.x = 0;
        this.y = 0;

        // 讓 RMMV 依行數自動計算視窗高度
        this.height = this.windowHeight();
    };

    //---------------------------------------------------------------------------
    // B. 道具視窗 Window_BattleItem (同理)
    //---------------------------------------------------------------------------

    Window_BattleItem.prototype.maxCols = function () {
        return 1;  // 單欄
    };

    Window_BattleItem.prototype.numVisibleRows = function () {
        return 8;  // 一次顯示 8 行
    };

    const _Window_BattleItem_initialize = Window_BattleItem.prototype.initialize;
    Window_BattleItem.prototype.initialize = function (x, y, width, height) {
        _Window_BattleItem_initialize.call(this, x, y, width, height);
        // 同樣給它 300px 寬
        this.width = 300;
    };

    const _Window_BattleItem_updatePlacement = Window_BattleItem.prototype.updatePlacement;
    Window_BattleItem.prototype.updatePlacement = function () {
        _Window_BattleItem_updatePlacement.call(this);

        this.x = 0;
        this.y = 0;
        this.height = this.windowHeight();
    };

})();
