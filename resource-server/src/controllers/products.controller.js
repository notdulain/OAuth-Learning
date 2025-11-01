// Sample data (in-memory for Phase 1)
const products = [
    { id: 'p1', name: 'Laptop', price: 1299.99, currency: 'USD' },
    { id: 'p2', name: 'Mechanical Keyboard', price: 129.0, currency: 'USD' },
    { id: 'p3', name: 'Noise-canceling Headphones', price: 249.99, currency: 'USD' }
  ];
  
  function listProducts(req, res) {
    const { limit } = req.query;
    let result = products;
    if (limit) {
      const n = Math.max(0, Math.min(products.length, Number(limit)));
      if (!Number.isNaN(n)) result = products.slice(0, n);
    }
    res.json({ data: result });
  }
  
  module.exports = { listProducts };
  