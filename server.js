const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes (This will be replaced with actual route files)
app.get('/', (req, res) => {
    res.send('Welcome to the MediSphere API!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
