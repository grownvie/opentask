let currentFilter = 'all';

function addTask() {
    const title = document.getElementById('taskInput').value.trim();
    const description = document.getElementById('taskDesc').value.trim();

    if (!title) {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }

    const task = {
        title,
        description,
        completed: false,
        id: Date.now()
    };

    addTaskToDOM(task);
    saveTasks();
    clearInputs();
}

function addTaskToDOM(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;
    li.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
        <div class="task-content">
            <div class="task-title">
                ${task.title}
            </div>
            ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Excluir</button>
    `;

    document.getElementById('taskList').appendChild(li);
    applyFilter();
}

function toggleTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        refreshTaskList();
    }
}

function deleteTask(id) {
    const tasks = getTasks().filter(t => t.id !== id);
    saveTasks(tasks);
    refreshTaskList();
}

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => 
        btn.classList.remove('active'));
    event.target.classList.add('active');
    applyFilter();
}

function applyFilter() {
    document.querySelectorAll('.task-item').forEach(item => {
        const completed = item.querySelector('input').checked;
        item.style.display = 
            currentFilter === 'all' ? 'flex' :
            currentFilter === 'completed' && completed ? 'flex' :
            currentFilter === 'pending' && !completed ? 'flex' : 'none';
    });
}

function getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasks(tasks) {
    tasks = tasks || Array.from(document.querySelectorAll('.task-item')).map(item => ({
        id: Number(item.dataset.id),
        title: item.querySelector('.task-title').textContent.trim(),
        description: item.querySelector('.task-desc')?.textContent.trim() || '',
        completed: item.querySelector('input').checked
    }));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function refreshTaskList() {
    const tasks = getTasks();
    document.getElementById('taskList').innerHTML = '';
    tasks.forEach(addTaskToDOM);
    applyFilter();
}

function clearInputs() {
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDesc').value = '';
}

// Carregar tarefas ao iniciar
window.onload = () => {
    getTasks().forEach(addTaskToDOM);
    applyFilter();
};
