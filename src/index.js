import express from "express";
import dotenv from "dotenv";

import authRoter from "./api/routes/auth.router.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});