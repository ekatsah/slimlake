canvas = function() {
	var data = {
		x: 100,
		y: 100,
		width: 300,
		height: 200,
	};

	return {
		draw: function(el) {
			var p = new Processing(el);
			p.size(data.width, data.height);
			p.background("#ffaaaa");
			p.smooth();
			p.stroke(50);
			p.noLoop();
			p.ellipse(data.x, data.y, 50, 50);
		},

		move: function(nx, ny) {
			data.x = nx;
			data.y = ny;
		}
	};
}();	

var hamapp = Backbone.View.extend({
	initialize: function() {
		this.template = Handlebars.compile($("#main-page").html());
		this.variables = {
			"state": 1,
			"display_canvas": true,
			"help_title": "Introduction",
			"help_text": "wazup lorem ipsum",
			"print_debug": true,
		};
		this.render();
	},

	render: function() {
		var html = this.template(this.variables);
		$(this.el).html(html);
		if (this.variables.display_canvas)
			canvas.draw(document.getElementById('render-zone'));
	},

	events: {
		"click #mask-canvas": function() {
			this.variables.display_canvas = false;
			this.render();
		},

		"click #show-canvas": function() {
			this.variables.display_canvas = true;
			this.render();
		},
	}
});
