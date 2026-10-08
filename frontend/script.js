const API = 'http://localhost:5000/api/expenses';
const SUMMARY_API = 'http://localhost:5000/api/summary';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
let chart;

const form = document.getElementById('expenseForm');
const list = document.getElementById('expenseList');
const formMessage = document.getElementById('formMessage');
const emptyChart = document.getElementById('emptyChart');

function formatCurrency(value) {
  return currency.format(Number(value) || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function renderExpenses(expenses) {
  list.replaceChildren();
  document.getElementById('transactionCount').textContent =
    `${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`;

  if (!expenses.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No transactions yet. Add your first one above.';
    list.append(empty);
    return;
  }

  [...expenses].reverse().forEach((expense) => {
    const item = document.createElement('div');
    item.className = 'transaction';

    const symbol = document.createElement('div');
    symbol.className = 'transaction-symbol';
    symbol.textContent = expense.type === 'income' ? '↗' : '◈';

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
    amount.className = `transaction-amount ${expense.type}`;
    amount.textContent = `${expense.type === 'income' ? '+' : '-'}${formatCurrency(expense.amount)}`;

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

function renderChart(expenses) {
  const totals = expenses
    .filter((expense) => expense.type === 'expense')
    .reduce((categories, expense) => {
      categories[expense.category] = (categories[expense.category] || 0) + Number(expense.amount);
      return categories;
    }, {});
  const labels = Object.keys(totals);
  emptyChart.hidden = labels.length > 0;

  if (chart) chart.destroy();
  if (!labels.length) return;

  chart = new Chart(document.getElementById('expenseChart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: Object.values(totals),
        backgroundColor: ['#9b7bff', '#e98cff', '#55dbaf', '#ffbd72', '#6db8ff', '#ff7eaa', '#baa8ff'],
        borderColor: '#1d1b33',
        borderWidth: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'right', labels: { color: '#c9c3db', boxWidth: 10, padding: 13, font: { size: 11 } } },
        tooltip: { callbacks: { label: (context) => ` ${formatCurrency(context.raw)}` } }
      }
    }
  });
}

async function loadDashboard() {
  try {
    const [expensesResponse, summaryResponse] = await Promise.all([fetch(API), fetch(SUMMARY_API)]);
    if (!expensesResponse.ok || !summaryResponse.ok) throw new Error('Unable to load dashboard data.');
    const [expenses, summary] = await Promise.all([expensesResponse.json(), summaryResponse.json()]);
    renderExpenses(expenses);
    renderChart(expenses);
    document.getElementById('balance').textContent = formatCurrency(summary.balance);
    document.getElementById('income').textContent = formatCurrency(summary.totalIncome);
    document.getElementById('expense').textContent = formatCurrency(summary.totalExpense);
  } catch (error) {
    list.innerHTML = '<p class="empty-state">Could not connect to the API. Please start the backend server.</p>';
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
}

async function deleteExpense(id) {
  try {
    const response = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Could not delete transaction.');
    await loadDashboard();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  formMessage.textContent = '';

  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Could not add transaction.');
    }
    form.reset();
    formMessage.textContent = 'Transaction added successfully.';
    await loadDashboard();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
});

document.getElementById('currentDate').textContent = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'short', day: 'numeric'
}).format(new Date());
loadDashboard();