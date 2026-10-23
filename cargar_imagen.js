require('dotenv').config();
const fs = require('fs');
const path = require('path');
const User = require('./models/user');

const filePath = process.argv[2];

if (!filePath) {
	console.log('\nUso: node cargar_imagen.js <ruta_de_la_imagen>');
	console.log('Ejemplo: node cargar_imagen.js ./mi_foto.jpg\n');
	process.exit(1);
}

const resolvedPath = path.resolve(filePath);

if (!fs.existsSync(resolvedPath)) {
	console.error(`\n[Error] El archivo "${resolvedPath}" no existe.\n`);
	process.exit(1);
}

const fileName = path.basename(resolvedPath);
const ext = path.extname(resolvedPath).toLowerCase();

const mimeTypes = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.bmp': 'image/bmp',
	'.svg': 'image/svg+xml'
};

const mimetype = mimeTypes[ext] || 'application/octet-stream';

console.log(`Leyendo archivo: ${fileName} (${mimetype})...`);
const buffer = fs.readFileSync(resolvedPath);

User.insertImage(fileName, mimetype, buffer, (err, result) => {
	if (err) {
		console.error('\n[Error al insertar en MySQL]:', err.message);
		process.exit(1);
	}

	console.log('\n Imagen guardada con éxito en MySQL!');
	console.log(`ID asignado: ${result.insertId}`);
	console.log(`Nombre: ${fileName}`);
	console.log(`Tamaño: ${(buffer.length / 1024).toFixed(2)} KB`);
	console.log(`\nPuedes visualizarla en el navegador o app en:`);
	console.log(`-> http://localhost:3010/imagen/${result.insertId}`);
	console.log(`-> http://localhost:3010/imagen (última cargada)\n`);
	process.exit(0);
});
