const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); // ✅ importing your db connection
const Product = require('./models/Product'); // adjust path if needed
const ProductCategory = require('./models/ProductCategory')
const Users =require('./models/Users');
const app = express(); // ✅ define app before using it
const Transaction = require('./models/Transaction');

const PORT = 5050;
// Connect to MongoDB
connectDB();
// Middlewares
app.use(cors());
app.use(express.json());
// configure multer: save uploads in ./uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  },
});
const upload = multer({ storage });

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
// GET /api/products/search?name=app
// GET /api/products/search?query=Herbal
app.get("/api/products/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return res.status(400).json({ message: "Please enter at least 3 characters" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { barcode: { $regex: query, $options: "i" } },
      ]
    });

    res.json(products);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


// API to save product category to MongoDB
app.post(
  "/api/products-category",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "topicon", maxCount: 1 },
    { name: "topbanner", maxCount: 1 },
    { name: "topbannerbottom", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { category, toplist } = req.body;

      // convert uploaded files → base64 strings
      const toBase64 = (file) => {
        if (!file) return null;
        const fileData = fs.readFileSync(file.path);
        return `data:${file.mimetype};base64,${fileData.toString("base64")}`;
      };

      const newCategory = new ProductCategory({
        category,
        toplist: toplist === "true", // from form-data
        image: toBase64(req.files?.image?.[0]),
        topicon: toBase64(req.files?.topicon?.[0]),
        topbanner: toBase64(req.files?.topbanner?.[0]),
        topbannerbottom: toBase64(req.files?.topbannerbottom?.[0]),
      });

      const saved = await newCategory.save();
      res.status(201).json({ message: "✅ Category saved", product: saved });
    } catch (err) {
      console.error("❌ Error saving category:", err.message);
      res.status(500).json({ error: "Server error while saving category" });
    }
  }
);

// get product category api
app.get('/api/product-category', async (req, res) => {
  try {
    const category = await ProductCategory.find(); // fetch all products
    res.status(200).json(category);
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
});

// POST API to create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { items = [], paymentMethod = 'cash' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // normalize & validate items
    const normalized = items.map((it, idx) => {
      const price = Number(it.price);
      const qty = Number(it.qty || 1);
      if (!it.name) throw new Error(`Item ${idx + 1}: name is required`);
      if (!Number.isFinite(price) || price < 0) throw new Error(`Item ${idx + 1}: price must be a positive number`);
      if (!Number.isInteger(qty) || qty <= 0) throw new Error(`Item ${idx + 1}: qty must be a positive integer`);
      const lineTotal = +(price * qty).toFixed(2);
      return {
        name: it.name,
        size: it.size || null,
        image: it.image || null,
        price,
        sale: it.sale || null,
        category: it.category || null,
        qty,
        lineTotal
      };
    });

    // compute totals server-side
    const subtotal = +normalized.reduce((s, it) => s + it.lineTotal, 0).toFixed(2);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const newOrder = await Orders.create({
      items: normalized,
      paymentMethod,
      subtotal,
      tax,
      total
    });

    res.status(201).json({
      message: '✅ Order created successfully',
      order: newOrder
    });
  } catch (err) {
    console.error('❌ Error creating order:', err);
    res.status(400).json({ error: err.message || 'Server error while creating order' });
  }
});

// GET all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Orders.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err.message);
    res.status(500).json({ error: "Server error while fetching orders" });
  }
});

// GET order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Orders.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err.message);
    res.status(500).json({ error: "Server error while fetching order" });
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

// Manual signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, name, email, role, password } = req.body;

    // check if email or username already exists
    let existingUser = await Users.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or Username already exists' });
    }

    const user = await Users.create({ username, name, email, password, role }); 
    // ⚡️ make sure to hash password in production

    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/users
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await Users.find().select('-password -resetPasswordToken -resetPasswordExpires'); 
    // remove sensitive fields
    res.status(200).json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// GET /api/auth/users/:id
// GET /api/auth/users/search?q=rah
app.get('/api/auth/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Please provide at least 3 characters to search' });
    }

    const users = await Users.find({
      $or: [
        { name: { $regex: '^' + q, $options: 'i' } },   // starts with q (case-insensitive)
        { email: { $regex: '^' + q, $options: 'i' } }
      ]
    }).select('-password -resetPasswordToken -resetPasswordExpires');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error('❌ Error searching users:', err.message);
    res.status(500).json({ error: 'Server error while searching users' });
  }
});





// Manual login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    if (!user || user.password !== password) { // Use bcrypt compare in real app
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password API
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a reset token (expires in 1 hour)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token & expiry in DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // TODO: Send resetToken via email (Mailgun, SendGrid, Nodemailer, etc.)
    console.log(`Password reset link: /reset-password/${resetToken}`);

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
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


