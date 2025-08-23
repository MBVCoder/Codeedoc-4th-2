import Heading from "../components/Heading";
import { Link , useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useEffect, useState, useContext , useRef } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { toast } from "react-toastify";
import MemberRoom from "./MemberRoom";

const Member = () => {
  const [roomId, setRoomId] = useState("");
  const [roomJoined, setRoomJoined] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [allowMemberControlVolume, setAllowMemberControlVolume] =
    useState(false);
  const [allowMemberToPlay, setAllowMemberToPlay] = useState(false);
  const [allowMemberToSync, setAllowMemberToSync] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (roomId.trim() === "") {
      toast.error("Room ID cannot be empty");
      return;
    }
    socket.emit("join-room", roomId);
  };

  useEffect(() => {
    inputRef.current?.focus();
    if (!socket) {
      toast.error("Socket Disconnected!!");
      navigate("/");
    } else {
      socket.off("join-room").on("join-room", (data: any) => {
        if (data.type === "ERROR") {
          toast.error("Room not found");
        } else {
          toast.success("Joined the room");
          setRoomJoined((prev: boolean) => !prev);
          setAllowMemberControlVolume(data.allowMemberControlVolume);
          setAllowMemberToPlay(data.allowMemberToPlay);
          setAllowMemberToSync(data.allowMemberToSync);
        }
      });
      socket.off("room-tracks").on("room-tracks", (data: any) => {
        console.log("Room Tracks in Member:", data);
        setTracks(data);
      });
    }
  }, [socket, navigate, handleSubmit]);

  if (roomJoined) {
    return <MemberRoom tracks={tracks} roomId={roomId} allowMemberControlVolume={allowMemberControlVolume} allowMemberToPlay={allowMemberToPlay} allowMemberToSync={allowMemberToSync} />;
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen text-white relative">
        <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
          <Heading text="Member" />
          <div className="mt-5">
            <p className="max-md:text-sm text-center capitalize px-2 sm:px-0">Enter room name to join</p>
            <hr className="w-1/2 mx-auto mt-2" />
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex max-sm:flex-col w-fit items-center justify-center gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20 mx-5 sm:mx-0"
          >
            <input
              ref={inputRef}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              type="text"
              placeholder="Enter Room Name"
              className="w-full rounded-xl border-1 border-white/20 p-2 max-sm:text-sm  text-center focus:outline-0"
            />
            <button
              type="submit"
              className="bg-transparent border-1 hover:bg-green-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2 max-sm:text-sm "
            >
              Join <Plus className="w-5 h-5 fill-green-600" />
            </button>
          </form>
          <p className="text-center">
            Not have any room ?{" "}
            <Link to={"/"} className="text-blue-400 underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Member;
