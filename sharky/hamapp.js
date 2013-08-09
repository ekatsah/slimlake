new_canvas = function() {
	var data = {
		red_points: [],
		blue_points: [],
		width: 100,
		height: 100,
	};
	var p = false;

	return {
		setup: function(el) {
			p = new Processing(el);
			p.smooth();
			p.size(data.width, data.height);
			p.noLoop();
		},

		draw: function() {
			if (p == false) {
				console.error("processing context not init");
				return;
			}

			p.background(255, 255, 255);

			// draw red points
			p.fill(255, 0, 0);
			p.noStroke();
			$(data.red_points).each(function(i, point) {
				p.ellipse(point.x, point.y, 10, 10);
			});

			// draw blue points
			p.fill(0, 0, 255);
			p.noStroke();
			$(data.blue_points).each(function(i, point) {
				p.ellipse(point.x, point.y, 10, 10);
			});
		},

		add_point: function(color, x, y) {
			if (color == "red")
				data.red_points.push({x: x, y: y});
			if (color == "blue")
				data.blue_points.push({x: x, y: y});
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

	xy: function(e) {
		if (this.variables.display_canvas)
			return {
				x: e.pageX - $("#render-zone").offset().left,
				y: e.pageY - $("#render-zone").offset().top,
			};
		else
			return {x: 0, y: 0};
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

		"click #render-zone": function(e) {
			var pos = this.xy(e);
			this.canvas_engine.add_point("red", pos.x, pos.y);
			this.canvas_engine.draw();
		},
	}
});