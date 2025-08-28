import {Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Host from "./screens/Host";
import Member from "./screens/Member";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div className="absolute top-0 left-0 w-full min-h-screen h-full bg-gradient-to-br from-blue-950 to-green-950 z-0">
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />
        <Route
          path="/host"
          element={
            <MainLayout>
              <Host />
            </MainLayout>
          }
        />
        <Route
          path="/member"
          element={
            <MainLayout>
              <Member />
            </MainLayout>
          }
        />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
