
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="glass-panel p-8 text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-white/80 mb-6">Oops! Page not found</p>
        <a href="/" className="glass-button px-6 py-3 inline-block">
          Return to Music Player
        </a>
      </div>
    </div>
  );
};

export default NotFound;
