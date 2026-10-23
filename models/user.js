const mysql = require('mysql');
const Connection = require('./mySQLConnection')

//IP http://192.168.72.181:3010/users

//connection = mysql.createConnection({
//	host: 'localhost',
//	user: 'root',	
//	password: '1234',
//	database: 'TSCU'
//});

require('dotenv').config();

// Configuracion de la base de datos mediante variables de entorno (local o TiDB Cloud)
const connection = new Connection(
	process.env.DB_HOST || '127.0.0.1',
	process.env.DB_USER || 'root',
	process.env.DB_PASSWORD || '120105',
	process.env.DB_NAME || 'proyectodb',
	process.env.DB_PORT || '3306',
	process.env.DB_SSL === 'true'
);

let userModel = {};

userModel.getMetrics = (callback) => {
	connection.getData('SELECT * FROM result', callback);
};

userModel.getUsers = (callback) => {
	connection.getData('SELECT * FROM sensor', callback);
};

userModel.insertUser = (userData, callback) => {
	connection.insertData(userData.dato, userData.segundo, 'INSERT INTO sensor (dato, segundo) VALUES (?, ?)', callback);
};

userModel.insertResult = (userData, callback) => {
	connection.insertData(userData.id, userData.result, 'INSERT INTO result (id, info) VALUES (?, ?)', callback);
};

userModel.insertImage = (nombre, mimetype, buffer, callback) => {
	connection.insertImage(nombre, mimetype, buffer, callback);
};

userModel.getImageById = (id, callback) => {
	connection.getImageById(id, callback);
};

userModel.getLatestImage = (callback) => {
	connection.getLatestImage(callback);
};

userModel.getImagesList = (callback) => {
	connection.getImagesList(callback);
};

/*
userModel.insertUser = (userData, callback) => {
	if( connection ){
		console.log(userData);
		connection.query(
			'INSERT INTO Sensor SET ?', userData,
				(err, result) => {

					if( err  ){
						throw err;
					}else{
						console.log(result);
						callback(null, {
							affectedRows: result.affectedRows
						});
					}
				}
		);
	}
};
*/
module.exports = userModel;