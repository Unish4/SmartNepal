import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import EmailVerificationBanner from "./EmailVerificationBanner.jsx";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <EmailVerificationBanner />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
