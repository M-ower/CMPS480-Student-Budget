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


// Load dashboard information
async function loadDashboard() {

    try {

        const transactionResponse =
            await fetch("/api/transactions");

        const transactionData =
            await transactionResponse.json();


        const budgetResponse =
            await fetch("/api/budgets");

        const budgetData =
            await budgetResponse.json();


        displayTransactions(transactionData.transactions);

        updateDashboardSummary(
            transactionData.transactions,
            budgetData.budget.amount
        );

    } catch (error) {

        console.error("Error loading dashboard:", error);

    }
}


// Add transaction
if (transactionForm) {

    transactionForm.addEventListener("submit", async function(event) {

        event.preventDefault();


        const type =
            document.getElementById("type").value;

        const description =
            document.getElementById("description").value;

        const category =
            document.getElementById("category").value;

        const amount =
            Number(document.getElementById("amount").value);


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
                    amount: amount
                })

            });


            const data = await response.json();


            const message =
                document.getElementById("transactionMessage");


            if (!data.success) {

                message.textContent = data.message;

                message.className = "message error";

                return;

            }


            message.textContent =
                "Transaction added successfully.";

            message.className = "message success";


            transactionForm.reset();


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


    const emptyMessage =
        document.getElementById("emptyMessage");


    if (transactions.length === 0) {

        if (emptyMessage) {
            emptyMessage.style.display = "block";
        }

        return;

    }


    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }


    transactions
        .slice()
        .reverse()
        .forEach(function(transaction) {

            const row =
                document.createElement("tr");


            const descriptionCell =
                document.createElement("td");

            descriptionCell.textContent =
                transaction.description;


            const categoryCell =
                document.createElement("td");

            categoryCell.textContent =
                transaction.category;


            const typeCell =
                document.createElement("td");

            typeCell.textContent =
                transaction.type === "income"
                    ? "Income"
                    : "Expense";


            const amountCell =
                document.createElement("td");

            amountCell.textContent =
                "$" + transaction.amount.toFixed(2);


            if (transaction.type === "income") {

                amountCell.classList.add("income-text");

            } else {

                amountCell.classList.add("expense-text");

            }


            row.appendChild(descriptionCell);

            row.appendChild(categoryCell);

            row.appendChild(typeCell);

            row.appendChild(amountCell);


            transactionList.appendChild(row);

        });

}


// Update dashboard summary
function updateDashboardSummary(
    transactions,
    monthlyBudget
) {

    let income = 0;

    let expenses = 0;


    transactions.forEach(function(transaction) {

        if (transaction.type === "income") {

            income += transaction.amount;

        } else {

            expenses += transaction.amount;

        }

    });


    const balance =
        income - expenses;


    const incomeDisplay =
        document.getElementById("income");

    const expensesDisplay =
        document.getElementById("expenses");

    const balanceDisplay =
        document.getElementById("balance");

    const budgetDisplay =
        document.getElementById("monthlyBudget");


    if (incomeDisplay) {

        incomeDisplay.textContent =
            formatMoney(income);

    }


    if (expensesDisplay) {

        expensesDisplay.textContent =
            formatMoney(expenses);

    }


    if (balanceDisplay) {

        balanceDisplay.textContent =
            formatMoney(balance);

    }


    if (budgetDisplay) {

        budgetDisplay.textContent =
            formatMoney(monthlyBudget);

    }

}


// Clear transaction history
if (clearHistoryButton) {

    clearHistoryButton.addEventListener(
        "click",
        async function() {

            const confirmed =
                confirm(
                    "Are you sure you want to clear all transaction history?"
                );


            if (!confirmed) {
                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/transactions",
                        {
                            method: "DELETE"
                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    loadDashboard();

                }


            } catch (error) {

                console.error(
                    "Error clearing history:",
                    error
                );

            }

        }
    );

}


// ============================================
// BUDGET PAGE
// ============================================

const budgetForm =
    document.getElementById("budgetForm");


if (budgetForm) {

    budgetForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const amount =
                Number(
                    document.getElementById(
                        "budgetAmount"
                    ).value
                );


            try {

                const response =
                    await fetch(
                        "/api/budgets",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                amount: amount
                            })
                        }
                    );


                const data =
                    await response.json();


                const message =
                    document.getElementById(
                        "budgetMessage"
                    );


                if (!data.success) {

                    message.textContent =
                        data.message;

                    message.className =
                        "message error";

                    return;

                }


                message.textContent =
                    "Monthly budget saved successfully.";

                message.className =
                    "message success";


                budgetForm.reset();


                loadBudgetPage();


            } catch (error) {

                console.error(
                    "Error saving budget:",
                    error
                );

            }

        }
    );


    loadBudgetPage();

}


// Load budget information
async function loadBudgetPage() {

    try {

        const budgetResponse =
            await fetch("/api/budgets");

        const budgetData =
            await budgetResponse.json();


        const transactionResponse =
            await fetch("/api/transactions");

        const transactionData =
            await transactionResponse.json();


        const monthlyBudget =
            budgetData.budget.amount;


        let expenses = 0;


        transactionData.transactions.forEach(
            function(transaction) {

                if (transaction.type === "expense") {

                    expenses += transaction.amount;

                }

            }
        );


        const remaining =
            monthlyBudget - expenses;


        const currentBudget =
            document.getElementById(
                "currentBudget"
            );

        const budgetSpent =
            document.getElementById(
                "budgetSpent"
            );

        const budgetRemaining =
            document.getElementById(
                "budgetRemaining"
            );


        if (currentBudget) {

            currentBudget.textContent =
                formatMoney(monthlyBudget);

        }


        if (budgetSpent) {

            budgetSpent.textContent =
                formatMoney(expenses);

        }


        if (budgetRemaining) {

            budgetRemaining.textContent =
                formatMoney(remaining);

        }


        updateBudgetProgress(
            monthlyBudget,
            expenses,
            "budgetPageProgress",
            "budgetPageStatus"
        );


    } catch (error) {

        console.error(
            "Error loading budget:",
            error
        );

    }

}


// ============================================
// ANALYTICS PAGE
// ============================================

async function loadAnalytics() {

    const categoryList =
        document.getElementById("categoryList");


    if (!categoryList) {
        return;
    }


    try {

        const response =
            await fetch("/api/analytics");


        const data =
            await response.json();


        const analytics =
            data.analytics;


        document.getElementById(
            "analyticsIncome"
        ).textContent =
            formatMoney(analytics.income);


        document.getElementById(
            "analyticsExpenses"
        ).textContent =
            formatMoney(analytics.expenses);


        document.getElementById(
            "analyticsBalance"
        ).textContent =
            formatMoney(analytics.balance);


        document.getElementById(
            "remainingBudget"
        ).textContent =
            formatMoney(
                analytics.remainingBudget
            );


        displayCategories(
            analytics.categories,
            analytics.expenses
        );


        updateBudgetProgress(
            analytics.monthlyBudget,
            analytics.expenses,
            "budgetProgress",
            "budgetStatus"
        );


    } catch (error) {

        console.error(
            "Error loading analytics:",
            error
        );

    }

}


// Display category breakdown
function displayCategories(
    categories,
    totalExpenses
) {

    const categoryList =
        document.getElementById(
            "categoryList"
        );


    const emptyMessage =
        document.getElementById(
            "analyticsEmptyMessage"
        );


    categoryList.innerHTML = "";


    const categoryNames =
        Object.keys(categories);


    if (categoryNames.length === 0) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";

        }

        return;

    }


    if (emptyMessage) {

        emptyMessage.style.display =
            "none";

    }


    categoryNames
        .sort(
            function(a, b) {
                return categories[b] -
                    categories[a];
            }
        )
        .forEach(function(category) {

            const amount =
                categories[category];


            const percentage =
                totalExpenses > 0
                    ? (amount / totalExpenses) * 100
                    : 0;


            const item =
                document.createElement("div");

            item.className =
                "category-item";


            const top =
                document.createElement("div");

            top.className =
                "category-top";


            const name =
                document.createElement("strong");

            name.textContent =
                category;


            const value =
                document.createElement("span");

            value.textContent =
                formatMoney(amount);


            top.appendChild(name);

            top.appendChild(value);


            const barBackground =
                document.createElement("div");

            barBackground.className =
                "category-bar-background";


            const bar =
                document.createElement("div");

            bar.className =
                "category-bar";

            bar.style.width =
                percentage + "%";


            barBackground.appendChild(bar);


            const percentageText =
                document.createElement("small");

            percentageText.textContent =
                percentage.toFixed(1) +
                "% of expenses";


            item.appendChild(top);

            item.appendChild(
                barBackground
            );

            item.appendChild(
                percentageText
            );


            categoryList.appendChild(item);

        });

}


// ============================================
// LOGIN
// ============================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const email =
                document.getElementById(
                    "email"
                ).value;


            const password =
                document.getElementById(
                    "password"
                ).value;


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                const message =
                    document.getElementById(
                        "loginMessage"
                    );


                if (data.success) {

                    message.textContent =
                        "Login successful. Welcome!";

                    message.className =
                        "message success";


                    setTimeout(function() {

                        window.location.href =
                            "index.html";

                    }, 1000);

                } else {

                    message.textContent =
                        data.message;

                    message.className =
                        "message error";

                }


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

            }

        }
    );

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

    const progress =
        document.getElementById(progressId);

    const status =
        document.getElementById(statusId);


    if (!progress || !status) {
        return;
    }


    if (budget <= 0) {

        progress.style.width = "0%";

        status.textContent =
            "Set a monthly budget to begin tracking your spending.";

        return;

    }


    const percentage =
        (spent / budget) * 100;


    const displayPercentage =
        Math.min(percentage, 100);


    progress.style.width =
        displayPercentage + "%";


    if (spent > budget) {

        status.textContent =
            "You are over your monthly budget by " +
            formatMoney(spent - budget) +
            ".";

        status.className =
            "budget-status over-budget";

    } else {

        status.textContent =
            "You have " +
            formatMoney(budget - spent) +
            " remaining in your budget.";

        status.className =
            "budget-status";

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

if (transactionForm) {

    loadDashboard();

}


if (document.getElementById("categoryList")) {

    loadAnalytics();

}