new_canvas = function() {
	var data = {
		red_points: [{x:1, y:2}, {x:-1, y:-3}, {x:-2.3, y:5}],
		blue_points: [{x:-1.2, y:2.5}, {x: 2.5, y: -1}, {x: 4.2, y: 4}],
		width: 100,
		height: 100,
	};
	var p = false;

	var tx = function(x) {
		return x * 20 + data.width/2;
	};

	var ty = function(y) {
		return data.height/2 - y * 20;
	};

	return {
		setup: function(el) {
			p = new Processing(el);
			p.smooth();
			p.size(data.width, data.height);
			p.noLoop();
		},

		draw: function() {
			if (p == false) {
				throw new Error("processing context not init");
				return;
			}

			p.background(255, 255, 255);

			// draw red points
			p.fill(255, 0, 0);
			p.noStroke();
			$(data.red_points).each(function(i, point) {
				p.ellipse(tx(point.x), ty(point.y), 10, 10);
			});

			// draw blue points
			p.fill(0, 0, 255);
			p.noStroke();
			$(data.blue_points).each(function(i, point) {
				p.ellipse(tx(point.x), ty(point.y), 10, 10);
			});

			// draw pseudo axis
			p.stroke(0);
			p.line(data.width/2, 0, data.width/2, data.height);
			p.line(0, data.height/2, data.width, data.height/2);

			// draw red lines
			p.stroke(255, 0, 0);
			$(data.red_points).each(function(i, point) {
				p.line(tx(-10), ty(point.x * -10 - point.y), tx(10), ty(point.x * 10 - point.y));
			});

			p.stroke(0, 0, 255);
			$(data.blue_points).each(function(i, point) {
				p.line(tx(-10), ty(point.x * -10 - point.y), tx(10), ty(point.x * 10 - point.y));
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

		cut2: function() {
			var G = data.red_points.concat(data.blue_points);
			console.log(G);
		}
	};
};	

var hamapp = Backbone.View.extend({
	initialize: function() {
		Handlebars.registerHelper("active2", function(variable, value, item) {
			if (variable == value)
				return 'class="active"';
			else
				return "";
		});

		Handlebars.registerHelper("active4", function(var1, value1, var2, value2, item) {
			if ((var1 == value1) && (var2 == value2))
				return 'class="active"';
			else
				return "";
		});

		this.template = Handlebars.compile($("#main-page").html());
		this.variables = {
			"mode": "intro",
			"color": "red",
			"algo": "cut2",
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
			this.canvas_engine.add_point(this.variables.color, pos.x, pos.y);
			this.canvas_engine.draw();
		},

		"click #a-intro": function() {
			this.variables.mode = "intro";
			this.render();
		},

		"click #a-editor": function() {
			this.variables.mode = "editor";
			this.render();
		},

		"click #a-red": function() {
			this.variables.mode = "editor";
			this.variables.color = "red";
			this.render();
		},

		"click #a-blue": function() {
			this.variables.mode = "editor";
			this.variables.color = "blue";
			this.render();
		},

		"click #a-algo": function() {
			this.variables.mode = "algo";
			this.render();
		},

		"click #a-cut2": function() {
			this.variables.mode = "algo";
			this.variables.algo = "cut2";
			this.canvas_engine.cut2();
			this.render();
		}
	}
});