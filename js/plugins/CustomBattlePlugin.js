/*:
 * @plugindesc Modify Battle Mode to Handle Negative HP with Recovery for Enemies Only
 * @version 1.2.0
 * @author User
 *
 * @help
 * 原邏輯：HP掉到負值時，立即變成「正值」，相當於回復；HP=0 時則套用死亡狀態。
 * 
 * 現在新增需求：玩家角色若 HP <= 0 則直接死亡，不使用負值回復。
 * 敵人若 HP < 0 依舊轉為正值 (負值的絕對值)，給與特殊玩法差異。
 *
 * 
 * Plugin Commands:
 *   EnableRecoveryLogic    - 啟用負 HP 轉回復的功能 (只對敵人有效果)
 *   DisableRecoveryLogic   - 停用該功能，所有人都回歸預設 HP 行為
 */

(function () {
    let recoveryLogicEnabled = true; // Default state of the recovery logic

    //--------------------------------------------------------------------------
    // 插件指令
    //--------------------------------------------------------------------------
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === "EnableRecoveryLogic") {
            recoveryLogicEnabled = true;
        } else if (command === "DisableRecoveryLogic") {
            recoveryLogicEnabled = false;
        }
    };

    //--------------------------------------------------------------------------
    // Game_BattlerBase.prototype.refresh
    //--------------------------------------------------------------------------
    // 依照「是否敵人」和「功能開關」決定是否使用負 HP → 回復的行為。
    const _Game_BattlerBase_refresh = Game_BattlerBase.prototype.refresh;
    Game_BattlerBase.prototype.refresh = function () {
        // 如果 plugin 被停用，或「這個 battler 是玩家」都走原本 RMMV 內建邏輯
        // => 0 or less 就死亡
        if (!recoveryLogicEnabled || this.isActor()) {
            _Game_BattlerBase_refresh.call(this);
            return;
        }

        // 否則(代表是敵人 & 邏輯啟用)，保持原本的「負 HP → 回復」行為:
        if (this._isRefreshing) return;
        this._isRefreshing = true;

        this.stateResistSet().forEach((stateId) => this.eraseState(stateId));

        const previousHp = this._hp;
        // 允許 HP 負值，但限制範圍
        this._hp = Math.max(this._hp, -99999);
        // 不能超過最大 HP
        this._hp = Math.min(this._hp, this.mhp);

        // 若 HP < 0，轉為正值(回復機制)
        if (this._hp < 0) {
            this._hp = Math.abs(this._hp);
        } else if (this._hp === 0 && previousHp !== 0) {
            // 若剛好歸 0，套用死亡狀態
            this.addState(this.deathStateId());
        }

        this._mp = this._mp.clamp(0, this.mmp);
        this._tp = this._tp.clamp(0, this.maxTp());

        this._isRefreshing = false;
    };

    //--------------------------------------------------------------------------
    // Game_Battler.prototype.executeDamage
    //--------------------------------------------------------------------------
    // 根據是否為敵人 & 開關，決定是否負值轉回復。
    const _Game_Battler_executeDamage = Game_Battler.prototype.executeDamage;
    Game_Battler.prototype.executeDamage = function () {
        // 如果 pluginDisabled 或 角色是玩家，走預設行為
        if (!recoveryLogicEnabled || this.isActor()) {
            _Game_Battler_executeDamage.call(this);
            return;
        }

        // 否則(敵人 & 開啟), 保留負值 → 回復邏輯
        const originalHp = this.hp;
        const hpDamage = this._result.hpDamage;
        let remainingHp = originalHp - hpDamage;
        this._hp = remainingHp;

        // 調用 refresh() 讓它處理負值→回復 + 死亡判定
        if (!this._isRefreshing) {
            this.refresh();
        }

        // 如果最終 HP=0，執行死亡表現
        if (this.hp === 0 && originalHp > 0) {
            this.performCollapse();
        }
    };

    //--------------------------------------------------------------------------
    // clamp function for older versions
    //--------------------------------------------------------------------------
    if (!Number.prototype.clamp) {
        Number.prototype.clamp = function (min, max) {
            return Math.min(Math.max(this, min), max);
        };
    }
})();
