import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-gray-400 mb-4">Page not found.</p>
      <Link
        to="/"
        className="text-blue-400 hover:text-blue-300 underline text-sm"
      >
        Go back to login
      </Link>
    </div>
  );
}

export default NotFound;