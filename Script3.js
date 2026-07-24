// JavaScript source code
const CATEGORY_DATA = {
    Housing: { color: "#b7f34a", icon: "🏠" },
    Food: { color: "#56cfe1", icon: "🛒" },
    Transport: { color: "#ffb454", icon: "⛽" },
    Fun: { color: "#a78bfa", icon: "🎬" }
};

const CATEGORIES = Object.keys(CATEGORY_DATA);
const STORAGE_KEY = "budget-flow-vanilla-v1";

const DEFAULT_EXPENSES = [
    { id: "rent", name: "Apartment rent", category: "Housing", amount: 520 },
    { id: "groceries", name: "Weekly groceries", category: "Food", amount: 186 },
    { id: "market", name: "Farmers market", category: "Food", amount: 134 },
    { id: "fuel", name: "Fuel", category: "Transport", amount: 92 },
    {
        id: "insurance",
        name: "Car insurance",
        category: "Transport",
        amount: 168
    },
    { id: "cinema", name: "Cinema and dinner", category: "Fun", amount: 74 },
    { id: "gym", name: "Gym membership", category: "Fun", amount: 56 },
    { id: "trip", name: "Weekend trip", category: "Fun", amount: 110 }
];

let expenses = [...DEFAULT_EXPENSES];
let monthlyBudget = 2000;

const expenseForm = document.getElementById("expense-form");
const budgetForm = document.getElementById("budget-form");
const editBudgetButton = document.getElementById("edit-budget-btn");
const cancelBudgetButton = document.getElementById("cancel-budget-btn");
const monthlyBudgetInput = document.getElementById("monthly-budget");

const budgetValue = document.getElementById("budget-value");
const spentValue = document.getElementById("spent-value");
const spentPercentage = document.getElementById("spent-percentage");
const remainingCard = document.getElementById("remaining-card");
const remainingIcon = document.getElementById("remaining-icon");
const remainingTitle = document.getElementById("remaining-title");
const remainingValue = document.getElementById("remaining-value");
const remainingDescription = document.getElementById(
    "remaining-description"
);

const donut = document.getElementById("donut");
const donutSpent = document.getElementById("donut-spent");
const donutBudget = document.getElementById("donut-budget");
const categoryList = document.getElementById("category-list");

const transactionList = document.getElementById("transaction-list");
const itemCount = document.getElementById("item-count");
const emptyState = document.getElementById("empty-state");
const statusMessage = document.getElementById("status-message");

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2
    }).format(value);
}

function isValidCategory(category) {
    return CATEGORIES.includes(category);
}

function loadData() {
    try {
        const savedValue = localStorage.getItem(STORAGE_KEY);

        if (!savedValue) {
            return;
        }

        const savedData = JSON.parse(savedValue);

        if (Array.isArray(savedData.expenses)) {
            expenses = savedData.expenses.filter(function (expense) {
                return (
                    typeof expense.id === "string" &&
                    typeof expense.name === "string" &&
                    isValidCategory(expense.category) &&
                    Number.isFinite(expense.amount) &&
                    expense.amount > 0
                );
            });
        }

        if (
            Number.isFinite(savedData.monthlyBudget) &&
            savedData.monthlyBudget >= 100 &&
            savedData.monthlyBudget <= 1000000
        ) {
            monthlyBudget = savedData.monthlyBudget;
        }
    } catch (error) {
        console.error("Saved budget data could not be loaded.", error);
        localStorage.removeItem(STORAGE_KEY);
    }
}

function saveData() {
    const data = {
        expenses: expenses,
        monthlyBudget: monthlyBudget
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showStatus(message) {
    statusMessage.textContent = message;
}

function getTotalSpent() {
    return expenses.reduce(function (total, expense) {
        return total + expense.amount;
    }, 0);
}

function getCategoryTotals(totalSpent) {
    return CATEGORIES.map(function (category) {
        const amount = expenses
            .filter(function (expense) {
                return expense.category === category;
            })
            .reduce(function (total, expense) {
                return total + expense.amount;
            }, 0);

        return {
            name: category,
            amount: amount,
            percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
            color: CATEGORY_DATA[category].color
        };
    });
}

function createDonutBackground(categoryTotals, totalSpent) {
    if (totalSpent === 0) {
        return "#e4eaed";
    }

    let start = 0;

    const segments = categoryTotals.map(function (category) {
        const end = start + (category.amount / totalSpent) * 360;
        const segment = `${category.color} ${start}deg ${end}deg`;
        start = end;
        return segment;
    });

    return `conic-gradient(${segments.join(", ")})`;
}

function renderSummary(totalSpent) {
    const remaining = monthlyBudget - totalSpent;
    const percentage = monthlyBudget > 0
        ? (totalSpent / monthlyBudget) * 100
        : 0;
    const isOverBudget = remaining < 0;

    budgetValue.textContent = formatCurrency(monthlyBudget);
    spentValue.textContent = formatCurrency(totalSpent);
    spentPercentage.textContent = `${percentage.toFixed(1)}% of budget`;

    remainingValue.textContent = formatCurrency(Math.abs(remaining));
    remainingTitle.textContent = isOverBudget ? "Over budget" : "Remaining";
    remainingIcon.textContent = isOverBudget ? "!" : "✓";

    remainingDescription.textContent = isOverBudget
        ? "Review your spending"
        : `${Math.max(0, 100 - percentage).toFixed(1)}% left to spend`;

    remainingCard.classList.toggle("danger", isOverBudget);
}

function createCategoryRow(category) {
    const row = document.createElement("div");
    row.className = "category-row";

    const label = document.createElement("div");
    label.className = "category-label";

    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.backgroundColor = category.color;

    const name = document.createElement("strong");
    name.textContent = category.name;

    const percentage = document.createElement("span");
    percentage.textContent = `${category.percentage.toFixed(1)}%`;

    label.append(dot, name, percentage);

    const bar = document.createElement("div");
    bar.className = "bar-track";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", `${category.name} share`);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute(
        "aria-valuenow",
        String(Math.round(category.percentage))
    );

    const barValue = document.createElement("span");
    barValue.style.width = `${category.percentage}%`;
    barValue.style.backgroundColor = category.color;
    bar.appendChild(barValue);

    const amount = document.createElement("strong");
    amount.textContent = formatCurrency(category.amount);

    row.append(label, bar, amount);

    return row;
}

function renderChart(totalSpent) {
    const categoryTotals = getCategoryTotals(totalSpent);

    donut.style.background = createDonutBackground(
        categoryTotals,
        totalSpent
    );

    donut.setAttribute(
        "aria-label",
        `Doughnut chart showing ${formatCurrency(totalSpent)} spent by category`
    );

    donutSpent.textContent = formatCurrency(totalSpent);
    donutBudget.textContent = formatCurrency(monthlyBudget);

    categoryList.innerHTML = "";

    categoryTotals.forEach(function (category) {
        categoryList.appendChild(createCategoryRow(category));
    });
}

function createTransactionRow(expense) {
    const row = document.createElement("article");
    row.className = "transaction-row";

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = CATEGORY_DATA[expense.category].icon;

    const details = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = expense.name;

    const category = document.createElement("span");
    category.textContent = expense.category;

    details.append(name, category);

    const amount = document.createElement("strong");
    amount.textContent = `−${formatCurrency(expense.amount)}`;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.id = expense.id;
    deleteButton.setAttribute("aria-label", `Remove ${expense.name}`);
    deleteButton.textContent = "×";

    row.append(icon, details, amount, deleteButton);

    return row;
}

function renderTransactions() {
    transactionList.innerHTML = "";

    expenses.forEach(function (expense) {
        transactionList.appendChild(createTransactionRow(expense));
    });

    const itemWord = expenses.length === 1 ? "item" : "items";
    itemCount.textContent = `${expenses.length} ${itemWord}`;

    transactionList.hidden = expenses.length === 0;
    emptyState.hidden = expenses.length !== 0;
}

function renderApp() {
    const totalSpent = getTotalSpent();

    renderSummary(totalSpent);
    renderChart(totalSpent);
    renderTransactions();
}

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(expenseForm);
    const name = String(formData.get("name") ?? "").trim();
    const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
    const category = formData.get("category");

    if (
        name === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100000
    ) {
        showStatus("Enter an expense name and an amount greater than €0.");
        return;
    }

    if (!isValidCategory(category)) {
        showStatus("Choose an expense category.");
        return;
    }

    const newExpense = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: name,
        amount: amount,
        category: category
    };

    expenses.unshift(newExpense);

    saveData();
    renderApp();
    showStatus(`${name} was added.`);

    expenseForm.reset();
});

transactionList.addEventListener("click", function (event) {
    const deleteButton = event.target.closest("button[data-id]");

    if (!deleteButton) {
        return;
    }

    const expenseId = deleteButton.dataset.id;
    const selectedExpense = expenses.find(function (expense) {
        return expense.id === expenseId;
    });

    expenses = expenses.filter(function (expense) {
        return expense.id !== expenseId;
    });

    saveData();
    renderApp();

    if (selectedExpense) {
        showStatus(`${selectedExpense.name} was removed.`);
    }
});

editBudgetButton.addEventListener("click", function () {
    monthlyBudgetInput.value = monthlyBudget;
    budgetForm.hidden = false;
    editBudgetButton.hidden = true;
    monthlyBudgetInput.focus();
});

cancelBudgetButton.addEventListener("click", function () {
    budgetForm.hidden = true;
    editBudgetButton.hidden = false;
});

budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const newBudget =
        Math.round(Number(monthlyBudgetInput.value) * 100) / 100;

    if (
        !Number.isFinite(newBudget) ||
        newBudget < 100 ||
        newBudget > 1000000
    ) {
        showStatus("Set a monthly budget between €100 and €1,000,000.");
        return;
    }

    monthlyBudget = newBudget;

    saveData();
    renderApp();

    budgetForm.hidden = true;
    editBudgetButton.hidden = false;

    showStatus(
        `Monthly budget updated to ${formatCurrency(newBudget)}.`
    );
});

loadData();
renderApp();