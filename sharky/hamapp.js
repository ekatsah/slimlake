
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

		str: function() {
			return "(" + x.toFixed(2) + ", " + y.toFixed(2) + ")";
		},
	};
};


// line y = ax + b with color
var line = function(na, nb, ncolor) {
	var a = na, b = nb, color = ncolor;

	var str = function() {
		return "y = " + a.toFixed(2) + " * x + " + b.toFixed(2);
	};

	return {
		a: function(w) {
			if (w != undefined)
				a = w;
			return a;
		},

		b: function(w) {
			if (w != undefined)
				b = w;
			return b;
		},

		f: function(x) {
			return a * x + b;
		},

		dual: function() {
			return point(a, b, color);
		},

		str: str,
		is_vline: false,

		draw: function(p) {
			p.stroke(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);
			p.line(p.tx(-18), p.ty(-18 * a + b), p.tx(18), p.ty(18 * a + b));
		},

		intersection: function(l, ncolor) {
			// return point of intersection between two lines
			// color of the point is the same as this line, if not set

			if (ncolor == undefined)
				var ncolor = color;

			if (l.is_vline)
				return point(l.x(), l.x() * a + b, ncolor);

			if (a == l.a())
				return undefined; // no intersection


			var x = (l.b() - b) / (a - l.a());
			return point(x, a * x + b, ncolor);
		},

		color: function(c) {
			if (c != undefined)
				color = c;
			return color;
		},
	};
};

var vline = function(nx, ncolor) {
	var x = nx, color = ncolor;

	var str = function() {
		return "x = " + x.toFixed(2);
	};

	return {
		str: str,
		is_vline: true,
		x: function() { return x; },

		draw: function(p) {
			p.stroke(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);
			p.line(p.tx(x), p.ty(-20), p.tx(x), p.ty(20));
		},

		intersection: function(line, ncolor) {
			if (ncolor == undefined)
				var ncolor = color;

			if (line.is_vline)
				return undefined;
			else
				return point(x, line.a() * x + line.b(), ncolor);
		},
	};
};

var line_from_2points = function(p1, p2, color) {
	if (p1.x() == p2.x())
		var epsi = 0.01;
	else
		var epsi = 0;

	var a = (p1.y() - p2.y()) / (p1.x() - p2.x() + epsi);
	return line(a, p1.y() - a * p1.x(), color);
};

var segment = function(np1, np2, ncolor) {
	var p1 = np1, p2 = np2, color = ncolor;

	return {
		draw: function(p) {
			p.stroke(color);
			p.line(p1.x(), p1.y(), p2.x(), p2.y());
		},

		line: function() {
			return line_from_2points(p1, p2, color);
		},

		p1: function() { return p1; },
		p2: function() { return p2; },
	};
};

// Polygon, list of points
var polygon = function(npoints, ncolor, nclosed) {
	var points = npoints, color = ncolor;

	if (nclosed != undefined)
		var closed = nclosed;
	else
		var closed = true;

	var edges = function() {
		// return _all_ edges, assume polygon is closed
		edges = [];
		$(points).each(function(i, o) {
			if (i > 0)
				edges.push(segment(points[i - 1], o, color));
		});
		edges.push(segment(points[points.length - 1], points[0], color));
		return edges;
	};

	return {
		add: function(pt) {
			points.push(pt);
		},

		draw: function(p) {
			p.noStroke();
			p.fill(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16) / 5
			);
			p.beginShape();
			$(points).each(function(i, o) {
				p.vertex(p.tx(o.x()), p.ty(o.y()));
			});
			p.endShape();

			p.stroke(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);
			$(points).each(function(i, o) {
				if (i > 0)
					p.line(p.tx(o.x()), p.ty(o.y()), 
						p.tx(points[i - 1].x()), p.ty(points[i - 1].y()));
			});

			var len = points.length;
			if (closed && len > 1)
				p.line(p.tx(points[0].x()), p.ty(points[0].y()),
						p.tx(points[len - 1].x()), p.ty(points[len - 1].y()));
		},

		is_inside: function(point) {
			// true if point inside this polygon, false otherwise
			// raytracing method, against a horizontal line from the point

			var intersection = 0;

			$(edges()).each(function(i, e) {
				ipt = e.line().intersection(line(0, point.y(), ""));
				if (ipt.x() > point.x() &&
						((ipt.y() > e.p1().y() && ipt.y() < e.p2().y()) ||
						 (ipt.y() < e.p1().y() && ipt.y() > e.p2().y())))
					intersection += 1;
			});

			return intersection % 2 == 1;
		},
	};
}

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
			data.objects = [];
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
			"color": "FF0000FF",
			"algo": "cut2",
			"display_canvas": true,
			"help_title": "Introduction",
			"help_text": "wazup lorem ipsum",
			"print_debug": true,
			"tool": "point",
			"menu_polygon": false,
		};

		this.points = [];
		this.lines = [];
		this.polys = [];
		this.tmp = undefined;

		this.canvas_engine = new_canvas();
		this.canvas_engine.set_size(710, 600);
		this.render();
	},

	render: function() {
		this.variables.menu_polygon = (
			this.variables.mode == "editor" &&
			this.variables.tool == "poly" &&
			this.tmp != undefined && this.tmp.length > 2);

		var html = this.template(this.variables);
		$(this.el).html(html);

		if (this.variables.display_canvas) {
			ce = this.canvas_engine;
			ce.setup(document.getElementById('render-zone'));

			$(this.points).each(function(i, o) {
				ce.add(o);
			});

			$(this.lines).each(function(i, o) {
				ce.add(o);
			});

			$(this.polys).each(function(i, o) {
				ce.add(o);
			});

			$(this.tmp).each(function(i, o) {
				ce.add(point(o.x, o.y, "00FF00FF"));
			});

			ce.draw();
		}
	},

	xy: function(e) {
		if (this.variables.display_canvas) {
			var ce = this.canvas_engine;

			return {
				x: ce.dx(e.pageX - $("#render-zone").offset().left),
				y: ce.dy(e.pageY - $("#render-zone").offset().top),
			};
		} else
			return {x: 0, y: 0};
	},

	events: {
		"click": function() {
			this.render();
		},

		"click #mask-canvas": function() {
			this.variables.display_canvas = false;
		},

		"click #show-canvas": function() {
			this.variables.display_canvas = true;
		},

		"click #render-zone": function(e) {
			var pos = this.xy(e);

			if (this.variables.mode == "editor") {
				if (this.variables.tool == "point")
					this.points.push(point(pos.x, pos.y, this.variables.color));

				if (this.variables.tool == "line") {
					if (this.tmp == undefined) {
						// first point of line
						this.tmp = [{x: pos.x, y: pos.y}];
					} else {
						this.lines.push(
							line_from_2points(
								point(this.tmp[0].x, this.tmp[0].y, this.variables.color),
								point(pos.x, pos.y, this.variables.color),
								this.variables.color
							)
						);
						this.tmp = undefined;
					}
				}

				if (this.variables.tool == "poly") {
					if (this.tmp == undefined)
						this.tmp = [];
					this.tmp.push({x: pos.x, y: pos.y});
				}
			}
		},

		"click #a-intro": function() {
			this.variables.mode = "intro";
			this.tmp = undefined;
		},

		"click #a-editor": function() {
			this.variables.mode = "editor";
		},

		"click #a-red": function() {
			this.variables.mode = "editor";
			this.variables.color = "FF0000FF";
		},

		"click #a-blue": function() {
			this.variables.mode = "editor";
			this.variables.color = "0000FFFF";
		},

		"click #a-point": function() {
			this.variables.mode = "editor";
			this.variables.tool = "point";
			this.tmp = undefined;
		},

		"click #a-line": function() {
			this.variables.mode = "editor";
			this.variables.tool = "line";
			this.tmp = undefined;
		},

		"click #a-poly": function() {
			this.variables.mode = "editor";
			this.variables.tool = "poly";
			this.tmp = undefined;
		},

		"click #a-open": function() {
			var pts = [], color = this.variables.color;
			
			$(this.tmp).each(function(i, pt) {
				pts.push(point(pt.x, pt.y, color));
			});
			this.polys.push(polygon(pts, color, false));
			this.tmp = undefined;
		},

		"click #a-close": function() {
			var pts = [], color = this.variables.color;

			$(this.tmp).each(function(i, pt) {
				pts.push(point(pt.x, pt.y, color));
			});
			this.polys.push(polygon(pts, color, true));
			this.tmp = undefined;
		},

		"click #a-clear": function() {
			this.points = [];
			this.lines = [];
			this.polys = [];
			this.tmp = undefined;
		},

		"click #a-algo": function() {
			this.variables.mode = "algo";
			this.tmp = undefined;
		},

		"click #a-inside": function() {
			this.variables.mode = "algo";
			this.variables.algo = "inside";
			this.tmp = undefined;

			// check if point is inside a polygon
			if (this.points.length != 1 ||
					this.polys.length != 1) {
				this.variables.help_text = "error in input variables";
				return;
			}

			if (this.polys[0].is_inside(this.points[0]))
				this.variables.help_text = "the point " + this.points[0].str() + " is inside";
			else
				this.variables.help_text = "the point " + this.points[0].str() + " is outside";
		},

		"click #a-cut2": function() {
			this.variables.mode = "algo";
			this.variables.algo = "cut2";
			this.tmp = undefined;

			// general data
			this.points = [];
			this.lines = [];
			this.polys = [];
			self = this;

			reds = [{x:1, y:2}, {x:-1, y:-3}, {x: 0.5, y: -5}];
			blues = [{x:-1.2, y:2.5}, {x: 2.5, y: -1}, {x: 4.2, y: 4}, {x: -5, y: -8.4}, {x:-0.4, y: 8}];

			$(reds).each(function(i, p) {
				self.points.push(point(p.x, p.y, "FF0000FF"));
				self.lines.push(point(p.x, p.y, "FF0000FF").dual());
			});

			$(blues).each(function(i, p) {
				self.points.push(point(p.x, p.y, "0000FFFF"));
				self.lines.push(point(p.x, p.y, "0000FFFF").dual());
			});

			// helpers
			var print_lineset = function(s) {
				console.log("print lineset");
				$(s).each(function(i, l) {
					console.log(" [" + i + "] : " + l.str() + ", color = " + l.color());
				});
			};

			var union = function(set1, set2) {
				return _.clone(set1.concat(set2));
			};

			var steepness = function(l1, l2) {
				return l1.a() - l2.a();
			};


			// first round of algo - input

			var G1 = [], G2 = [];
			$(this.lines).each(function(i, l) {
				if (l.color() == "FF0000FF")
					G1.push(_.clone(l));
				else
					G2.push(_.clone(l));
			});
			var m1 = G1.length, m2 = G2.length;

			var G = union(G1, G2);
			G.sort(steepness);

			var k1 = Math.floor((m1 + 1)/2), k2 = Math.floor((m2 + 1)/2);
			console.log("k1 = " + k1 + " et k2 = " + k2);
			print_lineset(G);

			var gstar = G[Math.floor(G.length / 2)];
			console.log("gstar = " + gstar.str());

			var gminus = [], gplus = [], M = [];
			for (var i = 0; i < Math.floor(G.length / 2); ++i) {
				gminus.push(G[i]);
				gplus.push(G[G.length - i - 1]);
				M.push(G[i].intersection(G[G.length - i - 1], "00FF00FF"));
			}

			print_lineset(gminus);
			print_lineset(gplus);

			// print M
			$(M).each(function(i, p) {
				self.points.push(p);
			});

			// we need to find v*
			M.sort(function(p1, p2) {
				return p1.x() - p2.x();
			});
			// 2 cases : M odd, then v* is the middle line
			//           M even, then v* is between 2 middle points
			if (M.length % 2 == 0)
				var vx = (M[M.length/2].x() + M[M.length/2 - 1].x()) / 2;
			else
				var vx = M[Math.floor(M.length/2)].x();

			self.lines.push(vline(vx, "ee8800FF"));
		},

		"click #a-klevel": function() {
			this.variables.mode = "algo";
			this.variables.algo = "klevel";
			this.tmp = undefined;

			// general data
			this.points = [];
			this.lines = [];
			this.polys = [];
			self = this;

			reds = [{x:1, y:2}, {x:-1, y:-3}, {x: 0.5, y: -5}];
			blues = [{x:-1.5, y:2.5}, {x: -0.7, y: -1}, {x: 0.1, y: 4}, {x: 0.5, y: -1.4}, {x:0.9, y: 2}];

		/*	$(reds).each(function(i, p) {
				self.points.push(point(p.x, p.y, "FF0000FF"));
				self.lines.push(point(p.x, p.y, "FF0000FF").dual());
			});*/

			$(blues).each(function(i, p) {
		//		self.points.push(point(p.x, p.y, "0000FFFF"));
				self.lines.push(point(p.x, p.y, "0000FFFF").dual());
			});

			// helpers
			var print_lineset = function(s) {
				console.log("print lineset");
				$(s).each(function(i, l) {
					console.log(" [" + i + "] : " + l.str() + ", color = " + l.color());
				});
			};

			var union = function(set1, set2) {
				return _.clone(set1.concat(set2));
			};

			// select all intersections
			var I = [];
			$(self.lines).each(function(i, l1) {
				$(self.lines.slice(i + 1, self.lines.lenght)).each(function(i, l2) {
					I.push(l1.intersection(l2, "00FF00FF"));
				});
			});

			I.sort(function(p1, p2) {
				return p1.x() - p2.x();
			});
			self.points = I;

			console.log(I[0].str());

			var get_kline = function(k, lines, x) {
				if (k < 0 || k > lines.length - 1)
					return undefined;

				var vl = vline(x, "00AA00FF");
				var vinter = [];
				$(lines).each(function(i, l) {
					vinter.push([vl.intersection(l), l]);
				});
				vinter.sort(function(t1, t2) {
					return t1[0].y() - t2[0].y();
				});
				return vinter[k][1];
			};

			// first vline : 
			var v1 = get_kline(0, self.lines, I[0].x() - 1);
			v1.color("FF0000FF");
			self.lines.push(v1);
		//	self.points.push(v1.intersection(self.lines[2]));
		},
	},
});