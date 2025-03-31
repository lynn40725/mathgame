/*:
 * @plugindesc Modify Battle Mode to Handle Negative HP with Recovery for Enemies Only
 * @version 1.2.0
 * @author User
 *
 * @help
 * ���޿�GHP����t�ȮɡA�ߧY�ܦ��u���ȡv�A�۷��^�_�FHP=0 �ɫh�M�Φ��`���A�C
 * 
 * �{�b�s�W�ݨD�G���a����Y HP <= 0 �h�������`�A���ϥέt�Ȧ^�_�C
 * �ĤH�Y HP < 0 �����ର���� (�t�Ȫ������)�A���P�S���k�t���C
 *
 * 
 * Plugin Commands:
 *   EnableRecoveryLogic    - �ҥέt HP ��^�_���\�� (�u��ĤH���ĪG)
 *   DisableRecoveryLogic   - ���θӥ\��A�Ҧ��H���^�k�w�] HP �欰
 */

(function () {
    let recoveryLogicEnabled = true; // Default state of the recovery logic

    //--------------------------------------------------------------------------
    // ������O
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
    // �̷ӡu�O�_�ĤH�v�M�u�\��}���v�M�w�O�_�ϥέt HP �� �^�_���欰�C
    const _Game_BattlerBase_refresh = Game_BattlerBase.prototype.refresh;
    Game_BattlerBase.prototype.refresh = function () {
        // �p�G plugin �Q���ΡA�Ρu�o�� battler �O���a�v�����쥻 RMMV �����޿�
        // => 0 or less �N���`
        if (!recoveryLogicEnabled || this.isActor()) {
            _Game_BattlerBase_refresh.call(this);
            return;
        }

        // �_�h(�N��O�ĤH & �޿�ҥ�)�A�O���쥻���u�t HP �� �^�_�v�欰:
        if (this._isRefreshing) return;
        this._isRefreshing = true;

        this.stateResistSet().forEach((stateId) => this.eraseState(stateId));

        const previousHp = this._hp;
        // ���\ HP �t�ȡA������d��
        this._hp = Math.max(this._hp, -99999);
        // ����W�L�̤j HP
        this._hp = Math.min(this._hp, this.mhp);

        // �Y HP < 0�A�ର����(�^�_����)
        if (this._hp < 0) {
            this._hp = Math.abs(this._hp);
        } else if (this._hp === 0 && previousHp !== 0) {
            // �Y��n�k 0�A�M�Φ��`���A
            this.addState(this.deathStateId());
        }

        this._mp = this._mp.clamp(0, this.mmp);
        this._tp = this._tp.clamp(0, this.maxTp());

        this._isRefreshing = false;
    };

    //--------------------------------------------------------------------------
    // Game_Battler.prototype.executeDamage
    //--------------------------------------------------------------------------
    // �ھڬO�_���ĤH & �}���A�M�w�O�_�t����^�_�C
    const _Game_Battler_executeDamage = Game_Battler.prototype.executeDamage;
    Game_Battler.prototype.executeDamage = function () {
        // �p�G pluginDisabled �� ����O���a�A���w�]�欰
        if (!recoveryLogicEnabled || this.isActor()) {
            _Game_Battler_executeDamage.call(this);
            return;
        }

        // �_�h(�ĤH & �}��), �O�d�t�� �� �^�_�޿�
        const originalHp = this.hp;
        const hpDamage = this._result.hpDamage;
        let remainingHp = originalHp - hpDamage;
        this._hp = remainingHp;

        // �ե� refresh() �����B�z�t�ȡ��^�_ + ���`�P�w
        if (!this._isRefreshing) {
            this.refresh();
        }

        // �p�G�̲� HP=0�A���榺�`��{
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
