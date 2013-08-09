var hamapp = Backbone.View.extend({
	initialize: function() {
		this.template = Handlebars.compile($("#main-page").html());
		this.render();
	},

	render: function() {
		var html = this.template({
			"state": 1,
			"display-canvas": true,
			"help-title": "Introduction",
			"help-text": "wazup lorem ipsum",
			"print-debug": true,
		});
		$(this.el).html(html);
	}
});
