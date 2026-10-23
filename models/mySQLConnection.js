const mysql = require('mysql2')

class Connection{
    constructor(rhost, ruser, rpassword, rdatabase, rport, ssl){
        const poolConfig = {
            host: rhost,
            user: ruser,
            password: rpassword,
            database: rdatabase,
            port: rport,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        if (ssl || process.env.DB_SSL === 'true') {
            poolConfig.ssl = {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            };
        }

        this.pool = mysql.createPool(poolConfig);
    }

    async getConnection() {
        return this.pool.getConnection();
    }

    async getParams(name){
        return new Promise((resolve, reject) =>{
            this.pool.query('SELECT parametros FROM documentos WHERE nombre = ?;', [name], (err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    console.log('RESULTADO:' + result[0].parametros)
                    resolve(result[0].parametros)
                }
            })
        })
        
    }

    async getData(myquery, callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(myquery, (err, result, fields) => {
                if (err) {
                    if (callback) callback(err, null);
                    reject(err);
                } else {
                    if (callback) callback(null, result);
                    resolve(result);
                }
            });
        }).catch(err => {
            if (!callback) throw err;
        });
    }

    async insertData(dato, segundo, myquery, callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(myquery, [dato, segundo], (err, result, fields) => {
                if (err) {
                    if (callback) callback(err, null);
                    reject(err);
                } else {
                    if (callback) callback(null, result);
                    resolve(result);
                }
            });
        }).catch(err => {
            if (!callback) throw err;
        });
    }

    async getRuta(name){
        return new Promise((resolve, reject) =>{
            this.pool.query('SELECT ruta FROM documentos WHERE nombre = ?;', [name], (err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    console.log('RESULTADO:' + result[0].ruta)
                    resolve(result[0].ruta)
                }
            })
        }) 
    }

    async getDocumentos(){
        return new Promise((resolve, reject) =>{
            this.pool.query('SELECT nombre FROM documentos;', (err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    console.log('RESULTADO:' + result)
                    resolve(result)
                }
            })
        }) 
    }

    async newDocument(nombre, ruta){
        let tipo = nombre.split('.')
        tipo = tipo[tipo.length-1]
        return new Promise((resolve, reject) =>{
            this.pool.query('INSERT INTO documentos (nombre, ruta) VALUES (?, ?);',[nombre, ruta] ,(err, result, fields) => {
                if(err){
                    reject(err)
                }else{

                    switch(tipo){
                        case 'docx': tipo = 1
                            break;
                        case 'xlsx': tipo = 2
                            break;
                        case 'pdf': tipo = 3
                            break;
                    }

                    this.pool.query('INSERT INTO esTipo (id_documento, id_tipo) VALUES (LAST_INSERT_ID(), ?)', [tipo], (err, result, fields) => {
                        if(err){
                            reject(err)
                        }else{
                            resolve(result)
                        }
                    })
                }
            })
        }) 
    }

    async updateParametros(parametros){
        return new Promise((resolve, reject) =>{
            this.pool.query('UPDATE documentos SET parametros = ? WHERE id = LAST_INSERT_ID();',[parametros] ,(err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    resolve(result)
                }
            })
        })
    }

    //AQUI EMPEZAMOS A HACER LO DE LAS FIRMAS
    async getRutaFirma(name){
        return new Promise((resolve, reject) =>{
            this.pool.query('SELECT ruta_firma FROM firmas WHERE contraseña = ?;', [name], (err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    console.log('RESULTADO:' + result[0].ruta_firma)
                    resolve(result[0].ruta_firma)
                }
            })
        })
    }

    async newFirma(contraseña, ruta){
        return new Promise((resolve, reject) =>{
            this.pool.query('INSERT INTO firmas (contraseña, ruta_firma) VALUES (?, ?);',[contraseña, ruta] ,(err, result, fields) => {
                if(err){
                    reject(err)
                }else{
                    resolve(result)
                }
            })
        }) 
    }

    // Metodos para manejo de imagenes (LONGBLOB)
    async insertImage(nombre, mimetype, buffer, callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(
                'INSERT INTO imagenes (nombre, mimetype, datos) VALUES (?, ?, ?)',
                [nombre, mimetype, buffer],
                (err, result) => {
                    if (err) {
                        if (callback) callback(err, null);
                        reject(err);
                    } else {
                        if (callback) callback(null, result);
                        resolve(result);
                    }
                }
            );
        }).catch(err => {
            if (!callback) throw err;
        });
    }

    async getImageById(id, callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(
                'SELECT nombre, mimetype, datos FROM imagenes WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        if (callback) callback(err, null);
                        reject(err);
                    } else {
                        const image = result && result.length > 0 ? result[0] : null;
                        if (callback) callback(null, image);
                        resolve(image);
                    }
                }
            );
        }).catch(err => {
            if (!callback) throw err;
        });
    }

    async getLatestImage(callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(
                'SELECT id, nombre, mimetype, datos FROM imagenes ORDER BY id DESC LIMIT 1',
                (err, result) => {
                    if (err) {
                        if (callback) callback(err, null);
                        reject(err);
                    } else {
                        const image = result && result.length > 0 ? result[0] : null;
                        if (callback) callback(null, image);
                        resolve(image);
                    }
                }
            );
        }).catch(err => {
            if (!callback) throw err;
        });
    }

    async getImagesList(callback) {
        return new Promise((resolve, reject) => {
            this.pool.query(
                'SELECT id, nombre, mimetype, creado_en FROM imagenes ORDER BY id DESC',
                (err, result) => {
                    if (err) {
                        if (callback) callback(err, null);
                        reject(err);
                    } else {
                        if (callback) callback(null, result);
                        resolve(result);
                    }
                }
            );
        }).catch(err => {
            if (!callback) throw err;
        });
    }

}
module.exports = Connection;