import chat from './chat.js'
import user from './user.js'
import room from './room.js'
import { Router } from 'express'

const route = Router()
route.use('/chat',chat)
route.use('/user',user)
route.use('/room',room)

export default route