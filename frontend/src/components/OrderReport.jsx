import React, { useState, useRef, useContext } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import html2canvas from "html2canvas";
import { useSnackbar } from "notistack";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuthContext } from "../context/AuthContext";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// API base URL - default to localhost if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

const OrderReport = () => {
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { enqueueSnackbar } = useSnackbar(); // For showing notifications
  const { user } = useContext(AuthContext);

  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  // Handler to generate the order report
  const handleGenerateReport = async () => {
    try {
      if (!user || !user.token) {
        enqueueSnackbar("User not authenticated", { variant: "error" });
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { startDate, endDate, status: statusFilter },
      };
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/report`,
        config
      );
      setReportData(response.data);
        console.log(reportData.statusGroups);
        console.log(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      enqueueSnackbar("Failed to generate report", { variant: "error" });
    }
  };

  // Handler to download the order report as PDF
  const handleDownloadPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(16);
    doc.text("Order Status Report", 14, yPos);
    yPos += 10;

    // Add filter details
    doc.setFontSize(12);
    doc.text(
      `Date Range: ${startDate || "N/A"} to ${endDate || "N/A"}`,
      14,
      yPos
    );
    yPos += 10;
    doc.text(
      `Status: ${
        statusFilter === "all"
          ? "All Statuses"
          : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
      }`,
      14,
      yPos
    );
    yPos += 10;

    // Capture and add Bar Chart
    if (barChartRef.current) {
      const barCanvas = await html2canvas(barChartRef.current, {
        backgroundColor: "#ffffff",
      });
      const barImgData = barCanvas.toDataURL("image/png");
      const barImgProps = doc.getImageProperties(barImgData);
      const barWidth = 90; // Width in mm (A4 page width is 210mm)
      const barHeight = (barImgProps.height * barWidth) / barImgProps.width;
      doc.addImage(barImgData, "PNG", 14, yPos, barWidth, barHeight);
      yPos += barHeight + 10;
    }

    // Capture and add Pie Chart
    if (pieChartRef.current) {
      const pieCanvas = await html2canvas(pieChartRef.current, {
        backgroundColor: "#ffffff",
      });
      const pieImgData = pieCanvas.toDataURL("image/png");
      const pieImgProps = doc.getImageProperties(pieImgData);
      const pieWidth = 90;
      const pieHeight = (pieImgProps.height * pieWidth) / pieImgProps.width;
      doc.addImage(pieImgData, "PNG", 14, yPos, pieWidth, pieHeight);
      yPos += pieHeight + 10;
    }

    // Detailed Orders Tables
    const statuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    for (const status of statuses) {
      const orders = reportData.statusGroups[status];
      if (!orders || orders.length === 0) continue;

      doc.setFontSize(14);
      doc.text(
        `${status.charAt(0).toUpperCase() + status.slice(1)} Orders (Total: ${
          orders.length
        })`,
        14,
        yPos
      );
      yPos += 10;

      const tableData = orders.map((order) => [
        order._id.slice(-6),
        new Date(order.createdAt).toLocaleDateString(),
        order.billingInfo.fullName,
        `$${order.totalPrice.toFixed(2)}`,
        order.status.charAt(0).toUpperCase() + order.status.slice(1),
        order.items
          .map(
            (item, index) =>
              `${index + 1}. ${item.product?.name || "Unknown"} (${
                item.quantity
              }x $${item.price.toFixed(2)})`
          )
          .join("\n"),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Order ID", "Date", "Customer", "Total", "Status", "Items"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [54, 162, 235] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 5: { cellWidth: 60 } }, // Adjust width of "Items" column
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    doc.save("order-report.pdf");
  };

  const getChartData = () => {
  if (!reportData || !reportData.statusGroups)
    return { barData: {}, pieData: {} };

  const statuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];



  const counts = statuses.map(
    (status) => (reportData.statusGroups[status] || []).length
  );
  const totalOrders = counts.reduce((sum, count) => sum + count, 0);
  const percentages = counts.map((count) =>
    totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0
  );


    console.log(reportData);

    const colors = [
      "rgba(255, 206, 86, 0.6)", // Yellow for pending
      "rgba(54, 162, 235, 0.6)", // Blue for processing
      "rgba(153, 102, 255, 0.6)", // Purple for shipped
      "rgba(75, 192, 192, 0.6)", // Teal for delivered
      "rgba(255, 99, 132, 0.6)", // Red for cancelled
    ];

    const barData = {
      labels: statuses.map(
        (status) => status.charAt(0).toUpperCase() + status.slice(1)
      ),
      datasets: [
        {
          label: "Number of Orders",
          data: counts,
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    };

    const pieData = {
      labels: statuses.map(
        (status) => status.charAt(0).toUpperCase() + status.slice(1)
      ),
      datasets: [
        {
          label: "Order Distribution",
          data: percentages,
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    };

    return { barData, pieData };
  };

  const { barData, pieData } = getChartData();

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Order Status Distribution (Count)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Orders",
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Order Status Distribution (%)",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <label
            htmlFor="start-date"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Start Date:
          </label>
          <div className="relative">
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              style={{ paddingRight: "2rem" }}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              📅
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <label
            htmlFor="end-date"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            End Date:
          </label>
          <div className="relative">
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
              style={{ paddingRight: "2rem" }}
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              📅
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <label
            htmlFor="status-filter"
            className="mr-2 text-sm font-medium text-gray-700"
          >
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={handleGenerateReport}
          className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
        >
          Generate Report
        </button>

        {reportData && (
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Download PDF
          </button>
        )}
      </div>

      {reportData && (
        <div>
          {/* Display Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              className="bg-white p-4 rounded-lg shadow-md"
              ref={barChartRef}
            >
              <Bar data={barData} options={barOptions} />
            </div>
            <div
              className="bg-white p-4 rounded-lg shadow-md"
              ref={pieChartRef}
            >
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* Detailed Orders by Status */}
          {Object.keys(reportData.statusGroups).map((status) => {
            const orders = reportData.statusGroups[status];
            if (orders.length === 0) return null;

            return (
              <div key={status} className="mb-8">
                <h3 className="text-lg font-semibold">
                  {status.charAt(0).toUpperCase() + status.slice(1)} Orders
                  (Total: {orders.length})
                </h3>
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order._id.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.billingInfo.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.totalPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.status === "shipped"
                                  ? "bg-purple-100 text-purple-800"
                                  : order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {order.items.map((item, index) => (
                              <div key={index}>
                                {index + 1}. {item.product?.name || "Unknown"} (
                                {item.quantity}x ${item.price.toFixed(2)})
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderReport;
