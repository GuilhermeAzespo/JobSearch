const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_KEY = process.env.JWT_SECRET || 'jobsearch-secure-secret-key-2026-easypanel';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return checkHash === storedHash;
}

function loadUsers() {
  ensureDataDir();
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (err) {
      console.error('Erro ao ler users.json:', err);
    }
  }

  // Ensure default admin user guilherme@azespo.com.br exists
  const adminExists = users.some(u => u.email.toLowerCase() === 'guilherme@azespo.com.br');
  if (!adminExists) {
    const { salt, hash } = hashPassword('admin123');
    const defaultAdmin = {
      id: 'usr_guilherme',
      name: 'Guilherme Azevedo',
      email: 'guilherme@azespo.com.br',
      salt,
      hash,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    users.unshift(defaultAdmin);
    saveUsers(users);
  }

  return users;
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function createToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(body).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getUsers: () => {
    return loadUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
  },

  findUserById: (id) => {
    const users = loadUsers();
    return users.find(u => u.id === id);
  },

  login: (email, password) => {
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }
    if (!verifyPassword(password, user.salt, user.hash)) {
      throw new Error('E-mail ou senha incorretos.');
    }
    const token = createToken(user);
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  },

  createUserByAdmin: (name, email, password, role = 'user') => {
    const users = loadUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password || !name) {
      throw new Error('Nome, e-mail e senha são obrigatórios.');
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const { salt, hash } = hashPassword(password);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      name: name.trim(),
      email: cleanEmail,
      salt,
      hash,
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };
  },

  deleteUser: (id) => {
    let users = loadUsers();
    const target = users.find(u => u.id === id);
    if (!target) throw new Error('Usuário não encontrado.');
    if (target.email === 'guilherme@azespo.com.br') {
      throw new Error('Não é permitido excluir o usuário administrador principal.');
    }
    users = users.filter(u => u.id !== id);
    saveUsers(users);
    return true;
  },

  changePassword: (userId, currentPassword, newPassword) => {
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');
    if (!verifyPassword(currentPassword, user.salt, user.hash)) {
      throw new Error('Senha atual incorreta.');
    }
    if (!newPassword || newPassword.length < 5) {
      throw new Error('A nova senha deve ter no mínimo 5 caracteres.');
    }
    const { salt, hash } = hashPassword(newPassword);
    user.salt = salt;
    user.hash = hash;
    saveUsers(users);
    return true;
  },

  verifyToken
};
