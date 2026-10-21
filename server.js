
require("dotenv").config({
    path: require("path").join(
        require("os").homedir(),
        ".studentbudget-db.env"
    )
});

const express = require("express");
const db = require("./db");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Allow Express to read JSON data
app.use(express.json());

// Login sessions
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
 // TRANSACTIONS - MYSQL
 // ==============================

 // Add a transaction
 app.post("/api/transactions", async (req, res) => {
     const { type, description, category, amount } = req.body;
     const userId = req.session.userId;

     if (!userId) {
         return res.status(401).json({
             success: false,
             message: "Please log in first."
         });
     }

     if (
         !["income", "expense"].includes(type) ||
         typeof description !== "string" ||
         !description.trim() ||
         typeof category !== "string" ||
         !category.trim() ||
         !Number.isFinite(Number(amount)) ||
         Number(amount) <= 0
     ) {
         return res.status(400).json({
             success: false,
             message: "Please provide valid transaction information."
         });
     }

     try {
         const [categories] = await db.execute(
             `SELECT category_id
              FROM categories
              WHERE name = ? AND LOWER(type) = ?
              LIMIT 1`,
             [category.trim(), type]
         );

         if (categories.length === 0) {
             return res.status(400).json({
                 success: false,
                 message: "Category not found in database."
             });
         }

         const [result] = await db.execute(
             `INSERT INTO transactions
                 (user_id, type, description, category_id, amount, transaction_date)
              VALUES (?, ?, ?, ?, ?, NOW())`,
             [
                 userId,
                 type,
                 description.trim(),
                 categories[0].category_id,
                 Number(amount)
             ]
         );

         res.status(201).json({
             success: true,
             message: "Transaction saved to MySQL.",
             transaction: {
                 id: result.insertId,
                 type,
                 description: description.trim(),
                 category: category.trim(),
                 amount: Number(amount)
             }
         });

     } catch (error) {
         console.error("Transaction error:", error.message);

         res.status(500).json({
             success: false,
             message: "Could not save transaction."
         });
     }
 });

 // Get transactions
 app.get("/api/transactions", async (req, res) => {
     const userId = req.session.userId;

     if (!userId) {
         return res.status(401).json({
             success: false,
             message: "Please log in first."
         });
     }

     try {
         const [rows] = await db.execute(
             `SELECT
                 t.transaction_id AS id,
                 LOWER(t.type) AS type,
                 t.description,
                 c.name AS category,
                 t.amount
              FROM transactions t
              JOIN categories c ON t.category_id = c.category_id
              WHERE t.user_id = ?
              ORDER BY t.transaction_id`,
             [userId]
         );

         const transactions = rows.map(row => ({
             ...row,
             amount: Number(row.amount)
         }));

         res.json({
             success: true,
             transactions
         });

     } catch (error) {
         console.error("Transaction error:", error.message);

         res.status(500).json({
             success: false,
             message: "Could not load transactions."
         });
     }
 });

 // Clear transactions
 app.delete("/api/transactions", async (req, res) => {
     const userId = req.session.userId;

     if (!userId) {
         return res.status(401).json({
             success: false,
             message: "Please log in first."
         });
     }

     try {
         await db.execute(
             "DELETE FROM transactions WHERE user_id = ?",
             [userId]
         );

         res.json({
             success: true,
             message: "Transaction history cleared."
         });

     } catch (error) {
         console.error("Transaction error:", error.message);

         res.status(500).json({
             success: false,
             message: "Could not clear transactions."
         });
     }
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
// REGISTER NEW USER (Login page)
// ==============================

app.post("/api/register", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        password.length < 12 ||
        firstName.length > 100 ||
        lastName.length > 100 ||
        email.length > 254
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter valid details and a password of at least 12 characters."
        });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await db.execute(
            "SELECT user_id FROM user WHERE email = ?",
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.execute(
            `INSERT INTO user
                (first_name, last_name, email, password_hash, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
                firstName.trim(),
                lastName.trim(),
                normalizedEmail,
                passwordHash
            ]
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully! Redirecting to login..."
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        console.error("Registration error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not create account."
        });
    }
});


// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`Student Budget Tracker running at http://localhost:${PORT}`);
});