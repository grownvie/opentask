const STORAGE_KEY = 'adwaita-tasks';

let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let draggedId = null;

const taskListEl = document.getElementById('taskList');
const taskInputEl = document.getElementById('taskInput');
const taskDescEl = document.getElementById('taskDesc');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const counterEl = document.getElementById('counter');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');

// Carregar tarefas do localStorage
function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
}

// Salvar tarefas
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Escapar HTML para segurança
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar lista com filtros e busca
function render() {
    const filtered = tasks.filter(task => {
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'pending' && !task.completed) ||
            (currentFilter === 'completed' && task.completed);
        const matchesSearch = task.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(currentSearch.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    taskListEl.innerHTML = '';
    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.id = task.id;
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Concluir tarefa">
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
            </div>
            <button class="delete-btn" aria-label="Excluir tarefa">✕</button>
        `;

        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        taskListEl.appendChild(li);
    });

    counterEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'tarefa' : 'tarefas'}`;
}

// Adicionar nova tarefa
function addTask() {
    const title = taskInputEl.value.trim();
    const description = taskDescEl.value.trim();
    if (!title) return;

    const task = {
        id: Date.now().toString(),
        title,
        description,
        completed: false
    };

    tasks.unshift(task);
    saveTasks();
    render();
    taskInputEl.value = '';
    taskDescEl.value = '';
    taskInputEl.focus();
}

// Alternar conclusão
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        render();
    }
}

// Excluir tarefa
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

// Limpar concluídas
function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
}

// Drag and Drop para reordenar
function handleDragStart(e) {
    draggedId = e.target.dataset.id;
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetId = e.target.closest('.task-item')?.dataset.id;
    if (!targetId || targetId === draggedId) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);
    const [draggedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, draggedTask);
    saveTasks();
    render();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedId = null;
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    render();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// Inicializar
loadTasks();
render();
