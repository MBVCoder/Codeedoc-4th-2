import {Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Host from "./screens/Host";
import Member from "./screens/Member";
import MainLayout from "./components/MainLayout";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
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
    </>
  );
}

export default App;
