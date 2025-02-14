const mongoose = require('mongoose')
require('dotenv').config({path: 'variables.env'})

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO)
        console.log('base de datos conectada')

    } catch (error) {
        console.log('hubo un error')
        console.error(error)
        process.exit(1) //detener la aplicacion
    }
}

module.exports = conectarDB