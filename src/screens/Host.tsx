import Heading from "../components/Heading";
import { BadgePlus } from "lucide-react";
import { useEffect, useState, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContextProvider";
import HostRoom from "./HostRoom";
import { toast } from "react-toastify";

const Host = () => {
  const { socket } = useContext(SocketContext);
  console.log("Socket in Host :", socket);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState("");
  const [allowMemberControlVolume, setAllowMemberControlVolume] =
    useState(true);
  const [allowMemberToPlay, setAllowMemberToPlay] = useState(true);
  const [allowMemberToSync, setAllowMemberToSync] = useState(true);
  const [roomCreated, setRoomCreated] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    if (!socket) {
      toast.error("Socket Disconnected!!");
      navigate("/");
    }
  }, [socket, navigate]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (roomId.trim() === "") {
      toast.error("Room ID cannot be empty");
      return;
    }
    socket.emit("create-room", {
      roomId,
      allowMemberControlVolume,
      allowMemberToPlay,
      allowMemberToSync,
    });
    setRoomCreated((prev: boolean) => !prev);
  };

  if (roomCreated) {
    return <HostRoom roomId={roomId} />;
  }
  return (
    <div className="flex flex-col items-center justify-center h-screen text-white relative">
      <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
        <Heading text="Host" />
        <div className="mt-5">
          <p className="max-md:text-sm text-center capitalize px-2 sm:px-0">
            Enter any name for your Room & Share with your friends to join
          </p>
          <hr className="w-1/2 mx-auto mt-2" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center justify-center gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20 mx-5 sm:mx-0"
        >
          <div className="flex max-sm:flex-col w-fit items-center justify-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room Name"
              className="w-full rounded-xl border-1 border-white/20 p-2 max-sm:text-sm  text-center focus:outline-0 "
            />
            <button
              type="submit"
              className="bg-transparent border-1 hover:bg-blue-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2 max-sm:text-sm "
            >
              Create <BadgePlus className="w-5 h-5 fill-green-600" />
            </button>
          </div>

          <div className="flex flex-col items-start justify-center gap-3 p-5">
            <div className="flex gap-3">
              <input
                type="checkbox"
                className="checkbox accent-green-600"
                checked={allowMemberToPlay}
                onChange={() => setAllowMemberToPlay((prev) => !prev)}
              />
              <label className="label-inline">
                <span className="label-text">Allow Members to play</span>
              </label>
            </div>
            <div className="flex gap-3">
              <input
                type="checkbox"
                className="checkbox accent-green-600"
                checked={allowMemberControlVolume}
                onChange={() => setAllowMemberControlVolume((prev) => !prev)}
              />
              <label className="label-inline">
                <span className="label-text">
                  Allow Members to control volume
                </span>
              </label>
            </div>
            <div className="flex gap-3">
              <input
                type="checkbox"
                className="checkbox accent-green-600"
                checked={allowMemberToSync}
                onChange={() => setAllowMemberToSync((prev) => !prev)}
              />
              <label className="label-inline">
                <span className="label-text">
                  Allow Members to sync with host
                </span>
              </label>
            </div>
          </div>
        </form>
        <p className="text-center">
          Want to Join any room ?{" "}
          <Link to={"/"} className="text-blue-400 underline">
            Join one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Host;
