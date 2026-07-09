import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(() => getSocket())
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const client = connectSocket()

    const handleConnect = () => {
      setConnected(true)
      setError(null)
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    const handleConnectError = (err) => {
      setError(err?.message || 'Socket connection failed')
      setConnected(false)
    }

    setSocket(client)
    setConnected(client.connected)

    client.on('connect', handleConnect)
    client.on('disconnect', handleDisconnect)
    client.on('connect_error', handleConnectError)

    return () => {
      client.off('connect', handleConnect)
      client.off('disconnect', handleDisconnect)
      client.off('connect_error', handleConnectError)
      disconnectSocket()
    }
  }, [])

  const value = useMemo(
    () => ({
      socket,
      connected,
      error,
    }),
    [socket, connected, error],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    throw new Error('useSocket must be used within a <SocketProvider>')
  }

  return ctx
}
