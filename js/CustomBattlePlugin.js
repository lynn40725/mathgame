/*:
 * @plugindesc Modify Battle Mode to Handle Negative HP with Recovery
 * @version 1.1.6
 * @author User
 *
 * @help
 * This plugin modifies the battle logic so that when HP drops below zero,
 * it is recovered instead of causing death. If HP reaches zero, the target
 * is assigned the KO state (#1).
 *
 * Plugin Commands:
 *   EnableRecoveryLogic    - Enables the negative HP recovery feature.
 *   DisableRecoveryLogic   - Disables the negative HP recovery feature.
 */

(function () {
    let recoveryLogicEnabled = true; // Default state of the recovery logic

    // Plugin command implementation
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === "EnableRecoveryLogic") {
            recoveryLogicEnabled = true;
        } else if (command === "DisableRecoveryLogic") {
            recoveryLogicEnabled = false;
        }
    };

    // Override refresh to handle negative HP and KO state logic
    Game_BattlerBase.prototype.refresh = function () {
        if (!recoveryLogicEnabled) return; // Skip logic if disabled

        // Prevent infinite recursion by skipping if already refreshing
        if (this._isRefreshing) return;
        this._isRefreshing = true;

        this.stateResistSet().forEach(function (stateId) {
            this.eraseState(stateId);
        }, this);

        const previousHp = this._hp;
        this._hp = Math.max(this._hp, -99999); // Allow HP to go negative but limit range
        this._hp = Math.min(this._hp, this.mhp); // Ensure HP does not exceed maximum

        if (this._hp < 0) {
            // Recover HP immediately when below zero
            this._hp = Math.abs(this._hp); // Convert negative HP to positive as recovery
        } else if (this._hp === 0 && previousHp !== 0) {
            // Apply KO state when HP is exactly zero
            this.addState(this.deathStateId());
        }

        this._mp = this._mp.clamp(0, this.mmp);
        this._tp = this._tp.clamp(0, this.maxTp());

        this._isRefreshing = false;
    };

    // Override executeDamage to ensure recovery and KO state logic
    Game_Battler.prototype.executeDamage = function () {
        if (!recoveryLogicEnabled) {
            // Default behavior if logic is disabled
            const originalHp = this.hp;
            const hpDamage = this._result.hpDamage;
            this._hp = Math.max(originalHp - hpDamage, 0);
            return;
        }

        const originalHp = this.hp;
        const hpDamage = this._result.hpDamage;
        let remainingHp = originalHp - hpDamage;

        // Directly update HP without triggering additional refresh calls
        this._hp = remainingHp;

        // Safely refresh to handle recovery and KO logic
        if (!this._isRefreshing) {
            this.refresh();
        }

        // If HP is zero, handle KO logic explicitly
        if (this.hp === 0 && originalHp > 0) {
            this.performCollapse();
        }
    };

    // Ensure the clamp function exists
    if (!Number.prototype.clamp) {
        Number.prototype.clamp = function (min, max) {
            return Math.min(Math.max(this, min), max);
        };
    }
})();
