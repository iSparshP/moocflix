module.exports = (error, req, res, next) => {
    console.error(error.stack);

    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
    }

    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
};
