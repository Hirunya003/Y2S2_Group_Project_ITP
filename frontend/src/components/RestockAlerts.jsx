import React, { useEffect, useState } from 'react';
import api from '../axios';


const RestockAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await api.get('/restock-alerts');
      setAlerts(res.data.items || []);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-red-600">🔔 Restocking Alerts</h2>

      {alerts.length === 0 ? (
        <p className="text-center text-gray-500">No low stock items at the moment ✅</p>
      ) : (
        <ul className="space-y-4">
          {alerts.map((item) => (
            <li key={item.itemId} className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="text-lg font-semibold text-gray-800">
                ⚠️ {item.name} — <span className="text-red-500 font-bold">Stock: {item.stockLevel}</span>
              </div>
              <div className="text-sm text-gray-700 mt-1">
                Supplier: <span className="font-medium">{item.supplierId?.supplierName}</span><br />
                Contact: {item.supplierId?.contact?.email} {item.supplierId?.contact?.phone && `(${item.supplierId.contact.phone})`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RestockAlerts;
