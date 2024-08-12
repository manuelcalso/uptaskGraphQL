const Usuario = require('../models/Usuario')
const Proyecto = require('../models/Proyecto')
const Tarea = require('../models/Tarea')
const bcryptjs = require("bcryptjs")
const jwt = require('jsonwebtoken')

require('dotenv').config({ path: 'variable.env' })

const crearToken = (usuario, secreta, expiresIn) => {
  const { id, email, nombre } = usuario
  return jwt.sign({ id, email, nombre }, secreta, { expiresIn })
}
// Definir los resolvers
const resolvers = {
  Query: {
    obtenerProyectos: async (_, { }, ctx) => {
      const proyectos = await Proyecto.find({ creador: ctx.usuario.id })
      return proyectos
    },
    obtenerTareas: async (_, {input}, ctx) => {
      const tareas = await Tarea.find({creador: ctx.usuario.id}).where('proyecto').equals(input.proyecto)
      return tareas
    }
  },
  Mutation: {
    //los parametros: root o _ (trae informacion anterior), {input}, context, info
    crearUsuario: async (_, { input }) => {
      const { email, password } = input
      const existeUsuario = await Usuario.findOne({ email })
      if (existeUsuario) {
        throw new Error('El usuario ya esta registrado')
      }
      try {
        //hashear password
        const salt = await bcryptjs.genSalt(10)
        input.password = await bcryptjs.hash(password, salt)
        //Registrar nuevo usuario
        const nuevoUsuario = new Usuario(input)
        //console.log(nuevoUsuario)
        nuevoUsuario.save()
        return 'Usuario Creado Correctamente'
      } catch (error) {
        console.error(error)
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input
      //revisar que el usuario existe
      const existeUsuario = await Usuario.findOne({ email })
      if (!existeUsuario) {
        throw new Error('El usuario no existe')
      }
      //si el password correct
      const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
      if (!passwordCorrecto) {
        throw new Error('Password Incorrecto')
      }
      //dar acceso 
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '8hr')
      }
    },
    nuevoProyecto: async (_, { input }, ctx) => {
      //console.log("desde resolver", ctx)
      try {
        const proyecto = new Proyecto(input)
        //asociar al creador
        proyecto.creador = ctx.usuario.id
        //console.log(proyecto.creador)
        //almacenar en db
        const resultado = await proyecto.save()
        return resultado
      } catch (error) {
        console.error(error)
      }
    },
    actualizarProyecto: async (_, { id, input }, ctx) => {
      //revisar proyeto exista 
      let proyecto = await Proyecto.findById(id)
      if (!proyecto) {
        throw new Error('Proyecto no encontrado')
      }
      console.log('proy', proyecto)
      //revisar persona autorizada 
      if (proyecto.creador.toString() != ctx.usuario.id) {
        throw new Error('No tienes las credenciales para editar')
      }
      //guardar proyecto
      proyecto = await Proyecto.findOneAndUpdate({ _id: id, }, input, { new: true })
      return proyecto
    },
    eliminarProyecto: async (_, { id }, ctx) => {
      //revisar proyeto exista 
      let proyecto = await Proyecto.findById(id)
      if (!proyecto) {
        throw new Error('Proyecto no encontrado')
      }
      //console.log('proy', proyecto)
      //revisar persona autorizada 
      if (proyecto.creador.toString() != ctx.usuario.id) {
        throw new Error('No tienes las credenciales para editar')
      }
      //eliminar 
      await Proyecto.findOneAndDelete({ _id: id })
      return "Proyecto Eliminado"
    },
    nuevaTarea: async (_, { input }, ctx) => {
      try {
        const tarea = new Tarea(input)
        tarea.creador = ctx.usuario.id
        const resultado = await tarea.save()
        return resultado
      } catch (error) {
        console.error(error)
      }
    },
    actualizarTarea: async (_, { id, input, estado }, ctx) => {
      //revisar si existe tarea
      let tarea = await Tarea.findById(id)

      if(!tarea){
        throw new Error('Tarea no encontrada')
      }
      //propietario revisar
      if (tarea.creador.toString() != ctx.usuario.id) {
        throw new Error('No tienes las credenciales para editar')
      }
      //asignar estado 
      input.estado = estado 
      //retornar la tarea
      tarea = await Tarea.findOneAndUpdate({ _id : id }, input, { new: true })
      return tarea
    }, 
    eliminarTarea: async (_, { id }, ctx) => {
      //revisar si existe tarea
      let tarea = await Tarea.findById(id)

      if(!tarea){
        throw new Error('Tarea no encontrada')
      }
      //propietario revisar
      if (tarea.creador.toString() != ctx.usuario.id) {
        throw new Error('No tienes las credenciales para editar')
      }

      //eliminar
      await Tarea.findOneAndDelete({_id: id})
      return "Tarea Eliminada"

    }
  }
};

module.exports = resolvers