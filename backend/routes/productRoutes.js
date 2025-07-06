const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/products - Public: Fetch all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('user', 'username email'); // optional: shows user info
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// POST /api/products - Private: Add new product
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, banner } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = new Product({
      name,
      description,
      price,
      banner,
      user: req.user.id
    });

    await product.save();
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// PUT /api/products/:id - Private: Update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Private: Delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
