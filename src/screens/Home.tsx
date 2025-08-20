import Heading from "../components/Heading";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContextProvider";
import { io } from "socket.io-client";
import { useContext } from "react";

const Home = () => {
  const { setSocket } = useContext(SocketContext);
  const navigate = useNavigate();
  // const handleClick = (role: string) => {
  //   if (role === "host") {
  //     navigate("/host");
      
  //   } else if (role === "member") {
  //     navigate("/member");
  //   }
  // };
  
  const handleClick = (role: string) => {
    let socket: any;

    if (role === "host") {
      
      socket = io(import.meta.env.VITE_SOCKET_SERVER);
      setSocket(socket);

      socket.on("connect", () => {
        console.log("Connected as Host with socket id:", socket.id);
      });
      navigate("/host");

    } else if (role === "member") {
      socket = io(import.meta.env.VITE_SOCKET_SERVER);
      setSocket(socket);

      socket.on("connect", () => {
        console.log("Connected as Member with socket id:", socket.id);
      });

      navigate("/member");
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-between h-screen text-white relative">
      <div className="flex justify-center items-center w-full mt-10">
        <img
          src="/src/assets/ShareVID.png"
          alt="logo"
          className=" w-auto h-25"
        />
      </div>
      <div className="flex flex-col items-center justify-center w-full h-full gap-5 ">
        <Heading text="Welcome to the ShareVID" />
        <h1 className="text-center text-2xl">
          The Live Streaming Platform for your Family and Friends
        </h1>
        <div className="flex flex-col items-center justify-center gap-2  my-5 p-5 bg-black/20 rounded-xl border-1 border-white/20">
          <h1 className="text-3xl font-semibold tracking-wide my-1">
            Select your role
          </h1>
          <p className="text-md font-extralight ">
            Host for Create Room & Member for Join Room
          </p>
          <div className="w-full flex justify-center items-center gap-20 p-2">
            <button
              onClick={() => handleClick("host")}
              className="bg-transparent border-1 hover:bg-blue-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500 flex items-center gap-2"
            >
              <img
                src="/src/assets/host.svg"
                alt="host"
                className="w-5 h-5 invert-100"
              />
              Host
            </button>
            <button
              onClick={() => handleClick("member")}
              className="bg-transparent border-1 hover:bg-green-600 text-white font-semibold py-2 px-7 rounded-xl hover:cursor-pointer hover:scale-105 transition-all duration-500
						flex items-center gap-2"
            >
              <img
                src="/src/assets/member.svg"
                alt="member"
                className="w-5 h-5"
              />
              Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
