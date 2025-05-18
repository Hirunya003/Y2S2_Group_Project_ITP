import React, { useState, useRef , useEffect } from 'react';
import api from '../axios';

const PerformanceReport = () => {
  const [supplierId, setSupplierId] = useState('');
  const [performance, setPerformance] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'update'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef(null);
  const [allSuppliers, setAllSuppliers] = useState([]);

  
  // Form states for updating performance
  const [orderId, setOrderId] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [qualityRating, setQualityRating] = useState('');
  const [isAccurate, setIsAccurate] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchPerformance = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      
      const res = await api.get(`/supplier-performance/${supplierId}`);
      setPerformance(res.data);
      
      // Also fetch orders for this supplier
      await fetchOrders();
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setMessage('Error fetching performance data');
      setMessageType('error');
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchAllSuppliers = async () => {
      try {
        const res = await api.get('/suppliers');
        setAllSuppliers(res.data);
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      }
    };
  
    fetchAllSuppliers();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/supplier-orders/${supplierId}`);
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updatePerformance = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (!supplierId || !orderId) {
        setMessage('Supplier ID and Order ID are required');
        setMessageType('error');
        setIsLoading(false);
        return;
      }

      const payload = {
        supplierId,
        orderId,
        deliveryTime: deliveryTime ? Number(deliveryTime) : undefined,
        qualityRating: qualityRating ? Number(qualityRating) : undefined,
        isAccurate
      };

      const res = await api.post('/update-supplier-performance', payload);
      setMessage('Performance updated successfully');
      setMessageType('success');
      setPerformance(res.data.performance);
      
      // Reset form fields
      setOrderId('');
      setDeliveryTime('');
      setQualityRating('');
      setIsAccurate(true);
      setSelectedOrder(null);
      
      // Refresh orders list
      await fetchOrders();
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setMessage(error.response?.data?.message || 'Error updating performance');
      setMessageType('error');
      console.error(error);
    }
  };

  const handleOrderSelect = (order) => {
    setOrderId(order.orderId);
    setSelectedOrder(order);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            className={`w-5 h-5 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'} 
                      ${i === fullStars && hasHalfStar ? 'text-yellow-400' : ''}`}
            fill={i < fullStars || (i === fullStars && hasHalfStar) ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
          </svg>
        ))}
        <span className="ml-2 text-gray-700">{rating ? rating.toFixed(1) : '0.0'}</span>
      </div>
    );
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = document.getElementById('print-section');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    
    window.print();
    
    document.body.innerHTML = originalContents;
    
    // Re-initialize the component state and event handlers after printing
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-bold text-center text-green-500 mb-6">
        Supplier Performance Management
      </h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${messageType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
  <select
    value={supplierId}
    onChange={(e) => setSupplierId(e.target.value)}
    className="flex-1 px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
  >
    <option value="">-- Select Supplier ID --</option>
    {allSuppliers.map((supplier) => (
      <option key={supplier._id} value={supplier.supplierId}>
        {supplier.supplierId} - {supplier.supplierName}
      </option>
    ))}
  </select>
  <button
    onClick={fetchPerformance}
    disabled={isLoading}
    className={`px-6 py-2 rounded-md text-white transition ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-300'}`}
  >
    {isLoading ? 'Loading...' : 'Get Data'}
  </button>
</div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('view')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'view' 
                ? 'border-green-300 text-green-500' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            View Performance
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'update' 
                ? 'border-green-300 text-green-500' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Update Performance
          </button>
        </nav>
      </div>
      
      {/* Print Button - Only show when performance data is available */}
      {performance && activeTab === 'view' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Performance Report
          </button>
        </div>
      )}
      
      {/* View Performance Section */}
      {activeTab === 'view' && (
        <>
          {/* Print Section - This is what gets printed */}
          <div id="print-section" ref={printRef}>
            {performance && (
              <div>
                {/* Print-only header that won't show in the UI */}
                <div className="print:block hidden mb-8">
                  <h1 className="text-2xl font-bold text-center">Supplier Performance Report</h1>
                  <p className="text-center text-gray-500">Supplier ID: {supplierId}</p>
                  <p className="text-center text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
                  <hr className="my-4" />
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 print:bg-white print:border-0">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Performance Metrics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                    <div className="p-4 bg-white rounded shadow print:shadow-none print:border print:border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Average Delivery Time</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performance.deliveryTime ? performance.deliveryTime.toFixed(1) : '0'} days
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded shadow print:shadow-none print:border print:border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Quality Rating</p>
                      <div className="mt-1">
                        {getRatingStars(performance.qualityRating)}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded shadow print:shadow-none print:border print:border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Order Accuracy</p>
                      <p className={`text-2xl font-bold ${getAccuracyColor(performance.accuracy)}`}>
                        {performance.accuracy ? performance.accuracy.toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded shadow print:shadow-none print:border print:border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {performance.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              
                {orders.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 print:bg-white print:border-0">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Order History</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white print:border print:border-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Cost
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order.orderId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.orderId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.items?.length || 0} items
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${order.totalCost?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                                <button
                                  onClick={() => {
                                    setActiveTab('update');
                                    handleOrderSelect(order);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Add Performance
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Print footer */}
                <div className="mt-8 text-center text-gray-500 print:block hidden">
                  <p>© {new Date().getFullYear()} Sell X SuperMarket.</p>
                  <p>This report is confidential and intended for internal use only.</p>
                </div>
              </div>
            )}
          </div>
          
          {!performance && !orders.length && supplierId && !isLoading && (
            <div className="text-center p-8 text-gray-500">
              No performance data available for this supplier
            </div>
          )}
        </>
      )}
      
      {/* Update Performance Section */}
      {activeTab === 'update' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Order</h3>
            
            {orders.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <div 
                    key={order.orderId}
                    onClick={() => handleOrderSelect(order)}
                    className={`p-3 rounded cursor-pointer ${
                      selectedOrder?.orderId === order.orderId 
                        ? 'bg-blue-100 border-blue-300 border' 
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <p className="font-medium">{order.orderId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm mt-1">${order.totalCost?.toFixed(2) || '0.00'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No orders available</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <form onSubmit={updatePerformance} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Update Performance Metrics</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="orderId">
                  Order ID*
                </label>
                <input
                  id="orderId"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryTime">
                  Delivery Time (days)
                </label>
                <input
                  id="deliveryTime"
                  type="number"
                  min="0"
                  step="0.1"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <p className="mt-1 text-sm text-gray-500">Average time from order to delivery in days</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="qualityRating">
                  Quality Rating (0-5)
                </label>
                <input
                  id="qualityRating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={qualityRating}
                  onChange={(e) => setQualityRating(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <p className="mt-1 text-sm text-gray-500">Rate the quality of products from 0 (poor) to 5 (excellent)</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Order Accuracy
                </label>
                <div className="flex items-center">
                  <input
                    id="accurate"
                    type="radio"
                    name="accuracy"
                    checked={isAccurate === true}
                    onChange={() => setIsAccurate(true)}
                    className="mr-2 accent-green-500"
                  />
                  <label htmlFor="accurate" className="mr-6">Accurate</label>
                  
                  <input
                    id="inaccurate"
                    type="radio"
                    name="accuracy"
                    checked={isAccurate === false}
                    onChange={() => setIsAccurate(false)}
                    className="mr-2 accent-green-500 "
                  />
                  <label htmlFor="inaccurate">Inaccurate</label>
                </div>
                <p className="mt-1 text-sm text-gray-500">Was the order delivered correctly as requested?</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-6 py-3 rounded-md text-white font-medium transition ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-300'
                }`}
              >
                {isLoading ? 'Updating...' : 'Update Supplier Performance'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page { margin: 0.5cm; }
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:border { border: 1px solid #e2e8f0 !important; }
          .print\\:border-gray-200 { border-color: #e2e8f0 !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:bg-gray-100 { background-color: #f7fafc !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </div>
  );
};

export default PerformanceReport;