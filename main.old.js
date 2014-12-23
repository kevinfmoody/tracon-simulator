$(document).ready(function() {
	var scope = new Scope;
	initScope(scope);
	initScopeZoom(scope);
	initScopeResize(scope);
	initScopeDrag(scope);
});

function initScope(scope) {
	scope.bind('#scope');
	scope.setMap('a90.map', function() {
		scope.render();
		setInterval(function() {
			scope.renderer().setMagVar(scope.renderer().magVar() + 1);
			scope.render();
		}, 1000 / 30);
	});
	scope.setSituation('a90.sit');
	scope.situation().run();
}

function initScopeZoom(scope) {
	$('#scope').bind('mousewheel', function(e) {
		var scale = 1 + e.originalEvent.wheelDelta / 1000;
		scale = Math.min(Math.max(scale, .5), 2);
		scope.renderer().setGlobalScale(scope.renderer().globalScale() * scale);
		scope.render();
	});
}

function initScopeResize(scope) {
	$(window).resize(function() {
		scope.render();
	});
}

function initScopeDrag(scope) {
	$('#scope').bind('mousedown touchstart', function(e) {
                //alert(e.type);
//alert(e.touches[0]);
                e = e.type == 'touchstart' ? e.touches[0] : e;
//alert(e.pageX);

		scope.renderer().setMouseDown(true);
		scope.renderer().setLastMousePosition({
			x: e.clientX,
			y: e.clientY
		});
		return false;
	});
	$('#scope').bind('mouseup mouseover mouseout touchend touchcancel', function() { scope.renderer().setMouseDown(false); });
	$('#scope').bind('mousemove touchmove', function(e) {
//alert(e.type);
                e = e.type == 'touchmove' ? e.touches[0] : e;
//alert('yep');
		if (scope.renderer().mouseDown()) {
			scope.renderer().setTranslationOffset({
				x: scope.renderer().translationOffset().x + scope.renderer().scale(e.clientX - scope.renderer().lastMousePosition().x),
				y: scope.renderer().translationOffset().y + scope.renderer().scale(scope.renderer().lastMousePosition().y - e.clientY)
			});
			scope.renderer().setLastMousePosition({
				x: e.clientX,
				y: e.clientY
			});
			scope.render();
		}
		//return false;
	});
}