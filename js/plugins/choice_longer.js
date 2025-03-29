/*:
 * @plugindesc 動態調整選項視窗顯示行數 (最多6行)，並維持預設上下擺放邏輯
 * @author 
 *
 * @help
 * ============================================================================
 * 功能說明：
 * 1. RMMV 原本只顯示固定 4 行選項，本插件改成：
 *    - 若選項數( this.maxItems() ) <= 6，顯示相同行數
 *    - 超過 6 的話，自動出現上下箭頭翻頁
 * 2. 預設的 Window_ChoiceList 會根據「訊息視窗位置」來決定把選單視窗放在哪裡：
 *    - 若訊息窗在畫面下半部，就把選單放上方
 *    - 若訊息窗在上半部，就把選單放下方
 * 3. 當行數大時，選單也會自動計算高度，並嘗試不超出畫面。
 * ============================================================================
 * 使用方式：
 * 1. 放入 js/plugins 。
 * 2. 在插件管理啟用。
 * 3. 不需要任何額外設定，遊戲裡每次對話「選項」自動依據數量顯示行數。
 * ============================================================================
 */

(function () {

    /**
     * 覆蓋 numVisibleRows()，返回「最小為選項總數，最大不超過6」。
     */
    Window_ChoiceList.prototype.numVisibleRows = function () {
        const total = this.maxItems();
        // 你可自行調整 6 -> 8 或其他上限
        return Math.min(total, 6);
    };

    /**
     * 覆蓋 updatePlacement()：先用 RMMV 內建邏輯來決定位置，
     * 然後再重新計算 this.height，以符合新的行數。
     */
    const _Window_ChoiceList_updatePlacement = Window_ChoiceList.prototype.updatePlacement;
    Window_ChoiceList.prototype.updatePlacement = function () {
        // 執行原本的定位邏輯
        _Window_ChoiceList_updatePlacement.call(this);

        // 重新計算 numVisibleRows() 導致的高度變化
        this.height = this.windowHeight();

        // 若行數大到可能超出螢幕，RMMV 內部也會自動出現上下箭頭，可翻頁
        // 預設會將視窗頂/底對齊螢幕邊緣，避免超出可視範圍
        // (內建 'this.updatePlacement' 就做了 clampX, clampY 等處理)
    };

})();
