const STORAGE_TASKS = 'opentask_tasks';
const STORAGE_CATEGORIES = 'opentask_categories';
const DEFAULT_CATEGORIES = ['Trabalho', 'Pessoal', 'Estudos'];
const ADD_NEW_VALUE = '__new_category__';

let tasks = [];
let categories = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;
let storageErrorShown = false;

// Dropdowns de categoria (formulário principal e modal de edição)
const categoryControllers = [];
let mainCategory = null;
let editCategorySelect = null;

// DOM Elements
const taskListEl = document.getElementById('taskList');
const taskTitleEl = document.getElementById('taskTitle');
const taskDescEl = document.getElementById('taskDesc');
const taskDateEl = document.getElementById('taskDate');
const taskCategoryEl = document.getElementById('taskCategory');
const addTaskBtn = document.getElementById('addTaskBtn');
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

    mainCategory = createCategorySelect({
        container: document.querySelector('.category-field'),
        trigger: document.getElementById('categoryTrigger'),
        display: document.getElementById('categoryDisplay'),
        panel: document.getElementById('categoryOptions'),
        nativeSelect: taskCategoryEl
    });
    editCategorySelect = createCategorySelect({
        container: document.querySelector('.edit-category-field'),
        trigger: document.getElementById('editCategoryTrigger'),
        display: document.getElementById('editCategoryDisplay'),
        panel: document.getElementById('editCategoryOptions'),
        nativeSelect: editCategory
    });

    renderCategories();
    render();
    setupEventListeners();
    if (window.lucide) lucide.createIcons();
}

// --- Armazenamento ---
function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        console.warn(`OpenTask: não foi possível ler "${key}".`, err);
        return fallback;
    }
}

function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.warn(`OpenTask: não foi possível salvar "${key}".`, err);
        if (!storageErrorShown) {
            storageErrorShown = true;
            alert('Não foi possível salvar seus dados neste navegador (armazenamento cheio ou bloqueado). As alterações podem ser perdidas ao fechar a página.');
        }
    }
}

function loadData() {
    const storedTasks = readJSON(STORAGE_TASKS, []);
    tasks = Array.isArray(storedTasks)
        ? storedTasks
            .filter(t => t && t.id != null && typeof t.title === 'string')
            .map(t => ({ ...t, id: String(t.id) }))
        : [];

    const storedCategories = readJSON(STORAGE_CATEGORIES, null);
    if (Array.isArray(storedCategories)) {
        categories = storedCategories.filter(c => typeof c === 'string' && c.trim() !== '');
    } else {
        categories = [...DEFAULT_CATEGORIES];
        saveCategories();
    }
}

function saveTasks() { writeJSON(STORAGE_TASKS, tasks); }
function saveCategories() { writeJSON(STORAGE_CATEGORIES, categories); }

// --- Categorias ---
function renderCategories() {
    categoryControllers.forEach(ctrl => ctrl.render());
}

function addCategory(targetCtrl = mainCategory) {
    const input = prompt('Digite o nome da nova categoria:');
    const name = input ? input.trim() : '';
    if (!name) return;

    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
        alert('Categoria já existe!');
        return;
    }

    categories.push(name);
    saveCategories();
    renderCategories();
    targetCtrl.setValue(name);
}

function deleteCategory(name) {
    if (!name) return false;
    if (!confirm(`Apagar a categoria "${name}"?\n\nAs tarefas desta categoria ficarão como "Sem categoria".`)) return false;

    categories = categories.filter(c => c !== name);
    saveCategories();

    // Tarefas que usavam essa categoria passam a ficar sem categoria
    tasks = tasks.map(task => task.category === name ? { ...task, category: '' } : task);
    saveTasks();

    renderCategories();
    render();
    return true;
}

/*
 * Dropdown customizado de categoria.
 * O <select> nativo fica escondido e guarda o valor; o painel é só a interface.
 * Teclado: setas/Home/End navegam, Enter/Espaço escolhem, Esc fecha,
 * Delete apaga a categoria em foco.
 */
function createCategorySelect({ container, trigger, display, panel, nativeSelect }) {
    function optionEls() {
        return Array.from(panel.querySelectorAll('.custom-option'));
    }

    function isOpen() {
        return !panel.classList.contains('hidden');
    }

    function buildOption(value, label, isCategory) {
        const el = document.createElement('div');
        el.className = 'custom-option';
        el.setAttribute('role', 'option');
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-selected', 'false');
        el.dataset.value = value;

        const text = document.createElement('span');
        text.className = 'custom-option-label';
        text.textContent = label;
        el.appendChild(text);

        if (isCategory) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'custom-option-delete';
            del.tabIndex = -1;
            del.title = 'Apagar categoria';
            del.setAttribute('aria-label', `Apagar categoria ${value}`);
            del.textContent = '✕';
            el.appendChild(del);
        }
        return el;
    }

    function refreshSelected() {
        const current = nativeSelect.value;
        optionEls().forEach(el => {
            const selected = el.dataset.value !== ADD_NEW_VALUE && el.dataset.value === current;
            el.setAttribute('aria-selected', String(selected));
        });
    }

    function update() {
        display.textContent = nativeSelect.value || 'Sem categoria';
        refreshSelected();
    }

    function renderPanel() {
        const items = [
            buildOption('', 'Sem categoria', false),
            ...categories.map(c => buildOption(c, c, true))
        ];
        const add = buildOption(ADD_NEW_VALUE, '+ Nova Categoria', false);
        add.classList.add('add-new');
        panel.replaceChildren(...items, add);
    }

    // Recria as opções preservando a seleção atual (se ela ainda existir)
    function render() {
        const previous = nativeSelect.value;
        nativeSelect.replaceChildren(
            new Option('Sem categoria', ''),
            ...categories.map(c => new Option(c, c))
        );
        nativeSelect.value = categories.includes(previous) ? previous : '';
        renderPanel();
        update();
    }

    function setValue(value) {
        nativeSelect.value = categories.includes(value) ? value : '';
        update();
    }

    function focusOption(index) {
        const opts = optionEls();
        if (!opts.length) return;
        opts[Math.max(0, Math.min(index, opts.length - 1))].focus();
    }

    function open() {
        categoryControllers.forEach(c => { if (c !== api) c.close(); });
        panel.classList.remove('hidden');
        container.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        const selectedIndex = optionEls().findIndex(el => el.getAttribute('aria-selected') === 'true');
        focusOption(selectedIndex >= 0 ? selectedIndex : 0);
    }

    function close(returnFocus = false) {
        const wasOpen = isOpen();
        panel.classList.add('hidden');
        container.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        if (returnFocus && wasOpen) trigger.focus();
    }

    function choose(value) {
        setValue(value);
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        close(true);
    }

    trigger.addEventListener('click', () => {
        isOpen() ? close() : open();
    });

    panel.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.custom-option-delete');
        if (deleteBtn) {
            // Evita que o clique "fora" feche o painel depois que ele for recriado
            e.stopPropagation();
            deleteCategory(deleteBtn.closest('.custom-option').dataset.value);
            return;
        }

        const optionEl = e.target.closest('.custom-option');
        if (!optionEl) return;

        const value = optionEl.dataset.value;
        if (value === ADD_NEW_VALUE) {
            close();
            addCategory(api);
            trigger.focus();
        } else {
            choose(value);
        }
    });

    container.addEventListener('keydown', (e) => {
        if (!isOpen()) {
            if (e.target === trigger && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                open();
            }
            return;
        }

        const opts = optionEls();
        const current = opts.indexOf(document.activeElement);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusOption(current + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusOption(current <= 0 ? 0 : current - 1);
                break;
            case 'Home':
                e.preventDefault();
                focusOption(0);
                break;
            case 'End':
                e.preventDefault();
                focusOption(opts.length - 1);
                break;
            case 'Enter':
            case ' ':
                if (current >= 0) {
                    e.preventDefault();
                    opts[current].click();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (current >= 0 && opts[current].querySelector('.custom-option-delete')) {
                    e.preventDefault();
                    deleteCategory(opts[current].dataset.value);
                    focusOption(current);
                }
                break;
            case 'Escape':
                // Fecha só o dropdown, sem fechar o modal por trás
                e.preventDefault();
                e.stopPropagation();
                close(true);
                break;
            case 'Tab':
                close();
                break;
        }
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) close();
    });

    nativeSelect.addEventListener('change', update);

    const api = { render, setValue, close, getValue: () => nativeSelect.value };
    categoryControllers.push(api);
    return api;
}

// --- Tarefas ---
function generateId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function addTask() {
    const title = taskTitleEl.value.trim();
    const description = taskDescEl.value.trim();
    const date = taskDateEl.value;
    const category = taskCategoryEl.value;

    if (!title) { alert('Por favor, digite um título.'); return; }

    const task = { id: generateId(), title, description, date, category, completed: false };
    tasks.unshift(task);
    saveTasks();
    render();

    taskTitleEl.value = '';
    taskDescEl.value = '';
    taskDateEl.value = '';
    mainCategory.setValue('');
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
    if (!tasks.some(t => t.completed)) return;
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
    editCategorySelect.setValue(task.category || '');
    editModal.classList.remove('hidden');
    editTitle.focus();
}

function isEditDirty() {
    const task = tasks.find(t => t.id === editingId);
    if (!task) return false;
    return editTitle.value.trim() !== task.title
        || editDesc.value.trim() !== (task.description || '')
        || editDate.value !== (task.date || '')
        || editCategorySelect.getValue() !== (task.category || '');
}

function closeEditModal() {
    const id = editingId;
    editingId = null;
    editCategorySelect.close();
    editModal.classList.add('hidden');

    // Devolve o foco ao botão de editar da tarefa
    if (id) {
        const btn = taskListEl.querySelector(`.task-item[data-id="${id}"] .btn-edit`);
        if (btn) btn.focus();
    }
}

// Fechar por Esc ou clique fora não descarta edições sem avisar
function requestCloseEditModal() {
    if (isEditDirty() && !confirm('Descartar as alterações desta tarefa?')) return;
    closeEditModal();
}

function saveEdit() {
    const task = tasks.find(t => t.id === editingId);
    if (!task) { closeEditModal(); return; }

    const title = editTitle.value.trim();
    if (!title) { alert('O título não pode ficar vazio.'); return; }

    task.title = title;
    task.description = editDesc.value.trim();
    task.date = editDate.value;
    task.category = editCategory.value;
    saveTasks();
    render();
    closeEditModal();
}

// --- Render ---
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, ch => map[ch]);
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    return isNaN(date) ? '' : date.toLocaleDateString('pt-BR');
}

function render() {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter(task => {
        const matchFilter = currentFilter === 'all' ? true : currentFilter === 'pending' ? !task.completed : task.completed;
        const matchSearch = !query
            || task.title.toLowerCase().includes(query)
            || (task.description || '').toLowerCase().includes(query)
            || (task.category || '').toLowerCase().includes(query);
        return matchFilter && matchSearch;
    });

    clearCompletedBtn.disabled = !tasks.some(t => t.completed);

    if (filtered.length === 0) {
        const message = tasks.length === 0
            ? 'Nenhuma tarefa ainda. Adicione a primeira para começar.'
            : 'Nenhuma tarefa encontrada.';
        taskListEl.innerHTML = `<li class="empty-state">${message}</li>`;
        return;
    }

    taskListEl.innerHTML = filtered.map(task => {
        const dateFormatted = formatDate(task.date);
        const hasMeta = dateFormatted || task.category;
        const title = escapeHtml(task.title);
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${escapeHtml(task.id)}">
                <label class="task-check">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="${title}">
                </label>
                <div class="task-content">
                    <div class="task-title">${title}</div>
                    ${hasMeta ? `
                        <div class="task-meta">
                            ${dateFormatted ? `<span class="task-date"><i data-lucide="calendar"></i> ${dateFormatted}</span>` : ''}
                            ${task.category ? `<span class="task-category">${escapeHtml(task.category)}</span>` : ''}
                        </div>
                    ` : ''}
                    ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button type="button" class="btn-edit" title="Editar" aria-label="Editar tarefa: ${title}"><i data-lucide="pencil"></i></button>
                    <button type="button" class="btn-delete" title="Excluir" aria-label="Excluir tarefa: ${title}"><i data-lucide="trash-2"></i></button>
                </div>
            </li>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

// --- Eventos ---
function trapFocusInModal(e) {
    const focusable = Array.from(editModal.querySelectorAll('input, textarea, button'))
        .filter(el => el.tabIndex >= 0 && !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function setupEventListeners() {
    addTaskBtn.addEventListener('click', addTask);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    taskTitleEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) addTask(); });
    editTitle.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) saveEdit(); });
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; render(); });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    // Delegação de eventos na lista (sem onclick inline)
    taskListEl.addEventListener('change', e => {
        const checkbox = e.target.closest('.task-checkbox');
        if (!checkbox) return;
        toggleTask(checkbox.closest('.task-item').dataset.id);
    });

    taskListEl.addEventListener('click', e => {
        const item = e.target.closest('.task-item');
        if (!item) return;
        if (e.target.closest('.btn-edit')) openEditModal(item.dataset.id);
        else if (e.target.closest('.btn-delete')) deleteTask(item.dataset.id);
    });

    cancelEditBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEdit);
    editModal.addEventListener('click', e => { if (e.target === e.currentTarget) requestCloseEditModal(); });

    document.addEventListener('keydown', e => {
        if (editModal.classList.contains('hidden')) return;
        if (e.key === 'Escape') requestCloseEditModal();
        else if (e.key === 'Tab') trapFocusInModal(e);
    });

    // Mantém várias abas sincronizadas em vez de sobrescrever os dados umas das outras
    window.addEventListener('storage', e => {
        if (e.key !== null && e.key !== STORAGE_TASKS && e.key !== STORAGE_CATEGORIES) return;
        loadData();
        renderCategories();
        render();
    });
}

init();
