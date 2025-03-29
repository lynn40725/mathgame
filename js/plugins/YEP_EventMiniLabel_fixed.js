/*:
 * @plugindesc 顯示玩家頭上可動態更新的標籤，並可透過 Show/HideMiniLabel 同步隱藏 (最終整合)
 * @author Gizmo
 *
 * @help
 * ============================================================================
 * ◤ 功能說明 ◢
 * ============================================================================
 * 1. 在地圖時，玩家角色頭上顯示一個可動態更新的標籤。預設文字為 "HP= \V[81]"。
 * 2. 文字中可使用 RMMV 內建控制碼，如 \V[n], \N[n], \C[n] 等。
 * 3. 由於插入在 WindowLayer 底下，不會擋住對話框。
 * 4. 若同時安裝 YEP_EventMiniLabel，執行 Plugin Command:
 *    - "HideMiniLabel" => 會同時隱藏玩家頭上標籤
 *    - "ShowMiniLabel" => 會同時顯示
 * 5. 若沒有安裝 YEP_EventMiniLabel，本插件仍可獨立使用，但 "HideMiniLabel"/"ShowMiniLabel" 指令會只影響玩家標籤本身。
 *
 * ============================================================================
 * 使用方式：
 * 1. 將此檔案放入 js/plugins。
 * 2. 在預設 text 內改成你想顯示的內容：可用 \V[xx] 代表指定變數值。
 * 3. 如要調整位置，可在 updatePosition() 內修改 offsetY。
 * ============================================================================
 */

(function () {

    //==========================================================================
    // 1) 製作玩家頭上標籤視窗 Window_PlayerMiniLabel
    //==========================================================================

    function Window_PlayerMiniLabel() {
        this.initialize(...arguments);
    }

    Window_PlayerMiniLabel.prototype = Object.create(Window_Base.prototype);
    Window_PlayerMiniLabel.prototype.constructor = Window_PlayerMiniLabel;

    Window_PlayerMiniLabel.prototype.initialize = function () {
        const width = 200;
        const height = this.fittingHeight(1);
        Window_Base.prototype.initialize.call(this, 0, 0, width, height);

        this.opacity = 0;         // 視窗背景透明
        this.contentsOpacity = 0; // 內容也透明
        this._text = "";                 // 原始文字
        this._oldExpandedText = "";      // 上一次展開後文字，用來比對是否改變
        this._isAlwaysShow = true;       // 是否始終顯示 (遇到HideMiniLabel就關)
        this.refresh();
    };

    /**
     * 預設顯示的文字內容。
     *  - 可含 \V[n], \N[n] 等控制碼，並自動展開
     */
    Window_PlayerMiniLabel.prototype.defaultLabelText = function () {
        // 例如顯示 HP= \V[81]，你可自由改
        return "　\\V[81]";
    };

    /**
     * 幫助將 \V[n], \N[n], ... 轉成真正文字
     *  - 你也能自行擴充對 \C[n], \I[n] 的替換
     */
    Window_PlayerMiniLabel.prototype.expandedText = function (text) {
        let s = text.replace(/\\/g, '\x1b');  // 先把 '\' 變成 '\x1b'
        s = s.replace(/\x1b\x1b/g, '\\');    // 把重複的再替換回來
        // \V[n]
        s = s.replace(/\x1bV\[(\d+)\]/gi, (_, p1) => {
            return $gameVariables.value(Number(p1));
        });
        // \N[n]
        s = s.replace(/\x1bN\[(\d+)\]/gi, (_, p1) => {
            const actorId = Number(p1);
            const actor = actorId >= 1 ? $gameActors.actor(actorId) : null;
            return actor ? actor.name() : "";
        });
        return s;
    };

    /**
     * 設置文字，並強制 refresh
     */
    Window_PlayerMiniLabel.prototype.setText = function (text) {
        this._text = text;
        this.refresh();
    };

    /**
     * refresh：重繪視窗
     */
    Window_PlayerMiniLabel.prototype.refresh = function () {
        this.contents.clear();
        if (!this._text) return;

        // 計算文字寬度
        const textWidth = this.textWidthEx(this._text);
        const newWidth = Math.max(120, textWidth + this.padding * 2);
        const newHeight = this.fittingHeight(1);

        this.width = newWidth;
        this.height = newHeight;

        // 繪製
        this.drawTextEx(this._text, 0, 0);
    };

    /**
     * 幫助計算文字寬度
     */
    Window_PlayerMiniLabel.prototype.textWidthEx = function (text) {
        const lastY = this.contents.height + 8;
        const lastFontSize = this.contents.fontSize;
        const w = this.drawTextEx(text, 0, lastY);
        this.contents.fontSize = lastFontSize;
        return w;
    };

    /**
     * 每幀更新
     */
    Window_PlayerMiniLabel.prototype.update = function () {
        Window_Base.prototype.update.call(this);

        // 若安裝 YEP_EventMiniLabel，可用 $gameSystem.isShowEventMiniLabel()
        const showLabels = $gameSystem.isShowEventMiniLabel
            ? $gameSystem.isShowEventMiniLabel()
            : true;

        // 視窗可視狀態
        this.visible = showLabels && this._isAlwaysShow;
        if (!this.visible) return;

        // 更新位置
        this.updatePosition();

        // 比對展開文字，若有變就 setText => refresh
        const rawText = this.defaultLabelText();
        const expanded = this.expandedText(rawText);
        if (expanded !== this._oldExpandedText) {
            this._oldExpandedText = expanded;
            this.setText(rawText);
        }

        // 淡入
        if (this.contentsOpacity < 255) {
            this.contentsOpacity += 32;
        }
    };

    /**
     * 決定標籤要顯示的位置。
     * 假設 x 在玩家中心，y 在頭上再往上 5px
     */
    Window_PlayerMiniLabel.prototype.updatePosition = function () {
        const px = $gamePlayer.screenX();
        const py = $gamePlayer.screenY();
        const offsetY = 3;
        this.x = px - Math.floor(this.width / 2);
        this.y = py - 48 - this.height - offsetY;
    };

    //==========================================================================
    // 2) 與 Scene_Map 整合（插在 WindowLayer 之下）
    //==========================================================================
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function () {
        _Scene_Map_createDisplayObjects.call(this);

        this._playerMiniLabel = new Window_PlayerMiniLabel();
        // 找到 windowLayer
        const windowLayerIndex = this.children.indexOf(this._windowLayer);
        // 在它之前插入 => windowLayer 會蓋在上面
        this.addChildAt(this._playerMiniLabel, windowLayerIndex);
    };

    //==========================================================================
    // 3) 外掛 PluginCommand：HideMiniLabel / ShowMiniLabel 同步控制
    //==========================================================================
    // 預設 YEP_EventMiniLabel 也用了 pluginCommand 來隱藏顯示標籤，
    // 這裡把它擴充，讓玩家頭上標籤也會一起執行 visible 切換。
    // 若沒裝 YEP，也能單獨運作。
    //==========================================================================
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === "ShowMiniLabel") {
            // 顯示玩家標籤
            if (SceneManager._scene instanceof Scene_Map && SceneManager._scene._playerMiniLabel) {
                SceneManager._scene._playerMiniLabel._isAlwaysShow = true;
                SceneManager._scene._playerMiniLabel.visible = true;
            }
        } else if (command === "HideMiniLabel") {
            // 隱藏玩家標籤
            if (SceneManager._scene instanceof Scene_Map && SceneManager._scene._playerMiniLabel) {
                SceneManager._scene._playerMiniLabel._isAlwaysShow = false;
                SceneManager._scene._playerMiniLabel.visible = false;
            }
        }
    };

})();
