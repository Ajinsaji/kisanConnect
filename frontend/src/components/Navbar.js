import { ShoppingCartIcon, UserIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

function Navbar({ title = "Kissan Connect" }) {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white border-b border-green-300 shadow-sm">
      {/* Colorful top strip */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-yellow-400 to-orange-400"></div>

      <div className="h-20 px-6 md:px-12 grid grid-cols-3 items-center">
        <div
          onClick={() => navigate("/")}
          className="justify-self-start text-2xl font-bold text-green-700 cursor-pointer"
        >
          🌾 Kissan Connect
        </div>

        <div className="justify-self-center text-lg md:text-xl font-semibold text-green-800">
          {title}
        </div>

        <div className="justify-self-end flex gap-6">
          <button
            onClick={() => navigate("/cart")}
            className="p-2 rounded-full hover:bg-green-100 transition"
            title="Shopping Cart"
          >
            <ShoppingCartIcon className="w-7 h-7 text-green-700" />
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full hover:bg-green-100 transition"
            title="View Profile"
          >
            <UserIcon className="w-7 h-7 text-green-700" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
