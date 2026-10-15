const STORAGE_TASKS = 'opentask_tasks';
const STORAGE_CATEGORIES = 'opentask_categories';

let tasks = [];
let categories = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;
let selectedCategory = '';

// Elementos do DOM
const taskListEl = document.getElementById('taskList');
const taskTitleEl = document.getElementById('taskTitle');
const taskDescEl = document.getElementById('taskDesc');
const taskDateEl = document.getElementById('taskDate');
const addTaskBtn = document.getElementById('addTaskBtn');
const searchInput = document.getElementById('searchInput');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Custom Select de Categoria
const categoryDropdown = document.getElementById('categoryDropdown');
const categoryTrigger = document.getElementById('categoryTrigger');
const categoryOptions = document.getElementById('categoryOptions');
const selectedCategoryText = document.getElementById('selectedCategoryText');

// Elementos do Modal
const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editDesc = document.getElementById('editDesc');
const editDate = document.getElementById('editDate');
const editCategory = document.getElementById('editCategory');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');

// --- Inicialização ---
function init() {
    loadData();
    renderCategories();
    render();
    setupEventListeners();
    lucide.createIcons(); // Inicializa ícones do Lucide
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

function saveTasks() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
}

// --- Categorias Customizadas ---
function renderCategories() {
    // Renderiza opções no dropdown customizado
    let optionsHtml = `<div class="option" data-value="">Sem categoria</div>`;
    categories.forEach(cat => {
        optionsHtml += `<div class="option" data-value="${cat}">${cat}</div>`;
    });
    optionsHtml += `<div class="option add-new" data-value="new"><i data-lucide="plus"></i> Nova Categoria</div>`;
    categoryOptions.innerHTML = optionsHtml;

    // Renderiza opções no select do modal (nativo)
    const defaultOption = '<option value="">Sem categoria</option>';
    const modalOptions = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    editCategory.innerHTML = defaultOption + modalOptions;
    
    // Atualiza ícones dentro do dropdown
    lucide.createIcons();
}

function selectCategory(value) {
    selectedCategory = value;
    selectedCategoryText.textContent = value || 'Sem categoria';
    categoryDropdown.classList.remove('open');
    categoryOptions.classList.add('hidden');
}

function toggleCategoryDropdown() {
    const isHidden = categoryOptions.classList.contains('hidden');
    if (isHidden) {
        categoryDropdown.classList.add('open');
        categoryOptions.classList.remove('hidden');
    } else {
        categoryDropdown.classList.remove('open');
        categoryOptions.classList.add('hidden');
    }
}

function handleCategoryOptionClick(e) {
    const option = e.target.closest('.option');
    if (!option) return;

    const value = option.dataset.value;

    if (value === 'new') {
        const newCat = prompt('Digite o nome da nova categoria:');
        if (newCat && newCat.trim() !== '') {
            const trimmed = newCat.trim();
            if (!categories.includes(trimmed)) {
                categories.push(trimmed);
                saveCategories();
                renderCategories();
                selectCategory(trimmed);
            } else {
                alert('Categoria já existe!');
            }
        }
    } else {
        selectCategory(value);
    }
}

// --- Tarefas ---
function addTask() {
    const title = taskTitleEl.value.trim();
    const description = taskDescEl.value.trim();
    const date = taskDateEl.value;
    const category = selectedCategory;

    if (!title) {
        alert('Por favor, digite um título para a tarefa.');
        return;
    }

    const task = {
        id: Date.now().toString(),
        title,
        description,
        date,
        category,
        completed: false
    };

    tasks.unshift(task);
    saveTasks();
    render();

    // Limpar formulário
    taskTitleEl.value = '';
    taskDescEl.value = '';
    taskDateEl.value = '';
    selectCategory('');
    taskTitleEl.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        render();
    }
}

function deleteTask(id) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
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

// --- Edição ---
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

function closeEditModal() {
    editingId = null;
    editModal.classList.add('hidden');
}

function saveEdit() {
    const task = tasks.find(t => t.id === editingId);
    if (!task) return;

    const title = editTitle.value.trim();
    if (!title) {
        alert('O título não pode ficar vazio.');
        return;
    }

    task.title = title;
    task.description = editDesc.value.trim();
    task.date = editDate.value;
    task.category = editCategory.value;

    saveTasks();
    render();
    closeEditModal();
}

// --- Renderização ---
function render() {
    const filtered = tasks.filter(task => {
        const matchesFilter = 
            currentFilter === 'all' ? true :
            currentFilter === 'pending' ? !task.completed :
            currentFilter === 'completed' ? task.completed : true;
            
        const matchesSearch = 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        taskListEl.innerHTML = `<li style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma tarefa encontrada.</li>`;
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
                    <button class="btn-edit" onclick="openEditModal('${task.id}')">
                        <i data-lucide="pencil"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </li>
        `;
    }).join('');

    // Recria os ícones na lista renderizada
    lucide.createIcons();
}

// Função para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Event Listeners ---
function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    taskTitleEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    // Eventos do Custom Select
    categoryTrigger.addEventListener('click', toggleCategoryDropdown);
    categoryOptions.addEventListener('click', handleCategoryOptionClick);
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!categoryDropdown.contains(e.target)) {
            categoryDropdown.classList.remove('open');
            categoryOptions.classList.add('hidden');
        }
    });

    // Eventos do Modal
    cancelEditBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEdit);
    
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
}

// Iniciar aplicação
init();