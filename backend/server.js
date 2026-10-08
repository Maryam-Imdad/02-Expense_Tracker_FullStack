import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let expenses = [];
let idCounter = 1;

app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const { title, amount, category, type } = req.body;
  const numericAmount = Number(amount);
  const validTypes = ['expense', 'income'];

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    typeof category !== 'string' ||
    !category.trim() ||
    !validTypes.includes(type)
  ) {
    return res.status(400).json({
      message: 'Please provide a title, a positive amount, a category, and a valid type.'
    });
  }

  const expense = {
    id: idCounter++,
    title: title.trim(),
    amount: numericAmount,
    category: category.trim(),
    type,
    date: new Date()
  };

  expenses.push(expense);
  return res.status(201).json(expense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const expenseId = Number(req.params.id);
  const originalLength = expenses.length;
  expenses = expenses.filter((expense) => expense.id !== expenseId);

  if (expenses.length === originalLength) {
    return res.status(404).json({ message: 'Transaction not found.' });
  }

  return res.json({ message: 'Transaction deleted.' });
});

app.get('/api/summary', (req, res) => {
  const totalIncome = expenses
    .filter((expense) => expense.type === 'income')
    .reduce((total, expense) => total + expense.amount, 0);
  const totalExpense = expenses
    .filter((expense) => expense.type === 'expense')
    .reduce((total, expense) => total + expense.amount, 0);

  res.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  });
});

app.get('/', (req, res) => {
  res.send('Expense Tracker API Running');
});

app.listen(PORT, () => {
  console.log(`Expense Tracker API running on port ${PORT}`);
});