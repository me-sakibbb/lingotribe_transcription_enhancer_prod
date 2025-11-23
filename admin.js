// admin.js
// Admin Panel JavaScript - User Management with Firebase

class AdminPanel {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentEditingUserId = null;
        this.userToDelete = null;
        this.firebaseHelper = null;
        this.apiKey = 'AIzaSyCzt_zZJMAUZ0QbhcBuy4fIG3JkVlzCSy4';
        this.projectId = 'anilab-42c99';
        this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }

    async init() {
        console.log('[Admin] Initializing admin panel...');

        // Check authentication
        if (typeof authManager !== 'undefined') {
            await authManager.init();
            const isAuth = await authManager.isUserAuthenticated();

            if (!isAuth) {
                window.location.href = 'login.html';
                return;
            }

            // Display admin email
            const email = authManager.getUserEmail();
            document.getElementById('adminEmail').textContent = email;

            // Check if user is admin (you can add admin check here)
            if (!this.isAdminUser(email)) {
                this.showToast('Access denied. Admin privileges required.', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
                return;
            }
        }

        this.setupEventListeners();
        await this.loadUsers();
    }

    isAdminUser(email) {
        // Add your admin emails here
        const adminEmails = [
            'sakibulhasan159@gmail.com',
            // Add more admin emails as needed
        ];
        return adminEmails.includes(email.toLowerCase());
    }

    setupEventListeners() {
        // Sign out
        document.getElementById('signOutBtn').addEventListener('click', () => this.signOut());

        // Add user button
        document.getElementById('addUserBtn').addEventListener('click', () => this.openAddUserModal());

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadUsers());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchUsers(e.target.value));

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeUserModal());
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());

        // Form submit
        document.getElementById('userForm').addEventListener('submit', (e) => this.saveUser(e));

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deleteUser());

        // Close modal on outside click
        document.getElementById('userModal').addEventListener('click', (e) => {
            if (e.target.id === 'userModal') this.closeUserModal();
        });
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') this.closeDeleteModal();
        });
    }

    async signOut() {
        if (typeof authManager !== 'undefined') {
            await authManager.signOut();
        }
        window.location.href = 'login.html';
    }

    // Firebase Operations
    async loadUsers() {
        try {
            this.showLoading(true);
            console.log('[Admin] Loading users from Firebase...');

            // Fetch users collection
            const url = `${this.baseUrl}/lingotribe_users`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }

            const data = await response.json();
            this.users = [];

            if (data.documents) {
                data.documents.forEach(doc => {
                    const userId = doc.name.split('/').pop();
                    const userData = this.parseFirebaseDocument(doc);
                    this.users.push({ id: userId, ...userData });
                });
            }

            console.log('[Admin] Loaded', this.users.length, 'users');
            this.filteredUsers = [...this.users];
            this.renderUsers();
            this.updateStats();
            this.showLoading(false);

            // Also update approved emails list
            await this.syncApprovedEmails();

        } catch (error) {
            console.error('[Admin] Error loading users:', error);
            this.showToast('Error loading users: ' + error.message, 'error');
            this.showLoading(false);
            this.showEmptyState(true);
        }
    }

    parseFirebaseDocument(doc) {
        if (!doc.fields) return {};

        const result = {};
        for (const [key, value] of Object.entries(doc.fields)) {
            result[key] = this.parseFirebaseValue(value);
        }
        return result;
    }

    parseFirebaseValue(value) {
        if (value.stringValue !== undefined) return value.stringValue;
        if (value.integerValue !== undefined) return parseInt(value.integerValue);
        if (value.doubleValue !== undefined) return value.doubleValue;
        if (value.booleanValue !== undefined) return value.booleanValue;
        if (value.timestampValue !== undefined) return value.timestampValue;
        if (value.arrayValue && value.arrayValue.values) {
            return value.arrayValue.values.map(v => this.parseFirebaseValue(v));
        }
        if (value.mapValue && value.mapValue.fields) {
            const obj = {};
            for (const [k, v] of Object.entries(value.mapValue.fields)) {
                obj[k] = this.parseFirebaseValue(v);
            }
            return obj;
        }
        return null;
    }

    convertToFirebaseFormat(data) {
        const fields = {};
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined || value === '') continue;

            if (typeof value === 'string') {
                fields[key] = { stringValue: value };
            } else if (typeof value === 'number') {
                fields[key] = { integerValue: value };
            } else if (typeof value === 'boolean') {
                fields[key] = { booleanValue: value };
            }
        }
        return { fields };
    }

    async saveUserToFirebase(userId, userData) {
        try {
            const url = `${this.baseUrl}/lingotribe_users/${userId}`;
            const firebaseData = this.convertToFirebaseFormat(userData);

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(firebaseData)
            });

            if (!response.ok) {
                throw new Error(`Failed to save user: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Admin] Error saving user:', error);
            throw error;
        }
    }

    async deleteUserFromFirebase(userId) {
        try {
            const url = `${this.baseUrl}/lingotribe_users/${userId}`;
            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok && response.status !== 404) {
                throw new Error(`Failed to delete user: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('[Admin] Error deleting user:', error);
            throw error;
        }
    }

    async syncApprovedEmails() {
        try {
            // Get all active user emails
            const activeEmails = this.users
                .filter(user => {
                    const now = new Date();
                    const enableDate = user.enableDate ? new Date(user.enableDate) : null;
                    const disableDate = user.disableDate ? new Date(user.disableDate) : null;

                    // User is active if:
                    // - Enable date is in the past or not set
                    // - Disable date is in the future or not set
                    const isEnabled = !enableDate || enableDate <= now;
                    const isNotDisabled = !disableDate || disableDate > now;

                    return isEnabled && isNotDisabled && user.email;
                })
                .map(user => user.email.toLowerCase());

            console.log('[Admin] Syncing', activeEmails.length, 'approved emails');

            // Update approved_emails document
            const url = `${this.baseUrl}/lingotribe_transcription_enhancer/approved_emails`;
            const firebaseData = {
                fields: {
                    emails: {
                        arrayValue: {
                            values: activeEmails.map(email => ({ stringValue: email }))
                        }
                    }
                }
            };

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(firebaseData)
            });

            if (!response.ok) {
                throw new Error(`Failed to sync approved emails: ${response.status}`);
            }

            console.log('[Admin] Approved emails synced successfully');
        } catch (error) {
            console.error('[Admin] Error syncing approved emails:', error);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            this.showEmptyState(true);
            return;
        }

        this.showEmptyState(false);

        this.filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(user.name || '-')}</td>
                <td>${this.escapeHtml(user.batch || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${this.escapeHtml(user.extensionId || '-')}</td>
                <td>${this.formatDate(user.enableDate)}</td>
                <td>${this.formatDate(user.disableDate)}</td>
                <td>${this.escapeHtml(user.facebookId || '-')}</td>
                <td>${this.escapeHtml(user.phone || '-')}</td>
                <td>${this.escapeHtml(user.purchaseType || '-')}</td>
                <td>${this.escapeHtml(user.paymentMethod || '-')}</td>
                <td>${this.renderPaymentStatus(user.paymentStatus)}</td>
                <td>
                    <button class="btn-edit" onclick="adminPanel.editUser('${user.id}')">Edit</button>
                    <button class="btn-delete" onclick="adminPanel.confirmDelete('${user.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPaymentStatus(status) {
        if (!status) return '-';
        const statusClass = `status-${status.toLowerCase()}`;
        return `<span class="status-badge ${statusClass}">${status}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const now = new Date();

        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => {
            const enableDate = user.enableDate ? new Date(user.enableDate) : null;
            const disableDate = user.disableDate ? new Date(user.disableDate) : null;
            const isEnabled = !enableDate || enableDate <= now;
            const isNotDisabled = !disableDate || disableDate > now;
            return isEnabled && isNotDisabled;
        }).length;
        const paidUsers = this.users.filter(user => user.paymentStatus === 'paid').length;
        const pendingPayments = this.users.filter(user => user.paymentStatus === 'pending').length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('paidUsers').textContent = paidUsers;
        document.getElementById('pendingPayments').textContent = pendingPayments;
    }

    searchUsers(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredUsers = [...this.users];
        } else {
            this.filteredUsers = this.users.filter(user => {
                return (
                    (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                    (user.batch && user.batch.toLowerCase().includes(searchTerm)) ||
                    (user.phone && user.phone.includes(searchTerm)) ||
                    (user.facebookId && user.facebookId.toLowerCase().includes(searchTerm))
                );
            });
        }

        this.renderUsers();
    }

    openAddUserModal() {
        this.currentEditingUserId = null;
        document.getElementById('modalTitle').textContent = 'Add New User';
        document.getElementById('userForm').reset();
        document.getElementById('userModal').classList.add('active');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.currentEditingUserId = userId;
        document.getElementById('modalTitle').textContent = 'Edit User';

        // Populate form
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userBatch').value = user.batch || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userExtensionId').value = user.extensionId || '';
        document.getElementById('userEnableDate').value = user.enableDate || '';
        document.getElementById('userDisableDate').value = user.disableDate || '';
        document.getElementById('userFacebookId').value = user.facebookId || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userPurchaseType').value = user.purchaseType || '';
        document.getElementById('userPaymentMethod').value = user.paymentMethod || '';
        document.getElementById('userPaymentStatus').value = user.paymentStatus || '';

        document.getElementById('userModal').classList.add('active');
    }

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
        document.getElementById('userForm').reset();
        this.currentEditingUserId = null;
    }

    async saveUser(e) {
        e.preventDefault();

        const userData = {
            name: document.getElementById('userName').value.trim(),
            batch: document.getElementById('userBatch').value.trim(),
            email: document.getElementById('userEmail').value.trim(),
            extensionId: document.getElementById('userExtensionId').value.trim(),
            enableDate: document.getElementById('userEnableDate').value,
            disableDate: document.getElementById('userDisableDate').value,
            facebookId: document.getElementById('userFacebookId').value.trim(),
            phone: document.getElementById('userPhone').value.trim(),
            purchaseType: document.getElementById('userPurchaseType').value,
            paymentMethod: document.getElementById('userPaymentMethod').value,
            paymentStatus: document.getElementById('userPaymentStatus').value,
        };

        try {
            const userId = this.currentEditingUserId || this.generateUserId();
            await this.saveUserToFirebase(userId, userData);

            this.showToast('User saved successfully!', 'success');
            this.closeUserModal();
            await this.loadUsers();
        } catch (error) {
            console.error('[Admin] Error saving user:', error);
            this.showToast('Error saving user: ' + error.message, 'error');
        }
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    confirmDelete(userId) {
        this.userToDelete = userId;
        document.getElementById('deleteModal').classList.add('active');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.userToDelete = null;
    }

    async deleteUser() {
        if (!this.userToDelete) return;

        try {
            await this.deleteUserFromFirebase(this.userToDelete);
            this.showToast('User deleted successfully!', 'success');
            this.closeDeleteModal();
            await this.loadUsers();
        } catch (error) {
            console.error('[Admin] Error deleting user:', error);
            this.showToast('Error deleting user: ' + error.message, 'error');
        }
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const tableContainer = document.querySelector('.table-container');

        if (show) {
            loadingIndicator.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }

    showEmptyState(show) {
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.querySelector('.table-container');

        if (show) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => adminPanel.init());
} else {
    adminPanel.init();
}
