const API = 'http://localhost:3000';

// ---- AUTH ----
async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    document.getElementById('auth-message').textContent = 
        res.ok ? 'Registered! Now log in.' : data.error;
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        showTodoSection();
        loadTodos();
    } else {
        document.getElementById('auth-message').textContent = data.error;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    location.reload();
}

// ---- TODOS ----
async function loadTodos() {
    const res = await fetch(`${API}/todos`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const todos = await res.json();
    renderTodos(todos);
}

async function addTodo() {
    const task = document.getElementById('new-task').value;
    if (!task) return;

    await fetch(`${API}/todos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ task })
    });

    document.getElementById('new-task').value = '';
    loadTodos();
}

async function toggleTodo(id, isComplete) {
    await fetch(`${API}/todos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isComplete: !isComplete })
    });
    loadTodos();
}

async function deleteTodo(id) {
    await fetch(`${API}/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    loadTodos();
}

// ---- UI ----
function renderTodos(todos) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = todo.is_complete ? 'done' : '';
        li.innerHTML = `
            <span onclick="toggleTodo(${todo.id}, ${todo.is_complete})" style="cursor:pointer">
                ${todo.task}
            </span>
            <button onclick="deleteTodo(${todo.id})">Delete</button>
        `;
        list.appendChild(li);
    });
}

function showTodoSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('todo-section').classList.remove('hidden');
    document.getElementById('current-user').textContent = localStorage.getItem('username');
}

// ---- INIT ----
if (localStorage.getItem('token')) {
    showTodoSection();
    loadTodos();
}