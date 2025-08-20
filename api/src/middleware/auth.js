// Simple Bearer token check middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.VITE_API_TOKEN) {
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }

  next(); // token is valid, proceed
};

export default authMiddleware;
