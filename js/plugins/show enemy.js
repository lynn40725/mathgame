/*:
 * @plugindesc 顯示敵人資訊插件 - 顯示敵人的詳細數值如HP、攻擊力、防禦力等，支持多個敵人顯示。
 * @author 您的名字
 *
 * @param BarWidth
 * @type number
 * @min 50
 * @default 120
 * @desc 血條的寬度
 *
 * @param ShowCriticalInfoSwitch
 * @type switch
 * @default 5
 * @desc 控制是否顯示暴擊資訊的開關編號
 *
 * @help
 * ============================================================================
 * 插件說明
 * ============================================================================
 * 此插件允許在戰鬥中顯示敵人的詳細資訊，包括：
 * 1. HP、最大HP、攻擊力、防禦力。
 * 2. 開關控制是否顯示暴擊率與暴擊傷害。
 * 3. 動態適應敵人數量（最多支持 3 個）。
 * ============================================================================
 */

(function () {
    // 插件參數設置
    var parameters = PluginManager.parameters('ShowEnemyDetails');
    var barWidth = Number(parameters['BarWidth'] || 120);
    var showCriticalSwitch = Number(parameters['ShowCriticalInfoSwitch'] || 5);

    // 確保開關能正確讀取
    var showCriticalInfo = function () {
        return $gameSwitches.value(showCriticalSwitch);
    };

    // 繼承 RPG Maker MV 窗口基類
    function Window_EnemyInfo() {
        this.initialize.apply(this, arguments);
    }

    Window_EnemyInfo.prototype = Object.create(Window_Base.prototype);
    Window_EnemyInfo.prototype.constructor = Window_EnemyInfo;

    Window_EnemyInfo.prototype.initialize = function () {
        var width = 300;
        var height = this.calculateWindowHeight();
        var x = Graphics.width - width - 10;
        var y = 10;
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };

    Window_EnemyInfo.prototype.calculateWindowHeight = function () {
        var enemies = $gameTroop.aliveMembers();
        var linesPerEnemy = showCriticalInfo() ? 6 : 4;
        var totalLines = linesPerEnemy * Math.min(enemies.length, 3); // 最多支持 3 個敵人
        return this.fittingHeight(totalLines);
    };

    Window_EnemyInfo.prototype.refresh = function () {
        this.contents.clear();
        var enemies = $gameTroop.aliveMembers();
        for (var i = 0; i < Math.min(enemies.length, 3); i++) {
            var enemy = enemies[i];
            var baseY = i * (showCriticalInfo() ? 6 : 4) * this.lineHeight(); // 每個敵人占用的高度

            // 設置名字為紅色
            this.changeTextColor(this.textColor(2)); // 紅色
            this.drawText(`${enemy.name()}`, 0, baseY, this.contentsWidth(), 'center');

            // 恢復為默認顏色
            this.resetTextColor();
            this.drawText(`HP: ${enemy.hp}/${enemy.mhp}`, 0, baseY + this.lineHeight(), this.contentsWidth(), 'left');
            this.drawText(`ATK: ${enemy.param(2)}`, 0, baseY + this.lineHeight() * 2, this.contentsWidth(), 'left');
            this.drawText(`DEF: ${enemy.param(3)}`, 0, baseY + this.lineHeight() * 3, this.contentsWidth(), 'left');

            if (showCriticalInfo()) {
                this.drawText(`Crit Rate: ${(enemy.cri * 100).toFixed(1)}%`, 0, baseY + this.lineHeight() * 4, this.contentsWidth(), 'left');
                this.drawText(`Crit Damage: x${(enemy.criDmg || 1.5).toFixed(2)}`, 0, baseY + this.lineHeight() * 5, this.contentsWidth(), 'left');
            }
        }
    };


    Window_EnemyInfo.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        this.refresh();
    };

    // 擴展 Scene_Battle 以添加窗口
    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function () {
        _Scene_Battle_createAllWindows.call(this);
        this._enemyInfoWindow = new Window_EnemyInfo();
        this.addWindow(this._enemyInfoWindow);
    };
})();
