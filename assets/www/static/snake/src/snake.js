define(function(require, exports, module) {
	var LAND_ROW = 20,
		LAND_COL = 15,
		CELL_WID = 40,
		CELL_HEI = 40;

	var $ = require('jquery');

	function Snake(container) {
		this.el = $(container);

		this.mapData = [];
		this.snakeData = [
			[2, 5],
			[2, 4],
			[2, 3]
		];
		this.direct = 2;
		this.foods = {};
	}

	Snake.cons = {
		FOOD_FOOD: 1, //食物
		FOOD_SPEED: 2, //速度
		FOOD_BRICK: 3, //障碍物

		FOOD_TY_FOOD: 1, //普通食物
		FOOD_TY_BIG: 2, //加量食物
		FOOD_TY_BIGER: 3, //大量食物
		FOOD_TY_SPEED: 11, //加速
		FOOD_TY_SLOW: 12, //减速
		FOOD_TY_BRICK: 21, //砖
		FOOD_TY_BOMB: 22 //炸弹
	};

	Snake.prototype.render = function() {
		var self = this;

		self._initLandSize();
		self._initLand();
		self._rendSnake();
		self._addEventListener();
		self._startMove();
		self._produceFood();
	};

	Snake.prototype._initLandSize = function() {
		var doc = $(document),
			docWid = doc.width(),
			docHei = doc.height(),
			mainHei, mainWid;

		LAND_ROW = Math.floor((docHei - 1) / (CELL_HEI + 1));
		LAND_COL = Math.floor((docWid - 1) / (CELL_WID + 1));

		mainHei = LAND_ROW * (CELL_HEI + 1) + 1;
		mainWid = LAND_COL * (CELL_WID + 1) + 1;
		$('#J_main_body').css({
			'width': mainWid,
			'height': mainHei,
			'top': (docHei - mainHei) / 2,
			'left': (docWid - mainWid) / 2
		});
	}


	/**
	 * 初始化地图
	 * @return {[type]} [description]
	 */
	Snake.prototype._initLand = function() {
		var col = 0,
			row = 0,
			tab = $('<table></table>'),
			tr, td,
			trArr;

		for (; row < LAND_ROW; row++) {
			col = 0;
			tr = createEle('tr');
			trArr = [];
			for (; col < LAND_COL; col++) {
				td = createEle('td');
				$(tr).append(td);
				trArr.push(td);
			}
			tab.append(tr);
			this.mapData.push(trArr);
		}
		this.el.html(tab);
	};

	/**
	 * 渲染蛇身
	 * @return {[type]} [description]
	 */
	Snake.prototype._rendSnake = function() {
		var snakeData = this.snakeData,
			mapData = this.mapData,
			i = 0,
			len = snakeData.length,
			pos, ele;


		for (; i < len; i++) {
			pos = snakeData[i];
			ele = $(mapData[pos[0]][pos[1]]);
			ele.css('background', 'red').attr('ty', '-1');
		}

	}

	/**
	 * 添加侦听事件
	 */
	Snake.prototype._addEventListener = function() {
		var self = this,
			el = this.el,
			startX = 0,
			startY = 0;

		el.on('touchstart', function(e) {
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];

			startX = touch.pageX;
			startY = touch.pageY;
		});
		el.on('touchend', function(e) {
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
				endX = touch.pageX,
				endY = touch.pageY,
				diffX = endX - startX,
				diffY = endY - startY,
				direct = 'right';

			if (Math.abs(diffX) + Math.abs(diffY) < 30) { //距离太小，不算划屏
				return;
			}
			if (Math.abs(diffY) > Math.abs(diffX)) { //上下
				direct = diffY > 0 ? 'down' : 'up';
			} else { //左右
				direct = diffX > 0 ? 'right' : 'left';
			}
			console.log('direct:' + direct);
			$(this).trigger('slide', {
				direct: direct
			});
		});

		el.on('slide', {
			context: this
		}, this._slideHandle);
	}

	Snake.prototype._slideHandle = function(e, params) {
		var self = e.data.context,
			direct = params.direct,
			directNum;

		switch (direct) {
			case 'up':
				directNum = 1;
				break;
			case 'left':
				directNum = -2;
				break;
			case 'right':
				directNum = 2;
				break;
			case 'down':
				directNum = -1;
				break;
			default:
				directNum = 2;
				break;
		}
		if (Math.abs(self.direct) == Math.abs(directNum)) {
			return false;
		}
		self.direct = directNum;
	}

	Snake.prototype._startMove = function() {
		this._moveStep();
	}

	/**
	 * 走一步
	 * @return {[type]} [description]
	 */
	Snake.prototype._moveStep = function() {
		var self = this,
			snakeData = self.snakeData,
			mapData = self.mapData,
			head = snakeData[0],
			tail = snakeData[snakeData.length - 1],
			newHead = [].concat(head),
			foodTy,
			direct = self.direct;

		switch (direct) {
			case 1: //向上
				newHead[0] = newHead[0] - 1;
				break;
			case -2: //向左
				newHead[1] = newHead[1] - 1;
				break;
			case 2: //向右
				newHead[1] = newHead[1] + 1;
				break;
			case -1: //向下
				newHead[0] = newHead[0] + 1;
				break;
		}
		if (newHead[0] < 0) {
			newHead[0] = LAND_ROW - 1;
		} else if (newHead[0] > LAND_ROW - 1) {
			newHead[0] = 0;
		}
		if (newHead[1] < 0) {
			newHead[1] = LAND_COL - 1;
		} else if (newHead[1] > LAND_COL - 1) {
			newHead[1] = 0;
		}

		foodTy = self._toColor(newHead);
		snakeData.unshift(newHead);

		if (foodTy == 0) { //正常行走
			self._toColor(tail, true);
			snakeData.pop();
		} else if (foodTy > 0) { //吃到食物
			self.foods = {};
		} else { //吃到自身
			$('#J_death_bt').trigger('click');
			return false;
		}
		setTimeout(function() {
			self._moveStep();
		}, 500);
	}

	/**
	 * 添加或去掉蛇身某一段
	 * @param  {[type]}  pos    [description]
	 * @param  {Boolean} isNone [是否none]
	 * @return {[type]}         [description]
	 */
	Snake.prototype._toColor = function(pos, isNone) {
		var ele = $(this.mapData[pos[0]][pos[1]]),
			ty = 0;

		if (isNone) {
			ele.css('background', 'none').attr('ty', '0');
			return ty;
		}
		ty = ele.attr('ty') || 0;
		ele.css('background', 'red').attr('ty', '-1');

		return ty;
	}

	/**
	 * 生产食物
	 * @return {[type]} [description]
	 */
	Snake.prototype._produceFood = function() {
		this._foodStart();
	}

	/**
	 * 生产食物
	 * @return {[type]} [description]
	 */
	Snake.prototype._foodStart = function() {
		var self = this,
			mapData = self.mapData,
			cons = Snake.cons,
			foods = self.foods[cons.FOOD_FOOD],
			foodTy = cons.FOOD_TY_FOOD,
			ranNum = Math.floor(Math.random() * 100), //随机生成一个100以内的数
			x, y, ele;

		if (!foods) {
			foods = self.foods[cons.FOOD_FOOD] = [];
		}
		if (foods.length > 0) { //食物还没吃
			setTimeout(function() {
				self._foodStart();
			}, 3000);
			return;
		}

		//随机出食物位置
		x = Math.floor(Math.random() * LAND_ROW),
		y = Math.floor(Math.random() * LAND_COL),
		ele = $(mapData[x][y]);

		if (ele.attr('ty') == -1) { //生产出来的食物不能在蛇身上
			setTimeout(function() {
				self._foodStart();
			}, 3000);
			return;
		}

		//随机食物剂量
		if (ranNum < 60) { //普通食物，60%机率
		} else if (ranNum >= 60 && ranNum < 90) { //加量食物，60%机率
			foodTy = cons.FOOD_TY_BIG;
		} else { //大量食物，10%机率
			foodTy = cons.FOOD_TY_BIGER;
		}

		ele.attr('ty', foodTy).addClass('food_' + foodTy);
		foods.push([x, y]);

		setTimeout(function() {
			self._foodStart();
		}, 3000);
	};


	function createEle(tag) {
		return document.createElement(tag);
	}

	module.exports = Snake;
});