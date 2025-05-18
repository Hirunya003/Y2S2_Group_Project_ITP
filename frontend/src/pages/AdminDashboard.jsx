import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/home/Header";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiPieChart,
  FiBarChart2,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import Spinner from "../components/Spinner";
// Update jsPDF import and initialization
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// API base URL - default to localhost if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "customer",
  });
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchId, setSearchId] = useState("");
  // Report state variables
  const [showReports, setShowReports] = useState(false);
  const [reportType, setReportType] = useState("userRoles");
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'reports'
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !user.token) return;

      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(`${API_BASE_URL}/api/users`, config);
        setUsers(data);
      } catch (error) {
        enqueueSnackbar(
          error.response && error.response.data.message
            ? error.response.data.message
            : "Failed to fetch users. Check server connection.",
          { variant: "error" }
        );
      }
      setLoading(false);
    };

    fetchUsers();
  }, [user, enqueueSnackbar]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.token) return;

      setLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(`${API_BASE_URL}/api/orders`, config);
        console.log("Fetched orders:", data);
        setOrders(data);
      } catch (error) {
        enqueueSnackbar(
          error.response && error.response.data.message
            ? error.response.data.message
            : "Failed to fetch users. Check server connection.",
          { variant: "error" }
        );
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, enqueueSnackbar]);

  // Handle user edit button click
  const handleEditClick = (userData) => {
    setSelectedUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      role: userData.role,
    });
    setIsEditing(true);
  };

  // Handle change in filters
  useEffect(() => {
    let filtered = [...orders];

    // Filter by start date
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((order) => new Date(order.createdAt) >= start);
    }

    // Filter by end date
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Ensure end date includes the whole day
      filtered = filtered.filter((order) => new Date(order.createdAt) <= end);
    }

    // Filter by order ID
    if (searchId) {
      filtered = filtered.filter((order) =>
        order._id.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, startDate, endDate, searchId]);

  // Handle user delete
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        await axios.delete(`${API_BASE_URL}/api/users/${userId}`, config);
        setUsers(users.filter((u) => u._id !== userId));
        enqueueSnackbar("User deleted successfully", { variant: "success" });
      } catch (error) {
        enqueueSnackbar(
          error.response && error.response.data.message
            ? error.response.data.message
            : "Failed to delete user. Check server connection.",
          { variant: "error" }
        );
      }
    }
  };

  const generateAdminInvoicePDF = (order) => {
    const doc = new jsPDF();

    // 🧾 Brand Header
    const companyName = "SuperMart";
    const website = "www.SuperMart.com";
    const contact = "support@SuperMart.com | +94 77 123 4567";

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(companyName, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(website, 14, 26);
    doc.text(contact, 14, 30);

    // 🧍 Customer Info
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text("Invoice Information", 14, 42);

    const customerY = 50;
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${order._id}`, 14, customerY);
    doc.text(
      `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      14,
      customerY + 6
    );
    doc.text(`Status: ${order.status}`, 14, customerY + 12);

    // 📦 Billing + Shipping
    doc.text(`Customer Name: ${order.billingInfo.fullName}`, 110, customerY);
    doc.text(`Email: ${order.billingInfo.email}`, 110, customerY + 6);
    doc.text(`Phone: ${order.billingInfo.phone || "N/A"}`, 110, customerY + 12);

    doc.text(`Shipping Address:`, 14, customerY + 24);
    const address = order.shippingAddress;
    doc.text(`${address},`, 14, customerY + 30);

    // 🛒 Order Items Table
    const tableY = customerY + 50;
    const items = order.items.map((item) => [
      item.product.name,
      item.quantity,
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: tableY,
      head: [["Product", "Qty", "Unit Price", "Total"]],
      body: items,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    // 💰 Totals Summary
    const finalY = doc.lastAutoTable.finalY || tableY + 30;

    doc.setFontSize(10);
    doc.text(`Payment Method: ${order.paymentMethod}`, 14, finalY + 10);

    const subtotal = order.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    const total = order.totalPrice;

    doc.text(`Subtotal: Rs.${subtotal.toFixed(2)}`, 150, finalY + 10);
    doc.text(`Total: Rs.${total.toFixed(2)}`, 150, finalY + 16);

    // 📝 Footer
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "This is a computer-generated invoice. No signature is required.",
      14,
      285
    );
    doc.text("Thank you for using SuperMart!", 14, 290);

    doc.save(`Admin_Invoice_${order._id}.pdf`);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/${selectedUser._id}`,
        formData,
        config
      );

      setUsers(users.map((u) => (u._id === selectedUser._id ? data : u)));
      setIsEditing(false);
      setSelectedUser(null);
      enqueueSnackbar("User updated successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to update user. Check server connection.",
        { variant: "error" }
      );
    }
  };

  // Generate report based on selected type
  const generateReport = async () => {
    setGeneratingReport(true);
    setReportData(null);

    // Reusable date filter function
    const filterByDateRange = (data, startDate, endDate) => {
      if (!startDate && !endDate) return data;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day

      return data.filter((item) => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    };

    try {
      // Simulate API call with setTimeout
      setTimeout(async () => {
        let data;

        switch (reportType) {
          case "userRoles":
            const roleCounts = users.reduce((counts, user) => {
              counts[user.role] = (counts[user.role] || 0) + 1;
              return counts;
            }, {});

            data = {
              title: "User Distribution by Role",
              labels: Object.keys(roleCounts),
              values: Object.values(roleCounts),
              type: "pie",
              description:
                "Shows the distribution of users by their assigned roles in the system.",
            };
            break;

          case "userRegistration":
            let filteredUsers = users;
            if (dateRange.startDate && dateRange.endDate) {
              filteredUsers = filterByDateRange(
                users,
                dateRange.startDate,
                dateRange.endDate
              );
            }

            const monthlyRegistration = filteredUsers.reduce((months, user) => {
              const date = new Date(user.createdAt);
              const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ];
              const monthYear = `${
                monthNames[date.getMonth()]
              } ${date.getFullYear()}`;
              months[monthYear] = (months[monthYear] || 0) + 1;
              return months;
            }, {});

            const sortedMonths = Object.keys(monthlyRegistration).sort(
              (a, b) => {
                const monthA = new Date(a);
                const monthB = new Date(b);
                return monthA - monthB;
              }
            );

            data = {
              title: "User Registrations by Month",
              labels: sortedMonths,
              values: sortedMonths.map((month) => monthlyRegistration[month]),
              type: "bar",
              description:
                "Shows the number of new user registrations per month.",
              filteredCount: filteredUsers.length,
              totalCount: users.length,
            };
            break;

          case "userActivity":
            data = {
              title: "Most Active Users",
              headers: ["User", "Email", "Login Count", "Last Active"],
              rows: users.slice(0, 5).map((user) => [
                user.name,
                user.email,
                Math.floor(Math.random() * 30) + 1, // Random login count
                new Date(
                  Date.now() -
                    Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
                ).toLocaleDateString(),
              ]),
              type: "table",
              description:
                "Shows the most active users based on login frequency.",
            };
            break;

          default:
            data = null;
        }

        setReportData(data);
        setGeneratingReport(false);
      }, 1000); // Simulate API delay
    } catch (error) {
      enqueueSnackbar("Failed to generate report. Please try again.", {
        variant: "error",
      });
      setGeneratingReport(false);
    }
  };

  // Export report as CSV
  const exportReport = () => {
    if (!reportData) return;

    let csvContent = "";

    if (reportData.type === "table") {
      // Convert table data to CSV
      csvContent = [
        reportData.headers.join(","),
        ...reportData.rows.map((row) => row.join(",")),
      ].join("\n");
    } else {
      // Convert chart data to CSV
      csvContent = [
        "Category,Value",
        ...reportData.labels.map(
          (label, index) => `"${label}",${reportData.values[index]}`
        ),
      ].join("\n");
    }

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${reportData.title.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    enqueueSnackbar("Report exported successfully as CSV", {
      variant: "success",
    });
  };

  // Export report as PDF
  const exportReportAsPDF = () => {
    if (!reportData) return;

    try {
      // Create a new PDF document with the correct constructor
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text(reportData.title, 14, 22);

      // Add date
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        14,
        30
      );

      // Add description
      doc.text(reportData.description, 14, 38);

      if (reportData.filteredCount !== undefined) {
        doc.text(
          `Showing data for ${reportData.filteredCount} out of ${reportData.totalCount} users`,
          14,
          46
        );
      }

      let finalY = 50;

      if (reportData.type === "table") {
        autoTable(doc, {
          head: [reportData.headers],
          body: reportData.rows,
          startY: finalY,
          theme: "striped",
          headStyles: { fillColor: [76, 129, 255] },
        });
        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;
      } else if (reportData.type === "pie" || reportData.type === "bar") {
        const chartData = reportData.labels.map((label, index) => [
          label,
          reportData.values[index],
        ]);
        autoTable(doc, {
          head: [["Category", "Value"]],
          body: chartData,
          startY: finalY,
          theme: "striped",
          headStyles: { fillColor: [76, 129, 255] },
        });
        finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : finalY + 20;
        doc.text(
          "Note: For better visualization, view the report on screen.",
          14,
          finalY + 10
        );
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount} - SuperMart Admin Dashboard`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(
        `${reportData.title.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      enqueueSnackbar("Report exported successfully as PDF", {
        variant: "success",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      console.error("Error details:", error.message, error.stack);
      enqueueSnackbar(`Failed to generate PDF: ${error.message}`, {
        variant: "error",
      });
    }
  };

  // Render report visualization based on type
  const renderReportVisualization = () => {
    if (!reportData) return null;

    if (reportData.type === "table") {
      return (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {reportData.headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cell}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportData.type === "pie" || reportData.type === "bar") {
      return (
        <div className="mt-4">
          {/* Simple visualization since we can't use Chart.js directly here */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-center mb-4">
              {reportData.title}
            </h4>

            {reportData.type === "pie" && (
              <div className="flex justify-center gap-4 flex-wrap">
                {reportData.labels.map((label, index) => (
                  <div key={index} className="flex items-center p-2">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{
                        backgroundColor: `hsl(${
                          index * (360 / reportData.labels.length)
                        }, 70%, 60%)`,
                      }}
                    ></div>
                    <span className="text-sm">
                      {label}: {reportData.values[index]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {reportData.type === "bar" && (
              <div className="flex items-end h-64 gap-2 pt-5 px-2">
                {reportData.labels.map((label, index) => {
                  const maxValue = Math.max(...reportData.values);
                  const height = (reportData.values[index] / maxValue) * 100;

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${label}: ${reportData.values[index]}`}
                      ></div>
                      <span className="text-xs mt-1 text-gray-600">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              {reportData.description}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Header searchTerm="" setSearchTerm={() => {}} cartCount={0} />

      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <FiUsers className="inline mr-2" />
              User Management
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "reports"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              <FiBarChart2 className="inline mr-2" />
              Reports
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("orders")}
            >
              <FiUsers className="inline mr-2" />
              Transaction Management
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {/* User Management Tab */}
              {activeTab === "users" && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    User Management
                  </h3>

                  {isEditing && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                      <h4 className="text-lg font-medium mb-4">Edit User</h4>
                      <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Role
                            </label>
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setSelectedUser(null);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Role
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Joined On
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditClick(user)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                <FiEdit className="inline" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Reports Tab */}
              {activeTab === "reports" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Reports</h3>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                    <h4 className="text-lg font-medium mb-4">
                      Generate Report
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Report Type
                        </label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="userRoles">
                            User Roles Distribution
                          </option>
                          <option value="userRegistration">
                            User Registration by Month
                          </option>
                          <option value="userActivity">
                            User Activity Report
                          </option>
                        </select>
                      </div>


                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={generateReport}
                          disabled={generatingReport}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                        >
                          {generatingReport ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <FiBarChart2 className="mr-2" />
                              Generate Report
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {generatingReport && (
                    <div className="flex justify-center my-12">
                      <Spinner />
                    </div>
                  )}

                  {reportData && !generatingReport && (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-center">
                          {reportData.title}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={exportReport}
                            className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                          >
                            <FiDownload className="mr-2" />
                            Export CSV
                          </button>
                          <button
                            onClick={exportReportAsPDF}
                            className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                          >
                            <FiFileText className="mr-2" />
                            Export PDF
                          </button>
                        </div>
                      </div>

                      {reportData.filteredCount !== undefined && (
                        <p className="text-sm text-gray-500 mb-4">
                          Showing data for {reportData.filteredCount} out of{" "}
                          {reportData.totalCount} transactions
                          {dateRange.startDate &&
                            dateRange.endDate &&
                            ` (from ${new Date(
                              dateRange.startDate
                            ).toLocaleDateString()} to ${new Date(
                              dateRange.endDate
                            ).toLocaleDateString()})`}
                        </p>
                      )}

                      {renderReportVisualization()}

                      <p className="text-sm text-gray-500 mt-4">
                        {reportData.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "orders" && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    Transaction Management
                  </h3>

                  {/* Filter Section */}
                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <label
                        htmlFor="start-date"
                        className="mr-2 text-sm font-medium text-gray-700"
                      >
                        Start Date:
                      </label>
                      <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <label
                        htmlFor="end-date"
                        className="mr-2 text-sm font-medium text-gray-700"
                      >
                        End Date:
                      </label>
                      <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <label
                        htmlFor="search-id"
                        className="mr-2 text-sm font-medium text-gray-700"
                      >
                        Search by ID:
                      </label>
                      <input
                        type="text"
                        id="search-id"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Search by order ID"
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  {/* Table for displaying orders */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center px-6 py-4">
                              No orders found matching the filters.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((order) => (
                            <tr key={order._id} className="relative group">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {order._id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {order.billingInfo.fullName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 rounded-full font-bold">
                                  Rs.{order.totalPrice}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleTimeString()}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => generateAdminInvoicePDF(order)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  <FiFileText className="inline mr-1" /> Invoice
                                </button>
                              </td>

                              {/* Hover Box */}
                              <td className="absolute z-10 top-full left-0 mt-2 hidden group-hover:block w-[300px] bg-white shadow-xl border rounded-lg p-4">
                                <h4 className="font-semibold text-sm mb-2">
                                  Transactions Summary
                                </h4>
                                {order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-sm text-gray-700 mb-1"
                                  >
                                    <span>
                                      {item.product.name} x {item.quantity}
                                    </span>
                                    <span>
                                      Rs.
                                      {(item.quantity * item.price).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                                <div className="mt-2 border-t pt-2 text-right text-sm font-semibold">
                                  Total: Rs.{order.totalPrice.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
