/**
 * SecondLife — Клиентская часть интернет-ресурса для размещения объявлений
 * Курсовая работа Беспалова Е.А., ИКБО-14-24, РТУ МИРЭА
 * 
 * App — основной класс приложения, управляет всей логикой UI
 */

class App {
    constructor(apiService, authService) {
        this.api = apiService;
        this.auth = authService;
        this.currentCategory = 'all';
        this.currentCity = 'all';
        this.items = [];
        this.editingItemId = null;
        this.activeChatUser = null;
        this._lastPurchaseItem = null;

        // DOM-элементы
        this.catalogGrid = document.getElementById('catalogGrid');
        this.favoritesGrid = document.getElementById('favoritesGrid');
        this.favoritesEmpty = document.getElementById('favoritesEmpty');
        this.myItemsGrid = document.getElementById('myItemsGrid');
        this.myItemsEmpty = document.getElementById('myItemsEmpty');
        this.myOrdersGrid = document.getElementById('myOrdersGrid');
        this.myOrdersEmpty = document.getElementById('myOrdersEmpty');
        this.loader = document.getElementById('loader');
        this.notification = document.getElementById('notification');
        this.searchInput = document.querySelector('.search__input');
        this.searchButton = document.querySelector('.search__button');

        this.init();
    }

    init() {
        this.updateUIForAuth();
        this.setupModals();
        this.setupFilters();
        this.setupSearch();
        this.setupAuthForms();
        this.setupCreateAdForm();
        this.setupPurchaseForm();
        this.setupChatForm();
        this.setupAvatarUpload();
        this.setupGlobalDelegation();
        this.setupNavigation();
        this.loadItems();
    }

    // ==================== АВТОРИЗАЦИЯ ====================

    updateUIForAuth() {
        const loggedIn = this.auth.isLoggedIn();
        const user = this.auth.currentUser;

        document.getElementById('headerActions').style.display = loggedIn ? 'none' : 'flex';
        document.getElementById('headerUser').style.display = loggedIn ? 'flex' : 'none';
        document.getElementById('navFavorites').style.display = loggedIn ? '' : 'none';
        document.getElementById('navMyItems').style.display = loggedIn ? '' : 'none';
        document.getElementById('navMyOrders').style.display = loggedIn ? '' : 'none';
        document.getElementById('navProfile').style.display = loggedIn ? '' : 'none';

        if (loggedIn && user) {
            document.getElementById('headerUsername').textContent = `${user.firstName} ${user.lastName}`;
            const headerAvatar = document.getElementById('headerAvatar');
            if (user.avatar) {
                headerAvatar.style.backgroundImage = `url(${user.avatar})`;
                headerAvatar.textContent = '';
            } else {
                headerAvatar.style.backgroundImage = '';
                headerAvatar.textContent = (user.firstName[0] + user.lastName[0]).toUpperCase();
            }
            this.updateProfilePage();
        }
    }

    updateProfilePage() {
        const user = this.auth.currentUser;
        if (!user) return;
        document.getElementById('profileLastName').textContent = user.lastName || '—';
        document.getElementById('profileFirstName').textContent = user.firstName || '—';
        document.getElementById('profileMiddleName').textContent = user.middleName || '—';
        document.getElementById('profileAgeVal').textContent = user.age ? `${user.age} лет` : '—';
        document.getElementById('profileCityVal').textContent = user.city || '—';
        document.getElementById('profileEmailVal').textContent = user.email || '—';

        const avatarLarge = document.getElementById('profileAvatarLarge');
        const avatarText = document.getElementById('profileAvatarText');
        if (user.avatar) {
            avatarLarge.style.backgroundImage = `url(${user.avatar})`;
            avatarText.textContent = '';
        } else {
            avatarLarge.style.backgroundImage = '';
            avatarText.textContent = (user.firstName[0] + user.lastName[0]).toUpperCase();
        }
    }

    setupAvatarUpload() {
        document.getElementById('avatarUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.auth.updateAvatar(ev.target.result);
                this.updateUIForAuth();
                this.showNotification('Аватар обновлён');
            };
            reader.readAsDataURL(file);
        });
    }

    setupAuthForms() {
        document.getElementById('btnLogin').addEventListener('click', () => this.openModal('authModal'));
        document.getElementById('btnRegister').addEventListener('click', () => this.openModal('registerModal'));
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal('authModal');
            this.openModal('registerModal');
        });
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal('registerModal');
            this.openModal('authModal');
        });
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            const result = this.auth.login(email, password);
            if (result.success) {
                this.closeModal('authModal');
                this.updateUIForAuth();
                this.showNotification(`Добро пожаловать, ${result.user.firstName}!`);
                this.loadItems();
            } else {
                alert(result.error);
            }
        });
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const userData = {
                firstName: document.getElementById('regFirstName').value.trim(),
                lastName: document.getElementById('regLastName').value.trim(),
                middleName: document.getElementById('regMiddleName').value.trim(),
                age: parseInt(document.getElementById('regAge').value),
                city: document.getElementById('regCity').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                password: document.getElementById('regPassword').value
            };
            const result = this.auth.register(userData);
            if (result.success) {
                this.closeModal('registerModal');
                this.updateUIForAuth();
                this.showNotification(`Регистрация успешна! ${result.user.firstName}, добро пожаловать!`);
                this.loadItems();
            } else {
                alert(result.error);
            }
        });
    }

    // ==================== НАВИГАЦИЯ ====================

    setupNavigation() {
        document.querySelector('.logo__text').addEventListener('click', () => this.showPage('catalog'));
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) this.showPage(page);
            });
        });
        document.getElementById('btnLogout').addEventListener('click', () => {
            this.auth.logout();
            this.updateUIForAuth();
            this.showPage('catalog');
            this.loadItems();
            this.showNotification('Вы вышли из аккаунта');
        });
        document.querySelector('.developer__back')?.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            if (page) this.showPage(page);
        });
        const aboutMemberLink = document.querySelector('.about__member-link');
        if (aboutMemberLink) {
            aboutMemberLink.addEventListener('click', (e) => {
                e.preventDefault();
                const page = aboutMemberLink.dataset.page;
                if (page) this.showPage(page);
            });
        }
    }

    showPage(page) {
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('page-section--active'));
        document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('nav__link--active'));

        const pageMap = {
            'catalog': 'catalogPage',
            'favorites': 'favoritesPage',
            'about': 'aboutPage',
            'support': 'supportPage',
            'my-items': 'myItemsPage',
            'my-orders': 'myOrdersPage',
            'profile': 'profilePage',
            'developer': 'developerPage'
        };

        const sectionId = pageMap[page];
        if (sectionId) {
            document.getElementById(sectionId).classList.add('page-section--active');
            document.querySelector(`.nav__link[data-page="${page}"]`)?.classList.add('nav__link--active');
        }

        if (page === 'catalog') this.loadItems();
        if (page === 'favorites') {
            if (!this.auth.isLoggedIn()) { this.openModal('authModal'); return; }
            this.loadFavorites();
        }
        if (page === 'my-items') {
            if (!this.auth.isLoggedIn()) { this.openModal('authModal'); return; }
            this.loadMyItems();
        }
        if (page === 'my-orders') {
            if (!this.auth.isLoggedIn()) { this.openModal('authModal'); return; }
            this.loadMyOrders();
        }
        if (page === 'profile') {
            if (!this.auth.isLoggedIn()) { this.openModal('authModal'); return; }
            this.updateProfilePage();
        }
    }

    // ==================== МОДАЛЬНЫЕ ОКНА ====================

    setupModals() {
        document.addEventListener('click', (e) => {
            const closeBtn = e.target.closest('[data-modal]');
            if (closeBtn) this.closeModal(closeBtn.dataset.modal);
        });
        document.querySelectorAll('.modal__overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                const modal = overlay.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal--open').forEach(m => this.closeModal(m.id));
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal--open');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal--open');
            document.body.style.overflow = '';
        }
    }

    // ==================== ЗАГРУЗКА ДАННЫХ ====================

    toggleLoader(show) {
        show ? this.loader.classList.add('catalog__loader--visible') : this.loader.classList.remove('catalog__loader--visible');
    }

    async loadItems(category = 'all', searchQuery = '') {
        this.toggleLoader(true);
        this.catalogGrid.innerHTML = '';
        try {
            this.items = searchQuery
                ? await this.api.searchItems(searchQuery)
                : await this.api.getItemsByCategory(category);
            this.updateCityFilter();
            this.applyAllFilters();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.catalogGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center">Ошибка загрузки</p>';
        } finally {
            this.toggleLoader(false);
        }
    }

    findItem(id) {
        let item = this.items.find(i => i.id === id);
        if (!item && this.auth.currentUser) {
            item = this.api.getUserItems(this.auth.currentUser.email).find(i => i.id === id);
        }
        return item;
    }

    loadMyItems() {
        if (!this.auth.isLoggedIn()) return;
        const userEmail = this.auth.currentUser.email;
        const myItems = this.api.getUserItems(userEmail);
        this.myItemsGrid.innerHTML = '';
        if (this.myItemsEmpty) this.myItemsEmpty.style.display = myItems.length === 0 ? 'block' : 'none';
        if (myItems.length > 0) {
            this.myItemsGrid.innerHTML = myItems.map(item => {
                const isReserved = chatService.isReserved(item.id);
                return CardComponent.render(item, true, this.isFavorited(item.id), isReserved);
            }).join('');
        }
    }

    loadMyOrders() {
        if (!this.auth.isLoggedIn()) return;
        const orders = chatService.getReservedItems(this.auth.currentUser.email);
        this.myOrdersGrid.innerHTML = '';
        if (this.myOrdersEmpty) this.myOrdersEmpty.style.display = orders.length === 0 ? 'block' : 'none';
        if (orders.length > 0) {
            this.myOrdersGrid.innerHTML = orders.map(order => {
                const item = this.findItem(order.itemId);
                if (!item) return '';
                return CardComponent.render(item, false, false, true) + 
                    `<div style="margin-top:8px"><button class="button button--danger button--small cancel-reserve-btn" data-id="${order.itemId}">Отменить бронь</button></div>`;
            }).join('');
        }
    }

    // ==================== ИЗБРАННОЕ ====================

    getFavorites() {
        if (!this.auth.currentUser) return [];
        try {
            const key = `secondlife_fav_${this.auth.currentUser.email}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveFavorites(ids) {
        if (!this.auth.currentUser) return;
        const key = `secondlife_fav_${this.auth.currentUser.email}`;
        localStorage.setItem(key, JSON.stringify(ids));
    }

    isFavorited(itemId) {
        return this.getFavorites().includes(itemId);
    }

    toggleFavorite(itemId) {
        if (!this.auth.isLoggedIn()) {
            this.showNotification('Войдите, чтобы добавлять в избранное');
            this.openModal('authModal');
            return;
        }
        const favs = this.getFavorites();
        const index = favs.indexOf(itemId);
        if (index === -1) {
            favs.push(itemId);
            this.showNotification('Добавлено в избранное');
        } else {
            favs.splice(index, 1);
            this.showNotification('Удалено из избранного');
        }
        this.saveFavorites(favs);
        this.applyAllFilters();
        if (document.getElementById('favoritesPage').classList.contains('page-section--active')) {
            this.loadFavorites();
        }
    }

    loadFavorites() {
        if (!this.auth.isLoggedIn()) return;
        const favIds = this.getFavorites();
        this.favoritesEmpty.style.display = favIds.length === 0 ? 'block' : 'none';
        if (favIds.length === 0) {
            this.favoritesGrid.innerHTML = '';
            return;
        }
        const allItems = [...this.items, ...this.api.getLocalItems()];
        const favItems = allItems.filter(item => favIds.includes(item.id));
        this.favoritesGrid.innerHTML = favItems.map(item => CardComponent.render(item, false, true)).join('');
    }

    // ==================== БРОНИРОВАНИЕ ====================

    cancelReserve(itemId) {
        chatService.cancelReservation(itemId);
        this.showNotification('Бронь отменена');
        this.loadItems(this.currentCategory);
        if (document.getElementById('myOrdersPage').classList.contains('page-section--active')) {
            this.loadMyOrders();
        }
    }

    // ==================== КАРТОЧКИ И ДЕТАЛИ ====================

    setupGlobalDelegation() {
        document.addEventListener('click', (e) => {
            // Кнопка избранного
            const favBtn = e.target.closest('.card__favorite-btn');
            if (favBtn) {
                e.stopPropagation();
                e.preventDefault();
                const id = parseInt(favBtn.dataset.id);
                this.toggleFavorite(id);
                return;
            }

            // Кнопка отмены брони
            const cancelBtn = e.target.closest('.cancel-reserve-btn');
            if (cancelBtn) {
                e.stopPropagation();
                e.preventDefault();
                const id = parseInt(cancelBtn.dataset.id);
                this.cancelReserve(id);
                return;
            }

            // Остальные кнопки
            const chatBtn = e.target.closest('.card__chat-btn');
            const buyBtn = e.target.closest('.card__buy-btn');
            const editBtn = e.target.closest('.card__edit-btn');
            const deleteBtn = e.target.closest('.card__delete-btn');
            const card = e.target.closest('.card');

            if (chatBtn) {
                e.stopPropagation();
                e.preventDefault();
                const targetCard = chatBtn.closest('.card');
                if (targetCard) {
                    const id = parseInt(targetCard.dataset.id);
                    const item = this.findItem(id);
                    if (item) this.openChat(item);
                }
                return;
            }

            if (buyBtn) {
                e.stopPropagation();
                e.preventDefault();
                const targetCard = buyBtn.closest('.card');
                if (targetCard) {
                    const id = parseInt(targetCard.dataset.id);
                    const item = this.findItem(id);
                    if (item) this.openPurchase(item);
                }
                return;
            }

            if (editBtn) {
                e.stopPropagation();
                e.preventDefault();
                const targetCard = editBtn.closest('.card');
                if (targetCard) {
                    const id = parseInt(targetCard.dataset.id);
                    const item = this.findItem(id);
                    if (item) this.openEditAd(item);
                }
                return;
            }

            if (deleteBtn) {
                e.stopPropagation();
                e.preventDefault();
                const targetCard = deleteBtn.closest('.card');
                if (targetCard) {
                    const id = parseInt(targetCard.dataset.id);
                    this.deleteAd(id);
                }
                return;
            }

            // Клик по карточке
            if (card) {
                const id = parseInt(card.dataset.id);
                const item = this.findItem(id);
                if (item) this.openItemModal(item);
            }
        });
    }

    openItemModal(item) {
        const currentUserEmail = this.auth.currentUser?.email;
        const isOwner = currentUserEmail && item.ownerEmail === currentUserEmail;
        document.getElementById('modalBody').innerHTML = CardComponent.renderModalContent(item, isOwner);
        this.openModal('itemModal');

        // Вешаем обработчики на кнопки в модалке
        setTimeout(() => {
            const modalBody = document.getElementById('modalBody');
            if (!modalBody) return;

            const modalChatBtn = modalBody.querySelector('.modal__chat-btn');
            if (modalChatBtn) {
                modalChatBtn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.closeModal('itemModal');
                    this.openChat(item);
                };
            }

            const modalBuyBtn = modalBody.querySelector('.modal__buy-btn');
            if (modalBuyBtn) {
                modalBuyBtn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.closeModal('itemModal');
                    this.openPurchase(item);
                };
            }

            const modalEditBtn = modalBody.querySelector('.modal__edit-btn');
            if (modalEditBtn) {
                modalEditBtn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.openEditAd(item);
                };
            }

            const modalDeleteBtn = modalBody.querySelector('.modal__delete-btn');
            if (modalDeleteBtn) {
                modalDeleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.deleteAd(item.id);
                };
            }
        }, 0);
    }

    // ==================== ЧАТ ====================

    openChat(item) {
        if (!this.auth.isLoggedIn()) {
            this.showNotification('Войдите, чтобы написать продавцу');
            this.openModal('authModal');
            return;
        }
        this.activeChatUser = item.ownerEmail;
        document.getElementById('chatSellerName').textContent = item.seller;
        document.getElementById('chatInput').value = '';
        this.renderChatMessages(item.ownerEmail);
        this.openModal('chatModal');
    }

    setupChatForm() {
        document.getElementById('chatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text || !this.activeChatUser) return;
            chatService.sendMessage(this.auth.currentUser.email, this.activeChatUser, text, null);
            input.value = '';
            this.renderChatMessages(this.activeChatUser);
        });
    }

    renderChatMessages(otherEmail) {
        const container = document.getElementById('chatMessages');
        const me = this.auth.currentUser.email;
        const messages = chatService.getMessages(me, otherEmail);
        container.innerHTML = messages.map(msg => {
            const isSent = msg.sender === me;
            const time = new Date(msg.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            return `<div class="chat__message ${isSent ? 'chat__message--sent' : 'chat__message--received'}">
                <p>${msg.text}</p>
                <small style="opacity:0.7;font-size:0.7rem;">${time}</small>
            </div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }

    // ==================== СОЗДАНИЕ И РЕДАКТИРОВАНИЕ ОБЪЯВЛЕНИЙ ====================

    setupCreateAdForm() {
        document.getElementById('btnCreateAd').addEventListener('click', () => this.startNewAd());
        document.getElementById('btnCreateAdMyItems').addEventListener('click', () => this.startNewAd());
        document.getElementById('adImage').addEventListener('change', (e) => this.previewImage(e));
        document.getElementById('createAdForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitAd();
        });
    }

    startNewAd() {
        if (!this.auth.isLoggedIn()) {
            this.openModal('authModal');
            return;
        }
        this.editingItemId = null;
        document.getElementById('adFormTitle').textContent = 'Подать объявление';
        document.getElementById('adSubmitBtn').textContent = 'Опубликовать';
        document.getElementById('createAdForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').classList.remove('form__image-preview--visible');
        this.openModal('createAdModal');
    }

    previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.innerHTML = `<img src="${ev.target.result}" alt="Предпросмотр">`;
                preview.classList.add('form__image-preview--visible');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.remove('form__image-preview--visible');
        }
    }

    openEditAd(item) {
        this.editingItemId = item.id;
        document.getElementById('adFormTitle').textContent = 'Редактировать объявление';
        document.getElementById('adSubmitBtn').textContent = 'Сохранить';
        document.getElementById('adTitle').value = item.title || '';
        document.getElementById('adCategory').value = item.category || '';
        document.getElementById('adPrice').value = item.price || '';
        document.getElementById('adCondition').value = item.condition || 'Хорошее';
        document.getElementById('adVideo').value = item.video || '';
        document.getElementById('adDescription').value = item.description || '';
        document.getElementById('imagePreview').innerHTML = item.image ? `<img src="${item.image}" alt="">` : '';
        document.getElementById('imagePreview').classList.toggle('form__image-preview--visible', !!item.image);
        this.openModal('createAdModal');
        this.closeModal('itemModal');
    }

    async submitAd() {
        const title = document.getElementById('adTitle').value.trim();
        const category = document.getElementById('adCategory').value;
        const price = parseInt(document.getElementById('adPrice').value);
        const condition = document.getElementById('adCondition').value;
        const description = document.getElementById('adDescription').value.trim();
        const video = document.getElementById('adVideo').value.trim();
        const imageFile = document.getElementById('adImage').files[0];

        if (!title || !category || !price || !description) {
            alert('Заполните все обязательные поля!');
            return;
        }

        const user = this.auth.currentUser;
        const seller = `${user.firstName} ${user.lastName}`;
        const location = user.city;

        let image = null;
        if (imageFile) {
            image = await this.fileToBase64(imageFile);
        } else if (this.editingItemId) {
            const existingItem = this.api.getLocalItems().find(i => i.id === this.editingItemId);
            image = existingItem?.image || null;
        }

        const itemData = { title, category, price, condition, description, seller, location, image, video };

        if (this.editingItemId) {
            this.api.updateLocalItem(this.editingItemId, itemData);
            this.showNotification('Объявление обновлено');
        } else {
            this.api.addLocalItem(itemData, user.email);
            this.showNotification('Объявление опубликовано');
        }

        this.closeModal('createAdModal');
        this.editingItemId = null;
        document.getElementById('createAdForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').classList.remove('form__image-preview--visible');
        this.loadItems(this.currentCategory);
        if (document.getElementById('myItemsPage').classList.contains('page-section--active')) this.loadMyItems();
    }

    deleteAd(id) {
        if (!confirm('Удалить объявление?')) return;
        this.api.deleteLocalItem(id);
        this.showNotification('Объявление удалено');
        this.closeModal('itemModal');
        this.loadItems(this.currentCategory);
        if (document.getElementById('myItemsPage').classList.contains('page-section--active')) this.loadMyItems();
        if (document.getElementById('favoritesPage').classList.contains('page-section--active')) this.loadFavorites();
    }

    fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    // ==================== ПОКУПКА ====================

    openPurchase(item) {
        this._lastPurchaseItem = item;
        const container = document.getElementById('purchaseItemInfo');
        const priceFormatted = new Intl.NumberFormat('ru-RU', {
            style: 'currency', currency: 'RUB', maximumFractionDigits: 0
        }).format(item.price);
        const imageSrc = item.image || CardComponent.getPlaceholderImage(item.category);
        container.innerHTML = `
            <img src="${imageSrc}" alt="${item.title}" class="purchase__item-image"
                 onerror="this.src='${CardComponent.getPlaceholderImage(item.category)}'">
            <div class="purchase__item-info">
                <p class="purchase__item-title">${item.title}</p>
                <p class="purchase__item-price">${priceFormatted}</p>
            </div>`;
        this.openModal('purchaseModal');
    }

    setupPurchaseForm() {
        document.getElementById('purchaseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const buyerName = document.getElementById('buyerName').value.trim();
            const buyerPhone = document.getElementById('buyerPhone').value.trim();
            if (!buyerName || !buyerPhone) {
                alert('Заполните имя и телефон!');
                return;
            }
            if (this._lastPurchaseItem) {
                chatService.reserveItem(
                    this._lastPurchaseItem.id,
                    this.auth.currentUser.email,
                    this._lastPurchaseItem.ownerEmail
                );
                chatService.sendMessage(
                    this.auth.currentUser.email,
                    this._lastPurchaseItem.ownerEmail,
                    'Товар забронирован! Оформлен заказ.',
                    this._lastPurchaseItem.id
                );
                this.showNotification('Товар забронирован!');
                this.loadItems(this.currentCategory);
            }
            this.closeModal('purchaseModal');
            document.getElementById('purchaseForm').reset();
        });
    }

    // ==================== ФИЛЬТРЫ И ПОИСК ====================

    setupFilters() {
        document.querySelectorAll('#filterContainer .filter').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#filterContainer .filter').forEach(b => b.classList.remove('filter--active'));
                btn.classList.add('filter--active');
                this.currentCategory = btn.dataset.category;
                this.searchInput.value = '';
                this.applyAllFilters();
            });
        });

        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            cityFilter.addEventListener('change', () => {
                this.currentCity = cityFilter.value;
                this.applyAllFilters();
            });
        }
    }

    updateCityFilter() {
        const cityFilter = document.getElementById('cityFilter');
        if (!cityFilter) return;

        const currentValue = cityFilter.value;
        const cities = new Set();
        this.items.forEach(item => {
            if (item.location) cities.add(item.location);
        });

        cityFilter.innerHTML = '<option value="all">Все города</option>';
        [...cities].sort().forEach(city => {
            cityFilter.innerHTML += `<option value="${city}">${city}</option>`;
        });

        if (currentValue && [...cities].includes(currentValue)) {
            cityFilter.value = currentValue;
        } else {
            cityFilter.value = 'all';
            this.currentCity = 'all';
        }
    }

    applyAllFilters() {
        let filteredItems = [...this.items];

        if (this.currentCategory !== 'all') {
            filteredItems = filteredItems.filter(item => item.category === this.currentCategory);
        }

        const cityFilter = document.getElementById('cityFilter');
        const selectedCity = cityFilter ? cityFilter.value : 'all';
        if (selectedCity !== 'all') {
            filteredItems = filteredItems.filter(item => item.location === selectedCity);
        }

        this.renderFilteredItems(filteredItems);
    }

    renderFilteredItems(filteredItems) {
        if (filteredItems.length === 0) {
            this.catalogGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#64748b;">Ничего не найдено</p>';
            return;
        }
        const currentUserEmail = this.auth.currentUser?.email;
        const favIds = this.getFavorites();
        this.catalogGrid.innerHTML = filteredItems.map(item => {
            const isOwner = currentUserEmail && item.ownerEmail === currentUserEmail;
            const isFav = favIds.includes(item.id);
            const isReserved = chatService.isReserved(item.id);
            return CardComponent.render(item, isOwner, isFav, isReserved);
        }).join('');
    }

    setupSearch() {
        const performSearch = () => {
            const query = this.searchInput.value.trim();
            if (query) {
                document.querySelectorAll('#filterContainer .filter').forEach(b => b.classList.remove('filter--active'));
                document.querySelector('#filterContainer .filter[data-category="all"]')?.classList.add('filter--active');
                this.currentCategory = 'all';
                document.getElementById('cityFilter').value = 'all';
                this.currentCity = 'all';
                this.loadItems('all', query);
            }
        };
        this.searchButton.addEventListener('click', performSearch);
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    showNotification(text) {
        this.notification.textContent = text;
        this.notification.classList.add('notification--visible');
        clearTimeout(this._notifTimeout);
        this._notifTimeout = setTimeout(() => this.notification.classList.remove('notification--visible'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => new App(apiService, authService));