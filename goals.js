
const goalForm = document.getElementById("goalForm");
const goalMessage = document.getElementById("goalMessage");
const goalsList = document.getElementById("goalsList");

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

function formatMoney(amount) {
    return currency.format(Number(amount) || 0);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getGoalProgress(goal) {
    const target = Number(goal.target_amount) || 0;
    const saved = Number(goal.current_amount) || 0;

    const remaining = Math.max(0, target - saved);

    const percentage = target > 0
        ? Math.min(100, Math.max(0, (saved / target) * 100))
        : 0;

    return {
        target,
        saved,
        remaining,
        percentage
    };
}

function getMonthlySavings(remaining, targetDate) {
    if (remaining <= 0) {
        return {
            amount: 0,
            message: "This savings goal has been completed."
        };
    }

    if (!targetDate) {
        return {
            amount: null,
            message: "Add a target date to calculate the monthly savings needed."
        };
    }

    const parts = String(targetDate).slice(0, 10).split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return {
            amount: null,
            message: "The target date could not be calculated."
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(parts[0], parts[1] - 1, parts[2]);
    deadline.setHours(0, 0, 0, 0);

    if (deadline < today) {
        return {
            amount: null,
            message: "The target date has passed. Consider updating your deadline."
        };
    }

    const daysRemaining = Math.max(
        1,
        Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
    );

    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.4375));

    const monthlyAmount = remaining / monthsRemaining;

    return {
        amount: monthlyAmount,
        message: `Save approximately ${formatMoney(monthlyAmount)} per month to reach this goal on time.`
    };
}

function createGoalCard(goal) {
    const progress = getGoalProgress(goal);
    const monthlySavings = getMonthlySavings(
        progress.remaining,
        goal.target_date
    );

    const item = createElement("div", "goal-item");

    const name = createElement("h3", "", goal.goal_name);

    const details = createElement("div", "goal-details");

    details.append(
        createElement("p", "", `Target amount: ${formatMoney(progress.target)}`),
        createElement("p", "", `Currently saved: ${formatMoney(progress.saved)}`),
        createElement("p", "", `Remaining: ${formatMoney(progress.remaining)}`),
        createElement(
            "p",
            "",
            goal.target_date
                ? `Target date: ${String(goal.target_date).slice(0, 10)}`
                : "No target date set"
        )
    );

    const progressHeader = createElement("div", "goal-progress-header");

    const progressLabel = createElement("span", "", "Goal progress");

    const percentage = createElement(
        "strong",
        "",
        `${progress.percentage.toFixed(1)}%`
    );

    if (progress.remaining === 0) {
        percentage.classList.add("goal-completed");
    }

    progressHeader.append(progressLabel, percentage);

    const progressContainer = createElement(
        "div",
        "goal-progress-container"
    );

    const progressBar = createElement("div", "goal-progress-bar");

    progressBar.style.width = `${progress.percentage}%`;

    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuenow", progress.percentage.toFixed(1));
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    progressBar.setAttribute(
        "aria-label",
        `${goal.goal_name} progress`
    );

    progressContainer.appendChild(progressBar);

    const savingsInfo = createElement("div", "goal-savings-info");

    savingsInfo.append(
        createElement("p", "", `Amount remaining: ${formatMoney(progress.remaining)}`),
        createElement(
            "p",
            "",
            monthlySavings.amount === null
                ? monthlySavings.message
                : `Monthly savings needed: ${formatMoney(monthlySavings.amount)}`
        )
    );

    const insight = createElement("div", "goal-insight");
    const insightText = createElement("p");

    if (progress.remaining === 0) {
        insight.classList.add("success");
        insightText.textContent =
            `Congratulations! You reached your ${goal.goal_name} savings goal.`;
    } else if (
        goal.target_date &&
        monthlySavings.amount === null
    ) {
        insight.classList.add("warning");
        insightText.textContent = monthlySavings.message;
    } else if (progress.percentage >= 75) {
        insight.classList.add("success");
        insightText.textContent =
            `You're close! You have completed ${progress.percentage.toFixed(1)}% of this goal.`;
    } else if (progress.percentage < 25) {
        insightText.textContent =
            `You're getting started. Keep saving toward your ${goal.goal_name} goal.`;
    } else {
        insightText.textContent =
            `You have completed ${progress.percentage.toFixed(1)}% of this goal. Keep going!`;
    }

    insight.appendChild(insightText);

    item.append(
        name,
        details,
        progressHeader,
        progressContainer,
        savingsInfo,
        insight
    );

    return item;
}

function displayGoalSummary(goals) {
    const summary = createElement("div", "goals-summary-grid");

    const totalSaved = goals.reduce(
        (total, goal) => total + (Number(goal.current_amount) || 0),
        0
    );

    const totalRemaining = goals.reduce(
        (total, goal) => total + getGoalProgress(goal).remaining,
        0
    );

    const activeGoals = goals.filter(
        goal => getGoalProgress(goal).remaining > 0
    ).length;

    const cards = [
        {
            title: "Total Saved",
            value: formatMoney(totalSaved)
        },
        {
            title: "Total Remaining",
            value: formatMoney(totalRemaining)
        },
        {
            title: "Active Goals",
            value: String(activeGoals)
        }
    ];

    cards.forEach(card => {
        const summaryCard = createElement("div", "goal-summary-card");

        summaryCard.append(
            createElement("h3", "", card.title),
            createElement("strong", "", card.value)
        );

        summary.appendChild(summaryCard);
    });

    goalsList.appendChild(summary);
}

async function loadGoals() {
    try {
        const response = await fetch("/api/goals");
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                goalMessage.textContent =
                    "Please log in to view your savings goals.";

                goalsList.innerHTML = "";
                return;
            }

            throw new Error(data.message || "Could not load savings goals.");
        }

        goalsList.innerHTML = "";

        if (!data.goals || data.goals.length === 0) {
            goalsList.textContent = "No savings goals yet.";
            return;
        }

        displayGoalSummary(data.goals);

        data.goals.forEach(goal => {
            goalsList.appendChild(createGoalCard(goal));
        });

    } catch (error) {
        console.error("Load savings goals error:", error);

        goalMessage.textContent =
            "Could not load savings goals. Please try again.";
    }
}

goalForm.addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(goalForm);

    const goal = {
        goal_name: formData.get("goal_name")?.toString().trim(),
        target_amount: formData.get("target_amount"),
        current_amount: formData.get("current_amount"),
        target_date: formData.get("target_date") || null
    };

    goalMessage.textContent = "";

    try {
        const response = await fetch("/api/goals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(goal)
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                goalMessage.textContent =
                    "Please log in before saving a goal.";
                return;
            }

            throw new Error(data.message || "Could not save savings goal.");
        }

        goalMessage.textContent = "Savings goal saved successfully!";
        goalMessage.className = "message success";

        goalForm.reset();

        await loadGoals();

    } catch (error) {
        console.error("Save savings goal error:", error);

        goalMessage.textContent =
            error.message || "Could not save savings goal. Please try again.";

        goalMessage.className = "message error";
    }
});

loadGoals();
