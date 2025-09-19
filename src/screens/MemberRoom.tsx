import { useEffect, useContext, useState, useRef } from "react";
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
  Volume2,
  VolumeOff,
  Disc2,
  Disc3,
} from "lucide-react";
import Heading from "../components/Heading";
import YouTubePlayer from "youtube-player";
import { extractYouTubeId } from "../components/ExtractYoutubeId";
import { Reorder } from "framer-motion";
import Controller from "../components/common/Controller";
import ButtonBlack from "../components/common/ButtonBlack";
import InputVolume from "../components/common/InputVolume";
import Input from "../components/common/Input";
import Card from "../components/common/Card";

const MemberRoom = ({
  tracks,
  roomId,
  allowMemberControlVolume,
  allowMemberToPlay,
  allowMemberToSync,
  joinPlayingIndex,
  joinVideoVolume,
}: any) => {
  // console.log("Socket in MemberRoom :", socket);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  // const [syncActive, setSyncActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState<any>("");
  const [trackName, setTrackName] = useState<any>("");
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [localTracks, setLocalTracks] = useState(tracks);
  const [videoVolume, setVideoVolume] = useState<Number>(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncActive, setSyncActive] = useState(false);
  console.log("Sync Active :", syncActive);

  useEffect(() => {
    // console.log("local TRacks :", localTracks);
    // console.log("Join Playing Id :", joinPlayingIndex);
    if (joinPlayingIndex != null && localTracks[joinPlayingIndex]) {
      const track = localTracks[joinPlayingIndex];
      setSelectedTrack(track);
      setCurrentPlayingId(track.id);
      setIsPlaying(true);
    }
    if (joinVideoVolume != null) {
      setVideoVolume(joinVideoVolume);
    }
  }, [joinPlayingIndex, joinVideoVolume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);

    setVideoVolume(newVolume);

    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }

    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      socket.emit("update-volume", newVolume);
    }, 10);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    playerRef.current = YouTubePlayer(containerRef.current, {
      height: "150",
      width: "280",
      playerVars: { autoplay: 1, playsinline: 1 },
    });

    playerRef.current.on("ready", (event) => {
      console.log(event);
    });

    playerRef.current.on("stateChange", (event: any) => {
      if (event.data === 1) {
        // socket.emit("update-playing-status", { value: true });
        setIsPlaying(true);
      } else if (event.data === 2) {
        // socket.emit("update-playing-status", { value: false });
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
    setLocalTracks(tracks); // Whenever parent updates tracks, sync local
  }, [tracks]);

  useEffect(() => {
    socket.off("update-volume").on("update-volume", (data: Number) => {
      setVideoVolume(data);
    });
    if (playerRef.current) {
      playerRef.current.setVolume(videoVolume);
    }
  }, [videoVolume]);

  useEffect(() => {
    if (!socket) {
      navigate("/");
      return;
    }
    socket
      .off("update-current-playing")
      .on("update-current-playing", (data: { index: number }) => {
        const track = tracks[data.index];
        if (!track) return;

        setSelectedTrack(track);
        setCurrentPlayingId(track.id);

        if (playerRef.current) {
          playerRef.current.loadVideoById(track.videoId);
        }
      });

    socket
      .off("update-playing-status")
      .on("update-playing-status", (data: boolean) => {
        if (!playerRef.current) return;

        if (data) {
          playerRef.current.playVideo();
          setIsPlaying(true);
        } else {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      });
  }, [socket, navigate, playerRef.current, tracks]);

  useEffect(() => {
    if (!socket) return;
    socket.off("sync-response").on("sync-response", (data: any) => {
      console.log("Sync Response in MemberRoom:", data);

      if (data.type === "ERROR") {
        toast.error("Sync Failed");
        return;
      }

      if (!playerRef.current) {
        toast.error("Player not ready yet");
        return;
      }

      if (data.type === "TIME") {
        const { videoId, currentTime, playerState } = data;

        if (videoId) {
          // Load the video and seek to correct time
          playerRef.current.loadVideoById(videoId, currentTime);

          // Sync playback state
          if (playerState === 1) {
            // Playing
            playerRef.current.playVideo();
          } else if (playerState === 2 || playerState === 5) {
            // Paused or cued
            playerRef.current.pauseVideo();
          }
          toast.success("Synced with host");
        } else {
          toast.info("No video currently playing");
          playerRef.current.stopVideo();
        }
      }
    });
    socket.off("clear-state").on("clear-state", () => {
      navigate("/");
      toast.error("Host has left the room");
      socket.disconnect();
    });
  }, [socket]);

  const handlePlayPause = ({ id, index }: { id: string; index: number }) => {
    if (!allowMemberToPlay) {
      toast.info("Members are not allowed to play");
      return;
    }

    if (currentPlayingId === id) {
      if (isPlaying) {
        // 👉 Pause
        playerRef.current?.pauseVideo();
        socket.emit("update-playing-status", { value: false });
        setIsPlaying(false);
      } else {
        // 👉 Resume
        playerRef.current?.playVideo();
        socket.emit("update-playing-status", { value: true });
        setIsPlaying(true);
      }
    } else {
      // 👉 Play a new track
      setCurrentPlayingId(id);
      const track = tracks.find((t: any) => t.id === id);
      setSelectedTrack(track);

      // emit current track index
      socket.emit("update-current-playing", { index });

      // emit playing status
      socket.emit("update-playing-status", { value: true });

      if (playerRef.current && track) {
        playerRef.current.loadVideoById(track.videoId);
        playerRef.current.playVideo();
        console.log("playerRef.current video load", playerRef.current);
        setIsPlaying(true);
      }
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

  // const handleDeleteAll = () => {
  //   socket.emit("update-tracks", { tracks: [] });
  // };

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
    setSyncActive(true);
  };
  const handleSyncOff = () => {
    setSyncActive(false);
    playerRef.current?.stopVideo();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white relative p-5 max-lg:pt-15 ">
      <div className="py-3 flex max-sm:flex-col items-center justify-center gap-5">
        <Heading text="Welcome to the Room :" />
        <h1 className="text-center text-2xl  sm:text-4xl font-semibold text-white">
          {roomId}
        </h1>
      </div>
      <div className="flex max-lg:flex-col gap-4 w-full flex-1 Video&TracksContainer">
        <div className="flex-1 lg:max-w-[500px] space-y-2 VideoContainer">
          <div className=" bg-black/20 rounded-xl border-1 border-white/20 VideoContainer p-5">
            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  {/* Always mount the YouTube player */}
                  <div className={`${syncActive ? "block" : "invisible"}`}>
                    <div ref={containerRef} className={`w-[280px] h-[150px]`} />
                  </div>

                  {/* Overlay fallback UI when sync is OFF */}
                  {!syncActive && (
                    <div className="absolute inset-0 flex gap-3 justify-center items-center bg-black/30 rounded-md w-[280px] h-[150px]">
                      {isPlaying ? <Disc3 /> : <Disc2 />}
                      <h1 className="text-2xl">
                        {selectedTrack
                          ? selectedTrack.title
                          : "No Track Playing"}
                      </h1>
                    </div>
                  )}
                </div>
              </div>
              <hr className="border-white/20 w-full mt-5" />
              <div className="flex items-center justify-between h-20 w-full">
                <div className="size-[64px] h-0.5 p-5"></div>
                <div
                  className={`flex items-center justify-center gap-5 sm:gap-10 p-5 videoControls ${
                    !allowMemberToPlay ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Controller onClick={() => handleSkip("prev")}>
                    <SkipBack className="max-w-6 max-h-6 group-hover:fill-blue-400" />
                  </Controller>

                  <Controller
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
                  </Controller>

                  <Controller onClick={() => handleSkip("next")}>
                    <SkipForward className="max-w-6 max-h-6 group-hover:fill-blue-400" />
                  </Controller>
                </div>

                <Controller
                  className="!p-5 "
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
                </Controller>
              </div>
              <div
                className={`flex items-center justify-center w-full gap-5 VideoVolume ${
                  allowMemberControlVolume ? "block" : "hidden"
                } `}
              >
                {videoVolume === 0 ? <VolumeOff /> : <Volume2 />}
                {allowMemberControlVolume && (
                  <InputVolume
                    type="range"
                    min="0"
                    max="100"
                    value={videoVolume.toString()}
                    onChange={handleVolumeChange}
                  />
                )}
              </div>
            </div>
          </div>
          {allowMemberToSync &&
            (syncActive ? (
              <ButtonBlack
                onClick={handleSyncOff}
                className="flex gap-3 !py-3 !px-5 !rounded-xl hover:scale-105 !duration-500 mx-auto"
              >
                {" "}
                Pause Sync
                <RefreshCcw />
              </ButtonBlack>
            ) : (
              <ButtonBlack
                onClick={handleSync}
                className="flex gap-3 !py-3 !px-5 !rounded-xl hover:scale-105 !duration-500 mx-auto"
              >
                {" "}
                Sync With Host
                <RefreshCcw />
              </ButtonBlack>
            ))}

          <Card className=" AddtrackContainer">
            <div className="border-b-1 border-white/80 p-3">
              <h1 className="text-2xl font-semibold tracking-wide text-center">
                Add New Track
              </h1>
            </div>
            <div className="flex items-center justify-center w-full">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col items-center justify-center gap-5 py-2 mb-3">
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    type="text"
                    placeholder="Enter link ...."
                    className=" h-full !border-2 px-6 py-3 !text-left"
                  />
                  <Input
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    type="text"
                    placeholder="Enter title ...."
                    className=" h-full !border-2 px-6 py-3 !text-left"
                  />
                </div>
                <div className="flex justify-center items-center w-full">
                  <ButtonBlack
                    type="submit"
                    className=" text-white !rounded-xl !px-6 !py-3 w-full h-full flex items-center justify-center gap-2"
                  >
                    Add
                    <Plus className="max-w-5 max-h-5" />
                  </ButtonBlack>
                </div>
              </form>
            </div>
          </Card>
        </div>
        <div className="flex-1 gap-2 p-2 sm:p-5 max-sm:pt-10 bg-black/20 rounded-xl border-1 border-white/20 TracksListContainer max-h-[660px]">
          {tracks.length > 0 ? (
            <div className="flex flex-col gap-5 items-center justify-center">
              <div className="flex items-center justify-between w-full px-5">
                <h1 className="self-start text-xl sm:text-3xl flex items-center">
                  Tracks : ({tracks.length})
                </h1>
                {/* <button
                  onClick={handleDeleteAll}
                  className="bg-black/30 hover:bg-black hover:scale-105 duration-300 hover:cursor-pointer px-5 py-2 rounded-2xl"
                >
                  Clear All
                </button> */}
              </div>
              <div className="flex-1 w-full overflow-y-auto max-[2200px]:max-h-[550px] sm:px-5">
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
                    const isThisTrack = currentPlayingId === track.id;

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
                          isThisTrack && isPlaying
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
                        <div className="flex items-center justify-center gap-5 xl:gap-10">
                          <Controller
                            className={`${
                              !allowMemberToPlay
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:cursor-pointer"
                            }`}
                            onClick={() =>
                              allowMemberToPlay &&
                              handlePlayPause({ id: track.id, index })
                            }
                          >
                            {isThisTrack && isPlaying ? (
                              <Pause className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115" />
                            ) : (
                              <Play className="w-5 h-5 group-hover:fill-green-400 group-hover:scale-115" />
                            )}
                          </Controller>

                          <Controller
                            onClick={() => handleDeleteTrack(track.id)}
                          >
                            <Trash className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115 group-hover:cursor-pointer" />
                          </Controller>
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
