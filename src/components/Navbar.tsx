import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SocketContext } from "../context/SocketContextProvider";
import { useContext } from "react";
import ButtonBlack from "./common/ButtonBlack";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const { socket } = useContext(SocketContext);

  const handleClick = () => {
    navigate(-1);
    if (socket) {
      socket.disconnect();
    }
  };

  const isHomePage = location.pathname === "/";

  if (isHomePage) {
    return null;
  }
  return (
    <div className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-5 py-2 text-white z-50">
      <div>
        <ButtonBlack
          onClick={handleClick}
          className=" text-white font-semibold flex items-center gap-2"
        >
          <ChevronLeft /> Back
        </ButtonBlack>
      </div>
    </div>
  );
};

export default Navbar;
