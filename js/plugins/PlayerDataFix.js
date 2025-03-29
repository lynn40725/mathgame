/*:
 * @plugindesc 自訂戰鬥狀態顯示：左列 HP/MP(原樣式)，右列 ATK、DEF、暴擊資訊，中間留空隙
 * @author 
 *
 * @help
 * ============================================================================
 * 【說明】
 * 1. 直接修改預設的 Window_BattleStatus，使每位角色只佔用一行，但分成左右兩個區塊：
 *    - 左側：HP、MP（RMMV 原生彩色進度條）
 *    - 中間：留出空間，避免左右擁擠
 *    - 右側：ATK、DEF，若開關 #5 為 ON 時，再顯示 Crit Rate、Crit Damage
 *
 * 2. 開關 #5（Show Critical Switch）控制是否顯示暴擊資訊：
 *    - OFF：只顯示 ATK、DEF
 *    - ON ：另外顯示 Crit Rate、Crit Damage
 *
 * 3. 若角色沒有自訂屬性 `criDmg`，預設顯示 1.50。
 * 4. 若要調整「空間大小」或其他排版，請修改下方程式碼中的 `columnSpacing`、`leftW`、`rightW` 等參數。
 * ============================================================================
 */

(function () {
    'use strict';

    // 讓開關 #5 控制是否顯示暴擊資訊
    var showCriticalSwitchId = 5;
    function showCriticalInfo() {
        return $gameSwitches.value(showCriticalSwitchId);
    }

    // 每行只顯示一位角色
    Window_BattleStatus.prototype.maxCols = function () {
        return 1;
    };

    // 行高依據左列(HP/MP 2行) 與右列(ATK/DEF + 可選的暴擊資訊) 取最大
    Window_BattleStatus.prototype.itemHeight = function () {
        var linesLeft = 2; // HP、MP 各一行
        var linesRight = showCriticalInfo() ? 4 : 2; // ATK/DEF 或再加 Crit
        return this.lineHeight() * Math.max(linesLeft, linesRight);
    };

    // 覆蓋原本的繪製邏輯：左HP/MP + 空間 + 右ATK/DEF/暴擊
    Window_BattleStatus.prototype.drawItem = function (index) {
        var actor = $gameParty.battleMembers()[index];
        var rect = this.itemRectForText(index);
        var lineH = this.lineHeight();

        // 可自行調整的「兩列間距」
        var columnSpacing = 24;

        // 左列寬度 (略少於一半，以便留出空間)
        var leftW = Math.floor(rect.width / 2) - Math.floor(columnSpacing / 2);
        // 右列寬度 (剩餘空間)
        var rightW = rect.width - leftW - columnSpacing;

        // 繪製左列：HP (第0行), MP (第1行)
        this.drawActorHp(actor, rect.x, rect.y, leftW);
        this.drawActorMp(actor, rect.x, rect.y + lineH, leftW);

        // 右列的起始 X
        var rightX = rect.x + leftW + columnSpacing;

        // 第0行：ATK
        this.drawText("ATK: " + actor.param(2), rightX, rect.y, rightW, 'left');
        // 第1行：DEF
        this.drawText("DEF: " + actor.param(3), rightX, rect.y + lineH, rightW, 'left');

        // 若開關ON，顯示暴擊資訊 (第2行、3行)
        if (showCriticalInfo()) {
            var critRate = (actor.cri * 100).toFixed(1) + "%";
            this.drawText("Crit Rate: " + critRate, rightX, rect.y + lineH * 2, rightW, 'left');

            var cdmg = actor.criDmg ? actor.criDmg : 1.5;
            this.drawText("Crit Dmg: x" + cdmg.toFixed(2), rightX, rect.y + lineH * 3, rightW, 'left');
        }
    };

})();
