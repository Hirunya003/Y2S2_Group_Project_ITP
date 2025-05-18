import React, { useState, useEffect } from 'react';
import api from '../axios';

const AddSupplier = ({ onSupplierAdded, supplierToEdit, onSupplierUpdated }) => {
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setSupplierId(supplierToEdit.supplierId);
      setSupplierName(supplierToEdit.supplierName);
      setEmail(supplierToEdit.contact.email);
      setPhone(supplierToEdit.contact.phone);
      setProductName(supplierToEdit.productName);
      setCostPrice(supplierToEdit.costPrice);
      setSellingPrice(supplierToEdit.sellingPrice);
    } else {
      resetForm();
    }
  }, [supplierToEdit]);

  const resetForm = () => {
    setSupplierId('');
    setSupplierName('');
    setEmail('');
    setPhone('');
    setProductName('');
    setCostPrice('');
    setSellingPrice('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const newSupplier = {
        supplierId: supplierToEdit ? supplierToEdit.supplierId : supplierId,
        supplierName,
        contact: {
          email,
          phone,
        },
        productName,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
      };

      if (supplierToEdit) {
        const res = await api.put(`/suppliers/${supplierToEdit.supplierId}`, newSupplier);
        setSuccess('Supplier updated successfully!');
        if (typeof onSupplierUpdated === 'function') {
          onSupplierUpdated(res.data);
        } else {
          console.warn('onSupplierUpdated is not a function');
        }
      } else {
        const res = await api.post('/suppliers', newSupplier);
        setSuccess('Supplier added successfully!');
        if (typeof onSupplierAdded === 'function') {
          onSupplierAdded(res.data);
        } else {
          console.warn('onSupplierAdded is not a function');
        }
      }

      // Reset form on success
      if (!supplierToEdit) {
        resetForm();
      }
    } catch (error) {
      console.error('Error adding/updating supplier:', error);
      const errorMsg = error.response?.data?.error?.message || 
                     error.response?.data?.message || 
                     'Failed to save supplier. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-green-500">
        {supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier ID</label>
          <input
            type="text"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g. SUP1004"
            disabled={supplierToEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cost Price</label>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price</label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          className={`w-full ${loading ? 'bg-blue-400' : 'bg-green-500 hover:bg-green-300'} text-white py-2 px-4 rounded-lg font-semibold transition duration-200`}
          disabled={loading}
        >
          {loading ? 'Saving...' : (supplierToEdit ? 'Update Supplier' : 'Add Supplier')}
        </button>
      </form>
    </div>
  );
};

export default AddSupplier;


