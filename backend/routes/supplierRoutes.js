import { Router } from 'express';
const router = Router();
import { getSuppliers, checkRestockAlerts, generatePurchaseOrder, getSupplierById, getSupplierPerformance, addSupplier, getSupplierOrders, updateSupplierPerformance } from '../controllers/supplierController.js'; // ✅ use controller functions
import Supplier from "../models/SupplierModel.js";


// 1. Get all suppliers
router.get('/suppliers', getSuppliers);

// 2. Check restock alerts
router.get('/restock-alerts', checkRestockAlerts);

// 3. Generate purchase order
router.post('/generate-order', generatePurchaseOrder);

router.get('/suppliers/:id', getSupplierById);

// 4. Get supplier performance
router.get('/supplier-performance/:id', getSupplierPerformance);

// 5. Add a new supplier
router.post('/suppliers', addSupplier);

// 6. Delete a supplier
router.delete('/suppliers/:supplierId', async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findOneAndDelete({
      supplierId: req.params.supplierId,
    });
    if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully', deletedSupplier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update a supplier
router.put('/suppliers/:supplierId', async (req, res) => {
  try {
    const updatedSupplier = await Supplier.findOneAndUpdate(
      { supplierId: req.params.supplierId },
      req.body,
      { new: true }
    );
    if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(updatedSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get supplier orders
router.get('/supplier-orders/:id', getSupplierOrders);

// Update supplier performance
router.post('/update-supplier-performance', updateSupplierPerformance);

export default router;

