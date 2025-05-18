import { Schema, model } from 'mongoose';

const inventorySchema = new Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stockLevel: { type: Number, required: true },
  threshold: { type: Number, required: true }, // Low-stock threshold
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' }, // Link to Supplier
}, { timestamps: true });

export default model('Inventory', inventorySchema);

import { schedule } from 'node-cron';
schedule('0 * * * *', () => supplierController.checkRestockAlerts({}));