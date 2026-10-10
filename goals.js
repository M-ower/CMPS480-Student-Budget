const goalForm = document.getElementById("goalForm");
const goalMessage = document.getElementById("goalMessage");

goalForm.addEventListener("submit", function(event) {
    event.preventDefault();

    goalMessage.textContent =
        "Savings goal saving will be available after database integration.";
});