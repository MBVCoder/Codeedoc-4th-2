// MemberRoom.tsx
import { useEffect, useContext, useState, useMemo } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Heading from "../components/Heading";
import YouTube from "react-youtube";
import { extractYouTubeId } from "../components/ExtractYoutubeId";
import yt from "../assets/yt.svg";
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

type Track = {
  id: string;
  title: string;
  url: string;
  videoId: string;
};

const MemberRoom = ({
  roomId,
  tracks,
}: {
  roomId: string;
  tracks: Track[];
}) => {
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  // --- Video / playback state
  const [player, setPlayer] = useState<any>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // --- Add new track form
  const [videoUrl, setVideoUrl] = useState("");
  const [trackName, setTrackName] = useState("");

  // --- Smooth DnD: local copy while dragging
  const [localTracks, setLocalTracks] = useState<Track[]>(tracks);

  // Keep local list in sync when server/parent updates
  useEffect(() => {
    setLocalTracks(tracks);
  }, [tracks]);

  // If selected id exists and list changes, resolve the object ref again
  useEffect(() => {
    if (currentPlayingId && localTracks.length) {
      const t = localTracks.find((x) => x.id === currentPlayingId) || null;
      setSelectedTrack(t);
    }
  }, [localTracks, currentPlayingId]);

  // Navigation / socket presence
  useEffect(() => {
    if (!socket) {
      toast.error("Socket disconnected");
      navigate("/");
      return;
    }

    // If host leaves
    socket.off("clear-state").on("clear-state", () => {
      navigate("/");
      toast.error("Host has left the room");
    });

    // If the track order is updated by someone else (host or another member)
    socket.off("room-tracks").on("room-tracks", (serverTracks: Track[]) => {
      setLocalTracks(serverTracks);
    });

    // Host (or member) changed current playing by index
    // When any client (host or member) changes the current track
    socket
      .off("update-current-playing")
      .on("update-current-playing", (data: { index: number }) => {
        const arr = (localTracks?.length ? localTracks : tracks) as Track[];
        const next = arr[data.index];
        if (!next) return;

        setCurrentPlayingId(next.id);
        setSelectedTrack(next);

        if (player) {
          player.loadVideoById(next.videoId);
        }
      });

    // Host (or member) toggled play/pause
    socket
      .off("update-playing-status")
      .on("update-playing-status", (data: { value: boolean }) => {
        setIsPlaying(data.value); // drives play/pause icons globally

        if (!player) return;
        if (data.value) player.playVideo();
        else player.pauseVideo();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, player, isPlaying, localTracks, tracks, navigate]);

  // Helper to get index for a track id (from the **current** local order)
  const indexById = (id: string) => {
    return localTracks.findIndex((t) => t.id === id);
  };

  const handlePlayPause = ({ id }: { id: string }) => {
    const track = localTracks.find((t) => t.id === id);
    if (!track) return;

    // If this track is currently playing -> toggle pause
    if (currentPlayingId === id && isPlaying) {
      setIsPlaying(false);
      socket.emit("update-playing-status", { value: false });
      if (player) player.pauseVideo();
      return;
    }

    // Otherwise, play this track
    const idx = indexById(id);
    setCurrentPlayingId(track.id);
    setSelectedTrack(track);
    setIsPlaying(true);

    socket.emit("update-current-playing", { index: idx });
    socket.emit("update-playing-status", { value: true });

    if (player) {
      player.loadVideoById(track.videoId);
      player.playVideo();
    }
  };

  const handleSkip = (direction: "prev" | "next") => {
    if (!localTracks.length || !selectedTrack) return;

    const currentIndex = indexById(selectedTrack.id);
    if (currentIndex === -1) return;

    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + localTracks.length) % localTracks.length
        : (currentIndex + 1) % localTracks.length;

    const next = localTracks[newIndex];
    if (!next) return;

    setCurrentPlayingId(next.id);
    setSelectedTrack(next);
    setIsPlaying(true);

    socket.emit("update-current-playing", { index: newIndex });
    socket.emit("update-playing-status", { value: true });

    if (player) {
      player.loadVideoById(next.videoId);
      player.playVideo();
    }
  };

  // Add a new track
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      toast.error("Invalid YouTube URL");
      return;
    }

    const newTrack: Track = {
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

  // Delete helpers
  const handleDeleteAll = () => {
    socket.emit("update-tracks", { tracks: [] });
  };

  const handleDeleteTrack = (id: string) => {
    const next = localTracks.filter((t) => t.id !== id);
    socket.emit("update-tracks", { tracks: next });
  };

  // Share helper
  const copySelectedUrl = () => {
    if (!selectedTrack?.url) return;
    navigator.clipboard.writeText(selectedTrack.url);
    toast.success("Video link copied!");
  };

  // Play/Pause button icon switch
  const PlayPauseIcon = useMemo(() => (isPlaying ? Pause : Play), [isPlaying]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative p-5 pt-10">
      <div className="py-3 flex items-center justify-center gap-5">
        <Heading text="Welcome to the Room :" />
        <h1 className="text-center text-4xl font-semibold text-white">
          {roomId}
        </h1>
      </div>

      <div className="flex max-md:flex-col gap-4 w-full flex-1">
        {/* Video */}
        <div className="flex-1 md:max-w-[500px] space-y-4">
          <div className="bg-black/20 rounded-xl border-1 border-white/20 p-5">
            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-5">
                {selectedTrack ? (
                  <YouTube
                    videoId={selectedTrack.videoId}
                    opts={{
                      height: "150",
                      width: "280",
                      playerVars: { autoplay: 1 },
                    }}
                    onReady={(event) => setPlayer(event.target)}
                  />
                ) : (
                  <div className="w-[280px] h-[150px] bg-black rounded-md flex items-center justify-center text-white/40">
                    <img src={yt} alt="yt logo" className="w-20 h-20" />
                  </div>
                )}
              </div>

              <hr className="border-white/20 w-full mt-5" />

              {/* Controls */}
              <div className="flex items-center justify-between h-20 w-full">
                <div className="w-1/10 h-0.5 p-5" />
                <div className="flex items-center justify-center gap-10 p-5">
                  <div className="flex items-center justify-center gap-10 p-5">
                    <div
                      className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                      onClick={() => handleSkip("prev")}
                    >
                      <SkipBack className="w-6 h-6 group-hover:fill-blue-400" />
                    </div>

                    <div
                      className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                      onClick={() => {
                        if (selectedTrack) {
                          handlePlayPause({ id: selectedTrack.id });
                        } else if (localTracks.length > 0) {
                          handlePlayPause({ id: localTracks[0].id });
                        }
                      }}
                    >
                      <PlayPauseIcon className="w-6 h-6" />
                    </div>

                    <div
                      className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                      onClick={() => handleSkip("next")}
                    >
                      <SkipForward className="w-6 h-6 group-hover:fill-blue-400" />
                    </div>
                  </div>
                </div>

                <div
                  className="p-5 hover:bg-white/30 rounded-full hover:cursor-pointer"
                  onClick={copySelectedUrl}
                >
                  <Share2 />
                </div>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-center w-full gap-5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="100"
                  onChange={(e) => {
                    if (player) player.setVolume(Number(e.target.value));
                  }}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Add track */}
          <div className="flex flex-col items-center justify-center gap-2 my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20">
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
                    className="w-full h-full border-2 border-white/20 rounded-xl px-6 py-3 focus:outline-0"
                  />
                </div>
                <div className="flex justify-center items-center">
                  <button
                    type="submit"
                    className="bg-black/40 hover:bg-black text-white rounded-xl px-6 py-3 w-full h-full hover:cursor-pointer duration-300 flex items-center justify-center gap-2"
                  >
                    Add <Plus className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Track list with smooth DnD */}
        <div className="flex-1 gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20">
          {localTracks.length > 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 w-full">
              <div className="flex items-center justify-between w-full px-5">
                <h1 className="self-start text-3xl">
                  Tracks : ({localTracks.length})
                </h1>
                <button
                  onClick={handleDeleteAll}
                  className="bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl"
                >
                  Clear All
                </button>
              </div>

              <Reorder.Group
                axis="y"
                values={localTracks}
                onReorder={setLocalTracks} // local only (smooth)
                className="flex flex-col items-center justify-center gap-2 p-5 w-full"
              >
                {localTracks.map((track, index) => {
                  const isThisPlaying =
                    currentPlayingId === track.id && isPlaying;
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
                      // emit final order when a drag finishes
                      onDragEnd={() => {
                        socket.emit("update-tracks", { tracks: localTracks });
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border-1 ${
                        isThisPlaying
                          ? "border-white bg-white/20"
                          : "border-white/20 bg-black/20"
                      } w-full h-20 px-10`}
                    >
                      <div className="flex flex-col">
                        <h1 className="text-xl font-semibold my-1 text-left line-clamp-1 break-all">
                          {track.title}
                        </h1>
                        <p className="text-sm text-white/30">Track: {index}</p>
                      </div>

                      <div className="flex items-center justify-center gap-10">
                        <div
                          className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer"
                          onClick={() => handlePlayPause({ id: track.id })}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-5 h-5 group-hover:fill-red-400" />
                          ) : (
                            <Play className="w-5 h-5 group-hover:fill-green-400" />
                          )}
                        </div>

                        <div className="hover:bg-white/30 p-2 rounded-full group hover:cursor-pointer">
                          <Trash
                            onClick={() => handleDeleteTrack(track.id)}
                            className="w-5 h-5 group-hover:fill-red-400 group-hover:cursor-pointer"
                          />
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
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
