const users = [
  {
    id: 'user-1',
    username: 'alice',
    password: 'password123',
    name: 'Alice Johnson',
    email: 'alice@example.com'
  },
  {
    id: 'user-2',
    username: 'bob',
    password: 'password123',
    name: 'Bob Singh',
    email: 'bob@example.com'
  }
];

function findUserByUsername(username) {
  if (!username) return null;
  return users.find(
    user => user.username.toLowerCase() === String(username).toLowerCase()
  );
}

function findUserById(userId) {
  if (!userId) return null;
  return users.find(user => user.id === userId);
}

module.exports = {
  users,
  findUserByUsername,
  findUserById
};
