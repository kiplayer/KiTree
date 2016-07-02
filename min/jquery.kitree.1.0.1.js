/*
 ### Ki Tree Plugin v1.0.1 - 2016-06-11 ###
 * Home: http://kiplayer.vps.phps.kr/kitree/
 * Licensed under http://en.wikipedia.org/wiki/MIT_License
 ###
*/
if(window.jQuery)(function ($){

	var kiTree_dragSuccess;
	var kiTree_kiplayer;

	// plugin initialization
	$.fn.kiTree = function (options){
		if(this.length == 0) return this; // quick fail

		//
		function jsonUlAdd(data){
			if(data.length > 0){
				var ulHtml = $('<ul></ul>');
				for(var i=0; i<data.length; i++){
					var liHtml = $('<li></li>');
					var aHtml = $('<a href="'+data[i].url+'">'+data[i].name+'</a>');
					liHtml.append(aHtml);
					if(data[i].list && data[i].list.length > 0){
						var childHtml = jsonUlAdd(data[i].list);
						liHtml.append(childHtml);
					}
					ulHtml.append(liHtml);
				}
			}
			return ulHtml;
		}

		// Handle API methods
		if(typeof arguments[0] == 'string'){
			// Perform API methods on individual elements
			if(this.length > 1){
				var args = arguments;
				return this.each(function (){
					$.fn.kiTree.apply($(this), args);
				});
			};
			// Invoke API method handler (and return whatever it wants to return)
			return $.fn.kiTree[arguments[0]].apply(this, $.makeArray(arguments).slice(1) || []);
		};

		// Initialize options for this call
		var options = $.extend({} /* new object */ ,
			$.fn.kiTree.options /* default options */ ,
			options || {} /* just-in-time options */
		);

		// loop through each matched element
		this.not('.kiTree').addClass('kiTree').each(function (){
			window.kiTree = (window.kiTree || 0) + 1;
			var group_count = window.kiTree;
			var kiTree = {
				e: this,
				E: $(this),
				clone: $(this).clone()
			};

			//# USE CONFIGURATION
			var o = $.extend({},
				$.fn.kiTree.options,
				options || {}, ($.metadata ? kiTree.E.metadata() : ($.meta ? kiTree.E.data() : null)) || {}, /* metadata options */ {} /* internals */
			);
			
			//
			$.extend(kiTree, o || {});
			kiTree.STRING = $.extend({}, $.fn.kiTree.options.STRING, kiTree.STRING);

			//
			if(parseInt(o.width) > 0){
				$(this).width(o.width);
			};

			//
			if(parseInt(o.height) > 0){
				$(this).height(o.height);
			};

			//
			if(o.bordered){
				$(this).not('.bordered').addClass('bordered');
			};

			//
			if(o.useCheckbox){
				$(this).not('.useCheckbox').addClass('useCheckbox');
			};

			//
			$(this).attr('data-maxDepth',o.maxDepth);

			//
			if(o.rootDenied){
				$(this).attr('data-rootDenied',o.rootDenied);
			};

			//
			if(o.dragSuccess){
				kiTree_dragSuccess = o.dragSuccess;
			};

			//
			if(typeof o.data == "object"){
				var treeWrap = $(this);
				var treeHtml = jsonUlAdd(o.data);
				treeWrap.append(treeHtml);
			};

			// PRIVATE PROPERTIES/METHODS
			$.extend(kiTree, {
				n: 0, // How many elements are currently selected?
				trees: [],
				trigger: function (event, element, kiTree, files){
					var rv, handler = kiTree[event] || kiTree['on'+event] ;
					if(handler){
						files = files || kiTree.files || FILE_LIST(this);
						$.each(files,function(i, file){
							// execute function in element's context, so 'this' variable is current element
							rv = handler.apply(kiTree.wrapper, [element, file.name, kiTree, file]);
						});
						return rv;
					};
				}
			});

			//
			kiTree.init = function (tree){
				//if(window.console) console.log('kiTree.addTree',tree_count);
				tree.kiTree = kiTree;
				var tree = $(tree);
				var treeLiList = tree.find("li");
				for(var i=0; i<treeLiList.length; i++){
					var treeLi = treeLiList.eq(i);
					var em = $('<em></em>')
						.click(function (){
							if($(this).hasClass("on") || $(this).hasClass("off")){
								var treeUl = $(this).parent().children("ul");
								if(treeUl.css("display") == "none"){
									$(this).attr("class","on");
									treeUl.removeClass("hidden");
								}else{
									$(this).attr("class","off");
									treeUl.addClass("hidden");
								}
							}
							$(kiTree.e).reset();
						});
					var sup = "";
					if(o.useCount){
						sup = $("<sup></sup>");
					}
					treeLi.prepend(
						em.append(sup)
					);

					if(o.useCheckbox){
						var span = $('<span class="checkBox"></span>');
						var checkbox = $('<input type="checkbox" name="" value="">').click(function (){
							var treeLi = $(this).parent().parent();
							var treeUl = $(this).parent().parent().parent();
							if($(this).prop("checked") == true){
								treeLi.find("input[type='checkbox']").prop("checked",true);
								for(var i=0; i<treeLi.find("em.off").length; i++){
									var emOff = treeLi.find("em.off").eq(i);
									emOff.attr("class","on");
									emOff.parent().children("ul").removeClass("hidden");
								}
								var allCheck = true;
								for(var i=0; i<treeUl.find("input[type='checkbox']").length; i++){
									var treeUlInput = treeUl.find("input[type='checkbox']").eq(i);
									if(treeUlInput.prop("checked") == false){
										allCheck = false;
										break;
									}
								}
								if(allCheck == true){
									treeUl.parent().children("span.checkBox").children("input").prop("checked",true);
								}
							}else{
								treeLi.find("input[type='checkbox']").prop("checked",false);
								var allCheck = true;
								treeUl.parent().children("span.checkBox").children("input").prop("checked",false);
							}
						});
						treeLi.prepend(
							span.append(checkbox)
						);
					};
				}

				//
				if(o.useDrag){
					var treeNo = kiTree.n;
					var treeLiList = tree.find("li");
					for(var i=0; i<treeLiList.length; i++){
						treeLiList.eq(i).children("a").append('<div id="dragItem_'+treeNo+'_'+i+'" class="dragTreeItem"></div>');
						eval("var dragItem_"+treeNo+"_"+i+" = treeDragHandler.attach(document.getElementById('dragItem_"+treeNo+"_"+i+"'));dragItem_"+treeNo+"_"+i+".dragBegin = treeBegin;dragItem_"+treeNo+"_"+i+".drag = treeDrag;dragItem_"+treeNo+"_"+i+".dragEnd = treeEnd;");
						treeLiList.eq(i).children("em").click(function(){
							$(kiTree.e).kiTree("lineup");
						});
					}
					$(kiTree.e).kiTree("lineup");
				};
				$(kiTree.e).kiTree("reset");
			};

			// Bind functionality to the first element
			if(!kiTree.kiTree) kiTree.init(kiTree.e);
		});
	}

/*--------------------------------------------------------*/

	/*
	 * ### Core functionality and API ###
	 */
	$.extend($.fn.kiTree, {

		/*Reset*/
		reset: function (){
			var tree = $(this);
			var treeLiList = tree.find("li");
			for(var i=0; i<treeLiList.length; i++){
				var treeLi = treeLiList.eq(i);
				var treeLiUl = treeLi.children("ul");
				var treeLiEm = treeLi.children("em");
				treeLiEm.removeAttr("class");
				if(treeLiUl.length == 0){
					treeLiEm.addClass("none");
				}else{
					if(treeLiEm.children("sup").length > 0){
						var treeLiSup = treeLiEm.children("sup");
						treeLiSup.show().text(treeLiUl.find("li").length);
					}
					if(treeLiUl.css("display") == "none"){
						treeLiEm.addClass("off");
					}else{
						treeLiEm.addClass("on");
					} 
				}
			}
			return;
		},

		/*Position Reset*/
		lineup: function (){
			var tree = $(this);
			_scrollTop = tree.scrollTop();
			dragItem = tree.find(".dragTreeItem");
			for(var i=0; i<dragItem.length; i++){
				dragItem.eq(i).css("top",(dragItem.eq(i).parent("a").offset().top-tree.offset().top+_scrollTop)+"px");
			}
			treeLiItem = tree.find("li");
			for(var i=0; i<treeLiItem.length; i++){
				if(treeLiItem.eq(i).find("li").length==0){
					treeLiItem.eq(i).children("em").removeClass().addClass("none");
					treeLiItem.eq(i).children("ul").remove();
				}
			}
			$(tree).kiTree("reset");
			return;
		},

		/*Drag Move*/
		dragMove: function (data){
			var tree = $(this);
			if(kiTree_dragSuccess(data)){
				var element = data['element'];
				var dragId = data['dragId'];
				var targetId = data['targetId'];
				var move = data['move'];
				var targetLi = $("#dragItem_"+targetId).parent("a").parent("li");
				var dragLi = $(element).parent("a").parent("li");
				if(move == "in"){
					if(targetLi.children("ul").length == 0){
						targetLi.children("em").removeAttr("class").addClass("on");
						targetLi.append("<ul></ul>");
					}else{
						targetLi.children("em").removeAttr("class").addClass("on");
						targetLi.children("ul").show();
					}
					targetLi.children("ul").append(dragLi);
				}else if(move == "firstin"){
					targetLi.find("li").eq(0).before(dragLi);
				}else if(move == "move"){
					targetLi.after(dragLi);
				}
			}
			$(tree).kiTree("lineup");
			return;
		},

		/*Search*/
		search: function (keyword){
			var tree = $(this);
			var treeAList = tree.find("a");
			if(tree.attr("data-keyword") != keyword){
				tree.attr("data-keyword",keyword);
				tree.attr("data-keyword-count",0);
				var currCount = 0;
				for(var i=0; i<treeAList.length; i++){
					var treeA = treeAList.eq(i);
					treeA.html(treeA.html().replace('<b class="keyword">','').replace('</b>',''));
					if(treeA.text().indexOf(keyword) != -1){
						currCount++;
						if(currCount == 1){
							var targetScrollTop = tree.scrollTop() + treeA.offset().top - tree.offset().top;
							tree.scrollTop(targetScrollTop);
						}
						treeA.html(treeA.html().replace(keyword,'<b class="keyword">'+keyword+'</b>'));
					}
				}
				tree.attr("data-keyword-length",currCount);
			}else{
				var keywordCount = tree.attr("data-keyword-count");
				var keywordLength = tree.attr("data-keyword-length");
				keywordCount++;
				if(keywordCount == keywordLength){
					keywordCount = 0;
				}
				if(keywordCount < keywordLength){
					tree.attr("data-keyword-count",keywordCount);
					var currCount = 0;
					for(var i=0; i<treeAList.length; i++){
						var treeA = treeAList.eq(i);
						if(treeA.text().indexOf(keyword) != -1){
							if(keywordCount == currCount){
								var targetScrollTop = tree.scrollTop() + treeA.offset().top - tree.offset().top;
								tree.scrollTop(targetScrollTop);
								break;
							}
							currCount++;
						}
					}
				}
			}
			return;
		}
	});

	/*--------------------------------------------------------*/

	/*
	 * ### Default Settings ###
	 */
	$.fn.kiTree.options = { //$.extend($.fn.kiTree, { options: {
		width: 0, //
		height: 0, //
		bordered: false, //
		useCount: false, //
		useCheckbox: false, //
		useDrag: false, //
		maxDepth: 10, //
		errorMsg: {
			max: 'error max',
			denied: 'error denied'
		},
		error: function (s){
			if(typeof console != 'undefined') console.log(s);
			alert(s);
		},
		dragSuccess: function (tree,element,dragId,targetId,move){
		}
	}; //} });

	/*--------------------------------------------------------*/

	/*
	 * ### Additional Methods ###
	 */
	//
	$.fn.reset = $.fn.reset || function (){
		return this.each(function (){
			try {
				this.reset();
			} catch (e){}
		});
	};

	//
	$.fn.lineup = $.fn.lineup || function (){
		return this.each(function (){
			try {
				this.lineup();
			} catch (e){}
		});
	};

	/*# AVOID COLLISIONS #*/
})(jQuery);
/*# AVOID COLLISIONS #*/


/*Tree Drag*/
var or_y;
var or_el_move;
function treeBegin(element, x, y){
	or_y = y;
}
function treeDrag(element, x, y){
    or_el_move = element;
	$(element).addClass("move");
	var treeWrap = $(element).parents(".kiTree");
	var dragItem = treeWrap.find(".dragTreeItem");
	var dragItemA = treeWrap.find("a");
	var _scrollTop = treeWrap.scrollTop();
	var _treeHeight = treeWrap.height();
	if(y < (_scrollTop)){
		treeWrap.scrollTop(_scrollTop - 50);
	}else if(y > (_scrollTop+_treeHeight-24)){
		treeWrap.scrollTop(_scrollTop + 50);
	}
	movePx = or_y - y;
	if(movePx > -18 && movePx <= 18){ //현재 위치 유지
		$(element).empty();
		dragItemA.css("border-color","#fff");
	}else if(movePx > 18 && movePx < 30){ //바로 위에 넣기
		dragItemA.css("border-color","#fff");
		$(element).html("+&nbsp;&nbsp;&nbsp;");
	}else{
		$(element).empty();
		for(var i=0; i<dragItem.length; i++){ //이동 지점 검색
			if($(element).offset().top < dragItem.eq(i).offset().top){
				gap = Math.abs($(element).offset().top - dragItem.eq(curr_no).offset().top);
				if(dragItem.eq(curr_no).attr("id") != $(element).attr("id")){ //드레그 원위치
					if($(element).parent("a").parent("li").find("#"+dragItem.eq(curr_no).attr("id")).length!=0){ //내부이동
					}else{
						if(gap < 6){ //넣기
							$(element).empty();
							dragItemA.css("border-color","#fff");
							$(element).html("+&nbsp;&nbsp;&nbsp;");
						}else{ //이동
							$(element).empty();
							dragItemA.css("border-color","#fff");
							dragItem.eq(curr_no).parent("a").css("border-color","#bbb");
						}
					}
				}
				break;
			}
			if(dragItem.eq(i).offset().top > 0) curr_no = i; //이동이 유효한 지점
		}
		if($(element).offset().top < (dragItem.eq(curr_no).offset().top+6)){ //맨 아래에 넣기
			dragItemA.css("border-color","#fff");
			$(element).html("+&nbsp;&nbsp;&nbsp;");
		}else if(i == dragItem.length){ //마지막 이후에 추가
			$(element).empty();
			dragItemA.css("border-color","#fff");
			dragItem.eq(curr_no).parent("a").css("border-color","#bbb");
		}
	}
}
function treeEnd(element, x, y){
	var treeWrap = $(element).parents(".kiTree");
	var dragLi = $(element).parent("a").parent("li");
	var maxDepth = parseInt(treeWrap.attr("data-maxDepth"));
	var rootDenied = treeWrap.attr("data-rootDenied");
	var treeParentUlLength = treeWrap.parents("ul").length;
	var curr_no = 0;
	var dragId = $(element).attr("id").replace("dragItem_","");
	var dragLevel = 0;
	if(dragLi.find("ul").length>0){
		dragLevel++;
		if(dragLi.find("ul li ul").length>0){
			dragLevel++;
			if(dragLi.find("ul li ul li ul").length>0){
				dragLevel++;
				if(dragLi.find("ul li ul li ul li ul").length>0){
					dragLevel++;
				}
			}
		}
	}
	var targetId;
	var targetLevel;
	var targetDoId;
	var targetDoType;
	var error = false;
	if(or_el_move != element){
		window.location.href = $(element).parent("a").attr("href");
	}else{
		dragItem = $(".dragTreeItem");
		if(movePx > -18 && movePx <= 18){ //현재 위치 유지
		}else if(movePx > 18 && movePx < 30){ //바로 위에 넣기
		    for(var i=0; i<dragItem.length; i++){ //이동 지점 검색
				if($(element).offset().top < (dragItem.eq(i).offset().top+10)){
				    targetLevel = dragItem.eq(curr_no).parents("ul").length - treeParentUlLength;
					totalLevel = dragLevel + targetLevel;
					if(totalLevel < maxDepth){
					    targetDoId = dragItem.eq(i).attr("id").replace("dragItem_","");
					    targetDoType = "in";
					}else{ //최대 단계 이상은 불가
						element.style.top = or_y+"px";
						alert("Max "+maxDepth+"");
						error = true;
					}
					break;
				}
		    }
		}else{
			for(var i=0; i<dragItem.length; i++){ //이동 지점 검색
				if($(element).offset().top < dragItem.eq(i).offset().top){
					gap = Math.abs($(element).offset().top - dragItem.eq(curr_no).offset().top);
					if(targetId != dragId){ //드레그 원위치
						if(dragLi.find("#dragItem_"+targetId).length!=0){ //내부로 이동 불가(원위치 이동)
							element.style.left = or_y+"px";
							alert("Can not move to the inside.");
							error = true;
						}else{
							targetLevel = dragItem.eq(curr_no).parents("ul").length - treeParentUlLength;
							totalLevel = dragLevel + targetLevel;
							if(gap < 6){ //넣기
								if(totalLevel < maxDepth){
								    targetDoId = dragItem.eq(curr_no).attr("id").replace("dragItem_","");
								    targetDoType = "in";
								}else{ //최대 단계 이상은 불가
									element.style.left = or_y+"px";
									alert("Max "+maxDepth+"Step.");
									error = true;
								}
							}else{ //이동
								if($("#dragItem_"+targetId).parent().parent().children("ul").length > 0 
							            && $("#dragItem_"+targetId).parent().parent().children("ul").css("display")!="none" 
							            && totalLevel < (maxDepth+1)){ //하위 카테고리의 맨 앞으로 이동
								    targetDoId = targetId;
								    targetDoType = "firstin";
							    }else if(!dragLi.parent().parent().hasClass("kiTree") && targetLevel==1){ //1단계가 아닌 메뉴가 1단계로 이동
									element.style.left = or_y+"px";
							        alert("Step 1 can not be moved.");
									error = true;
								}else if(totalLevel < (maxDepth+1)){
								    targetDoId = dragItem.eq(curr_no).attr("id").replace("dragItem_","");
								    targetDoType = "move";
								}else{ //최대 단계 이상은 불가
									element.style.left = or_y+"px";
									alert("Max "+maxDepth+"Step.");
									error = true;
								}
							}
						}
					}
					break;
				}
				if(dragItem.eq(i).offset().top > 0){ //이동이 유효한 지점
					curr_no = i;
					targetId = dragItem.eq(curr_no).attr("id").replace("dragItem_","");
				}
			}
			if($(element).offset().top < (dragItem.eq(curr_no).offset().top+6)){ //맨 아래에 넣기
				if(dragItem.eq(curr_no).attr("id") == $(element).attr("id")) curr_no = curr_no + 1; //바로 밑에 넣기
			    targetDoId = dragItem.eq(curr_no).attr("id").replace("dragItem_","");
			    targetDoType = "in";
			}else if(i == dragItem.length){ //마지막 이후에 추가
			    if(dragItem.eq(curr_no).parent().parent().parent().parent().hasClass("treeWrap")){
					element.style.left = or_y+"px";
					alert("Step 1 can not be moved.");
					error = true;
				}else{
				    targetDoId = dragItem.eq(curr_no).attr("id").replace("dragItem_","");
				    targetDoType = "move";
				}
			}
		}
	}
	$(treeWrap).kiTree("lineup");
	if(targetDoId && error == false){ //동작 실행
		var data = {"element":element,"dragId":dragId,"targetId":targetDoId,"move":targetDoType};
		$(treeWrap).kiTree("dragMove",data);
	}
	$(element).removeClass("move");
	$(element).empty();
	$(treeWrap).find("li a").css("border-color","#fff");
}
var treeDragHandler = {
	_oElem : null,
	attach : function(oElem){
		oElem.onmousedown = treeDragHandler._dragBegin;
		oElem.dragBegin = new Function();
		oElem.drag = new Function();
		oElem.dragEnd = new Function();
		return oElem;
	},
	_dragBegin : function(e){
		var oElem = treeDragHandler._oElem = this;
		if(isNaN(parseInt(oElem.style.left))){oElem.style.left = '0px';}
		if(isNaN(parseInt(oElem.style.top))){oElem.style.top = '0px';}
		var x = parseInt(oElem.style.left);
		var y = parseInt(oElem.style.top);
		e = e ? e : window.event;
		oElem.mouseX = e.clientX;
		oElem.mouseY = e.clientY;
		oElem.dragBegin(oElem, x, y);
		document.onmousemove = treeDragHandler._drag;
		document.onmouseup = treeDragHandler._dragEnd;
		return false;
	},
	_drag : function(e){
		var oElem = treeDragHandler._oElem;
		var x = parseInt(oElem.style.left);
		var y = parseInt(oElem.style.top);
		e = e ? e : window.event;
		var targetTop = y + (e.clientY - oElem.mouseY);
		if(targetTop < 0) targetTop = 0;
		oElem.style.top = targetTop + 'px';
		oElem.style.left = 0;
		oElem.mouseX = e.clientX;
		oElem.mouseY = e.clientY;
		oElem.drag(oElem, x, y);
		return false;
	},
	_dragEnd : function(){
		var oElem = treeDragHandler._oElem;
		var x = parseInt(oElem.style.left);
		var y = parseInt(oElem.style.top);
		oElem.dragEnd(oElem, x, y);
		document.onmousemove = null;
		document.onmouseup = null;
		treeDragHandler._oElem = null;
	}
}