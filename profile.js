const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

const displayNameInput = document.getElementById("display_name");
const profileImageInput = document.getElementById("profile_image");
const bioInput = document.getElementById("bio");

const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const profileInitials = document.getElementById("profileInitials");
const profileAvatar = document.getElementById("profileAvatar");
// Financial Preferences
const priorityForm = document.getElementById("priorityForm");
const prioritySelect = document.getElementById("financialPriority");
const priorityMessage = document.getElementById("priorityMessage");

// Financial Insights
const insightIncome = document.getElementById("insightIncome");
const insightExpenses = document.getElementById("insightExpenses");
const insightBalance = document.getElementById("insightBalance");

const incomeBar = document.getElementById("incomeBar");
const expenseBar = document.getElementById("expenseBar");
const personalizedInsight = document.getElementById("personalizedInsight");
const insightMessage = document.getElementById("insightMessage");
const profileMonthSelector = document.getElementById("profileMonthSelector");


// Set up January through December 2026
function setupProfileMonthSelector() {
    const currentMonth = new Date().getMonth();

    profileMonthSelector.innerHTML = "";

    for (let month = 0; month < 12; month++) {
        const date = new Date(2026, month, 1);

        const option = document.createElement("option");

        option.value = `2026-${String(month + 1).padStart(2, "0")}`;

        option.textContent = date.toLocaleString("en-US", {
            month: "long",
            year: "numeric"
        });

        profileMonthSelector.appendChild(option);
    }

    profileMonthSelector.value =
        `2026-${String(currentMonth + 1).padStart(2, "0")}`;
}


// Floating spending notification
const spendingToast = document.getElementById("spendingToast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");
const toastClose = document.getElementById("toastClose");

let toastTimer;

function hideSpendingToast() {
    spendingToast.hidden = true;
    clearTimeout(toastTimer);
}

toastClose.addEventListener("click", hideSpendingToast);

function showSpendingToast(income, expenses) {

    // Hide any previous notification
    hideSpendingToast();

    // Only show if expenses reach 80% of income
    if (income <= 0 || expenses < income * 0.8) return;

    spendingToast.classList.remove("warning", "caution");

    if (expenses > income) {
        spendingToast.classList.add("warning");
        toastTitle.textContent = "Spending Warning";
        toastMessage.textContent =
            `Your expenses exceed your income by $${(expenses - income).toFixed(2)} this month.`;

    } else {
        spendingToast.classList.add("caution");
        toastTitle.textContent = "Spending Caution";
        toastMessage.textContent =
            `You've used ${((expenses / income) * 100).toFixed(1)}% of your monthly income.`;
    }

    spendingToast.hidden = false;

    // Automatically hide after 10 seconds
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideSpendingToast, 10000);
}

function updateProfilePreview() {
    const name = displayNameInput.value.trim();
    const bio = bioInput.value.trim();

    previewName.textContent = name || "Your Display Name";
    previewBio.textContent = bio || "Your bio will appear here.";

    profileInitials.textContent = name
        ? name.charAt(0).toUpperCase()
        : "?";
}

// Update preview while typing
displayNameInput.addEventListener("input", updateProfilePreview);
bioInput.addEventListener("input", updateProfilePreview);

// Load profile from MySQL through the backend
async function loadProfile() {
    try {
        const response = await fetch("/api/profile");

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load profile");
        }

        const profile = await response.json();

        document.getElementById("firstName").textContent =
            profile.first_name || "Not provided";

        document.getElementById("lastName").textContent =
            profile.last_name || "Not provided";

        document.getElementById("email").textContent =
            profile.email || "Not provided";

        displayNameInput.value = profile.display_name || "";
        profileImageInput.value = profile.profile_image || "";
        bioInput.value = profile.bio || "";

        // Load saved financial priority
        prioritySelect.value = profile.financial_priority || "balanced";


        updateProfilePreview();

    } catch (error) {
        console.error(error);
        profileMessage.textContent = "Unable to load profile.";
    }
}

// Load financial insights from the backend
async function loadFinancialInsights() {
    const selectedMonth = profileMonthSelector.value;

    personalizedInsight.textContent = "Loading financial insights...";
    insightMessage.textContent = "";

    try {
        const response = await fetch(
            `/api/transactions?month=${selectedMonth}`,
            { credentials: "same-origin" }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load monthly transactions");
        }

        const data = await response.json();
        const transactions = data.transactions;

        if (!Array.isArray(transactions)) {
            throw new Error("Invalid transaction data");
        }

        // Ignore an older response if the month changed
        if (selectedMonth !== profileMonthSelector.value) {
            return;
        }

        let income = 0;
        let expenses = 0;

        transactions.forEach(transaction => {
            const amount = Number(transaction.amount) || 0;

            if (transaction.type === "income") {
                income += amount;
            } else if (transaction.type === "expense") {
                expenses += amount;
            }
        });

        const balance = income - expenses;
        showSpendingToast(income, expenses);

        // Update financial summary
        insightIncome.textContent = `$${income.toFixed(2)}`;
        insightExpenses.textContent = `$${expenses.toFixed(2)}`;
        insightBalance.textContent = `$${balance.toFixed(2)}`;

        insightBalance.style.color =
            balance >= 0 ? "#16a34a" : "#dc2626";

        // Update chart bars
        const maxAmount = Math.max(income, expenses);

        incomeBar.style.width = maxAmount > 0
            ? `${(income / maxAmount) * 100}%`
            : "0%";

        expenseBar.style.width = maxAmount > 0
            ? `${(expenses / maxAmount) * 100}%`
            : "0%";

        // Personalized insight based on financial preference
        const priority = prioritySelect.value;

        if (income === 0 && expenses === 0) {
            personalizedInsight.textContent =
                "No transactions recorded for this month.";

        } else if (priority === "save_more") {
            personalizedInsight.textContent =
                `Your goal is to save more money. Your monthly balance is $${balance.toFixed(2)}. Consider setting aside some money for savings.`;

        } else if (priority === "reduce_spending") {
            if (income > 0) {
                const percentage = (expenses / income) * 100;

                personalizedInsight.textContent =
                    `Your goal is to reduce spending. You've spent ${percentage.toFixed(1)}% of your monthly income.`;
            } else {
                personalizedInsight.textContent =
                    "You have recorded expenses but no income this month. Review your spending.";
            }

        } else {
            personalizedInsight.textContent =
                balance >= 0
                    ? `You're maintaining a positive monthly balance of $${balance.toFixed(2)}.`
                    : `Your monthly expenses exceed your income by $${Math.abs(balance).toFixed(2)}.`;
        }

    } catch (error) {
        if (selectedMonth !== profileMonthSelector.value) {
            return;
        }

        console.error("Financial insights error:", error);

        personalizedInsight.textContent =
            "Unable to load financial insights.";

        insightMessage.textContent =
            "Unable to load financial data.";
    }
}



// Save changes to MySQL through the backend
profileForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    profileMessage.textContent = "Saving...";

    try {
        const response = await fetch("/api/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                display_name: displayNameInput.value.trim(),
                profile_image: profileImageInput.value.trim(),
                bio: bioInput.value.trim()
            })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to save profile");
        }

        profileMessage.textContent = "Profile saved successfully!";
        updateProfilePreview();

    } catch (error) {
        console.error(error);
        profileMessage.textContent = "Unable to save profile.";
    }
});
// Save financial preference to MySQL
priorityForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    priorityMessage.textContent = "Saving...";
    
    try {
        const response = await fetch("/api/profile/priority", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                financial_priority: prioritySelect.value
            })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to save preference");
        }

        priorityMessage.textContent = "Financial preference saved successfully!";
        priorityMessage.style.color = "green";

        // Refresh insight after changing financial priority
        await loadFinancialInsights();

    } catch (error) {
        console.error(error);
        priorityMessage.textContent = "Unable to save financial preference.";
        priorityMessage.style.color = "red";
    }
});

    // Load profile first, then financial insights
    async function initializeProfile() {
        setupProfileMonthSelector();
        await loadProfile();
        await loadFinancialInsights();

}

// Logout button
const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/logout", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Logout failed");
        }

        window.location.href = "login.html";

    } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to log out. Please try again.");
    }
});

    profileMonthSelector.addEventListener("change", () => {
    hideSpendingToast();
    loadFinancialInsights();
});

initializeProfile();