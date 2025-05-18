import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Spinner from '../Spinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5555';

const StockHistory = ({ productId, token }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        let url = `${API_BASE_URL}/api/inventory/history`;
        if (productId) {
          url = `${API_BASE_URL}/api/inventory/products/${productId}/history`;
        }

        const { data } = await axios.get(url, config);
        setHistory(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stock history:', error);
        enqueueSnackbar('Failed to load stock history', { variant: 'error' });
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, productId, enqueueSnackbar]);

  const getChangeTypeLabel = (type) => {
    switch (type) {
      case 'add': return 'Stock Added';
      case 'remove': return 'Stock Removed';
      case 'adjust': return 'Stock Adjusted';
      case 'expire': return 'Stock Expired';
      default: return type;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {productId ? 'Product Stock History' : 'Inventory Activity Log'}
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No stock history found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!productId && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Old Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  {!productId && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.product?.name || 'Unknown Product'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.changeType === 'add'
                          ? 'bg-green-100 text-green-800'
                          : item.changeType === 'remove'
                          ? 'bg-red-100 text-red-800'
                          : item.changeType === 'expire'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getChangeTypeLabel(item.changeType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item.previousStock}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item.newStock}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.notes || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item.performedBy?.name || 'Unknown User'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockHistory;
