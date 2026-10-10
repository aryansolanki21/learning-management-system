import Navbar from "@/components/Navbar.jsx";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col">
      <Navbar />

      <div className="mt-16 min-w-0 w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
