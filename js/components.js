/**
 * CardComponent — компонент для отрисовки карточек товаров и модальных окон
 * Используется в каталоге, избранном, моих вещах, заказах
 */

class CardComponent {

    // Метки категорий для отображения
    static categoryLabels = {
        electronics: 'Электроника',
        clothes: 'Одежда и обувь',
        furniture: 'Мебель',
        sport: 'Спорт и отдых',
        home: 'Для дома',
        music: 'Музыка',
        photo: 'Фото и видео',
        kids: 'Детские товары',
        hobby: 'Хобби',
        other: 'Прочее'
    };

    /**
     * Генерирует SVG-заглушку для товаров без фото
     * @param {string} category — категория товара
     * @returns {string} data URI с SVG
     */
    static getPlaceholderImage(category) {
        const colors = {
            electronics: '#3b82f6',
            clothes: '#ec4899',
            furniture: '#f59e0b',
            sport: '#10b981',
            home: '#8b5cf6',
            music: '#ef4444',
            photo: '#06b6d4',
            kids: '#f97316',
            hobby: '#84cc16',
            other: '#64748b'
        };
        const bg = colors[category] || '#64748b';
        const text = this.categoryLabels[category] || 'Товар';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="${bg}" opacity="0.06"/>
            <rect x="155" y="100" width="90" height="70" rx="8" fill="${bg}" opacity="0.2"/>
            <circle cx="200" cy="85" r="25" fill="${bg}" opacity="0.15"/>
            <text x="200" y="210" text-anchor="middle" fill="${bg}" font-size="13" font-family="sans-serif" opacity="0.5">${text}</text>
        </svg>`;

        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    /**
     * Преобразует ссылку на видео в embed-URL для iframe или тега video
     * @param {string} url — исходная ссылка
     * @returns {string|null} URL для встраивания или null
     */
    static getVideoEmbedUrl(url) {
        if (!url) return null;

        // YouTube: youtube.com/watch?v= или youtu.be/
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Vimeo: vimeo.com/123456789
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        // Прямая ссылка на видеофайл
        if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
            return url;
        }

        // Если формат не распознан — возвращаем как есть
        return url;
    }

    /**
     * Рендерит карточку товара для каталога
     * @param {Object} item — объект товара
     * @param {boolean} isOwner — является ли текущий пользователь владельцем
     * @param {boolean} isFavorited — добавлен ли в избранное
     * @param {boolean} isReserved — забронирован ли товар
     * @returns {string} HTML-строка карточки
     */
    static render(item, isOwner = false, isFavorited = false, isReserved = false) {
        // Форматирование цены в рублях
        const priceFormatted = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(item.price);

        // Изображение или заглушка
        const imageSrc = item.image || this.getPlaceholderImage(item.category);

        // Флаг "Новое" для товаров младше 24 часов
        const isNew = item.createdAt && new Date(item.createdAt) > new Date(Date.now() - 86400000);

        // Определяем классы для забронированной карточки
        const cardClasses = isReserved ? 'card card--reserved' : 'card';

        return `
            <article class="${cardClasses}" data-id="${item.id}">
                <div class="card__image-wrapper">
                    <img src="${imageSrc}" 
                         alt="${item.title}" 
                         class="card__image" 
                         loading="lazy"
                         onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div style=\\'height:100%;display:flex;align-items:center;justify-content:center;background:#e2e8f0;color:#94a3b8;font-size:0.85rem\\'>Нет фото</div>')">
                    
                    <!-- Кнопка избранного (сердечко) -->
                    <button class="card__favorite-btn ${isFavorited ? 'card__favorite-btn--active' : ''}" 
                            type="button" 
                            data-id="${item.id}" 
                            aria-label="В избранное">
                        <svg width="20" height="20" viewBox="0 0 24 24" 
                             fill="${isFavorited ? '#ef4444' : 'none'}" 
                             stroke="${isFavorited ? '#ef4444' : '#fff'}" 
                             stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>

                    ${isNew ? '<span class="card__badge">Новое</span>' : ''}
                    ${isReserved ? '<span class="card__reserved-badge">Забронировано</span>' : ''}
                </div>

                <div class="card__body">
                    <h3 class="card__title">${item.title}</h3>
                    <p class="card__price">${priceFormatted}</p>
                    
                    <div class="card__meta">
                        <span class="card__category">${this.categoryLabels[item.category] || item.category}</span>
                        <span>${item.location || ''}</span>
                    </div>

                    <div class="card__actions">
                        ${isOwner ? `
                            <!-- Кнопки для владельца -->
                            <button class="button button--outline button--small card__edit-btn" type="button">Изменить</button>
                            <button class="button button--danger button--small card__delete-btn" type="button">Удалить</button>
                        ` : isReserved ? `
                            <!-- Забронированный товар — только чат -->
                            <button class="button button--outline button--small card__chat-btn" type="button">Написать</button>
                        ` : `
                            <!-- Обычные кнопки для покупателя -->
                            <button class="button button--outline button--small card__chat-btn" type="button">Написать</button>
                            <button class="button button--primary button--small card__buy-btn" type="button">Купить</button>
                        `}
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Рендерит содержимое модального окна с деталями товара
     * @param {Object} item — объект товара
     * @param {boolean} isOwner — является ли текущий пользователь владельцем
     * @returns {string} HTML-строка для модального окна
     */
    static renderModalContent(item, isOwner = false) {
        // Форматирование цены
        const priceFormatted = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(item.price);

        // Дата публикации
        const date = item.createdAt 
            ? new Date(item.createdAt).toLocaleDateString('ru-RU') 
            : 'Сегодня';

        // Определяем, что показывать: видео или фото
        let mediaHtml = '';
        const videoUrl = this.getVideoEmbedUrl(item.video);

        if (videoUrl) {
            // Если это прямая ссылка на видеофайл — используем тег video
            if (videoUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
                mediaHtml = `<video class="modal__video" controls playsinline>
                    <source src="${videoUrl}" type="video/mp4">
                    Ваш браузер не поддерживает видео.
                </video>`;
            } else {
                // Иначе — iframe (YouTube, Vimeo)
                mediaHtml = `<iframe class="modal__video" 
                    src="${videoUrl}" 
                    frameborder="0" 
                    allowfullscreen 
                    allow="autoplay; encrypted-media">
                </iframe>`;
            }
        } else if (item.image) {
            // Если видео нет, но есть фото
            mediaHtml = `<img src="${item.image}" 
                alt="${item.title}" 
                class="modal__image"
                onerror="this.src='${this.getPlaceholderImage(item.category)}'">`;
        } else {
            // Заглушка
            mediaHtml = `<img src="${this.getPlaceholderImage(item.category)}" 
                alt="${item.title}" 
                class="modal__image">`;
        }

        return `
            ${mediaHtml}
            <h2 class="modal__title">${item.title}</h2>
            <p class="modal__price">${priceFormatted}</p>
            <p class="modal__description">${item.description || 'Описание отсутствует'}</p>
            
            <div class="modal__details">
                <div>
                    <p class="modal__detail-label">Продавец</p>
                    <p class="modal__detail-value">${item.seller || '—'}</p>
                </div>
                <div>
                    <p class="modal__detail-label">Дата</p>
                    <p class="modal__detail-value">${date}</p>
                </div>
                <div>
                    <p class="modal__detail-label">Состояние</p>
                    <p class="modal__detail-value">${item.condition || 'Б/у'}</p>
                </div>
                <div>
                    <p class="modal__detail-label">Город</p>
                    <p class="modal__detail-value">${item.location || '—'}</p>
                </div>
            </div>

            <div class="modal__actions">
                ${isOwner ? `
                    <button class="button button--outline modal__edit-btn" type="button">Редактировать</button>
                    <button class="button button--danger modal__delete-btn" type="button">Удалить</button>
                ` : `
                    <button class="button button--outline modal__chat-btn" type="button">Написать продавцу</button>
                    <button class="button button--primary modal__buy-btn" type="button">Купить сейчас</button>
                `}
            </div>
        `;
    }
}