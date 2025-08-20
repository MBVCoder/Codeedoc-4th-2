import Heading from "../components/Heading";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useEffect , useState, useContext } from "react";
import { SocketContext } from "../context/SocketContextProvider";
import { toast } from "react-toastify";

const Member = () => {
	const [roomId, setRoomId] = useState("");
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!socket) {
      navigate("/");
    }
  }, []);

	const handleSubmit = (e: any) => {
		if (roomId.trim() === "") {
      toast.error("Room ID cannot be empty");
      return;
    }
    e.preventDefault();
		socket.emit("join-room",roomId);
    navigate(`/memberRoom/${roomId}`);
    setRoomId("");
  };
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen text-white relative">
        <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
          <Heading text="Member" />
          <div className="mt-5">
            <p className="capitalize">Enter room name to join</p>
            <hr className="w-1/2 mx-auto mt-2" />
          </div>
          <form onSubmit={handleSubmit} className="flex w-fit items-center justify-center gap-2 p-5 bg-black/20 rounded-xl border-1 border-white/20">
            <input
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
              type="text"
              placeholder="Enter Room Name"
              className="w-full rounded-xl border-1 border-white/20 p-2 text-center focus:outline-0"
            />
            <button type="submit" className="bg-transparent border-1 hover:bg-green-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2">
              Join <Plus />
            </button>
          </form>
          <p>
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
