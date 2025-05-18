import React, { useEffect, useState } from 'react';
import api from '../axios';
import AddSupplier from './AddSupplier';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierToEdit, setSupplierToEdit] = useState(null); // State to hold the supplier being edited

  useEffect(() => {
    const fetchSuppliers = async () => {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    };
    fetchSuppliers();
  }, []);

  const handleSupplierAdded = (newSupplier) => {
    setSuppliers((prevSuppliers) => [...prevSuppliers, newSupplier]);
  };

  const handleSupplierUpdated = (updatedSupplier) => {
    setSuppliers((prevSuppliers) =>
      prevSuppliers.map((supplier) =>
        supplier.supplierId === updatedSupplier.supplierId ? updatedSupplier : supplier
      )
    );
    setSupplierToEdit(null); // Clear the supplier being edited
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await api.delete(`/suppliers/${supplierId}`);
      setSuppliers((prevSuppliers) => prevSuppliers.filter(supplier => supplier.supplierId !== supplierId));
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const handleEditSupplier = (supplier) => {
    setSupplierToEdit(supplier); // Set the supplier to be edited
  };

  return (
    <div className="max-w-7xl font-bold mx-auto px-4 py-10">
      Add Supplier Form
      <div className="mb-10">
        <AddSupplier
          onSupplierAdded={handleSupplierAdded}
          supplierToEdit={supplierToEdit}
          onSupplierUpdated={handleSupplierUpdated}
        />
      </div>
  
      {/* Table Heading */}
      <h2 className="text-2xl font-bold text-green-500 mb-4 text-center">Supplier Database</h2>
  
      {/* Supplier Table */}
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-green-500 text-white uppercase text-sm">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Product Name</th>
              <th className="px-4 py-3 text-left">Cost</th>
              <th className="px-4 py-3 text-left">Selling Price</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {suppliers.map((supplier) => (
              <tr key={supplier.supplierId} className="hover:bg-gray-100">
                <td className="px-4 py-2">{supplier.supplierId}</td>
                <td className="px-4 py-2">{supplier.supplierName}</td>
                <td className="px-4 py-2">
                  {supplier.contact.email}<br />
                  <span className="text-xs text-gray-500">{supplier.contact.phone}</span>
                </td>
                <td className="px-4 py-2">{supplier.productName}</td>
                <td className="px-4 py-2">Rs. {supplier.costPrice}</td>
                <td className="px-4 py-2">Rs. {supplier.sellingPrice}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => handleEditSupplier(supplier)}
                    className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.supplierId)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierList;
