// STUDENT BUDGET TRACKER
// JavaScript for managing transactions and calculating totals.


// Stores all transactions entered by the user.
let transactions = [];


// Get HTML elements.
const form =
    document.getElementById("transactionForm");

const transactionList =
    document.getElementById("transactionList");

const incomeDisplay =
    document.getElementById("income");

const expensesDisplay =
    document.getElementById("expenses");

const balanceDisplay =
    document.getElementById("balance");

const clearHistoryButton =
    document.getElementById("clearHistory");


// ADD A NEW TRANSACTION
// Runs whenever the form is submitted
form.addEventListener("submit", function(event) {

    // Prevent the webpage from refreshing.
    event.preventDefault();


    // Get the values entered in the form.
    const type =
        document.getElementById("type").value;

    const description =
        document.getElementById("description").value;

    const category =
        document.getElementById("category").value;

    const amount =
        Number(document.getElementById("amount").value);


    // Create a transaction object.
    const transaction = {
        type: type,
        description: description,
        category: category,
        amount: amount
    };


    // Add transaction to the array.
    transactions.push(transaction);


    // Refresh the transaction history.
    displayTransactions();


    // Recalculate income, expenses, and balance.
    updateSummary();


    // Clear the form after transaction is added.
    form.reset();

});




// DISPLAY TRANSACTIONS
// Creates a new table row for each transaction in the array.
function displayTransactions() {

    // Remove old rows before rebuilding table.
    transactionList.innerHTML = "";


    transactions.forEach(function(transaction) {

        // Create new table row.
        const row =
            document.createElement("tr");


        // Add transaction information.
        row.innerHTML = `
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>${transaction.type}</td>
            <td>$${transaction.amount.toFixed(2)}</td>
        `;


        // Add row to transaction table.
        transactionList.appendChild(row);

    });

}

// UPDATE SUMMARY
// Calculates total income, expenses, and current balance.
function updateSummary() {

    let income = 0;
    let expenses = 0;


    // Look through all transactions.
    transactions.forEach(function(transaction) {

        // Add income transactions together.
        if (transaction.type === "income") {

            income += transaction.amount;

        }

        // Everything else is treated as an expense.
        else {

            expenses += transaction.amount;

        }

    });


    // Calculate money remaining.
    const balance =
        income - expenses;


    // Update values shown on the webpage.
    incomeDisplay.textContent =
        "$" + income.toFixed(2);

    expensesDisplay.textContent =
        "$" + expenses.toFixed(2);

    balanceDisplay.textContent =
        "$" + balance.toFixed(2);

}



// CLEAR TRANSACTION HISTORY
// Removes all transactions and resets
// the summary back to $0.

clearHistoryButton.addEventListener(
    "click",
    function() {

        // Ask before deleting everything.
        const confirmed =
            confirm(
                "Are you sure you want to clear all transaction history?"
            );


        // Stop if user selects Cancel.
        if (!confirmed) {
            return;
        }


        // Empty the transaction array.
        transactions = [];


        // Remove transaction rows.
        displayTransactions();


        // Reset totals.
        updateSummary();

    }
);