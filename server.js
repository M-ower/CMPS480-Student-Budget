const express = require("express");

const app = express();
const PORT = 3000;

// Allow Express to read JSON data
app.use(express.json());

// Serve the HTML, CSS, and JavaScript files
app.use(express.static(__dirname));

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

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    // Prototype login for the class project
    res.json({
        success: true,
        message: "Login successful.",
        user: {
            email: email
        }
    });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`Student Budget Tracker running at http://localhost:${PORT}`);
});