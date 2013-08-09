var hamapp = Backbone.View.extend({
	initialize: function() {
		this.template = Handlebars.compile($("#main-page").html());
		this.variables = {
			"state": 1,
			"display_canvas": true,
			"help-title": "Introduction",
			"help-text": "wazup lorem ipsum",
			"print-debug": true,
		};
		this.render();
	},

	render: function() {
		var html = this.template(this.variables);
		$(this.el).html(html);
	},

	events: {
		"click #mask-canvas": function() {
			this.variables.display_canvas = false;
			this.render();
		},

		"click #show-canvas": function() {
			this.variables.display_canvas = true;
			this.render();
		}
	}
});
