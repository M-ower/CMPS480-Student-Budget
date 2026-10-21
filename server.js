require("dotenv").config({
    path: require("path").join(
        require("os").homedir(),
        ".studentbudget-db.env"
    )
});

const bcrypt = require("bcryptjs");
const session = require("express-session");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(session({
    name: "studentbudget.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 2
    }
}));

const express = require("express");
const db = require("./db");


// Allow Express to read JSON data
app.use(express.json());

// Serve the HTML, CSS, and JavaScript files
app.use(express.static(__dirname));

// Temporary database connection test
app.get("/api/db-status", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "MySQL database connected successfully."
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});

// Temporary data for the project
let transactions = [];
let budget = {
    amount: 0
};
// ==============================
// TRANSACTIONS
// ==============================

// Add a transaction
app.post("/api/transactions", (req, res) => {
    const { type, description, category, amount } = req.body;

    if (
        !type ||
        !description ||
        !category ||
        !amount ||
        Number(amount) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid transaction information."
        });
    }

    const transaction = {
        id: Date.now(),
        type: type,
        description: description.trim(),
        category: category,
        amount: Number(amount)
    };

    transactions.push(transaction);

    res.status(201).json({
        success: true,
        message: "Transaction added successfully.",
        transaction: transaction
    });
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
    res.json({
        success: true,
        transactions: transactions
    });
});

// Delete all transactions
app.delete("/api/transactions", (req, res) => {
    transactions = [];

    res.json({
        success: true,
        message: "Transaction history cleared."
    });
});

// ==============================
// MONTHLY BUDGET
// ==============================

// Save monthly budget
app.post("/api/budgets", (req, res) => {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid budget amount."
        });
    }

    budget.amount = Number(amount);

    res.status(201).json({
        success: true,
        message: "Budget saved successfully.",
        budget: budget
    });
});

// Get current budget
app.get("/api/budgets", (req, res) => {
    res.json({
        success: true,
        budget: budget
    });
});

// ==============================
// ANALYTICS
// ==============================

app.get("/api/analytics", (req, res) => {
    let income = 0;
    let expenses = 0;

    const categories = {};

    transactions.forEach((transaction) => {
        if (transaction.type === "income") {
            income += transaction.amount;
        }

        if (transaction.type === "expense") {
            expenses += transaction.amount;

            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }

            categories[transaction.category] += transaction.amount;
        }
    });

    const balance = income - expenses;
    const remainingBudget = budget.amount - expenses;

    res.json({
        success: true,
        analytics: {
            income: income,
            expenses: expenses,
            balance: balance,
            monthlyBudget: budget.amount,
            remainingBudget: remainingBudget,
            categories: categories
        }
    });
});

// ==============================
// LOGIN
// ==============================

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    try {
        const [users] = await db.execute(
            "SELECT user_id, email, password_hash FROM user WHERE email = ?",
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Could not create login session."
                });
            }

            req.session.userId = user.user_id;

            req.session.save((error) => {
                if (error) {
                    return res.status(500).json({
                        success: false,
                        message: "Could not save login session."
                    });
                }

                res.json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        id: user.user_id,
                        email: user.email
                    }
                });
            });
        });

    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`Student Budget Tracker running at http://localhost:${PORT}`);
});