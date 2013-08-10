
/*
	First, some standard types
*/

// point on (x; y) with color
var point = function(nx, ny, ncolor) {
	var x = nx, y = ny, color = ncolor;

	return {
		x: function(a) {
			if (a != undefined)
				x = a;
			return x;
		},

		y: function(a) {
			if (a != undefined)
				y = a;
			return y;
		},

		dual: function() {
			return line(x, y, color);
		},

		draw: function(p) {
			p.noStroke();
			p.fill(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);
			p.ellipse(p.tx(x), p.ty(y), 7, 7);
		},
	};
};


// line y = ax + b with color
var line = function(na, nb, ncolor) {
	var a = na, b = nb, color = ncolor;

	return {
		a: function(w) {
			if (w != undefined)
				a = w;
			return w;
		},

		b: function(w) {
			if (w != undefined)
				b = w;
			return w;
		},

		dual: function() {
			return point(a, b, color);
		},

		draw: function(p) {
			p.stroke(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);
			p.line(p.tx(-18), p.ty(-18 * a + b), p.tx(18), p.ty(18 * a + b));
		},
	};
};

/*
	Next, we need a rendering engine
*/

new_canvas = function() {
	var data = {
		objects: [],
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

	var dx = function(rx) {
		return (rx - data.width/2) / 20;
	}

	var dy = function(ry) {
		return (data.height/2 - ry) / 20;
	}

	return {
		setup: function(el) {
			p = new Processing(el);
			p.tx = tx;
			p.ty = ty;
			p.smooth();
			p.size(data.width, data.height);
			p.noLoop();
		},

		dx: dx,
		dy: dy,

		draw: function() {
			if (p == false) {
				throw new Error("processing context not init");
				return;
			}

			p.background(255, 255, 255);

			// draw pseudo axis
			p.stroke(0);
			p.line(data.width/2, 0, data.width/2, data.height);
			p.line(0, data.height/2, data.width, data.height/2);

			// draw objects
			$(data.objects).each(function(i, o) {
				o.draw(p);
			});
		},

		add: function(o) {
			data.objects.push(o);
		},

		objects: function(o) {
			data.objects = _.clone(o);
		},

		clear: function() {
			data.objects = [];
		},

		set_size: function(new_width, new_height) {
			data.width = new_width;
			data.height = new_height;
		},
	};
};	

/*
	The application per see
*/

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

		this.default_pts = {
			red_points: [{x:1, y:2}, {x:-1, y:-3}, {x:-2.3, y:5}],
			blue_points: [{x:-1.2, y:2.5}, {x: 2.5, y: -1}, {x: 4.2, y: 4}],
		}

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

	intersection: function(line1, line2) {
		var x = (line2.y - line1.y) / (line1.x - line2.x);
		return {x: x, y: line1.x * x + line1.y};
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
			this.canvas_engine.add(point(
				this.canvas_engine.dx(pos.x),
				this.canvas_engine.dy(pos.y),
				this.variables.color
			));
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
			this.variables.color = "FF0000FF";
			this.render();
		},

		"click #a-blue": function() {
			this.variables.mode = "editor";
			this.variables.color = "0000FFFF";
			this.render();
		},

		"click #a-algo": function() {
			this.variables.mode = "algo";
			this.render();
		},

		"click #a-clear": function() {
			this.canvas_engine.clear();
			this.canvas_engine.draw();
		},

		"click #a-cut2": function() {
			this.variables.mode = "algo";
			this.variables.algo = "cut2";
			var ce = this.canvas_engine;

			ce.clear();
			$(this.default_pts.red_points).each(function(i, p) {
				ce.add(point(p.x, p.y, "FF0000FF"));
			});
			$(this.default_pts.blue_points).each(function(i, p) {
				ce.add(point(p.x, p.y, "0000FFFF"));
			});
			$(this.default_pts.red_points).each(function(i, p) {
				ce.add(point(p.x, p.y, "FF0000FF").dual());
			});
			$(this.default_pts.blue_points).each(function(i, p) {
				ce.add(point(p.x, p.y, "0000FFFF").dual());
			});

			i = this.intersection(this.default_pts.red_points[1], this.default_pts.red_points[2]);
			ce.add(point(i.x, i.y, "00FF00FF"));
			this.render();
		}
	}
});