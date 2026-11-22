
// ============================================
// STUDENT BUDGET TRACKER
// Main JavaScript File
// ============================================


// ============================================
// DASHBOARD
// ============================================

const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const clearHistoryButton = document.getElementById("clearHistory");
const transactionFilter = document.getElementById("transactionFilter");

// ============================================
// CHANGED FOR DATABASE TESTING
// ============================================


// Dashboard and Budget month selector
const monthSelector = document.getElementById("monthSelector");
const transactionDateInput = document.getElementById("transactionDate");

// Get current month in local time
function getCurrentMonth() {
    const today = new Date();

    return today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0");
}


// Fill with 24 calendar months (January 2026 - December 2027)
function setupMonthSelector() {
    if (!monthSelector) return;

    const startYear = 2026;
    const totalMonths = 24;

    monthSelector.innerHTML = "";

    for (let i = 0; i < totalMonths; i++) {
        const year = startYear + Math.floor(i / 12);
        const month = (i % 12) + 1;

        const date = new Date(year, month - 1, 1);

        const value = year + "-" +
            String(month).padStart(2, "0");

        const option = document.createElement("option");
        option.value = value;

        option.textContent = date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

        monthSelector.appendChild(option);
    }

        // Automatically select the current month
        const currentMonth = getCurrentMonth();

        const currentMonthOption = monthSelector.querySelector(
            'option[value="' + currentMonth + '"]'
        );

        monthSelector.value = currentMonthOption
        ? currentMonth
        : "2026-01";

        monthSelector.addEventListener("change", function() {

        if (transactionForm) {
            setDefaultTransactionDate();
            setDefaultPlannerDate();
            loadDashboard();
        }

        if (budgetForm) {
            loadBudgetPage();
        }
        if (document.getElementById("categoryList")) {
            loadAnalytics();
        }
    });
}


// Default transaction date to today
function setDefaultTransactionDate() {
    if (!transactionDateInput) return;

    const today = new Date();

    const selectedMonth = monthSelector
        ? monthSelector.value
        : "2026-01";

    const currentMonth = getCurrentMonth();

    if (selectedMonth === currentMonth) {
        transactionDateInput.value =
            selectedMonth + "-" +
            String(today.getDate()).padStart(2, "0");
    } else {
        transactionDateInput.value = selectedMonth + "-01";
    }
}


function setDefaultPlannerDate() {
    const plannerDateInput = document.getElementById("plannerDate");

    if (!plannerDateInput || !monthSelector) return;

    const selectedMonth = monthSelector.value;
    const currentMonth = getCurrentMonth();
    const today = new Date();

    if (selectedMonth === currentMonth) {
        plannerDateInput.value =
            selectedMonth + "-" +
            String(today.getDate()).padStart(2, "0");
    } else {
        plannerDateInput.value = selectedMonth + "-01";
    }

    // Notify the planner that its date changed
    plannerDateInput.dispatchEvent(new Event("change", { bubbles: true }));
}


async function loadDashboard() {
    try {
        const month = monthSelector
            ? monthSelector.value
            : getCurrentMonth();

        // Load transactions for selected month
        const transactionResponse = await fetch(
            "/api/transactions?month=" + encodeURIComponent(month),
            { credentials: "same-origin" }
        );

        const transactionData = await transactionResponse.json();

        if (!transactionResponse.ok || !transactionData.success) {
            throw new Error(
                transactionData.message || "Could not load transactions."
            );
        }

        // Load budget for selected month
        const budgetResponse = await fetch(
            "/api/budgets?month=" + encodeURIComponent(month),
            { credentials: "same-origin" }
        );

        const budgetData = await budgetResponse.json();

        if (!budgetResponse.ok || !budgetData.success) {
            throw new Error(
                budgetData.message || "Could not load budget."
            );
        }

        // Ignore outdated responses if user switched months
        if (monthSelector && monthSelector.value !== month) {
            return;
        }

        displayTransactions(transactionData.transactions);

        updateDashboardSummary(
            transactionData.transactions,
            Number(budgetData.budget?.amount) || 0
        );

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}


// Automatically update categories based on transaction type
const transactionTypeSelect = document.getElementById("type");
const transactionCategorySelect = document.getElementById("category");

function updateTransactionCategories() {
    if (!transactionTypeSelect || !transactionCategorySelect) {
        return;
    }

    const categories = transactionTypeSelect.value === "income"
        ? [
            "Salary",
            "Part-Time Job",
            "Freelance",
            "Gifts",
            "Scholarships",
            "Other Income"
        ]
        : [
            "Food",
            "Transportation",
            "Entertainment",
            "Housing",
            "School",
            "Bills",
            "Shopping",
            "Healthcare",
            "Other Expense"
        ];

    transactionCategorySelect.innerHTML = "";

    categories.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        transactionCategorySelect.appendChild(option);
    });
}


if (transactionTypeSelect && transactionCategorySelect) {
    transactionTypeSelect.addEventListener("change", updateTransactionCategories);
    updateTransactionCategories();
}


// Add transaction
if (transactionForm) {
    transactionForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const type = document.getElementById("type").value;
        const description = document.getElementById("description").value;
        const category = document.getElementById("category").value;
        const amount = Number(document.getElementById("amount").value);
        const date = transactionDateInput.value;

        const selectedMonth = monthSelector
            ? monthSelector.value
            : getCurrentMonth();

        const firstDay = selectedMonth + "-01";

        const [year, month] = selectedMonth.split("-").map(Number);
        const lastDay = new Date(year, month, 0).getDate();

        const lastDate = selectedMonth + "-" +
            String(lastDay).padStart(2, "0");

        if (!date || date < firstDay || date > lastDate) {
            alert("Please select a transaction date within the selected month.");
            return;
        }

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: type,
                    description: description,
                    category: category,
                    amount: amount,
                    date: date
                })
            });

            const data = await response.json();

            const message = document.getElementById("transactionMessage");

            if (!data.success) {
                message.textContent = data.message;
                message.className = "message error";
                return;
            }

            message.textContent = "Transaction added successfully.";
            message.className = "message success";

            transactionForm.reset();
            updateTransactionCategories();
            setDefaultTransactionDate();

            loadDashboard();

        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    });
}


// Display transaction history
function displayTransactions(transactions) {
    if (!transactionList) {
        return;
    }

    transactionList.innerHTML = "";

    const emptyMessage = document.getElementById("emptyMessage");

    if (transactions.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = "block";
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    const selectedFilter = transactionFilter
        ? transactionFilter.value
        : "all";

    const filteredTransactions = transactions.filter(function(transaction) {
        if (selectedFilter === "all") {
            return true;
        }

        return transaction.type === selectedFilter;
    });

    filteredTransactions
        .slice()
        .reverse()
        .forEach(function(transaction) {
            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            dateCell.textContent = transaction.date || "N/A";

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = transaction.description;

            const categoryCell = document.createElement("td");
            categoryCell.textContent = transaction.category;

            const typeCell = document.createElement("td");
            typeCell.textContent =
                transaction.type === "income" ? "Income" : "Expense";

            const amountCell = document.createElement("td");
            amountCell.textContent = "$" + transaction.amount.toFixed(2);

            if (transaction.type === "income") {
                amountCell.classList.add("income-text");
            } else {
                amountCell.classList.add("expense-text");
            }

            row.appendChild(dateCell);
            row.appendChild(descriptionCell);
            row.appendChild(categoryCell);
            row.appendChild(typeCell);
            row.appendChild(amountCell);

            transactionList.appendChild(row);
        });
}


// Filter transactions by type
if (transactionFilter) {
    transactionFilter.addEventListener("change", function() {
        loadDashboard();
    });
}


// Update dashboard summary
function updateDashboardSummary(transactions, monthlyBudget) {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function(transaction) {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    });

    const balance = income - expenses;

    const incomeDisplay = document.getElementById("income");
    const expensesDisplay = document.getElementById("expenses");
    const balanceDisplay = document.getElementById("balance");
    const budgetDisplay = document.getElementById("monthlyBudget");

    if (incomeDisplay) {
        incomeDisplay.textContent = formatMoney(income);
    }

    if (expensesDisplay) {
        expensesDisplay.textContent = formatMoney(expenses);
    }

    if (balanceDisplay) {
        balanceDisplay.textContent = formatMoney(balance);
    }

    if (budgetDisplay) {
        budgetDisplay.textContent = formatMoney(monthlyBudget);
    }
}


// Clear history for the selected month
if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", async function() {
        const month = monthSelector
            ? monthSelector.value
            : getCurrentMonth();

        const confirmed = confirm(
            "Are you sure you want to delete all transactions for " +
            month + "? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        clearHistoryButton.disabled = true;

        try {
            const response = await fetch(
                "/api/transactions?month=" + encodeURIComponent(month),
                {
                    method: "DELETE",
                    credentials: "same-origin"
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Could not clear transaction history."
                );
            }

            alert("Transactions for " + month + " were cleared successfully.");

            await loadDashboard();

        } catch (error) {
            console.error("Error clearing history:", error);
            alert(error.message || "Could not clear transaction history.");
        } finally {
            clearHistoryButton.disabled = false;
        }
    });
}


// ============================================
// HARD-CODED TRANSACTION JSON (DATABASE SIMULATION)
// ============================================

async function loadTransactionData() {
    const response = await fetch("transaction-data.json");

    if (!response.ok) {
        throw new Error("Could not load transaction-data.json");
    }

    return await response.json();
}


// ============================================
// BUDGET PAGE
// ============================================

const budgetForm = document.getElementById("budgetForm");


// Save budget for the selected month
if (budgetForm) {
    budgetForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const amount = Number(
            document.getElementById("budgetAmount").value
        );

        const message = document.getElementById("budgetMessage");

        const month = monthSelector
            ? monthSelector.value
            : getCurrentMonth();

        if (!Number.isFinite(amount) || amount <= 0) {
            if (message) {
                message.textContent = "Please enter a valid budget amount.";
                message.className = "message error";
            }

            return;
        }

        try {
            const response = await fetch("/api/budgets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    amount: amount,
                    month: month
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (message) {
                    message.textContent =
                        data.message || "Could not save the monthly budget.";

                    message.className = "message error";
                }

                return;
            }

            if (message) {
                message.textContent =
                    "Monthly budget saved successfully.";

                message.className = "message success";
            }

            // Reload the selected month's budget
            await loadBudgetPage();

            // Clear the amount field without changing the selected month
            budgetForm.reset();

        } catch (error) {
            console.error("Error saving budget:", error);

            if (message) {
                message.textContent =
                    "Could not save your budget. Please try again.";

                message.className = "message error";
            }
        }
    });
}


// ============================================
// LOAD BUDGET DATA FROM THE DATABASE API
// ============================================

async function loadBudgetData(month) {
    const response = await fetch(
        "/api/budgets?month=" + encodeURIComponent(month),
        {
            credentials: "same-origin",
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Could not load monthly budget from the server."
        );
    }

    const data = await response.json();

    if (!data.success || !data.budget) {
        throw new Error(
            data.message || "Could not load monthly budget."
        );
    }

    return data.budget;
    
}



// ============================================
// LOAD BUDGET INFORMATION
// ============================================

async function loadBudgetPage() {
    try {
        const month = monthSelector
            ? monthSelector.value
            : getCurrentMonth();

        // Load the selected month's budget and spending
        const budgetData = await loadBudgetData(month);

        // Do not display data if the user selected another month
        // while the request was loading.
        if (monthSelector && monthSelector.value !== month) {
            return;
        }

        const monthlyBudget = Number(budgetData.amount) || 0;
        const expenses = Number(budgetData.spent) || 0;

        const remaining = budgetData.remaining !== undefined
            ? Number(budgetData.remaining)
            : monthlyBudget - expenses;

        const currentBudget = document.getElementById("currentBudget");
        const budgetSpent = document.getElementById("budgetSpent");
        const budgetRemaining = document.getElementById("budgetRemaining");

        if (currentBudget) {
            currentBudget.textContent = formatMoney(monthlyBudget);
        }

        if (budgetSpent) {
            budgetSpent.textContent = formatMoney(expenses);
        }

        // Show a dash when no monthly budget has been set.
        // Otherwise, display the actual remaining amount.

        if (budgetRemaining) {
            budgetRemaining.textContent = monthlyBudget <= 0
                ? "-"
                : formatMoney(remaining);
        }

        updateBudgetProgress(
            monthlyBudget,
            expenses,
            "budgetPageProgress",
            "budgetPageStatus"
        );

    } catch (error) {
        console.error("Error loading budget:", error);

        const message = document.getElementById("budgetMessage");

        if (message) {
            message.textContent =
                "Could not load your budget. Please log in and try again.";

            message.className = "message error";
        }
    }
}


// ============================================
// ANALYTICS PAGE
// ============================================

async function loadAnalytics() {
    const categoryList = document.getElementById("categoryList");

    if (!categoryList) {
        return;
    }

    try {
        const selectedMonth = monthSelector
        ? monthSelector.value
        : getCurrentMonth();
    
    const response = await fetch(
        `/api/analytics?month=${encodeURIComponent(selectedMonth)}`,
        {
            credentials: "same-origin"
        }
    );
        const data = await response.json();

        if (!response.ok || !data.success || !data.analytics) {
            throw new Error(
                data.message || "Could not load analytics. Please log in."
            );
        }

        const analytics = data.analytics;

        document.getElementById("analyticsIncome").textContent =
            formatMoney(analytics.income);

        document.getElementById("analyticsExpenses").textContent =
            formatMoney(analytics.expenses);

        document.getElementById("analyticsBalance").textContent =
            formatMoney(analytics.balance);

        document.getElementById("remainingBudget").textContent =
            formatMoney(analytics.remainingBudget);

        displayCategories(
            analytics.categories || {},
            Number(analytics.expenses) || 0
        );

        updateBudgetProgress(
            Number(analytics.monthlyBudget) || 0,
            Number(analytics.expenses) || 0,
            "budgetProgress",
            "budgetStatus"
        );

    } catch (error) {
        console.error("Error loading analytics:", error);

        const emptyMessage = document.getElementById(
            "analyticsEmptyMessage"
        );

        if (emptyMessage) {
            emptyMessage.textContent =
                error.message || "Could not load analytics.";

            emptyMessage.style.display = "block";
        }
    }
}


// Display category breakdown, highest-spending category, and pie chart
function displayCategories(categories, totalExpenses) {
    const categoryList = document.getElementById("categoryList");
    const emptyMessage = document.getElementById("analyticsEmptyMessage");

    const highestCategoryName =
        document.getElementById("highestCategoryName");

    const highestCategoryAmount =
        document.getElementById("highestCategoryAmount");

    const highestCategoryPercentage =
        document.getElementById("highestCategoryPercentage");

    const pieChart = document.getElementById("categoryPieChart");
    const pieLegend = document.getElementById("categoryPieLegend");

    if (!categoryList) {
        return;
    }

    categoryList.innerHTML = "";

    if (pieLegend) {
        pieLegend.innerHTML = "";
    }

    // Combine duplicate category names
    const combinedCategories = {};

    Object.entries(categories || {}).forEach(function(entry) {
        const category = String(entry[0]).trim();
        const amount = Number(entry[1]) || 0;
        const key = category.toLowerCase();

        if (category && amount > 0) {
            if (combinedCategories[key]) {
                combinedCategories[key].amount += amount;
            } else {
                combinedCategories[key] = {
                    name: category,
                    amount: amount
                };
            }
        }
    });

    // Sort categories from highest spending to lowest
    const sortedCategories = Object.values(combinedCategories)
        .map(function(entry) {
            return [entry.name, entry.amount];
        })
        .sort(function(a, b) {
            return b[1] - a[1];
        });

    // Calculate total spending across all categories
    const categoryTotal = sortedCategories.reduce(
        function(total, entry) {
            return total + entry[1];
        },
        0
    );

    // Handle empty expenses
    if (sortedCategories.length === 0) {
        if (emptyMessage) {
            emptyMessage.textContent =
                "Add some expenses to see your spending breakdown.";

            emptyMessage.style.display = "block";
        }

        if (highestCategoryName) {
            highestCategoryName.textContent = "No expenses yet";
        }

        if (highestCategoryAmount) {
            highestCategoryAmount.textContent = "--";
        }

        if (highestCategoryPercentage) {
            highestCategoryPercentage.textContent = "--";
        }

        if (pieChart) {
            pieChart.style.background = "#e2e8f0";
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    // Display highest-spending category
    const highestCategory = sortedCategories[0];

    const highestPercentage = categoryTotal > 0
        ? (highestCategory[1] / categoryTotal) * 100
        : 0;

    if (highestCategoryName) {
        highestCategoryName.textContent = highestCategory[0];
    }

    if (highestCategoryAmount) {
        highestCategoryAmount.textContent =
            formatMoney(highestCategory[1]);
    }

    if (highestCategoryPercentage) {
        highestCategoryPercentage.textContent =
            highestPercentage.toFixed(1) + "%";
    }

    // Colors for pie chart and category bars
    const chartColors = [
        "#2563eb",
        "#16a34a",
        "#f59e0b",
        "#9333ea",
        "#ef4444",
        "#0891b2",
        "#db2777",
        "#64748b",
        "#84cc16"
    ];

    let currentAngle = 0;
    const gradientParts = [];

    sortedCategories.forEach(function(entry, index) {
        const category = entry[0];
        const amount = entry[1];

        const percentage = categoryTotal > 0
            ? (amount / categoryTotal) * 100
            : 0;

        const color = chartColors[index % chartColors.length];

        // Create pie chart section
        const nextAngle = currentAngle + percentage * 3.6;

        gradientParts.push(
            color + " " + currentAngle + "deg " + nextAngle + "deg"
        );

        currentAngle = nextAngle;

        // Create category breakdown item
        const item = document.createElement("div");
        item.className = "category-item";

        const top = document.createElement("div");
        top.className = "category-top";

        const name = document.createElement("strong");
        name.textContent = category;

        const value = document.createElement("span");
        value.textContent = formatMoney(amount);

        top.appendChild(name);
        top.appendChild(value);

        // Create percentage bar
        const barBackground = document.createElement("div");
        barBackground.className = "category-bar-background";

        const bar = document.createElement("div");
        bar.className = "category-bar";
        bar.style.width = percentage + "%";
        bar.style.backgroundColor = color;

        barBackground.appendChild(bar);

        const percentageText = document.createElement("small");
        percentageText.textContent =
            percentage.toFixed(1) + "% of expenses";

        item.appendChild(top);
        item.appendChild(barBackground);
        item.appendChild(percentageText);

        categoryList.appendChild(item);

        // Create pie chart legend
        if (pieLegend) {
            const legendItem = document.createElement("div");
            legendItem.className = "pie-legend-item";

            const colorDot = document.createElement("span");
            colorDot.className = "pie-legend-color";
            colorDot.style.backgroundColor = color;

            const legendText = document.createElement("span");
            legendText.textContent =
                category + " (" + percentage.toFixed(1) + "%)";

            legendItem.appendChild(colorDot);
            legendItem.appendChild(legendText);

            pieLegend.appendChild(legendItem);
        }
    });

    // Display pie chart
    if (pieChart) {
        pieChart.style.background =
            "conic-gradient(" + gradientParts.join(", ") + ")";

        pieChart.setAttribute(
            "aria-label",
            "Pie chart showing expenses by category"
        );
    }
}


// ============================================
// LOGIN
// ============================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            const message = document.getElementById("loginMessage");

            if (data.success) {
                message.textContent = "Login successful. Welcome!";
                message.className = "message success";

                setTimeout(function() {
                    window.location.href = "index.html";
                }, 1000);

            } else {
                message.textContent = data.message;
                message.className = "message error";
            }

        } catch (error) {
            console.error("Login error:", error);
        }
    });
}


// ============================================
// REGISTER NEW USER (Login page)
// ============================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const message = document.getElementById("registerMessage");

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password
                })
            });

            const data = await response.json();

            message.textContent = data.message;
            message.className = data.success
                ? "message success"
                : "message error";

            if (data.success) {
                registerForm.reset();

                setTimeout(function() {
                    window.location.href = "login.html";
                }, 1500);
            }

        } catch (error) {
            console.error("Registration error:", error);
            message.textContent = "Could not create account.";
            message.className = "message error";
        }
    });
}


// ============================================
// BUDGET PROGRESS
// ============================================

function updateBudgetProgress(
    budget,
    spent,
    progressId,
    statusId
) {
    const progress = document.getElementById(progressId);
    const status = document.getElementById(statusId);

    if (!progress || !status) {
        return;
    }

    // Reset progress and status when no budget is set
    if (budget <= 0) {
        progress.style.width = "0%";
        progress.classList.remove("over-budget");

        status.textContent =
            "Set a monthly budget to begin tracking your spending.";

        status.className = "budget-status";
        return;
    }

    const percentage = (spent / budget) * 100;
    const displayPercentage = Math.min(percentage, 100);

    progress.style.width = displayPercentage + "%";

    if (spent > budget) {
        progress.classList.add("over-budget");

        status.textContent =
            "You are over your monthly budget by " +
            formatMoney(spent - budget) +
            ".";

        status.className = "budget-status over-budget";

    } else {
        progress.classList.remove("over-budget");

        status.textContent =
            "You have " +
            formatMoney(budget - spent) +
            " remaining in your budget.";

        status.className = "budget-status";
    }
}


// ============================================
// HELPER FUNCTIONS
// ============================================

function formatMoney(amount) {
    return "$" + Number(amount).toFixed(2);
}


// ============================================
// START PAGE FUNCTIONS
// ============================================

// Initialize the month selector on Dashboard,
// Budget, and Analytics pages.
if (transactionForm || budgetForm || document.getElementById("categoryList")) {
    setupMonthSelector();
}

// Dashboard-only startup functions
if (transactionForm) {
    setDefaultTransactionDate();
    setDefaultPlannerDate();
    loadDashboard();
}

// Budget page startup
if (budgetForm) {
    loadBudgetPage();
}

// Analytics page startup
if (document.getElementById("categoryList")) {
    loadAnalytics();
}