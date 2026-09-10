const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());


// TEMPORARY DATA

let transactions = [];

let budget = {
    amount: 0
};


// TRANSACTIONS

// Add transaction
app.post("/api/transactions", (req, res) => {

    const { type, description, category, amount } = req.body;

    if (!type || !description || !category || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid transaction information."
        });
    }

    const transaction = {
        id: transactions.length + 1,
        type,
        description,
        category,
        amount: Number(amount)
    };

    transactions.push(transaction);

    res.status(201).json({
        success: true,
        message: "Transaction added successfully.",
        transaction
    });
});


// View transactions
app.get("/api/transactions", (req, res) => {

    res.json({
        success: true,
        transactions
    });
});


// Clear transactions
app.delete("/api/transactions", (req, res) => {

    transactions = [];

    res.json({
        success: true,
        message: "Transaction history cleared."
    });
});


// MONTHLY BUDGET

// Save budget
app.post("/api/budgets", (req, res) => {

    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid budget amount."
        });
    }

    budget.amount = Number(amount);

    res.status(201).json({
        success: true,
        message: "Budget saved successfully.",
        budget
    });
});


// View budget
app.get("/api/budgets", (req, res) => {

    res.json({
        success: true,
        budget
    });
});


// ANALYTICS


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

            // Add expenses by category
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
            income,
            expenses,
            balance,
            monthlyBudget: budget.amount,
            remainingBudget,
            categories
        }
    });
});


// LOGIN


app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    // Basic validation only
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    // Prototype login only
    res.json({
        success: true,
        message: "Login successful.",
        user: {
            email
        }
    });
});


// START SERVER


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});