const corsMiddleware = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Allow frontend domain
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Preflight Requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
};

export default corsMiddleware;
