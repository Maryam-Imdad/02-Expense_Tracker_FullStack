const STORAGE_KEY = 'spendly-expenses';
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const form = document.querySelector('#expenseForm');
const list = document.querySelector('#expenseList');
const categorySummary = document.querySelector('#categorySummary');
const formMessage = document.querySelector('#formMessage');
let expenses = loadExpenses();

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return currency.format(Number(value) || 0);
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : dateFormatter.format(date);
}

function renderSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  document.querySelector('#totalBalance').textContent = formatCurrency(total);
  document.querySelector('#expenseCount').textContent = expenses.length;
  document.querySelector('#averageExpense').textContent = formatCurrency(expenses.length ? total / expenses.length : 0);
  document.querySelector('#transactionCount').textContent =
    `${expenses.length} expense${expenses.length === 1 ? '' : 's'}`;
}

function renderCategories() {
  const totals = CATEGORIES.map((category) => ({
    category,
    total: expenses.filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0)
  })).filter((item) => item.total > 0);
  categorySummary.replaceChildren();

  if (!totals.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Add an expense to see your spending breakdown.';
    categorySummary.append(empty);
    return;
  }

  const largest = Math.max(...totals.map((item) => item.total));
  totals.forEach(({ category, total }) => {
    const row = document.createElement('div');
    row.className = 'category-row';
    const name = document.createElement('span');
    name.className = 'category-name';
    name.textContent = category;
    const track = document.createElement('span');
    track.className = 'category-track';
    const fill = document.createElement('span');
    fill.className = 'category-fill';
    fill.style.width = `${(total / largest) * 100}%`;
    track.append(fill);
    const amount = document.createElement('span');
    amount.className = 'category-amount';
    amount.textContent = formatCurrency(total);
    row.append(name, track, amount);
    categorySummary.append(row);
  });
}

function renderExpenses() {
  list.replaceChildren();
  if (!expenses.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No expenses yet. Add your first one above.';
    list.append(empty);
    return;
  }

  [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .forEach((expense) => {
      const item = document.createElement('article');
      item.className = 'transaction';
      const symbol = document.createElement('div');
      symbol.className = 'transaction-symbol';
      symbol.textContent = '−';
      const info = document.createElement('div');
      info.className = 'transaction-info';
      const title = document.createElement('div');
      title.className = 'transaction-title';
      title.textContent = expense.title;
      const meta = document.createElement('div');
      meta.className = 'transaction-meta';
      meta.textContent = `${expense.category} · ${formatDate(expense.date)}`;
      info.append(title, meta);
      const amount = document.createElement('div');
      amount.className = 'transaction-amount';
      amount.textContent = `−${formatCurrency(expense.amount)}`;
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button';
      deleteButton.type = 'button';
      deleteButton.setAttribute('aria-label', `Delete ${expense.title}`);
      deleteButton.textContent = '×';
      deleteButton.addEventListener('click', () => deleteExpense(expense.id));
      item.append(symbol, info, amount, deleteButton);
      list.append(item);
    });
}

function render() {
  renderSummary();
  renderCategories();
  renderExpenses();
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
  formMessage.textContent = 'Expense deleted.';
  formMessage.className = 'form-message';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const amount = Number(data.get('amount'));

  if (!Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = 'Enter an amount greater than zero.';
    formMessage.className = 'form-message error';
    return;
  }

  expenses.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: String(data.get('title')).trim(),
    amount,
    category: String(data.get('category')),
    date: String(data.get('date')),
    createdAt: Date.now()
  });
  saveExpenses();
  form.reset();
  document.querySelector('#date').value = new Date().toISOString().slice(0, 10);
  formMessage.textContent = 'Expense added successfully.';
  formMessage.className = 'form-message';
  render();
});

document.querySelector('#currentDate').textContent = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'short', day: 'numeric'
}).format(new Date());
document.querySelector('#date').value = new Date().toISOString().slice(0, 10);
render();
