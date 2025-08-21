import { useEffect, useContext, useState } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const MemberRoom = ({ tracks, roomId }: any) => {
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  console.log("Socket in MemberRoom :", socket);

  useEffect(() => {
    if (!socket) {
      console.log("User Reload the page :", socket);
      navigate("/");
      return;
    }
    socket.off("clear-state").on("clear-state", () => {
      navigate("/");
      toast.error("Host has left the room");
    });
  }, [socket, navigate]);

  // useEffect(() => {
  //   // Wait for socket to be connected
  //   const checkSocketConnection = () => {
  //     if (!socket.connected) {
  //       console.log("Socket not connected, redirecting to home...");
  //       navigate("/"); // Navigate if socket is not connected
  //     } else {
  //       console.log("Socket connected:", socket.id);

  //       // Now that the socket is connected, set up listeners
  //       socket.off("room-tracks").on("room-tracks", (data: any) => {
  //         console.log("Room Tracks in MemberRoom :", data);
  //         setTracks(data);
  //       });
  //     }
  //   };

  //   // Check if socket exists
  //   if (!socket) {
  //     console.log("Socket not available on first reload.");
  //     navigate("/");
  //     return;
  //   } else {
  //     checkSocketConnection();
  //   }

  //   // Cleanup event listeners when the component unmounts
  // }, [socket, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white relative">
      {tracks.length > 0 ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
          <h1 className="text-center text-2xl">Tracks in Room</h1>
          <div className="flex flex-col items-center justify-center gap-2  my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20">
            {tracks?.map((track: any, index: number) => {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center gap-2 p-2"
                >
                  <h1 className="text-3xl font-semibold tracking-wide my-1">
                    {track.title}
                  </h1>
                  <p className="text-md font-extralight ">{track.url}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <h1 className="text-center text-2xl">No Tracks in Room</h1>
      )}
    </div>
  );
};

export default MemberRoom;
