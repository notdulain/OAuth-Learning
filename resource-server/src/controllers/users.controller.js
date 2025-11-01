// Sample data (in-memory for Phase 1)
const users = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com' },
    { id: '2', name: 'Bob Singh', email: 'bob@example.com' },
    { id: '3', name: 'Charlie Kim', email: 'charlie@example.com' }
  ];
  
  function listUsers(req, res) {
    res.json({ data: users });
  }
  
  function getUserById(req, res) {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found', id });
    }
    res.json({ data: user });
  }
  
  module.exports = { listUsers, getUserById };
  