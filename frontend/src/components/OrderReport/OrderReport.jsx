import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import './OrderReport.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const OrderReport = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!user) {
      enqueueSnackbar('Please log in to generate a report', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob',
      };
      const requestUrl = `${API_BASE_URL}/api/orders/report${status ? `?status=${status}` : ''}`;
      console.log(`Sending request to: ${requestUrl}`);
      const response = await axios.get(requestUrl, config);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-report-${status || 'all'}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('Report with charts and table downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error generating report:', error);
      enqueueSnackbar(`Failed to generate report: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-report-container">
      <h2>Generate Order Report</h2>
      <p className="description">Select an order status to download a report </p>
      <div className="report-form">
        <label htmlFor="status">Order Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
        >
         
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={handleGenerateReport}
          className="generate-report-btn"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        {loading && <div className="spinner" aria-label="Loading"></div>}
      </div>
    </div>
  );
};

export default OrderReport;