const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); // ✅ importing your db connection
const Product = require('./models/Product'); // adjust path if needed
const Users =require('./models/Users');
const app = express(); // ✅ define app before using it
const Transaction = require('./models/Transaction');

const PORT = 5050;
// Connect to MongoDB
connectDB();
// Middlewares
app.use(cors());
app.use(express.json());

// API to save product to MongoDB
app.post('/api/products', async (req, res) => {
  try {
    const { name, size, image, price, sale, category } = req.body;

    const newProduct = new Product({
      name,
      size,
      image,
      price,
      sale,
      category
    });

    const newUsers = new Users({
      id,
       name, 
       email, 
       picture 
    });


    const savedProduct = await newProduct.save(); // ✅ Save to MongoDB

    res.status(201).json({
      message: 'Product saved successfully!',
      product: savedProduct
    });
  } catch (err) {
    console.error('❌ Error saving product:', err.message);
    res.status(500).json({ error: 'Server error while saving product' });
  }
});

// GET API to fetch all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); // fetch all products
    res.status(200).json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
});

//bulk api
app.post('/api/products/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products format' });
    }

    const inserted = await Product.insertMany(products);
    res.status(201).json({ message: 'Products imported', count: inserted.length });
  } catch (error) {
    console.error('Bulk import error:', error.message);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});


// google auth api

app.post('/api/auth/google', async (req, res) => {
  try {
    const { id, name, email, picture } = req.body;

    let user = await Users.findOne({ email });

    if (!user) {
      user = await Users.create({ googleId: id, name, email, picture });
    }

    res.status(200).json({ message: 'User saved', user });
  } catch (error) {
    console.error('❌ Save failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// For Spendly APP


app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, note, type } = req.body;

    if (!amount || !note || !['credit', 'debit'].includes(type)) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const transaction = new Transaction({
      amount,
      note,
      type
    });

    const saved = await transaction.save();
    res.status(201).json({ message: 'Transaction saved', transaction: saved });
  } catch (error) {
    console.error('❌ Transaction save failed:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ time: -1 });

    const balance = transactions.reduce((total, tx) => {
      return tx.type === 'credit'
        ? total + tx.amount
        : total - tx.amount;
    }, 0);

    res.status(200).json({ balance, transactions });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
});


