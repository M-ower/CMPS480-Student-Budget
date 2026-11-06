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
    try {
        const response = await fetch("/api/analytics");

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load financial insights");
        }

        const data = await response.json();
        const analytics = data.analytics;

        const income = Number(analytics.income) || 0;
        const expenses = Number(analytics.expenses) || 0;
        const balance = income - expenses;

        // Display income, expenses, and balance
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

        // Personalized message based on financial priority
        const priority = prioritySelect.value;

        if (income === 0 && expenses === 0) {
            personalizedInsight.textContent =
                "Add some transactions to start receiving financial insights.";

        } else if (priority === "save_more") {
            personalizedInsight.textContent =
                `Your goal is to save more money. You currently have $${balance.toFixed(2)} remaining after expenses. Consider putting some toward your savings goals.`;

        } else if (priority === "reduce_spending") {
            if (income > 0) {
                const spentPercent = (expenses / income) * 100;

                personalizedInsight.textContent =
                    `Your goal is to reduce spending. You've spent ${spentPercent.toFixed(1)}% of your recorded income. Review your expenses to identify areas to cut back.`;
            } else {
                personalizedInsight.textContent =
                    "Your goal is to reduce spending. Review your recorded expenses and add income to see how your spending compares.";
            }

        } else {
            personalizedInsight.textContent = balance >= 0
                ? `Your expenses are below your income. You're currently maintaining a positive balance of $${balance.toFixed(2)}.`
                : `Your expenses exceed your income by $${Math.abs(balance).toFixed(2)}. Consider reviewing your spending to improve your balance.`;
        }

        insightMessage.textContent = "";

    } catch (error) {
        console.error("Financial insights error:", error);
        personalizedInsight.textContent =
            "Unable to load your financial insights.";
        insightMessage.textContent = "Unable to load financial data.";
    }
}


// Load financial insights from MySQL through the backend
async function loadFinancialInsights() {
    try {
        const response = await fetch("/api/analytics");

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load financial insights");
        }

        const data = await response.json();
        const analytics = data.analytics;

        const income = Number(analytics.income) || 0;
        const expenses = Number(analytics.expenses) || 0;
        const balance = Number(analytics.balance) || 0;

        // Display financial summary
        insightIncome.textContent = `$${income.toFixed(2)}`;
        insightExpenses.textContent = `$${expenses.toFixed(2)}`;
        insightBalance.textContent = `$${balance.toFixed(2)}`;

        // Update income and expense chart
        const maxAmount = Math.max(income, expenses);

        incomeBar.style.width = maxAmount > 0
            ? `${(income / maxAmount) * 100}%`
            : "0%";

        expenseBar.style.width = maxAmount > 0
            ? `${(expenses / maxAmount) * 100}%`
            : "0%";

        // Personalized message based on saved preference
        const priority = prioritySelect.value;

        if (priority === "save_more") {
            personalizedInsight.textContent =
                `Your goal is to save more money. You currently have $${balance.toFixed(2)} remaining from your recorded income after expenses.`;

        } else if (priority === "reduce_spending") {
            const categories = analytics.categories || {};
            const sortedCategories = Object.entries(categories)
                .sort((a, b) => Number(b[1]) - Number(a[1]));

            if (sortedCategories.length > 0) {
                const [category, amount] = sortedCategories[0];

                personalizedInsight.textContent =
                    `Your goal is to reduce spending. Your largest expense category is ${category}, totaling $${Number(amount).toFixed(2)}.`;
            } else {
                personalizedInsight.textContent =
                    "Your goal is to reduce spending. Add some expenses to see where most of your money goes.";
            }

        } else {
            personalizedInsight.textContent =
                `Your goal is to maintain balance. Your recorded income is $${income.toFixed(2)} and your expenses are $${expenses.toFixed(2)}. Your current balance is $${balance.toFixed(2)}.`;
        }

        insightMessage.textContent = "";

    } catch (error) {
        console.error("Financial insights error:", error);
        personalizedInsight.textContent =
            "Unable to load your financial insights.";
        insightMessage.textContent = "Unable to load financial data.";
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

    initializeProfile();
