import React, { useState, useEffect } from 'react';
import api from '../axios';

const PurchaseOrder = () => {
  const [supplierId, setSupplierId] = useState('');
  const [supplierData, setSupplierData] = useState(null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [items, setItems] = useState([{ name: '', quantity: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Fetch all suppliers on first load
  useEffect(() => {
    fetchAllSuppliers();
  }, []);

  // Fetch supplier details when supplierId is selected
  useEffect(() => {
    if (supplierId) {
      fetchSupplierData();
    }
  }, [supplierId]);

  const fetchAllSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setAllSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/suppliers/${supplierId}`);
      setSupplierData(res.data);

      if (res.data?.productName) {
        setItems([{ name: res.data.productName, quantity: 0 }]);
      }

      setError('');
      setLoading(false);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('Supplier not found');
      setSupplierData(null);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/generate-order', { supplierId, items });
      alert(res.data.message);
      setSupplierId('');
      setItems([{ name: '', quantity: 0 }]);
      setSupplierData(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate order');
      console.error(error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: supplierData?.productName || '', quantity: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-green-500">
        Generate Purchase Order
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier ID Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Supplier ID</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Select Supplier ID --</option>
            {allSuppliers.map((supplier) => (
              <option key={supplier._id} value={supplier.supplierId}>
                {supplier.supplierId} - {supplier.supplierName}
              </option>
            ))}
          </select>
          {loading && <p className="text-blue-500 mt-1">Loading supplier data...</p>}
          {error && <p className="text-red-500 mt-1">{error}</p>}
        </div>

        {/* Supplier Details Card */}
        {supplierData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium">Supplier: {supplierData.supplierName}</h3>
            <p>Product: {supplierData.productName}</p>
            <p>Cost Price: Rs. {supplierData.costPrice}</p>
          </div>
        )}

        {/* Order Items */}
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <input
              type="text"
              value={item.name}
              readOnly
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
            <input
              type="number"
              placeholder="Quantity"
              min={1}
              value={item.quantity}
              onChange={(e) => {
                const newItems = [...items];
                newItems[idx].quantity = Number(e.target.value);
                setItems(newItems);
              }}
              required
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(idx)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        ))}

        {/* Add Item Button */}
        {supplierData && (
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
          >
            + Add Item
          </button>
        )}

        {/* Submit Order */}
        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
          disabled={!supplierData}
        >
          Generate Order
        </button>
      </form>
    </div>
  );
};

export default PurchaseOrder;
