	var main = require('./sovellus');
	var route = function(app){
		app.get('/add', function(request, response){
			var url = request.param('url');
			var vanity = request.param('vanity');
			main.addUrl(url, request, response, vanity);
		});
		
		
		app.get('/:segment', function(request, response){
			main.getUrl(request.params.segment, request, response);
		});
	}

	exports.route = route;