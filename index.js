const { ApolloServer, AuthenticationError } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: 'variable.env' })
const conectarDB = require('./config/db')
conectarDB()
// Crear una instancia del servidor Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers, context: ({ req }) => {
    const token = req.headers["authorization"] || ""
    //console.log(req.headers["authorization"])
    if (token) {
      try {
        const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA)
        //console.log('usuario', usuario)
        return { usuario }
      } catch (error) {
        throw new AuthenticationError('Invalid or expired token');
      }
    }
    return {};
  }
});

// Iniciar el servidor
server.listen({port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Servidor listo en la URL ${url}`);
});
