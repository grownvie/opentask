const STORAGE_TASKS = 'opentask_tasks';
const STORAGE_CATEGORIES = 'opentask_categories';

let tasks = [];
let categories = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;

// DOM Elements
const taskListEl = document.getElementById('taskList');
const taskTitleEl = document.getElementById('taskTitle');
const taskDescEl = document.getElementById('taskDesc');
const taskDateEl = document.getElementById('taskDate');
const taskCategoryEl = document.getElementById('taskCategory');
const addTaskBtn = document.getElementById('addTaskBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const searchInput = document.getElementById('searchInput');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editDesc = document.getElementById('editDesc');
const editDate = document.getElementById('editDate');
const editCategory = document.getElementById('editCategory');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

// --- Init ---
function init() {
    loadData();
    renderCategories();
    render();
    setupEventListeners();
    if (window.lucide) lucide.createIcons();
}

function loadData() {
    const storedTasks = localStorage.getItem(STORAGE_TASKS);
    const storedCategories = localStorage.getItem(STORAGE_CATEGORIES);
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
    if (storedCategories) {
        categories = JSON.parse(storedCategories);
    } else {
        categories = ['Trabalho', 'Pessoal', 'Estudos'];
        saveCategories();
    }
}

function saveTasks() { localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks)); }
function saveCategories() { localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories)); }

// --- Categories ---
function renderCategories() {
    const defaultOption = '<option value="">Sem categoria</option>';
    const options = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    taskCategoryEl.innerHTML = defaultOption + options;
    editCategory.innerHTML = defaultOption + options;
}

function addCategory() {
    const newCat = prompt('Digite o nome da nova categoria:');
    if (newCat && newCat.trim() !== '') {
        const trimmed = newCat.trim();
        if (!categories.includes(trimmed)) {
            categories.push(trimmed);
            saveCategories();
            renderCategories();
            taskCategoryEl.value = trimmed;
        } else {
            alert('Categoria já existe!');
        }
    }
}

// NOVO: apagar categoria por nome (exposto globalmente para o dropdown customizado)
window.deleteCategoryByName = function (name) {
    if (!name) return;

    categories = categories.filter(c => c !== name);
    saveCategories();

    // Tarefas que usavam essa categoria passam a ficar sem categoria
    tasks = tasks.map(task => task.category === name ? { ...task, category: '' } : task);
    saveTasks();

    // Reconstrói selects e lista
    renderCategories();
    render();
};

// --- Tasks ---
function addTask() {
    const title = taskTitleEl.value.trim();
    const description = taskDescEl.value.trim();
    const date = taskDateEl.value;
    const category = taskCategoryEl.value;

    if (!title) { alert('Por favor, digite um título.'); return; }

    const task = { id: Date.now().toString(), title, description, date, category, completed: false };
    tasks.unshift(task);
    saveTasks();
    render();
    taskTitleEl.value = '';
    taskDescEl.value = '';
    taskDateEl.value = '';
    taskCategoryEl.value = '';
    taskTitleEl.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) { task.completed = !task.completed; saveTasks(); render(); }
}

function deleteTask(id) {
    if (confirm('Excluir esta tarefa?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
    }
}

function clearCompleted() {
    if (confirm('Apagar todas as tarefas concluídas?')) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        render();
    }
}

// --- Edit ---
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingId = id;
    editTitle.value = task.title;
    editDesc.value = task.description || '';
    editDate.value = task.date || '';
    editCategory.value = task.category || '';
    editModal.classList.remove('hidden');
}

function closeEditModal() { editingId = null; editModal.classList.add('hidden'); }

function saveEdit() {
    const task = tasks.find(t => t.id === editingId);
    if (!task) return;
    const title = editTitle.value.trim();
    if (!title) { alert('O título não pode ficar vazio.'); return; }
    task.title = title;
    task.description = editDesc.value.trim();
    task.date = editDate.value;
    task.category = editCategory.value;
    saveTasks(); render(); closeEditModal();
}

// --- Render ---
function render() {
    const filtered = tasks.filter(task => {
        const matchFilter = currentFilter === 'all' ? true : currentFilter === 'pending' ? !task.completed : task.completed;
        const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
        taskListEl.innerHTML = `<li style="text-align:center; color:var(--text-muted); padding:2rem;">Nenhuma tarefa encontrada.</li>`;
        return;
    }

    taskListEl.innerHTML = filtered.map(task => {
        const dateFormatted = task.date ? new Date(task.date + 'T00:00:00').toLocaleDateString('pt-BR') : '';
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        ${dateFormatted ? `<span class="task-date"><i data-lucide="calendar"></i> ${dateFormatted}</span>` : ''}
                        ${task.category ? `<span class="task-category"><i data-lucide="tag"></i> ${escapeHtml(task.category)}</span>` : ''}
                    </div>
                    ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-edit" onclick="openEditModal('${task.id}')"><i data-lucide="pencil"></i> Editar</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </li>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Events ---
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    addCategoryBtn.addEventListener('click', addCategory);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    taskTitleEl.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; render(); });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    cancelEditBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEdit);
    editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });
}

init();