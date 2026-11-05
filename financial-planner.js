
document.addEventListener("DOMContentLoaded", () => {

    const toggleButton = document.getElementById("plannerToggle");
    const plannerContent = document.getElementById("plannerContent");

    const form = document.getElementById("plannerForm");
    const typeSelect = document.getElementById("plannerType");
    const categorySelect = document.getElementById("plannerCategory");
    const descriptionInput = document.getElementById("plannerDescription");
    const amountInput = document.getElementById("plannerAmount");

    const result = document.getElementById("plannerResult");
    const currentBalanceDisplay = document.getElementById("plannerCurrentBalance");
    const projectedBalanceDisplay = document.getElementById("plannerProjectedBalance");
    const adviceDisplay = document.getElementById("plannerAdvice");

    const confirmButton = document.getElementById("plannerConfirm");
    const discardButton = document.getElementById("plannerDiscard");

    // Open and close the planner
    toggleButton.addEventListener("click", () => {
        const opening = plannerContent.hidden;

        plannerContent.hidden = !opening;
        toggleButton.textContent = opening ? "Close Planner" : "Open Planner";
        toggleButton.setAttribute("aria-expanded", String(opening));
    });

    // Use the same categories as the existing transaction form
    const categories = {
        income: [
            "Salary", "Part-Time Job", "Freelance",
            "Gifts", "Scholarships", "Other Income"
        ],
        expense: [
            "Food", "Transportation", "Entertainment",
            "Housing", "School", "Bills", "Shopping",
            "Healthcare", "Other Expense"
        ]
    };

    function updateCategories() {
        categorySelect.innerHTML = "";

        categories[typeSelect.value].forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        result.hidden = true;
    }

    typeSelect.addEventListener("change", updateCategories);
    updateCategories();

    // Any changes invalidate the previous preview
    [descriptionInput, amountInput, categorySelect].forEach(input => {
        input.addEventListener("input", () => {
            result.hidden = true;
        });
    });

    let preview = null;

    // Calculate the projected balance
    form.addEventListener("submit", async event => {
        event.preventDefault();
        result.hidden = true;
        preview = null;

        const type = typeSelect.value;
        const description = descriptionInput.value.trim();
        const category = categorySelect.value;
        const amount = Number(amountInput.value);

        if (!description || !Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid description and amount.");
            return;
        }

        try {
            // Retrieve the latest transactions from the server
            const response = await fetch("/api/transactions", {
                credentials: "same-origin"
            });

            if (response.status === 401 || response.status === 403) {
            throw new Error("Please log in to use the Financial Planner.");
            }

            if (!response.ok) {
            throw new Error("Could not retrieve transactions.");
            }

            const data = await response.json();

            if (!Array.isArray(data.transactions)) {
                throw new Error("Invalid transaction data.");
            }

            const currentBalance = data.transactions.reduce((balance, transaction) => {
                const value = Number(transaction.amount) || 0;

                return transaction.type === "income"
                    ? balance + value
                    : balance - value;
            }, 0);

            const projectedBalance = type === "income"
                ? currentBalance + amount
                : currentBalance - amount;

            // Update the balance in Financial Preview
            currentBalanceDisplay.textContent = formatMoney(currentBalance);
            projectedBalanceDisplay.textContent = formatMoney(projectedBalance);

            const progressBar = document.getElementById("plannerProgressBar");
            const progressText = document.getElementById("plannerProgressText");

            const expensePercentage =
                currentBalance > 0
                ? (amount / currentBalance) * 100
                : 0;

            
            // Provide financial insights based on transaction impact
            if (type === "expense" && projectedBalance < 0) {

                adviceDisplay.textContent =
                    "Warning: This expense exceeds your available balance by " +
                    formatMoney(Math.abs(projectedBalance)) +
                    ". Consider reducing or postponing this purchase.";

                adviceDisplay.style.color = "#dc2626";
                projectedBalanceDisplay.style.color = "#dc2626";

            } else if (type === "expense" && expensePercentage >= 90) {

                adviceDisplay.textContent =
                    "High Risk: This expense would use " +
                    expensePercentage.toFixed(1) +
                    "% of your balance, leaving only " +
                    formatMoney(projectedBalance) +
                    ". You may not have enough money remaining for essential expenses or unexpected costs.";

                adviceDisplay.style.color = "#dc2626";
                projectedBalanceDisplay.style.color = "#c2410c";

            } else if (type === "expense" && expensePercentage >= 75) {

                adviceDisplay.textContent =
                    "Caution: This expense would use " +
                    expensePercentage.toFixed(1) +
                    "% of your balance, leaving " +
                    formatMoney(projectedBalance) +
                    ". Consider your upcoming bills and other financial responsibilities before confirming.";

                adviceDisplay.style.color = "#c2410c";
                projectedBalanceDisplay.style.color = "#c2410c";

            } else if (type === "expense" && expensePercentage >= 25) {

                adviceDisplay.textContent =
                    "This is a significant expense, using " +
                    expensePercentage.toFixed(1) +
                    "% of your balance. You would have " +
                    formatMoney(projectedBalance) +
                    " remaining. Make sure this purchase fits your budget.";

                adviceDisplay.style.color = "#475569";
                projectedBalanceDisplay.style.color = "#2563eb";

            } else if (type === "expense") {

                adviceDisplay.textContent =
                    "This expense would use " +
                    expensePercentage.toFixed(1) +
                    "% of your balance, leaving " +
                    formatMoney(projectedBalance) +
                    ". Remember to account for your other expenses.";

                adviceDisplay.style.color = "#475569";
                projectedBalanceDisplay.style.color = "#2563eb";

            } else {

                adviceDisplay.textContent =
                    "This income would increase your balance by " +
                    formatMoney(amount) +
                    ", bringing your total to " +
                    formatMoney(projectedBalance) +
                    ". Consider putting some of this income toward savings or upcoming expenses.";

                adviceDisplay.style.color = "#15803d";
                projectedBalanceDisplay.style.color = "#15803d";
            }

            
            // Update progress bar based on transaction size
            if (currentBalance > 0) {

                const percentage = (amount / currentBalance) * 100;
                const displayPercentage = Math.min(percentage, 100);

                let barColor;
                let level;

                if (type === "expense") {

                    if (percentage > 100) {
                        barColor = "#dc2626";
                        level = "Exceeds Balance";
                    } else if (percentage > 75) {
                        barColor = "#c2410c";
                        level = "Large Expense";
                    } else if (percentage > 25) {
                        barColor = "#f97316";
                        level = "Medium Expense";
                    } else if (percentage > 10) {
                        barColor = "#facc15";
                        level = "Small Expense";
                    } else {
                        barColor = "#eab308";
                        level = "Very Small Expense";
                    }

                    progressText.textContent =
                        level + ": " +
                        percentage.toFixed(1) +
                        "% of your current balance would be used.";

                } else {

                    if (percentage > 100) {
                        barColor = "#22c55e";
                        level = "Huge Income";
                    } else if (percentage > 50) {
                        barColor = "#2dd4bf";
                        level = "Large Income";
                    } else if (percentage > 10) {
                        barColor = "#2563eb";
                        level = "Medium Income";
                    } else {
                        barColor = "#7dd3fc";
                        level = "Small Income";
                    }

                    progressText.textContent =
                        level + ": Your balance would increase by " +
                        percentage.toFixed(1) + "%.";
                }

                progressBar.style.width = displayPercentage + "%";
                progressBar.style.backgroundColor = barColor;

            } else {

                // Avoid dividing by zero or a negative balance
                progressBar.style.width = "0%";
                progressBar.style.backgroundColor = "#94a3b8";

                progressText.textContent =
                    "A percentage comparison is not available for this balance.";
            }


            preview = { type, description, category, amount };
            result.hidden = false;

        } catch (error) {
            console.error("Planner preview error:", error);
            alert(error.message || "Could not calculate your preview. Please try again.");
        }
    });

    // Save the confirmed transaction
    confirmButton.addEventListener("click", async () => {
        if (!preview) return;

        // Prevent saving if the form was edited after previewing
        if (
            typeSelect.value !== preview.type ||
            descriptionInput.value.trim() !== preview.description ||
            categorySelect.value !== preview.category ||
            Number(amountInput.value) !== preview.amount
        ) {
            result.hidden = true;
            preview = null;
            alert("Your transaction changed. Please preview it again.");
            return;
        }

        confirmButton.disabled = true;

        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify(preview)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not save transaction.");
            }

            alert("Transaction added successfully!");

            form.reset();
            updateCategories();
            result.hidden = true;
            preview = null;

            await loadDashboard(true);

        } catch (error) {
            console.error("Planner save error:", error);
            alert(error.message || "Could not save transaction.");
        } finally {
            confirmButton.disabled = false;
        }
    });

    // Discard the planned transaction
    discardButton.addEventListener("click", () => {
        form.reset();
        updateCategories();
        result.hidden = true;
        preview = null;
    });

});
