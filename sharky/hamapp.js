new_canvas = function() {
	var data = {
		x: 100,
		y: 100,
		width: 100,
		height: 100,
	};
	var p = false;

	return {
		setup: function(el) {
			p = new Processing(el);
			p.smooth();
			p.size(data.width, data.height);
			p.stroke(0);
			p.noLoop();
		},

		draw: function() {
			if (p == false) {
				console.error("processing context not init");
				return;
			}

			p.background(255, 220, 255);
			p.ellipse(data.x, data.y, 50, 50);
		},

		move: function(nx, ny) {
			data.x = nx;
			data.y = ny;
		},

		set_size: function(new_width, new_height) {
			data.width = new_width;
			data.height = new_height;
		},
	};
};	

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
		this.step = 1;
		this.canvas_engine = new_canvas();
		this.canvas_engine.set_size(710, 600);
		this.render();
	},

	render: function() {
		var html = this.template(this.variables);
		$(this.el).html(html);
		if (this.variables.display_canvas) {
			this.canvas_engine.setup(document.getElementById('render-zone'));
			this.canvas_engine.draw();
		}
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

		"click #render-zone": function() {
			this.canvas_engine.move(100, 100 + this.step * 20);
			this.canvas_engine.draw();

			if (this.step >= 10)
				this.step = 0;
			else
				this.step += 1;
		},
	}
});