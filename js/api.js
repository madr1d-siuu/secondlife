/**
 * ApiService — работа с данными (JSON + localStorage)
 */
class ApiService {
    constructor(baseUrl = './data/items.json') {
        this.baseUrl = baseUrl;
        this.cache = null;
        this.itemsKey = 'secondlife_items';
    }

    async fetchItems() {
        if (this.cache) {
            return [...this.cache, ...this.getLocalItems()];
        }

        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            this.cache = data;
            return [...data, ...this.getLocalItems()];
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            return [...this.getLocalItems()];
        }
    }

    async getItemsByCategory(category) {
        const items = await this.fetchItems();
        return category === 'all' ? items : items.filter(item => item.category === category);
    }

    async searchItems(query) {
        const items = await this.fetchItems();
        const lowerQuery = query.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.description.toLowerCase().includes(lowerQuery)
        );
    }

    getLocalItems() {
        try {
            const stored = localStorage.getItem(this.itemsKey);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveLocalItems(items) {
        localStorage.setItem(this.itemsKey, JSON.stringify(items));
    }

    addLocalItem(item, userEmail) {
        const localItems = this.getLocalItems();
        const newItem = {
            ...item,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ownerEmail: userEmail
        };
        localItems.unshift(newItem);
        this.saveLocalItems(localItems);
        this.cache = null;
        return newItem;
    }

    updateLocalItem(id, updatedData) {
        const localItems = this.getLocalItems();
        const index = localItems.findIndex(i => i.id === id);
        if (index !== -1) {
            localItems[index] = { ...localItems[index], ...updatedData };
            this.saveLocalItems(localItems);
            this.cache = null;
            return localItems[index];
        }
        return null;
    }

    deleteLocalItem(id) {
        let localItems = this.getLocalItems();
        localItems = localItems.filter(i => i.id !== id);
        this.saveLocalItems(localItems);
        this.cache = null;
    }

    getUserItems(userEmail) {
        const localItems = this.getLocalItems();
        return localItems.filter(item => item.ownerEmail === userEmail);
    }
}

const apiService = new ApiService();