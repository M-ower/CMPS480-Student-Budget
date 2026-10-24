
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

// Save or update the logged-in user's budget for the current month
app.post("/api/budgets", async (req, res) => {
    const userId = req.session.userId;
    const amount = Number(req.body.amount);

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid budget amount."
        });
    }

    try {
        const [existingBudgets] = await db.execute(
            `SELECT budget_id
             FROM budgets
             WHERE user_id = ?
               AND budget_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
             LIMIT 1`,
            [userId]
        );

        if (existingBudgets.length > 0) {
            await db.execute(
                `UPDATE budgets
                 SET amount = ?
                 WHERE budget_id = ? AND user_id = ?`,
                [amount, existingBudgets[0].budget_id, userId]
            );
        } else {
            await db.execute(
                `INSERT INTO budgets (user_id, amount, budget_month)
                 VALUES (?, ?, DATE_FORMAT(CURDATE(), '%Y-%m-01'))`,
                [userId, amount]
            );
        }

        res.status(200).json({
            success: true,
            message: "Monthly budget saved successfully.",
            budget: { amount }
        });
    } catch (error) {
        console.error("Save budget error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not save your budget."
        });
    }
});

// Get the logged-in user's budget and current-month spending
app.get("/api/budgets", async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    try {
        const [budgetRows] = await db.execute(
            `SELECT amount
             FROM budgets
             WHERE user_id = ?
               AND budget_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
             ORDER BY budget_id DESC
             LIMIT 1`,
            [userId]
        );

        const [spendingRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) AS spent
             FROM transactions
             WHERE user_id = ?
               AND LOWER(type) = 'expense'
               AND transaction_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
               AND transaction_date < DATE_ADD(
                   DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                   INTERVAL 1 MONTH
               )`,
            [userId]
        );

        const amount = budgetRows.length > 0
            ? Number(budgetRows[0].amount)
            : 0;

        const spent = Number(spendingRows[0].spent);
        const remaining = amount - spent;

        res.json({
            success: true,
            budget: {
                amount,
                spent,
                remaining
            }
        });
    } catch (error) {
        console.error("Load budget error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not load your budget."
        });
    }
});

// ==============================
// SAVINGS GOALS - MYSQL
// ==============================

// Add a savings goal for the logged-in user
app.post("/api/goals", async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    const {
        goal_name,
        target_amount,
        current_amount,
        target_date
    } = req.body;

    const name = typeof goal_name === "string"
        ? goal_name.trim()
        : "";

    const target = Number(target_amount);
    const current = Number(current_amount);

    if (
        !name ||
        name.length > 100 ||
        target_amount === "" ||
        !Number.isFinite(target) ||
        target <= 0 ||
        current_amount === "" ||
        !Number.isFinite(current) ||
        current < 0 ||
        (target_date !== undefined &&
            target_date !== null &&
            target_date !== "" &&
            (typeof target_date !== "string" ||
             !/^\d{4}-\d{2}-\d{2}$/.test(target_date)))
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter valid savings goal information."
        });
    }

    try {
        await db.execute(
            `INSERT INTO savings_goals
                (user_id, goal_name, target_amount, current_amount, target_date)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                name,
                target,
                current,
                target_date || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Savings goal saved successfully."
        });

    } catch (error) {
        console.error("Save goal error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not save your savings goal."
        });
    }
});

// Get savings goals belonging to the logged-in user
app.get("/api/goals", async (req, res) => {
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
                goal_id,
                goal_name,
                target_amount,
                current_amount,
                target_date
             FROM savings_goals
             WHERE user_id = ?
             ORDER BY goal_id DESC`,
            [userId]
        );

        const goals = rows.map(goal => ({
            ...goal,
            target_amount: Number(goal.target_amount),
            current_amount: Number(goal.current_amount),
            target_date: goal.target_date
                ? (
                    goal.target_date instanceof Date
                        ? goal.target_date.toISOString().slice(0, 10)
                        : String(goal.target_date).slice(0, 10)
                )
                : null
        }));

        res.json({
            success: true,
            goals
        });

    } catch (error) {
        console.error("Load goals error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not load savings goals."
        });
    }
});



// ==============================
// ANALYTICS
// ==============================

app.get("/api/analytics", async (req, res) => {
    const userId = req.session.userId;

    // Only allow logged-in users to view their analytics
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    try {
        // Get total income and expenses for this user
        const [summaryRows] = await db.execute(
            `SELECT
                COALESCE(SUM(
                    CASE
                        WHEN LOWER(type) = 'income' THEN amount
                        ELSE 0
                    END
                ), 0) AS income,
                COALESCE(SUM(
                    CASE
                        WHEN LOWER(type) = 'expense' THEN amount
                        ELSE 0
                    END
                ), 0) AS expenses
             FROM transactions
             WHERE user_id = ?`,
            [userId]
        );

        // Get expense totals grouped by category
        const [categoryRows] = await db.execute(
            `SELECT
                c.name AS category,
                SUM(t.amount) AS total
             FROM transactions t
             JOIN categories c
                ON t.category_id = c.category_id
             WHERE t.user_id = ?
               AND LOWER(t.type) = 'expense'
             GROUP BY c.category_id, c.name
             ORDER BY total DESC`,
            [userId]
        );

        // Get this user's budget for the current month
        const [budgetRows] = await db.execute(
            `SELECT amount
             FROM budgets
             WHERE user_id = ?
               AND budget_month =
                   DATE_FORMAT(CURDATE(), '%Y-%m-01')
             ORDER BY budget_id DESC
             LIMIT 1`,
            [userId]
        );

        // Calculate expenses for the current month only
        const [monthlyExpenseRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) AS spent
             FROM transactions
             WHERE user_id = ?
               AND LOWER(type) = 'expense'
               AND transaction_date >=
                   DATE_FORMAT(CURDATE(), '%Y-%m-01')
               AND transaction_date < DATE_ADD(
                   DATE_FORMAT(CURDATE(), '%Y-%m-01'),
                   INTERVAL 1 MONTH
               )`,
            [userId]
        );

        const income = Number(summaryRows[0].income);
        const expenses = Number(summaryRows[0].expenses);
        const balance = income - expenses;

        const monthlyBudget = budgetRows.length > 0
            ? Number(budgetRows[0].amount)
            : 0;

        const monthlyExpenses =
            Number(monthlyExpenseRows[0].spent);

        const categories = {};

        categoryRows.forEach((row) => {
            categories[row.category] = Number(row.total);
        });

        res.json({
            success: true,
            analytics: {
                income,
                expenses,
                balance,
                monthlyBudget,
                remainingBudget: monthlyBudget - monthlyExpenses,
                categories
            }
        });

    } catch (error) {
        console.error("Analytics error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not load analytics."
        });
    }
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
// PROFILE - MYSQL
// ==============================

// Get logged-in user's profile
app.get("/api/profile", async (req, res) => {
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
                u.first_name,
                u.last_name,
                u.email,
                p.display_name,
                p.profile_image,
                p.bio
             FROM user u
             LEFT JOIN user_profiles p
                ON u.user_id = p.user_id
             WHERE u.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not load profile."
        });
    }
});
// Save logged-in user's profile
app.put("/api/profile", async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Please log in first."
        });
    }

    const { display_name, profile_image, bio } = req.body;

    if (
        typeof display_name !== "string" ||
        typeof profile_image !== "string" ||
        typeof bio !== "string" ||
        display_name.length > 100 ||
        profile_image.length > 255 ||
        bio.length > 255
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid profile information."
        });
    }

    try {
        const [existing] = await db.execute(
            "SELECT profile_id FROM user_profiles WHERE user_id = ?",
            [userId]
        );

        if (existing.length > 0) {
            await db.execute(
                `UPDATE user_profiles
                 SET display_name = ?, profile_image = ?, bio = ?
                 WHERE user_id = ?`,
                [
                    display_name.trim(),
                    profile_image.trim(),
                    bio.trim(),
                    userId
                ]
            );
        } else {
            await db.execute(
                `INSERT INTO user_profiles
                    (user_id, display_name, profile_image, bio)
                 VALUES (?, ?, ?, ?)`,
                [
                    userId,
                    display_name.trim(),
                    profile_image.trim(),
                    bio.trim()
                ]
            );
        }

        res.json({
            success: true,
            message: "Profile saved successfully."
        });

    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Could not save profile."
        });
    }
});


// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
    console.log(`Student Budget Tracker running at http://localhost:${PORT}`);
});