import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket.js';

/**
 * Custom hook that connects to WebSocket on mount and cleans up on unmount.
 * All dispatching is handled inside socket.js service directly.
 */
const useSocket = () => {
  useEffect(() => {
    const socket = connectSocket();
    return () => {
      // Don't disconnect on component unmount — keep connection alive at app level
      // disconnectSocket();
    };
  }, []);
};

export default useSocket;
