import { useEffect, useContext, useState } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Play,
  Pause,
  Trash,
  Plus,
  SkipBack,
  SkipForward,
  Share2,
  RefreshCcw,
} from "lucide-react";
import Heading from "../components/Heading";
import YouTube from "react-youtube";
import { extractYouTubeId } from "../components/ExtractYoutubeId";
import yt from "../assets/yt.svg";
import { Reorder } from "framer-motion";

const MemberRoom = ({
  tracks,
  roomId,
  allowMemberControlVolume,
  allowMemberToPlay,
  allowMemberToSync,
}: any) => {
  // console.log("Socket in MemberRoom :", socket);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  // const [syncActive, setSyncActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState<any>("");
  const [trackName, setTrackName] = useState<any>("");
  const [player, setPlayer] = useState<any>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [localTracks, setLocalTracks] = useState(tracks);
  const [volume, setVolume] = useState<Number>(100);

  useEffect(() => {
    setLocalTracks(tracks); // Whenever parent updates tracks, sync local
  }, [tracks]);

  useEffect(() => {
    socket.off("update-volume").on("update-volume", (data: any) => {
      setVolume(data);
    });
  }, [volume]);

  useEffect(() => {
    if (!socket) {
      navigate("/");
      return;
    }

    // Handle track change
    socket
      .off("update-current-playing")
      .on("update-current-playing", (data: { index: number }) => {
        const track = tracks[data.index];
        if (!track) return;

        setSelectedTrack(track);
        setCurrentPlayingId(track.id);

        if (player) {
          player.loadVideoById(track.videoId);
          player.playVideo();
        }
      });

    // Handle play/pause
    socket
      .off("update-playing-status")
      .on("update-playing-status", (data: { value: boolean }) => {
        if (!player) return;

        if (data.value) {
          player.playVideo();
        } else {
          player.pauseVideo();
          setCurrentPlayingId(null); // ✅ Reset UI state when paused
          setSelectedTrack(null);
        }
      });

    socket.off("clear-state").on("clear-state", () => {
      navigate("/");
      toast.error("Host has left the room");
    });
  }, [socket, navigate, player, tracks]);

  const handlePlayPause = ({ id, index }: { id: string; index: number }) => {
    if (!allowMemberToPlay) {
      toast.info("Members are not allowed to play");
      return;
    }

    if (currentPlayingId === id) {
      // Pause
      setCurrentPlayingId(null);
      if (player) player.pauseVideo();

      if (allowMemberToSync) {
        socket.emit("update-playing-status", { value: false });
      }
    } else {
      // Play
      const track = tracks.find((t: any) => t.id === id);
      if (!track) return;

      setSelectedTrack(track);
      setCurrentPlayingId(track.id);

      socket.emit("update-current-playing", { index });
      socket.emit("update-playing-status", { value: true });

      if (player) {
        player.loadVideoById(track.videoId);
        player.playVideo();
      }
    }
  };

  // const handleTrackSelect = (track: any, index: number) => {
  //   setSelectedTrack(track);
  //   setCurrentPlayingId(track.id);

  //   socket.emit("update-current-playing", { index });
  //   socket.emit("update-playing-status", { value: true });

  //   if (player) {
  //     player.loadVideoById(track.videoId);
  //     player.playVideo();
  //   }
  // };

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

  const handleSync = () => {
    socket.emit("sync-request");

    socket.off("sync-response").on("sync-response", (data: any) => {
      console.log("Sync Response in MemberRoom:", data);

      if (data.type === "ERROR") {
        toast.error("Sync Failed");
        return;
      }

      if (!player) {
        toast.error("Player not ready yet");
        return;
      }

      if (data.type === "TIME") {
        const { videoId, currentTime, playerState } = data;

        if (videoId) {
          // Load the video and seek to correct time
          player.loadVideoById(videoId, currentTime);

          // Sync playback state
          if (playerState === 1) {
            // Playing
            player.playVideo();
          } else if (playerState === 2 || playerState === 5) {
            // Paused or cued
            player.pauseVideo();
          }
        } else {
          toast.info("No video currently playing");
          player.stopVideo();
        }

        toast.success("Synced with host");
      }
    });
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
                {selectedTrack ? (
                  <YouTube
                    videoId={extractYouTubeId(selectedTrack?.url)}
                    opts={{
                      height: "150",
                      width: "280",
                      playerVars: { autoplay: 1 },
                    }}
                    onReady={(event) => setPlayer(event.target)} // store player instance
                    onStateChange={(event) => {
                      const playerStatus = event.data; // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused

                      if (playerStatus === 1) {
                        // Playing
                        if (
                          selectedTrack &&
                          currentPlayingId !== selectedTrack.id
                        ) {
                          setCurrentPlayingId(selectedTrack.id);
                          socket.emit("update-playing-status", { value: true });
                        }
                      } else if (playerStatus === 2) {
                        // Paused
                        setCurrentPlayingId(null);
                        socket.emit("update-playing-status", { value: false });
                      } else if (playerStatus === 0) {
                        // Ended -> Auto skip to next track (optional)
                        // handleSkip("next");
                      }
                    }}
                  />
                ) : (
                  // Default black screen placeholder
                  <div className="w-[280px] h-[150px] bg-black rounded-md flex items-center justify-center text-white/40">
                    <img src={yt} alt="yt logo" className="w-20 h-20" />
                  </div>
                )}
              </div>
              <hr className="border-white/20 w-full mt-5" />
              <div className="flex items-center justify-between h-20 w-full">
                <div className="w-1/10 h-0.5 p-5 hidden sm:block"></div>
                <div
                  className={`flex items-center justify-center gap-5 sm:gap-10 p-5 videoControls ${
                    !allowMemberToPlay ? "opacity-50 pointer-events-none" : ""
                  }`}
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
                    {currentPlayingId ? (
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
                {allowMemberControlVolume && (
                  <input
                    type="range"
                    value={volume}
                    min="0"
                    max="100"
                    defaultValue="100"
                    onChange={(e) => {
                      socket.emit("update-volume", volume);
                      if (player) player.setVolume(Number(e.target.value));
                      setVolume(Number(e.target.value));
                    }}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>
          {allowMemberToSync && (
            <button
              onClick={handleSync}
              className="flex gap-3 py-3 px-5 bg-black/30 rounded-xl hover:bg-black hover:scale-105 duration-500 hover:cursor-pointer mx-auto"
            >
              Sync with host <RefreshCcw />
            </button>
          )}

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
                    setLocalTracks(newOrder);
                    socket.emit("update-tracks", { tracks: newOrder });
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-5 w-full TrackLists"
                >
                  {tracks.map((track: any, index: number) => {
                    const isPlaying = currentPlayingId === track.id;

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
                          isPlaying
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
                            className={`hover:bg-white/30 p-2 rounded-full group ${
                              !allowMemberToPlay
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:cursor-pointer"
                            }`}
                            onClick={() =>
                              allowMemberToPlay &&
                              handlePlayPause({ id: track.id, index })
                            }
                          >
                            {isPlaying ? (
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

export default MemberRoom;
