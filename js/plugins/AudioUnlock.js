/*:
 * @plugindesc ✅ 強制解鎖 Edge / Safari / iOS 上的音訊播放，解決 BGM、SE 無聲問題（包含 iOS 特化修正）v3
 * @author ChatGPT
 *
 * @help
 * ✅ 功能：
 * - 在遊戲載入階段加入點擊、觸控事件偵測
 * - 確保 AudioContext 在 Chrome / Edge / Safari / iOS 上都能成功 resume()
 * - 解鎖成功後自動移除監聽器
 *
 * 無需參數設定，建議放在插件列表最上方。
 */

(() => {
    if (!Utils.isNwjs()) {
        let unlocked = false;

        const tryResumeAudio = () => {
            if (unlocked) return;
            const ctx = WebAudio._context;
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    unlocked = true;
                    console.log('🔊 AudioContext resume 成功（來自互動）');
                }).catch(err => {
                    console.warn('❌ AudioContext resume 錯誤:', err);
                });
            } else if (ctx && ctx.state === 'running') {
                unlocked = true;
                console.log('🔊 AudioContext 已經是 running 狀態');
            }

            if (unlocked) {
                document.removeEventListener('click', tryResumeAudio);
                document.removeEventListener('keydown', tryResumeAudio);
                document.removeEventListener('touchstart', tryResumeAudio);
                document.removeEventListener('touchend', tryResumeAudio);
                document.removeEventListener('mousedown', tryResumeAudio);
            }
        };

        window.addEventListener('DOMContentLoaded', () => {
            document.addEventListener('click', tryResumeAudio);
            document.addEventListener('keydown', tryResumeAudio);
            document.addEventListener('mousedown', tryResumeAudio);
            document.addEventListener('touchstart', tryResumeAudio); // ✅ iOS 觸控
            document.addEventListener('touchend', tryResumeAudio);   // ✅ iOS 確認互動結束也觸發
        });
    }
})();
(function () {

    //--------------------------------------------------------------------------
    // [A] WASD 行走
    //--------------------------------------------------------------------------
    // 覆蓋 default keyMapper
    Input.keyMapper[87] = 'up';    // W
    Input.keyMapper[65] = 'left';  // A
    Input.keyMapper[83] = 'down';  // S
    Input.keyMapper[68] = 'right'; // D
})();