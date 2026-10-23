require('dotenv').config();

const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const Connection = require('./models/mySQLConnection')
const myConnection = require('express-myconnection')
const { initWebSocket } = require('./websocket');

/* AGREGAR LIBRERIA CORS PARTE 1 */
const cors = require('cors')

// Define allowed origins (replace with your frontend URL(s))
const allowedOrigins = ['http://localhost:3010', 'http://localhost:5173', 'https://172.20.16.1:3010', 'http://172.20.16.1:3010', 'http://172.29.245.213:3010'];

const corsOptions = {
	origin: function (origin, callback) {
		// Permite peticiones sin origin (móviles, Arduino, curl) y cualquier origen en dev
		callback(null, true);
	},
	credentials: true
};
/************************************* */

//settings
app.set('port', process.env.PORT || 3010);

//middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());


//Configuracion de la base de datos (host, usuario, contrase�a, nombre de la DB y puerto)
const dbConfig = new Connection(
	process.env.DB_HOST || '127.0.0.1',
	process.env.DB_USER || 'root',
	process.env.DB_PASSWORD || '120105',
	process.env.DB_NAME || 'proyectodb',
	process.env.DB_PORT || '3306',
	process.env.DB_SSL === 'true'
);

app.use(myConnection(mysql, dbConfig.pool, 'pool'))

//AGREGAR LIBRERIA CORS PARTE 2
app.use(cors(corsOptions));

//routes
require('./routes/userRoutes')(app);

// Inicializar Servidor WebSocket
initWebSocket(server);

// Iniciar servidor HTTP y WebSocket en el mismo puerto
server.listen(app.get('port'), () => {
	console.log(`server on port ${app.get('port')} (HTTP y WebSocket)`);
});
