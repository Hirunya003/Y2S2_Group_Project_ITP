import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/home/Header";
import AllOrders from "../components/AllOrders/AllOrders"; // Import AllOrders
import { FiShoppingCart, FiCreditCard } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const CashierDashboard = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("transactions");

  // Redirect non-cashier users
  if (!user || user.email !== "cashier@example.com") {
    return <Navigate to="/" />;
  }

  // Fetch transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/transactions`);
        setTransactions(response.data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchTransactions();
  }, []);

  // Refund handler
  const handleRefund = async (id) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/transactions/${id}/refund`);
      setTransactions((prev) =>
        prev.map((trx) =>
          trx._id === id ? { ...trx, status: "Refunded" } : trx
        )
      );
    } catch (error) {
      console.error("Refund failed:", error);
      alert("Failed to refund transaction");
    }
  };

  // Render content based on selected tab
  const renderDashboardContent = () => {
    if (activeTab === "transactions") {
      return (
        <>
          {/* Recent Transactions */}
          <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trx._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trx.orderId && trx.orderId.billingInfo
                          ? trx.orderId.billingInfo.fullName
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rs.{trx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full `}
                        >
                          {new Date(trx.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={() => handleRefund(trx._id)}
                          disabled={trx.status === "Refunded"}
                        >
                          Refund
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      );
    } else if (activeTab === "all-orders") {
      return <AllOrders />;
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Header searchTerm="" setSearchTerm={() => {}} cartCount={0} />

      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Cashier Dashboard</h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "transactions"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiCreditCard className="inline mr-1" /> Transactions
            </button>
            <button
              onClick={() => setActiveTab("all-orders")}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "all-orders"
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiShoppingCart className="inline mr-1" /> All Orders
            </button>
          </div>

          {/* Render dynamic content */}
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
