class AuthService {
    constructor() {
        this.usersKey = 'secondlife_users';
        this.currentUserKey = 'secondlife_current_user';
        this.currentUser = this.loadCurrentUser();
    }

    getUsers() {
        try { const stored = localStorage.getItem(this.usersKey); return stored ? JSON.parse(stored) : []; }
        catch { return []; }
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    loadCurrentUser() {
        try { const stored = localStorage.getItem(this.currentUserKey); return stored ? JSON.parse(stored) : null; }
        catch { return null; }
    }

    saveCurrentUser(user) {
        this.currentUser = user;
        if (user) localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        else localStorage.removeItem(this.currentUserKey);
    }

    register(userData) {
        const users = this.getUsers();
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'Пользователь с таким email уже существует' };
        }
        const newUser = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            middleName: userData.middleName || '',
            age: userData.age || '',
            city: userData.city || '',
            email: userData.email,
            password: userData.password,
            avatar: null
        };
        users.push(newUser);
        this.saveUsers(users);
        this.saveCurrentUser(newUser);
        return { success: true, user: newUser };
    }

    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) { this.saveCurrentUser(user); return { success: true, user }; }
        return { success: false, error: 'Неверный email или пароль' };
    }

    updateAvatar(avatarBase64) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === this.currentUser.email);
        if (index !== -1) {
            users[index].avatar = avatarBase64;
            this.saveUsers(users);
            this.saveCurrentUser(users[index]);
            return users[index];
        }
        return null;
    }

    logout() { this.saveCurrentUser(null); }
    isLoggedIn() { return this.currentUser !== null; }
}

const authService = new AuthService();