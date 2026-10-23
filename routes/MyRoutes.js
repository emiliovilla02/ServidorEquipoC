const User = require('../models/user')

module.exports = function (app) {
	app.get('/json',
		(req, res) => {
			res.json('hey como estas');
		}
	);

	app.get('/send',
		(req, res) => {
			res.send('<p> <b> hey como estas </b> </p>');
		}
	);
}