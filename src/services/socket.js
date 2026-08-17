import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket = null

const createSocket = (token) => {
  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
    auth: token ? { token } : undefined,
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token')
    createSocket(token)
  }

  return socket
}

export const connectSocket = (token = localStorage.getItem('token')) => {
  const client = getSocket()

  if (token) {
    client.auth = { token }
  }

  if (!client.connected) {
    client.connect()
  }

  return client
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
  }
}

export const isSocketConnected = () => Boolean(socket?.connected)
