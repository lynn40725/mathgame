//=============================================================================
// Z_IOS_FixAll.js
//=============================================================================
/*:
 * @target MV
 * @plugindesc [iOS] 修正Safari/Chrome鍵盤 + 全螢幕 + 音訊解鎖
 * @author 
 *
 * @help
 * ----------------------------------------------------------------------------
 * 【說明】
 * 1. 將 <input> 提升 z-index, pointer-events, append 到 body，讓它在 iOS Safari 也能點到。
 * 2. 監聽多種事件 (touchend, pointerup, click 等) 解鎖 AudioContext，避免部分 iOS 預設行為。
 * 3. TouchInput preventDefault 排除 <input>，避免阻擋鍵盤彈出。
 * 4. 盡量配合 index.html meta viewport: `viewport-fit=cover` 來消除黑邊。
 *
 * 【使用方法】
 * 1. 於 index.html 中添加:
 *    <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, viewport-fit=cover">
 * 2. 在 js/plugins 中，啟用本外掛，並確保放在 MULI_WindowTextField 後。
 * 3. iOS Safari: 初次點擊 (包含touchend/pointerup/click等) 才能成功 resume AudioContext，
 *    之後 BGM/SE 就能播放。
 * 4. 若在 Safari 仍見黑邊，嘗試 "Add to Home Screen" 方式或檢查是否還有其他 DOM/CSS 影響。
 * ----------------------------------------------------------------------------
 */

(function() {

    //--------------------------------------------------------------------------
    // [1] 同時監聽多種事件 → 解鎖 AudioContext
    //--------------------------------------------------------------------------
    const iOSAudioUnlock = function() {
        // 只在 iOS 顯示
        if (!/iPad|iPhone|iPod/.test(navigator.userAgent)) return;

        // 已解鎖就不需重複
        if (WebAudio._context && WebAudio._context.state !== 'suspended') {
            return;
        }

        const unlockHandler = () => {
            if (WebAudio._context && WebAudio._context.state === 'suspended') {
                WebAudio._context.resume().catch(()=>{});
            }
            // 解鎖完成後移除監聽器
            document.removeEventListener('touchend', unlockHandler);
            document.removeEventListener('pointerup', unlockHandler);
            document.removeEventListener('click', unlockHandler);
            document.removeEventListener('mousedown', unlockHandler);
        };

        document.addEventListener('touchend', unlockHandler);
        document.addEventListener('pointerup', unlockHandler);
        document.addEventListener('click', unlockHandler);
        document.addEventListener('mousedown', unlockHandler);
    };

    // 場景開始時掛上
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.apply(this, arguments);
        iOSAudioUnlock();
    };


    //--------------------------------------------------------------------------
    // [2] MULI_WindowTextField - 確保 <input> z-index, pointer-events, 加到 body
    //--------------------------------------------------------------------------
    if (typeof Window_TextField !== "undefined") {
        const _Window_TextField_createTextField = Window_TextField.prototype.createTextField;
        Window_TextField.prototype.createTextField = function() {
            _Window_TextField_createTextField.call(this);
            // style 調整
            this._textField.style.zIndex = '9999';
            this._textField.style.pointerEvents = 'auto';
            this._textField.style.opacity = '1';
            this._textField.autocomplete = 'off';
            this._textField.autocorrect = 'off';

            // 加到 document.body
            if (this._textField.parentNode !== document.body) {
                document.body.appendChild(this._textField);
            }
        };
    }

    //--------------------------------------------------------------------------
    // [3] TouchInput 排除 <input> preventDefault
    //--------------------------------------------------------------------------
    const _TouchInput_onTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function(event) {
        if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
            return; // 不做 preventDefault
        }
        _TouchInput_onTouchStart.call(this, event);
    };

    const _TouchInput_onTouchMove = TouchInput._onTouchMove;
    TouchInput._onTouchMove = function(event) {
        if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
            return;
        }
        _TouchInput_onTouchMove.call(this, event);
    };

    const _TouchInput_onTouchEnd = TouchInput._onTouchEnd;
    TouchInput._onTouchEnd = function(event) {
        if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
            return;
        }
        _TouchInput_onTouchEnd.call(this, event);
    };

})();
