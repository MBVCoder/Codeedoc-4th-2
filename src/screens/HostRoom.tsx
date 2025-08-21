import { useEffect, useContext, useState } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import YouTube from "react-youtube";
import { extractYouTubeId } from "../components/ExtractYoutubeId";
import { Play, Trash, Plus, SkipBack, SkipForward, Share2 } from "lucide-react";

const HostRoom = ({ roomId }: any) => {
  // console.log("Room ID in HostRoom :", roomId);
  // console.log("Socket in HostRoom :", socket);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<any>("");
  const [trackName, setTrackName] = useState<any>("");

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(videoUrl.length === 0){
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractYouTubeId(videoUrl);
    console.log(videoId);
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      return;
    }

    const newTrack = {
      id: Date.now().toString(),
      title: trackName || `Video (${videoId})`,
      url: videoUrl,
      videoId,
    };

    socket.emit("add-track", { tracks: [newTrack] });

    toast.success("Track Added");

    setVideoUrl("");
    setTrackName("");
  };

  const handleDeleteAll = () => {};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative p-5 pt-10 ">
      <div className="py-3 flex items-center justify-center gap-5">
        <Heading text="Welcome to the Room :" />
        <h1 className="text-center text-4xl font-semibold text-white">
          {roomId}
        </h1>
      </div>
      <div className="flex max-md:flex-col gap-4 w-full flex-1 Video&TracksContainer">
        <div className="flex-1 md:max-w-[500px] space-y-4">
          <div className=" bg-black/20 rounded-xl border-1 border-white/20 VideoContainer p-5">
            <div className="flex flex-col items-center justify-center">
              <div>
                {selectedTrack &&
                  selectedTrack.url &&
                  selectedTrack.url.includes("youtube.com") && (
                    <div className="flex flex-col items-center justify-center gap-5">
                      <YouTube
                        videoId={extractYouTubeId(selectedTrack?.url)}
                        opts={{
                          height: "150",
                          width: "280",
                          playerVars: {
                            autoplay: 1,
                          },
                        }}
                      />
                    </div>
                  )}
              </div>
              <hr className="border-white/20 w-full mt-5" />
              <div className="flex items-center justify-between h-20 w-full">
                <div className="w-1/10 h-0.5 p-5"></div>
                <div className="flex items-center justify-center gap-10 p-5">
                  <SkipBack />
                  <Play />
                  <SkipForward />
                </div>
                <div className=" p-5">
                  <Share2 />
                </div>
              </div>
              <div className="flex items-center justify-center w-full gap-5">
                <input type="range" className="w-full h-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2  my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20 AddtrackContainer">
            <div className="border-b-1 border-white/80 p-3">
              <h1 className="text-2xl font-semibold tracking-wide text-center">
                Add New Track
              </h1>
            </div>
            <div className="flex items-center justify-center w-full">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col items-center justify-center gap-5 py-2 mb-3">
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    type="text"
                    placeholder="Enter link ...."
                    className="w-full h-full border-2 border-white/20 rounded-xl px-6 py-3 focus:outline-0"
                  />
                  <input
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    type="text"
                    placeholder="Enter title ...."
                    className="w-full h-full
                  border-2 border-white/20 rounded-xl px-6 py-3 focus:outline-0"
                  />
                </div>
                <div className="flex justify-center items-center">
                  <button
                    type="submit"
                    className="bg-black/40 hover:bg-black text-white rounded-xl px-6 py-3 w-full h-full hover:cursor-pointer duration-300 flex items-center justify-center gap-2"
                  >
                    Add
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="flex-1 gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20 TracksListContainer">
          {tracks.length > 0 ? (
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="flex items-center justify-between w-full px-5">
                <h1 className="self-start text-3xl flex items-center">
                  Tracks : ({tracks.length})
                </h1>
                <button
                  onClick={handleDeleteAll}
                  className="bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 p-5 w-full">
                {tracks?.map((track: any, index: number) => {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 p-2 bg-black/20 rounded-xl border-1 border-white/20 w-full h-20 px-10"
                    >
                      <div className="flex flex-col ">
                        <h1 className="text-xl font-semibold tracking-wide my-1 text-left line-clamp-1 overflow-hidden">
                          {track.title}
                        </h1>
                        <p className="text-sm text-white/30 ">Track:{index}</p>
                      </div>
                      <div className="flex items-center justify-center gap-10">
                        <div className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer">
                          <Play onClick={() => handleTrackSelect(track)} className="w-5 h-5 group-hover:fill-green-400 group-hover:scale-115 group-hover:cursor-pointer" />
                        </div>
                        <div className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer">
                          <Trash className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115 group-hover:cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <h1 className="text-center text-2xl">No Tracks in Room</h1>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostRoom;
