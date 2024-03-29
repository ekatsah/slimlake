
/*
	First, some standard types
*/

// point on (x; y) with color
var point = function(nx, ny, ncolor) {
	var x = nx, y = ny, color = ncolor;
	var ux = nx, uy = ny;

	return {
		color: function() { return color; },

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
			return line(ux, uy, color);
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
};

var klevel = function(lineset, k, ncolor) {
	var color = ncolor;
	var lines = [], lines_x = [];

	k = lineset.length - k;
	if (k < 0 || k >= lineset.length || lineset.length == 0)
		return undefined;

	// helper to select the k-eime line in a set, for a coord x
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

	// first, compute all intersections of the lines
	var intersections = [];
	$(lineset).each(function(i, l1) {
		$(lineset.slice(i + 1, lineset.lenght)).each(function(i, l2) {
			intersections.push(l1.intersection(l2, "00FF00FF"));
		});
	});

	// sort the intersections by x()
	intersections.sort(function(p1, p2) {
		return p1.x() - p2.x();
	});

	lines.push(get_kline(k, lineset, intersections[0].x() - 1));
	lines_x.push(intersections[0].x());
	for (var i = 1; i < intersections.length; ++i) {
		lines.push(get_kline(k, lineset, (intersections[i - 1].x() + intersections[i].x()) / 2));
		lines_x.push(intersections[i].x());
	}
	lines.push(get_kline(k, lineset, intersections[i - 1].x() + 1));

	// removing the interferences
	for (var i = 1; i < lines_x.length; ++i)
		if (lines[i] == lines[i-1]) {
			lines.splice(i, 1);
			lines_x.splice(i - 1, 1);
			--i;
		}

	return {
		lines: function() {
			return lines;
		},

		offsets: function() {
			return lines_x;
		},

		draw: function(p) {
			p.stroke(
				parseInt(color[0] + color[1], 16),
				parseInt(color[2] + color[3], 16),
				parseInt(color[4] + color[5], 16),
				parseInt(color[6] + color[7], 16)
			);

			if (lines_x[0] > -20)
				p.line(p.tx(-20), p.ty(lines[0].f(-20)),
						p.tx(lines_x[0]), p.ty(lines[0].f(lines_x[0])));

			for (var i = 1; i < lines_x.length; ++i) {
				var x1 = lines_x[i - 1], x2 = lines_x[i];
				var line = lines[i];

				p.line(p.tx(x1), p.ty(line.f(x1)),
						p.tx(x2), p.ty(line.f(x2)));
			}
			line = lines[i];
			p.line(p.tx(x2), p.ty(line.f(x2)),
					p.tx(20), p.ty(line.f(20)));
		},

		intersection: function(path, ncolor) {
			// compute the intersection (points) between this path and the arguments

			if (ncolor == undefined)
				var ncolor = "00FF00FF";

			var intersections = [], offsets1 = lines_x, offsets2 = path.offsets();
			$(lines).each(function(i1, l1) {
				$(path.lines()).each(function(i2, l2) {
					var inter = l1.intersection(l2, ncolor);
					if ((i1 == 0 && i2 == 0 && inter.x() < offsets1[0] && inter.x() < offsets2[0]) ||
							(i1 != 0 && i2 != 0 && inter.x() > offsets1[i1-1] && inter.x() > offsets2[i2-1]
							 && inter.x() < offsets1[i1] && inter.x() < offsets2[i2]) ||
							(i1 == lines.length - 1 && i2 == path.lines().length - 1 && inter.x() > offsets1[i1 - 1])) {
						intersections.push(inter);
					}
				});
			});
			return intersections;
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
		var self = this;

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
		this.helps = {};
		$("script[data-ref=help]").each(function(i, t) {
			var id = $(t).attr("id");
			self.helps[id] = Handlebars.compile($(t).html());
		});
		this.help_params = {
			rkvalue: 1,
			bkvalue: 1,
			raw_text: undefined,
		};
		this.current_help = "help-introduction";

		this.variables = {
			"mode": "intro",
			"color": "FF0000FF",
			"algo": "cut2",
			"display_canvas": false,
			"print_debug": false,
			"tool": "point",
			"menu_polygon": false,
		};

		this.points = [];
		this.lines = [];
		this.polys = [];
		this.tmp = undefined;
		this.algo_result = undefined;

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
		$("#help-container").html(this.helps[this.current_help](this.help_params));

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

			$(this.algo_result).each(function(i, o) {
				ce.add(o);
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

			if (this.variables.mode == "editor") {
				this.algo_result = undefined;
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
				this.render();
			}
		},

		"click #a-intro": function() {
			this.current_help = "help-introduction";
			this.variables.mode = "intro";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-editor": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.algo_result = undefined;
			this.render();
		},

		"click #a-red": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.variables.color = "FF0000FF";
			this.algo_result = undefined;
			this.render();
		},

		"click #a-blue": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.variables.color = "0000FFFF";
			this.algo_result = undefined;
			this.render();
		},

		"click #a-point": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.variables.tool = "point";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-line": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.variables.tool = "line";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-poly": function() {
			this.current_help = "help-editor";
			this.variables.mode = "editor";
			this.variables.tool = "poly";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-open": function() {
			var pts = [], color = this.variables.color;
			
			$(this.tmp).each(function(i, pt) {
				pts.push(point(pt.x, pt.y, color));
			});
			this.polys.push(polygon(pts, color, false));
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-close": function() {
			var pts = [], color = this.variables.color;

			$(this.tmp).each(function(i, pt) {
				pts.push(point(pt.x, pt.y, color));
			});
			this.polys.push(polygon(pts, color, true));
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-clear": function() {
			this.points = [];
			this.lines = [];
			this.polys = [];
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-algo": function() {
			this.current_help = "help-algo";
			this.variables.mode = "algo";
			this.variables.algo = "";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.render();
		},

		"click #a-inters": function() {
			this.variables.mode = "algo";
			this.variables.algo = "inter";
			this.tmp = undefined;
			this.current_help = "help-intersection";

			var inter = [], self = this;
			$(self.lines).each(function(i1, l1) {
				$(self.lines).each(function(i2, l2) {
					if (i2 > i1)
						inter.push(l1.intersection(l2));
				});
			});

			this.algo_result = inter;
			this.render();
		},
				
		"click #a-inside": function() {
			this.variables.mode = "algo";
			this.variables.algo = "inside";
			this.tmp = undefined;
			this.algo_result = undefined;

			// check if point is inside a polygon
			if (this.points.length != 1 ||
					this.polys.length != 1) {
				this.current_help = "help-inside-error";
			} else {
				this.current_help = "help-inside-ok";
				if (this.polys[0].is_inside(this.points[0]))
					this.help_params.raw_text = "The point " + this.points[0].str() + " is inside";
				else
					this.help_params.raw_text = "The point " + this.points[0].str() + " is outside";
			}
			this.render();
		},

		"click #a-klevel": function() {
			this.variables.mode = "algo";
			this.variables.algo = "klevel";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.current_help = "help-klevel";
			this.render();
		},

		"click #klevel-go": function() {
			var redline = [], blueline = [], self = this;
			$(this.lines).each(function(i, l) {
				if (l.color() == "FF0000FF")
					redline.push(l);
				else
					blueline.push(l);
			});

			var k1 = $("#red-k").val();
			var k2 = $("#blue-k").val();
			this.help_params.rkvalue = k1;
			this.help_params.bkvalue = k2;

			if (k1 <= 0 || k1 > redline.length || k2 <= 0 || k2 > blueline.length) {
				this.current_help = "help-klevel-error";
				return;
			}

			var path1 = klevel(redline, k1, "CB7C00FF");
			var path2 = klevel(blueline, k2, "CB00B1FF");
			this.algo_result = [];
			this.algo_result.push(path1);
			this.algo_result.push(path2);

			var pts = path1.intersection(path2, "00FF00FF");
			$(pts).each(function(i, p) {
				self.algo_result.push(p);
			});
			this.render();
		},

		"click #a-cut2": function() {
			this.variables.mode = "algo";
			this.variables.algo = "cut2";
			this.tmp = undefined;
			this.algo_result = undefined;
			this.current_help = "help-cut2";
			this.lines = [];
			this.polys = [];
			this.render();
		},

		"click #a-cut2-round": function() {
			var self = this, rlines = [], blines = [];

			// is it the first round or not?
			// if so, make all the dual in the line set
			if (self.lines.length == 0) {
				$(this.points).each(function(i, p) {
					if (p.color() == "FF0000FF") {
						var l = point(p.x(), p.y(), "FF0000FF").dual();
						rlines.push(l);
					} else {
						var l = point(p.x(), p.y(), "0000FFFF").dual()
						blines.push(l);
					}
				});
			// if not, sort by color the lines in two sets
			} else {
				$(this.lines).each(function(i, l) {
					if (l.color() == "FF0000FF")
						rlines.push(l);
					else
						blines.push(l);
				});
			}

			self.algo_result = [];
			var step = this.step_cut2({
				"G1": rlines,
				"G2": blines,
				"k1": Math.floor((rlines.length + 1)/2),
				"k2": Math.floor((blines.length + 1)/2),
			});

			this.lines = [];
			$(step.G1).each(function(i, l) {
				self.lines.push(l);
			});
			$(step.G2).each(function(i, l) {
				self.lines.push(l);
			});
			this.render();
		},
	},

	step_cut2: function(params) {
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

		var self = this;
		var G1 = params.G1, G2 = params.G2;
		var m1 = G1.length, m2 = G2.length;
		var G = union(G1, G2);
		G.sort(steepness);

		var k1 = Math.floor((m1 + 1)/2), k2 = Math.floor((m2 + 1)/2);
		console.log("k1 = " + k1 + " et k2 = " + k2);
		print_lineset(G);

		var gstar = G[Math.floor(G.length / 2)];
		var gminus = [], gplus = [], M = [];
		for (var i = 0; i < Math.floor(G.length / 2); ++i) {
			gminus.push(G[i]);
			gplus.push(G[G.length - i - 1]);
			M.push(G[i].intersection(G[G.length - i - 1], "000000FF"));
		}

		// print M
		$(M).each(function(i, p) {
			self.algo_result.push(p);
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

		var vstar = vline(vx, "00FF00FF");
		self.algo_result.push(vstar);

		var path1 = klevel(G1, k1, "CB00B0FF");
		var path2 = klevel(G2, k2, "CB00B0FF");
		var k_points = path1.intersection(path2);
		self.algo_result.push(path1);
		self.algo_result.push(path2);

		// if v* is on a intersection:
		$(k_points).each(function(i, p) {
			self.algo_result.push(p);
			if (Math.abs(p.x() - vstar.x()) < 0.0001) {
				console.log("got a intersection");
				return;
			}
		});

		// compute v, count the number of left and right points
		var p_left = 0, p_right = 0;
		$(k_points).each(function(i, p) {
			if (p.x() < vstar.x())
				p_left += 1;
			else
				p_right += 1;
		});

		if (p_left % 2 == 1 && p_right % 2 == 0)
			console.log("left is odd, not right, v is on the right side of v*");
		else if (p_right % 2 == 1 && p_left % 2 == 0)
			console.log("right is odd, not left, v is on the left side of v*");
		else {
			console.log("algorithm error, p_left = " + p_left + " && p_right = " + p_right);
			return;
		}

		var vothers = [];
		$(M).each(function(i, p) {
			if (p_left % 2 == 1 && p.x() > vstar.x())
				vothers.push(p);
			if (p_right % 2 == 1 && p.x() < vstar.x())
				vothers.push(p);
		});

		vothers.sort(function(p1, p2) {
			return p1.x() - p2.x();
		});

		if (vothers.length % 2 == 0)
			var wbase = point(
				(vothers[vothers.length/2].x() + vothers[vothers.length/2-1].x()) / 2,
				(vothers[vothers.length/2].y() + vothers[vothers.length/2-1].y()) / 2,
				"000000FF"
			);
		else
			var wbase = vothers[Math.floor(vothers.length/2)];

		var wstar = line(gstar.a(), wbase.y() - gstar.a() * wbase.x(), "00FF00FF");
		self.algo_result.push(wstar);

		var p_up = 0, p_down = 0;
		$(k_points).each(function(i, p) {
			var i_y = p.y() - p.x() * wstar.a() + wstar.b();

			if (Math.abs(i_y) < 0.0001) {
				console.log("got intersection with wstar");
				return;
			}

			if ((p_left % 2 == 1 && p.x() > vstar.x()) ||
				(p_right % 2 == 1 && p.x() < vstar.x()))
				return; // outside of v

			if (i_y > 0)
				p_up += 1;
			else
				p_down += 1;
		});

		if (p_up % 2 == 1 && p_down % 2 == 0)
			console.log("w is upper");
		else if (p_up % 2 == 0 && p_down % 2 == 1)
			console.log("w is down");
		else {
			console.log("bug in algo for w");
		}

		var pivot = wstar.intersection(vstar);

		var G1prim = [], G2prim = [];
		$(G1).each(function(i, g) {
			var gv = vstar.intersection(g);
			if ((gv.y() > pivot.y() && p_up % 2 == 1) ||
				(gv.y() < pivot.y() && p_down % 2 == 1)) {
				G1prim.push(g);
				return;
			}
			var gw = wstar.intersection(g);
			if (gw && ((gw.x() < pivot.x() && p_left % 2 == 1) ||
				(gw.x() > pivot.x() && p_right % 2 == 1)))
				G1prim.push(g);
		});
		$(G2).each(function(i, g) {
			var gv = vstar.intersection(g);
			if ((gv.y() > pivot.y() && p_up % 2 == 1) ||
				(gv.y() < pivot.y() && p_down % 2 == 1)) {
				G2prim.push(g);
				return;
			}
			var gw = wstar.intersection(g);
			if (gw && ((gw.x() < pivot.x() && p_left % 2 == 1) ||
				(gw.x() > pivot.x() && p_right % 2 == 1)))
				G2prim.push(g);
		});

		var Gprim = union(G1prim, G2prim);
		return {
			"G": Gprim,
			"G1": G1prim,
			"G2": G2prim,
			"vstar": vstar,
			"wstar": wstar,
			"klevel1": path1,
			"klevel2": path2,
			"p_up": p_up,
			"p_down": p_down,
		};
	},
});