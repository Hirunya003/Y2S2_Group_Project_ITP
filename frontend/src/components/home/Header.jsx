import React, { useContext, useState } from 'react';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiLogIn, FiChevronDown, FiUserPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Header = ({ searchTerm, setSearchTerm, cartCount }) => {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-400 text-white rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <Link to="/">
            <h1 className="text-4xl font-bold">SmartMart</h1>
            <p className="text-lg">Fresh products at your fingertips</p>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              className="py-2 px-4 pr-10 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute right-3 top-3 text-gray-500" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Link
                to="/cart"
                className="flex items-center justify-center hover:bg-green-700 rounded-full w-10 h-10 transition-all duration-200"
              >
                <FiShoppingCart className="text-2xl cursor-pointer" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Admin Login Icon */}
            <Link
              to="/admin-login"
              className="flex items-center justify-center hover:bg-green-700 rounded-full w-10 h-10 transition-all duration-200"
              title="Admin Login"
            >
              <i className="fas fa-user-shield text-xl"></i>
            </Link>

            {user ? (
              <div className="relative ml-2">
                <button
                  className="flex items-center gap-2 bg-green-700 rounded-full pl-2 pr-3 py-1 hover:bg-green-800 transition-all duration-200"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="bg-white text-green-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden md:inline font-medium">
                    {user.name}
                  </span>
                  <FiChevronDown
                    className={`transition-transform duration-200 ${
                      dropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu with better styling */}
                {dropdownOpen && (
                  <div className="absolute right-0 w-56 mt-2 py-2 bg-white rounded-md shadow-lg z-20 border border-gray-100 animate-fade-in-down">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiUser className="mr-2" /> My Profile
                    </Link>
                    {user.role === "customer" && (
                        <Link
                      to="/my-transactions"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FiUser className="mr-2" />
                      My Transactions
                    </Link>
                      )
                    }
                    

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 4.5c-4.5 0-7.5 3-7.5 7.5 0 7.5 7.5 9 7.5 9s7.5-1.5 7.5-9c0-4.5-3-7.5-7.5-7.5z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}

                    {user.role === "cashier" && (
                      <Link
                        to="/cashier"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser className="mr-2" />
                        Cashier Dashboard
                      </Link>
                    )}

                    {user.role === "storekeeper" && (
                      <Link
                        to="/storekeeper"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser className="mr-2" />
                        Storekeeper Dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-all duration-200 font-medium"
                >
                  <FiLogIn className="text-lg" />
                  <span>Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="hidden md:flex items-center gap-2 bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                >
                  <FiUserPlus className="text-lg" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
