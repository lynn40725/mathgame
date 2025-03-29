//=============================================================================
// Chimaki_EventPlus.js
// Version: 2.0
//=============================================================================
/*:
* @plugindesc 影子事件設定
* @author Chimaki 
* 
* ============================================================================
* @help
* 此插件由 Maker 製造機粽子 撰寫，禁止二次發佈
* 使用此插件在遊戲中時，希望可以附上來源網址
* 來源網址 : http://www.chimakier.com
* 
* 說明 : 依照以下方法在事件追加註解後，可以擴增事件的觸發範圍，滑鼠點擊到範圍內也將直接觸發事件
* 
* 在事件中註解欄位加上以下內容
* 
* 事件上方追加1格判定範圍:
* <EPUp:1>   
* 事件下方追加1格判定範圍:
* <EPDown:1>
* 事件左方追加1格判定範圍 
* <EPLeft:1> 
* 事件右追加1格判定範圍:
* <EPRight:1>   
* 事件重疊時，判定優先度為 2 (數字越大越優先) :
* <EPriority:2>    
* 影子事件一定要設定這個參數, 不管是0 或是 1  ;是否可以不移動直接觸發 : 1 => 可以不移動觸發
* <EPpattern:1>    
* 
* 如果不需要追加判定範圍，可以不用設置
*/
//=============================================================================
'use strict'; // es mode

var Imported = Imported || {};
var chimaki_plugin = chimaki_plugin || {};
// menu相關
chimaki_plugin.event = {}; 
chimaki_plugin.event.alias = chimaki_plugin.event.alias || {};


chimaki_plugin.event._lastIndexOf = document.currentScript.src.lastIndexOf( '/' );
chimaki_plugin.event._indexOf            = document.currentScript.src.indexOf( '.js' );
chimaki_plugin.event._getJSName          = document.currentScript.src.substring( chimaki_plugin.event._lastIndexOf + 1, chimaki_plugin.event._indexOf );


(function(){
	chimaki_plugin.event._arsg = PluginManager.parameters( chimaki_plugin.event._getJSName);
//=============================================================================
// 事件判斷
//=============================================================================	    

	let regexEventPluseUp = /<EPUp:[ ]*(.*)>/i;
	let regexEventPluseDown = /<EPDown:[ ]*(.*)>/i;
	let regexEventPluseRight = /<EPRight:[ ]*(.*)>/i; 
	let regexEventPluseLeft = /<EPLeft:[ ]*(.*)>/i
	let regexEventPriority = /<EPriority:[ ]*(.*)>/i;
	let regexEventTouch = /<EPpattern:[ ]*(.*)>/i;

	chimaki_plugin.event.alias.evet_init  = Game_Event.prototype.initialize;
	Game_Event.prototype.initialize = function (mapId, eventId){
		chimaki_plugin.event.alias.evet_init.call(this, mapId, eventId);
		this.setEventPlus();
	}
	Game_Event.prototype.resetEventPlus = function (){
		this._eventPlusUp = 0;
		this._eventPlusDown = 0;
		this._eventPlusRight = 0;
		this._eventPlusLeft = 0;
		this._eventPriority = 0;
		this._eventOverTouch = 0;
		this._isShowDoEvent = 0;
	}
	chimaki_plugin.event.alias.game_event_update = Game_Event.prototype.update;
	Game_Event.prototype.update = function (){
		chimaki_plugin.event.alias.game_event_update.call(this);
		if (this._overheadPageIndex != this._pageIndex){
			this._overheadPageIndex = this._pageIndex;
			this.setEventPlus();
		}
	}
	Game_Event.prototype.setEventPlus = function (){
		this._overheadPageIndex = this._pageIndex;
		if (!this.page()) return;
		this.resetEventPlus()

		if (this.list()){
			for (let action of this.list()){
				if (action.code == "108" || action.code == "408"){
					let a = action.parameters[0];
					let matchUp = regexEventPluseUp.exec(a);
					if (matchUp) {
						this._eventPlusUp = matchUp[1];
						continue;
					}
					let matchDown = regexEventPluseDown.exec(a);
					if (matchDown) {
						this._eventPlusDown = matchDown[1];
						continue;
					}
					let matchRight = regexEventPluseRight.exec(a);
					if (matchRight) {
						this._eventPlusRight = matchRight[1];
						continue;
					}
					let matchLeft = regexEventPluseLeft.exec(a);
					if (matchLeft) {
						this._eventPlusLeft = matchLeft[1];
						continue;
					}
					let matchPriority = regexEventPriority.exec(a);
					if (matchPriority){
						this._eventPriority = matchPriority[1];
						continue;
					}
					let overTouch = regexEventTouch.exec(a); // 一定要設置這個才會成為影子事件
					if (overTouch){
						this._eventOverTouch = Number( overTouch[1] );
						this._isShowDoEvent = 1;
						continue;						
					}
				}
			}
		}
		
	}
	Game_Event.prototype.neddShowEvent = function (){
		return this._isShowDoEvent	;
	}
	Game_Event.prototype.canOverTouch = function (){
		return this._eventOverTouch == 1;
	}
	Game_Event.prototype.getPlusUp = function() {
		return Number(this._eventPlusUp) || 0;
	};	
	Game_Event.prototype.getPlusDown = function() {
		return Number(this._eventPlusDown) || 0;
	};	
	Game_Event.prototype.getPlusRight = function() {
		return Number(this._eventPlusRight) || 0;
	};	
	Game_Event.prototype.getPlusLeft = function() {
		return Number(this._eventPlusLeft) || 0;
	};				
	Game_Event.prototype.getPriority = function() {
		return Number(this._eventPriority) || 0;
	};	
	Game_Event.prototype.posInRang = function (x, y){ // player 座標

		let x1 = this.x - this.getPlusLeft() ;
		let x2 = this.x + this.getPlusRight();
		let y1 = this.y - this.getPlusUp();
		let y2 = this.y + this.getPlusDown();
		return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
	}
	Game_Event.prototype.posInTouchRang = function (x , y){

		let x1 = this.x - this.getPlusLeft();
		let x2 = this.x + this.getPlusRight();
		let y1 = this.y - this.getPlusUp();
		let y2 = this.y + this.getPlusDown();
		return (x >= x1 && x <= x2 && y >= y1 && y <= y2);

	}
	Game_Player.prototype.checktToucgTriggerHere = function(x, y , triggers) {
	    if (this.canStartLocalEvents()) {
	        this.startMapEvent(x, y, triggers, false);
	    }
	};
	Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
	    if (!$gameMap.isEventRunning()) {
	        var es = $gameMap.eventsXy(x, y).filter(function (event ){
	        	var flag = event.neddShowEvent();
	        	if (flag){
	        		return (event.isTriggerIn(triggers));
	        	}
	        	else {
	        		return (event.isTriggerIn(triggers) && event.isNormalPriority() === normal);	
	        	}
	        });
	        es.sort(function (a, b ){
	        	if (a.getPriority() > b.getPriority()) return 1;
	        	if (a.getPriority() < b.getPriority()) return -1;
	        	return 0;

	        });
	        es.forEach(function (e){
	        	e.start();
	        })
	    }
	};



	Game_Map.prototype.eventsXy = function(x, y) { // player 觸發事件 座標
	    return this.events().filter(function(event) {
	    	if (event.neddShowEvent()){
	    		return event.posInRang(x, y);
	    	}
	    	else {
	    		return event.pos(x, y);	
	    	}
	    });
	};
	Game_Map.prototype.checkOverTouchEvent = function (x, y){		
		let over_event = [];
		over_event = this.eventsXy(x, y).filter(function (event){
			if (event.neddShowEvent() && event.canOverTouch() ){
				return event.posInTouchRang(x, y);		
			}
			return false;
		});
		over_event.sort(function (a, b ){
        	if (a.getPriority() > b.getPriority()) return 1;
        	if (a.getPriority() < b.getPriority()) return -1;
        	return 0;			
		})
		return over_event;
	}

	Game_Map.prototype.checkNomalEvent = function (x, y){
		let over_event = [];
		over_event = $gameMap.events().filter( function (e){
			if (!e.neddShowEvent()) return false;
			
			let ex = e.x;
			let ey = e.y;
			let px = $gamePlayer.x;
			let py = $gamePlayer.y;

			let upy = ey - e.getPlusUp();
			let downy = ey + e.getPlusDown();
			let lx = ex - e.getPlusLeft();
			let rx = ex + e.getPlusRight();

			let celllist = [];
			for (let i = lx ; i < rx + 1 ; i++){
				for (let j = upy ; j < downy + 1 ; j++){
					celllist.push({x : i, y :j })
				}
			}

			let d = $gamePlayer.direction();		
			let flag =  celllist.some(function (c){
				return (Math.abs(c.x -$gamePlayer.x) + Math.abs( c.y - $gamePlayer.y ) <= 1) 
			});
			let direction_flag = 0;
			if (x > px && d == 6){
				direction_flag = true;
			}
			if (x < px && d == 4){
				direction_flag = true;
			}				
			if (y < py && d == 8){
				direction_flag = true;
			}								
			if (y > py && d == 2){
				direction_flag = true;
			}			
			return direction_flag && flag && e.posInRang(x, y);
		});
		return over_event;
	}
	Scene_Map.prototype.processMapTouch = function() {

	    if (TouchInput.isTriggered() || this._touchCount > 0) {
	        if (TouchInput.isPressed()) {
	            if (this._touchCount === 0 || this._touchCount >= 15) {
	                var x = $gameMap.canvasToMapX(TouchInput.x);
	                var y = $gameMap.canvasToMapY(TouchInput.y);
	                $gameTemp.setDestination(x, y);	             
	            }
	            this._touchCount++;
	        } else {
	            this._touchCount = 0;
	        }
	    }
		if (TouchInput.isTriggered() || this._touchCount > 0 ) {
            var x = $gameMap.canvasToMapX(TouchInput.x);
            var y = $gameMap.canvasToMapY(TouchInput.y);			
            var overEvent = $gameMap.checkOverTouchEvent(x, y); // 全部的影子事件
            var nomalEvent = $gameMap.checkNomalEvent(x, y); // 全部的影子事件

            if (overEvent.length > 0 || nomalEvent.length > 0){
            	overEvent.forEach(function (e){ e.start() }); // 遠端觸發事件
            	nomalEvent.forEach(function (e) { e.start()});
            }			
		}
	    
	};

	
}());
