// Todo List Application
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.editingId = null;
        this.draggedElement = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.render();
    }

    // Initialize DOM elements
    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.todoCount = document.getElementById('todoCount');
        this.emptyState = document.getElementById('emptyState');
        this.themeToggle = document.getElementById('themeToggle');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.markAllCompleteBtn = document.getElementById('markAllComplete');
    }

    // Bind event listeners
    bindEvents() {
        // Form submission
        this.todoForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Action buttons
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.markAllCompleteBtn.addEventListener('click', () => this.markAllComplete());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Drag and drop events
        this.todoList.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.todoList.addEventListener('drop', (e) => this.handleDrop(e));
    }

    // Handle form submission
    handleSubmit(e) {
        e.preventDefault();
        const text = this.todoInput.value.trim();
        
        if (text) {
            this.addTodo(text);
            this.todoInput.value = '';
            this.todoInput.focus();
        }
    }

    // Add new todo
    addTodo(text) {
        const todo = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        this.showNotification('Task added successfully!', 'success');
    }

    // Toggle todo completion
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            
            const message = todo.completed ? 'Task completed!' : 'Task marked as active!';
            this.showNotification(message, todo.completed ? 'success' : 'info');
        }
    }

    // Delete todo
    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('removing');
            
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
                this.showNotification('Task deleted!', 'info');
            }, 300);
        }
    }

    // Start editing todo
    startEdit(id) {
        if (this.editingId) {
            this.cancelEdit();
        }
        
        this.editingId = id;
        const todo = this.todos.find(t => t.id === id);
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        const textElement = todoElement.querySelector('.todo-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-edit-input';
        input.value = todo.text;
        input.maxLength = 200;
        
        textElement.replaceWith(input);
        input.focus();
        input.select();
        
        // Handle edit completion
        const finishEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== todo.text) {
                todo.text = newText;
                this.saveTodos();
                this.showNotification('Task updated!', 'success');
            }
            this.editingId = null;
            this.render();
        };
        
        const cancelEdit = () => {
            this.editingId = null;
            this.render();
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });
    }

    // Cancel editing
    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    // Clear completed todos
    clearCompleted() {
        const completedCount = this.todos.filter(t => t.completed).length;
        if (completedCount === 0) return;
        
        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            this.showNotification(`${completedCount} completed task(s) deleted!`, 'info');
        }
    }

    // Mark all todos as complete
    markAllComplete() {
        const incompleteCount = this.todos.filter(t => !t.completed).length;
        if (incompleteCount === 0) return;
        
        this.todos.forEach(todo => {
            todo.completed = true;
        });
        
        this.saveTodos();
        this.render();
        this.showNotification('All tasks marked as complete!', 'success');
    }

    // Get filtered todos
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    // Render the todo list
    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Clear current list
        this.todoList.innerHTML = '';
        
        // Show/hide empty state
        if (filteredTodos.length === 0) {
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
        }
        
        // Render todos
        filteredTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        });
        
        // Update stats
        this.updateStats();
        
        // Update action buttons
        this.updateActionButtons();
    }

    // Create todo element
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        li.draggable = true;
        
        li.innerHTML = `
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                 onclick="app.toggleTodo('${todo.id}')"></div>
            <span class="todo-text" ondblclick="app.startEdit('${todo.id}')">${this.escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="todo-btn edit" onclick="app.startEdit('${todo.id}')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-btn delete" onclick="app.deleteTodo('${todo.id}')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add drag event listeners
        li.addEventListener('dragstart', (e) => this.handleDragStart(e));
        li.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        return li;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Update statistics
    updateStats() {
        const activeCount = this.todos.filter(t => !t.completed).length;
        const totalCount = this.todos.length;
        
        let statsText;
        if (totalCount === 0) {
            statsText = 'No tasks';
        } else if (activeCount === 0) {
            statsText = 'All tasks completed!';
        } else if (activeCount === 1) {
            statsText = '1 task remaining';
        } else {
            statsText = `${activeCount} tasks remaining`;
        }
        
        this.todoCount.textContent = statsText;
    }

    // Update action buttons
    updateActionButtons() {
        const hasCompleted = this.todos.some(t => t.completed);
        const hasIncomplete = this.todos.some(t => !t.completed);
        
        this.clearCompletedBtn.disabled = !hasCompleted;
        this.markAllCompleteBtn.disabled = !hasIncomplete;
    }

    // Drag and drop handlers
    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(this.todoList, e.clientY);
        if (afterElement == null) {
            this.todoList.appendChild(this.draggedElement);
        } else {
            this.todoList.insertBefore(this.draggedElement, afterElement);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        // Reorder todos array based on new DOM order
        const todoElements = Array.from(this.todoList.children);
        const newOrder = todoElements.map(el => el.dataset.id);
        
        this.todos.sort((a, b) => {
            return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        });
        
        this.saveTodos();
        this.showNotification('Tasks reordered!', 'info');
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter: Add new todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.todoInput.focus();
        }
        
        // Escape: Cancel editing or clear input
        if (e.key === 'Escape') {
            if (this.editingId) {
                this.cancelEdit();
            } else if (document.activeElement === this.todoInput) {
                this.todoInput.value = '';
                this.todoInput.blur();
            }
        }
        
        // Ctrl/Cmd + A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement !== this.todoInput) {
            e.preventDefault();
            this.markAllComplete();
        }
        
        // Delete: Clear completed
        if (e.key === 'Delete' && document.activeElement !== this.todoInput && !this.editingId) {
            this.clearCompleted();
        }
    }

    // Theme management
    initializeTheme() {
        const savedTheme = localStorage.getItem('todoTheme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('todoTheme', theme);
        
        const icon = this.themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    // Local storage management
    loadTodos() {
        try {
            const saved = localStorage.getItem('todos');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading todos:', error);
            return [];
        }
    }

    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
            this.showNotification('Error saving tasks!', 'error');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#48bb78';
                break;
            case 'error':
                notification.style.background = '#f56565';
                break;
            case 'warning':
                notification.style.background = '#ed8936';
                break;
            default:
                notification.style.background = '#667eea';
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Export todos as JSON
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Todos exported successfully!', 'success');
    }

    // Import todos from JSON
    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    this.todos = importedTodos;
                    this.saveTodos();
                    this.render();
                    this.showNotification('Todos imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing todos!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}