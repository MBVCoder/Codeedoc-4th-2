import Heading from "../components/Heading";
import { BadgePlus } from "lucide-react";
import { useEffect, useState, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContextProvider";
import HostRoom from "./HostRoom";
import { toast } from "react-toastify";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import InputCheck from "../components/common/InputCheck";
import Card from "../components/common/Card";

const Host = () => {
  const { socket } = useContext(SocketContext);
  console.log("Socket in Host :", socket);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState("");
  const [roomCreated, setRoomCreated] = useState(false);
  const [allowMemberToPlay, setallowMemberToPlay] = useState(true);
  const [allowMemberToSync, setallowMemberToSync] = useState(true);
  const [allowMemberControlVolume, setallowMemberControlVolume] =
    useState(true);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    inputRef.current?.focus();
    if (!socket) {
      // toast.error("Socket Disconnected!!");
      navigate("/");
    } else {
      socket.off("join-room").on("join-room", (data: any) => {
        if (data.type === "ERROR") {
          toast.error(data.message);
        } else {
          setRoomCreated((prev: boolean) => !prev);
          toast.success("Joined the room");
        }
      });
      socket.off("room-tracks").on("room-tracks", (data: any) => {
        console.log("Room Tracks in Host:", data);
        setTracks(data);
      });
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
      allowMemberToPlay,
      allowMemberToSync,
      allowMemberControlVolume,
    });
  };

  if (roomCreated) {
    return <HostRoom roomId={roomId} tracks={tracks} />;
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
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="flex items-center justify-center gap-2 p-5 ">
              <Input
                ref={inputRef}
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room Name"
              />
              <Button
                type="submit"
                className=" hover:bg-blue-600  max-sm:text-sm "
              >
                Create <BadgePlus className="w-5 h-5 fill-green-600" />
              </Button>
            </div>
            <div className="flex flex-col justify-center gap-2 ">
              <div className="flex gap-3 items-center">
                <InputCheck
                  type="checkbox"
                  checked={allowMemberToPlay}
                  onChange={() => setallowMemberToPlay((prev) => !prev)}
                />
                <p className="text-md text-left tracking-wide">Allow to play</p>
              </div>
              <div className="flex gap-3 items-center">
                <InputCheck
                  type="checkbox"
                  checked={allowMemberToSync}
                  onChange={() => setallowMemberToSync((prev) => !prev)}
                />
                <p className="text-md text-left tracking-wide">Allow to sync</p>
              </div>
              <div className="flex gap-3 items-center">
                <InputCheck
                  type="checkbox"
                  checked={allowMemberControlVolume}
                  onChange={() => setallowMemberControlVolume((prev) => !prev)}
                />
                <p className="text-md text-left tracking-wide">
                  Allow to control volume
                </p>
              </div>
            </div>
          </Card>
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
