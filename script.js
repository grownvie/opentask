document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setInterval(updateStorageStatus, 5000);
});

// Funções de Cookies
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while(c.charAt(0) === ' ') c = c.substring(1);
        if(c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
}

// Funções principais
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();

    if(!taskText) {
        alert('Por favor, digite uma tarefa!');
        return;
    }

    const taskList = document.getElementById('taskList');
    
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <span>${taskText}</span>
        <button class="delete-btn" onclick="deleteTask(this)">Excluir</button>
    `;

    taskList.appendChild(li);
    taskInput.value = '';
    saveTasks();
}

function deleteTask(button) {
    button.parentElement.remove();
    saveTasks();
}

function deleteAllTasks() {
    document.getElementById('taskList').innerHTML = '';
    saveTasks();
}

// Sistema de armazenamento
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item span').forEach(task => {
        tasks.push(task.textContent);
    });
    
    const data = JSON.stringify(tasks);
    try {
        localStorage.setItem('tasks', data);
    } catch(e) {
        console.log('Erro no localStorage, usando cookies:', e);
    }
    setCookie('todoList', data, 30);
    updateStorageStatus();
}

function loadTasks() {
    let tasks = [];
    
    try {
        const localData = localStorage.getItem('tasks');
        if(localData) {
            tasks = JSON.parse(localData);
            document.getElementById('storageStatus').textContent = "Dados carregados do cache local";
        } else {
            const cookieData = getCookie('todoList');
            if(cookieData) {
                tasks = JSON.parse(cookieData);
                localStorage.setItem('tasks', cookieData);
                document.getElementById('storageStatus').textContent = "Dados carregados de cookies";
            }
        }
    } catch(e) {
        console.log('Erro ao carregar dados:', e);
    }

    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    tasks.forEach(taskText => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <span>${taskText}</span>
            <button class="delete-btn" onclick="deleteTask(this)">Excluir</button>
        `;
        taskList.appendChild(li);
    });

    updateStorageStatus();
}

function updateStorageStatus() {
    const statusElement = document.getElementById('storageStatus');
    try {
        if(localStorage.getItem('tasks')) {
            statusElement.textContent = "Dados armazenados localmente e em cookies";
        } else {
            statusElement.textContent = "Armazenamento local não disponível, usando cookies";
        }
    } catch(e) {
        statusElement.textContent = "Usando cookies como fallback";
        console.log('Erro no localStorage:', e);
    }
}

// Evento do Enter
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if(e.key === 'Enter') addTask();
});