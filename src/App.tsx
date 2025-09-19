import { Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Host from "./screens/Host";
import Member from "./screens/Member";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div className="absolute top-0 left-0 w-full min-h-screen bg-gradient-to-br from-blue-950 to-green-950 z-0">
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<Host />} />
          <Route path="/member" element={<Member />} />
        </Routes>
      </MainLayout>
      <ToastContainer />
    </div>
  );
}

export default App;
