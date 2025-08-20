import { createContext, useState } from "react";
import { io } from "socket.io-client";

const serverLink = import.meta.env.VITE_SOCKET_SERVER;
const socket = io(serverLink);

socket.on("connect", () => {
  console.log("Connected to Socket", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket");
});

export const SocketContext = createContext<any>(null);

const SocketContextProvider = ({ children }: any) => {
  const [socket, setSocket] = useState<any>(null);
  return (
    <SocketContext.Provider value={{ setSocket: setSocket, socket: socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContextProvider;
