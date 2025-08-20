import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Host from "./screens/Host";
import Member from "./screens/Member";
import MemberRoom from "./screens/MemberRoom";
import HostRoom from "./screens/HostRoom";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/host" element={<MainLayout><Host /></MainLayout>} />
          <Route path="/member" element={<MainLayout><Member /></MainLayout>} />
          <Route path="/memberRoom/:roomId" element={<MainLayout><MemberRoom /></MainLayout>} />
          <Route path="/hostRoom/:roomId" element={<MainLayout><HostRoom /></MainLayout>} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
