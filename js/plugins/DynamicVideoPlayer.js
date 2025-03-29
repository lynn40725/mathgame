/*:
 * @plugindesc 在地圖上播放影片，不影響 UI 和對話框，並確保無縫循環
 * @author 你的名字
 *
 * @help
 * ============================================================================
 * 插件指令：
 * VideoBackground play <影片名稱>  # 在地圖上播放影片
 * VideoBackground stop              # 停止播放影片
 * VideoBackground opacity <數值>     # 設定影片透明度 (0.0 - 1.0)
 *
 * 影片應放置於 /movies/ 資料夾，且必須為 webm 格式。
 * ============================================================================
 */

(function () {
    var videoSprite = null;
    var videoTexture = null;
    var videoElement = null;
    var defaultOpacity = 0.5; // **記錄透明度，避免影片循環時累積增加**

    function createVideoSprite(filename) {
        stopVideoSprite(); // 確保不會有殘留影片

        videoElement = document.createElement('video');
        videoElement.src = 'movies/' + filename + '.webm';
        videoElement.muted = true; // 避免影響遊戲音效
        videoElement.style.display = "none";
        document.body.appendChild(videoElement);

        videoElement.loop = false;
        videoElement.addEventListener("timeupdate", handleVideoLoop);
        videoElement.addEventListener("canplaythrough", handleVideoPlay);
    }

    function stopVideoSprite() {
        if (videoElement) {
            videoElement.removeEventListener("timeupdate", handleVideoLoop);
            videoElement.removeEventListener("canplaythrough", handleVideoPlay);

            videoElement.pause();
            videoElement.src = "";
            document.body.removeChild(videoElement);
            videoElement = null;
        }

        if (videoSprite && SceneManager._scene && SceneManager._scene._spriteset) {
            SceneManager._scene._spriteset.removeChild(videoSprite);
        }
        videoSprite = null;
        videoTexture = null;
    }

    function handleVideoLoop() {
        if (videoElement && videoElement.duration - videoElement.currentTime < 0.1) {
            videoElement.currentTime = 0;
            videoElement.play();
        }
    }

    function handleVideoPlay() {
        if (!videoTexture) {
            videoTexture = PIXI.Texture.from(videoElement);
        }

        if (videoTexture.baseTexture && videoTexture.baseTexture.resource) {
            videoTexture.baseTexture.resource.autoUpdate = true;
        }

        videoSprite = new PIXI.Sprite(videoTexture);
        videoSprite.width = Graphics.width;
        videoSprite.height = Graphics.height;
        videoSprite.zIndex = 1;
        videoSprite.alpha = defaultOpacity;

        if (SceneManager._scene && SceneManager._scene._spriteset) {
            SceneManager._scene._spriteset.addChild(videoSprite);
        }

        videoElement.play();
    }

    var _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function () {
        _Spriteset_Map_update.call(this);
        if (videoTexture && videoTexture.baseTexture) {
            videoTexture.update();
        }
    };

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'VideoBackground') {
            switch (args[0]) {
                case 'play':
                    if (args[1]) createVideoSprite(args[1]);
                    break;
                case 'stop':
                    stopVideoSprite();
                    break;
                case 'opacity':
                    if (args[1]) {
                        var opacityValue = Math.max(0, Math.min(1, Number(args[1])));
                        defaultOpacity = opacityValue;
                        if (videoSprite) {
                            videoSprite.alpha = defaultOpacity;
                        }
                    }
                    break;
            }
        }
    };

})();
