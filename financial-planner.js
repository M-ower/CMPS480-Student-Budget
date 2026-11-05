document.addEventListener("DOMContentLoaded", () => {

    const toggleButton = document.getElementById("plannerToggle");
    const plannerContent = document.getElementById("plannerContent");

    toggleButton.addEventListener("click", () => {

        const isClosed = plannerContent.hidden;

        plannerContent.hidden = !isClosed;

        toggleButton.textContent = isClosed
            ? "Close Planner"
            : "Open Planner";

        toggleButton.setAttribute("aria-expanded", String(isClosed));

    });

});