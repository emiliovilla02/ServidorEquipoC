const User = require('../models/user');
const { broadcast } = require('../websocket');

module.exports = function (app) {
	app.get('/users',
		(req, res) => {
		res.json('hola');
		}
	);

	app.get('/users3',
		(req, res) => {
			res.send('<P> <B> hey como estas </B> </P>');
		}
	);

	app.get('/metrics', (req, res) => {
		User.getMetrics((err, data) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			res.json(data);
		});
	});

	app.get('/users2', (req, res) => {
		User.getUsers((err, data) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			res.json(data);
		});
	});

	app.post('/users2', (req, res) => {
		User.getUsers((err, data) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			res.json(data);
		});
	});

	app.post('/metrics', (req, res) => {
		const userData = {
			id: req.body.id,
			result: req.body.result
		};

		User.insertResult(userData, (err, data) => {
			if (err) {
				return res.status(500).json({ success: false, msg: 'Error al insertar métrica', error: err.message });
			}
			if (data && data.affectedRows) {
				// Notificar en tiempo real a clientes WebSocket
				broadcast({
					type: 'metric_update',
					id: userData.id,
					result: userData.result
				});

				res.status(200).json({
					success: true,
					msg: 'dato insertado',
					data: data
				});
			} else {
				res.status(500).json({
					success: false,
					msg: 'Error: No se afectaron filas'
				});
			}
		});
	});

	app.post('/users', (req, res) => {
		const userData = {
			dato: req.body.dato,
			segundo: req.body.segundo
		};

		User.insertUser(userData, (err, data) => {
			if (err) {
				return res.status(500).json({ success: false, msg: 'Error al insertar usuario/sensor', error: err.message });
			}
			if (data && data.affectedRows) {
				// Notificar en tiempo real a clientes WebSocket
				broadcast({
					type: 'sensor_update',
					id: data.insertId,
					dato: userData.dato,
					segundo: userData.segundo
				});

				res.status(200).json({
					success: true,
					msg: 'dato insertado',
					data: data
				});
			} else {
				res.status(500).json({
					success: false,
					msg: 'Error: No se afectaron filas'
				});
			}
		});
	});

	// Rutas para servir imagenes almacenadas en MySQL (LONGBLOB)
	// 1. Obtener lista de imagenes registradas
	app.get('/imagenes', (req, res) => {
		User.getImagesList((err, data) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			res.json(data);
		});
	});

	// 2. Obtener la ultima imagen guardada (como archivo de imagen directo)
	app.get('/imagen', (req, res) => {
		User.getLatestImage((err, image) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			if (!image || !image.datos) {
				return res.status(404).json({ success: false, msg: 'No se encontraron imagenes' });
			}

			res.setHeader('Content-Type', image.mimetype);
			res.setHeader('Content-Disposition', `inline; filename="${image.nombre}"`);
			res.send(image.datos);
		});
	});

	// 3. Obtener una imagen especifica por su ID (como archivo de imagen directo)
	app.get('/imagen/:id', (req, res) => {
		const id = req.params.id;
		User.getImageById(id, (err, image) => {
			if (err) {
				return res.status(500).json({ success: false, error: err.message });
			}
			if (!image || !image.datos) {
				return res.status(404).json({ success: false, msg: `Imagen con id ${id} no encontrada` });
			}

			res.setHeader('Content-Type', image.mimetype);
			res.setHeader('Content-Disposition', `inline; filename="${image.nombre}"`);
			res.send(image.datos);
		});
	});
};