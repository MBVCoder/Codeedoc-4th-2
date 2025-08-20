import Heading from "../components/Heading";
import { BadgePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContextProvider";
import { useContext } from "react";

const Host = () => {
  const { socket } = useContext(SocketContext);
  console.log("Socket in Host :", socket);
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    if (!socket) {
      navigate("/");
    }
  },[]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    socket.emit("create-room", { roomId });
    navigate(`/hostRoom/${roomId}`);
    setRoomId("");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white relative">
      <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
        <Heading text="Host" />
        <div className="mt-5">
          <p className="capitalize">
            Enter any name for your Room & Share with your friends to join
          </p>
          <hr className="w-1/2 mx-auto mt-2" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-fit items-center justify-center gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20"
        >
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            placeholder="Enter Room Name"
            className="w-full rounded-xl border-1 border-white/20 p-2 text-center focus:outline-0 "
          />
          <button
            type="submit"
            className="bg-transparent border-1 hover:bg-blue-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2"
          >
            Create <BadgePlus />
          </button>
        </form>
        <p>
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
