import { useEffect, useContext, useState, useRef } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import YouTubePlayer from "youtube-player";
import { extractYouTubeId } from "../components/ExtractYoutubeId";
import {
  Play,
  Trash,
  Plus,
  SkipBack,
  SkipForward,
  Share2,
  Pause,
} from "lucide-react";
import { Reorder } from "framer-motion";

const HostRoom = ({ roomId }: any) => {
  // console.log("Room ID in HostRoom :", roomId);
  // console.log("Socket in HostRoom :", socket);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const isRemoteAction = useRef(false);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<any>("");
  const [trackName, setTrackName] = useState<any>("");
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState<Number>(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    playerRef.current = YouTubePlayer(containerRef.current, {
      height: "150",
      width: "280",
      playerVars: { autoplay: 1, playsinline: 1 },
    });

    playerRef.current.on("ready", (event) => {
      console.log("YouTube player ready");
      console.log(event);
    });

    playerRef.current.on("stateChange", (event: any) => {
      if (event.data === 1) {
        console.log("state change", event);
        console.log("Playing");
        setIsPlaying(true);
      } else if (event.data === 2) {
        console.log("state change", event);
        console.log("Paused");
        setIsPlaying(false); // PAUSED
      } else if (event.data === 0) {
        setIsPlaying(false); // ENDED
      }
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, []);

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
    // Handle track change
    socket
      .off("update-current-playing")
      .on("update-current-playing", (data: { index: number }) => {
        console.log("index listen from memberroom ", data);
        const next = (tracks as any[])[data.index];
        if (!next) return;

        setSelectedTrack(next);
        setCurrentPlayingId(next.id);

        console.log("playerRef.current", playerRef.current);

        if (playerRef.current) {
          playerRef.current.loadVideoById(next.videoId);
        }
      });

    // Handle play/pause
    socket
      .off("update-playing-status")
      .on("update-playing-status", (data: { value: boolean }) => {
        console.log("status listen from memberroom ", data);
        if (!playerRef.current) return;
        if (isRemoteAction.current) {
          isRemoteAction.current = false;
          return;
        }
        if (data.value) {
          setIsPlaying(true);
        } else {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      });

    // Add new event listener for sync-request
    socket.off("sync-request").on("sync-request", async () => {
      if (!playerRef.current) return;

      // Get the current player state and video details
      const currentTime = await playerRef.current.getCurrentTime();
      const playerState = await playerRef.current.getPlayerState();
      const videoId = selectedTrack?.videoId || "";

      // Emit the sync-response with the current state data
      socket.emit("sync-response", {
        currentTime: currentTime,
        playerState: playerState,
        videoId: videoId,
        time: Date.now(),
        type: "TIME",
      });
      console.log("Sync response sent to member.");
    });

    socket.off("clear-state").on("clear-state", () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      navigate("/");
      toast.error("Host has left the room");
    });
  }, [socket, navigate, playerRef.current, tracks]);

  const handlePlayPause = ({ id, index }: { id: string; index: number }) => {
    // If the same track is already selected
    if (currentPlayingId === id) {
      if (isPlaying) {
        // Pause
        playerRef.current?.pauseVideo();
        isRemoteAction.current = true;
        socket.emit("update-playing-status", { value: false });
        setIsPlaying(false);
      } else {
        // Resume
        playerRef.current?.playVideo();
        isRemoteAction.current = true;
        socket.emit("update-playing-status", { value: true });
        setIsPlaying(true);
      }
    } else {
      // Play a new track
      setCurrentPlayingId(id);
      const track = tracks.find((t: any) => t.id === id);
      setSelectedTrack(track);

      // emit current track index
      socket.emit("update-current-playing", { index });

      // emit playing status
      isRemoteAction.current = true;
      socket.emit("update-playing-status", { value: true });

      if (playerRef.current && track) {
        playerRef.current.loadVideoById(track.videoId);
        playerRef.current.playVideo();
        console.log("playerRef.current video load", playerRef.current);
      }
      // player.playVideo()
      setIsPlaying(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (videoUrl.length === 0) {
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

  const handleDeleteAll = () => {
    socket.emit("update-tracks", { tracks: [] });
  };

  const handleDeleteTrack = (id: string) => {
    socket.emit("update-tracks", {
      tracks: tracks.filter((t: any) => t.id !== id),
    });
  };

  const handleSkip = (direction: "prev" | "next") => {
    if (!tracks.length || !selectedTrack) return;

    const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);

    let newIndex;
    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1; // loop to last track if at start
    } else {
      newIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0; // loop to first track if at end
    }

    const newTrack = tracks[newIndex];
    handlePlayPause({ id: newTrack.id, index: newIndex }); // reuses existing play/pause logic (syncs everything)
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative p-5 max-lg:pt-15">
      <div className="py-3 flex items-center justify-center gap-5">
        <Heading text="Welcome to the Room :" />
        <h1 className="text-center text-2xl  sm:text-4xl font-semibold text-white">
          {roomId}
        </h1>
      </div>
      <div className="flex max-lg:flex-col gap-4 w-full flex-1 Video&TracksContainer">
        <div className="flex-1 lg:max-w-[500px] space-y-4 VideoContainer">
          <div className=" bg-black/20 rounded-xl border-1 border-white/20 VideoContainer p-5">
            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-5">
                <div
                  ref={containerRef}
                  className="w-[280px] h-[150px] bg-black rounded-md"
                />
              </div>
              <hr className="border-white/20 w-full mt-5" />
              <div className="flex items-center justify-between h-20 w-full">
                <div className="w-1/10 h-0.5 p-5 hidden sm:block"></div>
                <div
                  className={`flex items-center justify-center gap-5 sm:gap-10 p-5 videoControls`}
                >
                  <div
                    className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                    onClick={() => handleSkip("prev")}
                  >
                    <SkipBack className="max-w-6 max-h-6 group-hover:fill-blue-400" />
                  </div>

                  <div
                    className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                    onClick={() => {
                      if (selectedTrack) {
                        handlePlayPause({
                          id: selectedTrack.id,
                          index: tracks.findIndex(
                            (t) => t.id === selectedTrack.id
                          ),
                        });
                      } else if (tracks.length > 0) {
                        handlePlayPause({ id: tracks[0].id, index: 0 });
                      }
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="max-w-6 max-h-6 group-hover:fill-red-400" />
                    ) : (
                      <Play className="max-w-6 max-h-6 group-hover:fill-green-400" />
                    )}
                  </div>

                  <div
                    className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                    onClick={() => handleSkip("next")}
                  >
                    <SkipForward className="max-w-6 max-h-6 group-hover:fill-blue-400" />
                  </div>
                </div>

                <div
                  className="p-5 videoShare hover:bg-white/30 rounded-full hover:cursor-pointer max-[400px]:hidden"
                  onClick={() => {
                    if (!selectedTrack)
                      toast.error("Please Play the track first !!");
                    else {
                      navigator.clipboard.writeText(selectedTrack?.url);
                      toast.success("Video link copied!");
                    }
                  }}
                >
                  <Share2 className="max-w-6 max-h-6" />
                </div>
              </div>
              <div className="flex items-center justify-center w-full gap-5 VideoVolume">
                <input
                  type="range"
                  value={volume}
                  min="0"
                  max="100"
                  onChange={(e) => {
                    socket.emit("update-volume", volume);
                    if (playerRef.current)
                      playerRef.current.setVolume(Number(e.target.value));
                    setVolume(Number(e.target.value));
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20 AddtrackContainer">
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
                    <Plus className="max-w-5 max-h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="flex-1 gap-2 p-2 sm:p-5 max-sm:pt-10 bg-black/20 rounded-xl border-1 border-white/20 TracksListContainer">
          {tracks.length > 0 ? (
            <div className="flex flex-col gap-5 items-center justify-center">
              <div className="flex items-center justify-between w-full px-5">
                <h1 className="self-start text-xl sm:text-3xl flex items-center">
                  Tracks : ({tracks.length})
                </h1>
                <button
                  onClick={handleDeleteAll}
                  className="bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl"
                >
                  Clear All
                </button>
              </div>
              <div className="flex-1 w-full overflow-y-auto max-h-[540px] sm:px-5">
                <Reorder.Group
                  axis="y"
                  values={tracks}
                  onReorder={(newOrder) => {
                    setTracks(newOrder);
                    socket.emit("update-tracks", { tracks: newOrder });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 w-full TrackLists"
                >
                  {tracks.map((track: any, index: number) => {
                    const isActive = currentPlayingId === track.id;

                    return (
                      <Reorder.Item
                        key={track.id}
                        value={track}
                        whileDrag={{ scale: 1.05 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border-1 ${
                          isActive && isPlaying
                            ? "border-white bg-white/20"
                            : "border-white/20 bg-black/20"
                        } w-full h-20 px-10`}
                      >
                        <div className="flex flex-col">
                          <h1 className="text-xl font-semibold tracking-wide my-1 text-left line-clamp-1 overflow-hidden break-all">
                            {track.title}
                          </h1>
                          <p className="text-sm text-white/30 line-clamp-1 overflow-hidden break-all">
                            Track: {index + 1}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-10">
                          <div
                            className={`hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer`}
                            onClick={() =>
                              handlePlayPause({ id: track.id, index })
                            }
                          >
                            {isActive && isPlaying ? (
                              <Pause className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115" />
                            ) : (
                              <Play className="w-5 h-5 group-hover:fill-green-400 group-hover:scale-115" />
                            )}
                          </div>

                          <div className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer">
                            <Trash
                              onClick={() => handleDeleteTrack(track.id)}
                              className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115 group-hover:cursor-pointer"
                            />
                          </div>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
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
