
const goalForm = document.getElementById("goalForm");
const goalMessage = document.getElementById("goalMessage");
const goalsList = document.getElementById("goalsList");

async function loadGoals() {
    try {
        const response = await fetch("/api/goals");
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                goalMessage.textContent = "Please log in to view your savings goals.";
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

        data.goals.forEach((goal) => {
            const item = document.createElement("div");
            item.className = "goal-item";

            const name = document.createElement("h3");
            name.textContent = goal.goal_name;

            const target = document.createElement("p");
            target.textContent =
                `Target: $${Number(goal.target_amount).toFixed(2)}`;

            const current = document.createElement("p");
            current.textContent =
                `Saved: $${Number(goal.current_amount).toFixed(2)}`;

            const remaining = document.createElement("p");
            remaining.textContent =
                `Remaining: $${Math.max(
                    0,
                    Number(goal.target_amount) - Number(goal.current_amount)
                ).toFixed(2)}`;

            const date = document.createElement("p");
            date.textContent = goal.target_date
                ? `Target date: ${String(goal.target_date).slice(0, 10)}`
                : "No target date set";

            item.append(name, target, current, remaining, date);
            goalsList.appendChild(item);
        });
    } catch (error) {
        console.error("Load savings goals error:", error);
        goalMessage.textContent = "Could not load savings goals. Please try again.";
    }
}

goalForm.addEventListener("submit", async (event) => {
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
                goalMessage.textContent = "Please log in before saving a goal.";
                return;
            }

            throw new Error(data.message || "Could not save savings goal.");
        }

        goalMessage.textContent = "Savings goal saved successfully!";
        goalForm.reset();
        await loadGoals();
    } catch (error) {
        console.error("Save savings goal error:", error);
        goalMessage.textContent =
            error.message || "Could not save savings goal. Please try again.";
    }
});

loadGoals();
