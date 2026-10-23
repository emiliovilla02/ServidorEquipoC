const { WebSocketServer, WebSocket } = require('ws');
const User = require('./models/user');

let wss = null;

/**
 * Inicializa el servidor WebSocket sobre el servidor HTTP existente
 * @param {import('http').Server} server 
 */
function initWebSocket(server) {
	wss = new WebSocketServer({ server });

	console.log('Servidor WebSocket inicializado');

	wss.on('connection', (ws, req) => {
		const clientIp = req.socket.remoteAddress;
		console.log(`[WS] Cliente conectado desde: ${clientIp}`);

		// Mensaje de bienvenida al conectarse
		ws.send(JSON.stringify({
			type: 'info',
			message: 'Conectado exitosamente al servidor WebSocket en puerto 3010'
		}));

		// Escuchar mensajes entrantes del cliente (Arduino, Android o Web)
		ws.on('message', (data) => {
			const messageStr = data.toString();
			console.log(`[WS] Mensaje recibido: ${messageStr}`);

			let parsedData = null;
			try {
				parsedData = JSON.parse(messageStr);
			} catch (e) {
				// No es formato JSON (ej. texto plano desde Arduino/Serial)
				parsedData = null;
			}

			if (parsedData) {
				// Caso 1: Lectura de sensor { dato: ..., segundo: ... } o { type: 'sensor', dato: ... }
				if (parsedData.dato !== undefined) {
					const userData = {
						dato: String(parsedData.dato),
						segundo: parsedData.segundo !== undefined ? String(parsedData.segundo) : String(Math.floor(Date.now() / 1000))
					};

					User.insertUser(userData, (err, dbResult) => {
						if (err) {
							console.error('[WS Error] Error al guardar en tabla sensor:', err.message);
							ws.send(JSON.stringify({ success: false, error: err.message }));
						} else {
							console.log('[WS] Sensor guardado en BD:', dbResult.insertId);
							ws.send(JSON.stringify({
								success: true,
								msg: 'Dato de sensor insertado',
								id: dbResult.insertId
							}));

							// Retransmitir (broadcast) a los demás clientes conectados (ej. panel web o Android)
							broadcast({
								type: 'sensor_update',
								id: dbResult.insertId,
								dato: userData.dato,
								segundo: userData.segundo
							}, ws);
						}
					});
				}
				// Caso 2: Métricas { id: ..., result: ... } o { type: 'metric', id: ..., result: ... }
				else if (parsedData.id !== undefined && parsedData.result !== undefined) {
					const metricData = {
						id: String(parsedData.id),
						result: String(parsedData.result)
					};

					User.insertResult(metricData, (err, dbResult) => {
						if (err) {
							console.error('[WS Error] Error al guardar en tabla result:', err.message);
							ws.send(JSON.stringify({ success: false, error: err.message }));
						} else {
							console.log('[WS] Métrica guardada en BD');
							ws.send(JSON.stringify({ success: true, msg: 'Métrica insertada' }));

							// Retransmitir métrica a los demás clientes
							broadcast({
								type: 'metric_update',
								id: metricData.id,
								result: metricData.result
							}, ws);
						}
					});
				} else {
					// Otro objeto JSON: retransmitir a todos
					broadcast({
						type: 'custom_json',
						payload: parsedData
					}, ws);
				}
			} else {
				// Caso 3: Mensaje en texto plano (ej. "25.4" o comandos directos)
				broadcast({
					type: 'raw_message',
					data: messageStr
				}, ws);

				ws.send(JSON.stringify({ success: true, msg: 'Mensaje de texto recibido y difundido' }));
			}
		});

		ws.on('close', () => {
			console.log(`[WS] Cliente desconectado: ${clientIp}`);
		});

		ws.on('error', (err) => {
			console.error(`[WS Error] en cliente ${clientIp}:`, err.message);
		});
	});

	return wss;
}

/**
 * Difunde un mensaje a todos los clientes WebSocket conectados
 * @param {object|string} data Datos a enviar
 * @param {WebSocket} [senderWs] Si se provee, no se reenvía al remitente
 */
function broadcast(data, senderWs = null) {
	if (!wss) return;
	const payload = typeof data === 'string' ? data : JSON.stringify(data);

	wss.clients.forEach((client) => {
		if (client !== senderWs && client.readyState === WebSocket.OPEN) {
			client.send(payload);
		}
	});
}

module.exports = {
	initWebSocket,
	broadcast
};
