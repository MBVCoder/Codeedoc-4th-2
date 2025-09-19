import { Reorder } from "framer-motion";
import { Play, Pause, Trash } from "lucide-react";
import Controller from "./common/Controller";

interface TrackItemProps {
  track: any;
  index: number;
  currentPlayingId: string | null;
  isPlaying: boolean;
  onPlayPause: (id: string, index: number) => void;
  onDelete: (id: string) => void;
  allowPlay?: boolean; // for MemberRoom restriction
}

const TrackItem = ({
  track,
  index,
  currentPlayingId,
  isPlaying,
  onPlayPause,
  onDelete,
  allowPlay = true,
}: TrackItemProps) => {
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
          className={`${!allowPlay ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => allowPlay && onPlayPause(track.id, index)}
        >
          {isThisTrack && isPlaying ? (
            <Pause className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115" />
          ) : (
            <Play className="w-5 h-5 group-hover:fill-green-400 group-hover:scale-115" />
          )}
        </Controller>
        <Controller onClick={() => onDelete(track.id)}>
          <Trash className="w-5 h-5 group-hover:fill-red-400 group-hover:scale-115 group-hover:cursor-pointer" />
        </Controller>
      </div>
    </Reorder.Item>
  );
};

export default TrackItem;
