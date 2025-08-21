import { useEffect, useContext, useState } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import YouTube from 'react-youtube';

const HostRoom = ({ roomId }: any) => {
  console.log("Room ID in HostRoom :", roomId);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  console.log("Socket in HostRoom :", socket);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);

  useEffect(() => {
    if (!socket) {
      console.log("Socket not available");
      navigate("/");
      return;
    }
    socket.off("room-tracks").on("room-tracks", (data: any) => {
      console.log("Room Tracks in HostRoom :", data);
      setTracks(data);
    });
    socket.off("clear-state").on("clear-state", () => {
      navigate("/");
      toast.error("Host has left the room");
    });
  }, [socket, navigate]);

  const handleTrackSelect = (track: any) => {
    setSelectedTrack(track);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white relative ">
      <div className="flex items-center justify-center gap-5">
        <Heading text="Welcome to the room :" />
        <h1 className="text-center text-4xl font-semibold">{roomId}</h1>
      </div>
      <div className="flex items-center justify-center w-full h-full gap-5 ">
        <div className="flex flex-col items-center justify-center gap-2  my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20">
          <div>
            {selectedTrack && selectedTrack.url && selectedTrack.url.includes("youtube.com") && (
            <div className="my-4 min-w-[390px] min-h-[220px]">
              <YouTube 
                videoId={selectedTrack.url.split("v=")[1]}  
                opts={{
                  height: '220',
                  width: '390',
                  playerVars: {
                    autoplay: 1,  
                  },
                }}
              />
            </div>
          )}
          </div>
          <div>
            {selectedTrack?.url}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2  my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20">
        {tracks.length > 0 ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
          <h1 className="text-center text-3xl">Tracks in Room</h1>
          <div className="flex flex-col items-center justify-center gap-2 p-5">
            {tracks?.map((track: any, index: number) => {
              return (
                <div
                onClick={() => handleTrackSelect(track)}
                  key={index}
                  className="flex flex-col items-center justify-center gap-2 p-2 bg-black/20 rounded-xl border-1 border-white/20"
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
      )}</div>
      </div>
    </div>
  );
};

export default HostRoom;
