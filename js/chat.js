class ChatService {
    constructor() {
        this.chatsKey = 'secondlife_chats';
        this.reservationsKey = 'secondlife_reservations';
    }

    getChats() {
        try {
            return JSON.parse(localStorage.getItem(this.chatsKey)) || {};
        } catch {
            return {};
        }
    }

    saveChats(chats) {
        localStorage.setItem(this.chatsKey, JSON.stringify(chats));
    }

    getChatKey(user1, user2) {
        return [user1, user2].sort().join('|||');
    }

    getMessages(sellerEmail, buyerEmail) {
        const chats = this.getChats();
        const key = this.getChatKey(sellerEmail, buyerEmail);
        return chats[key] || [];
    }

    sendMessage(senderEmail, receiverEmail, text, itemId) {
        const chats = this.getChats();
        const key = this.getChatKey(senderEmail, receiverEmail);
        if (!chats[key]) chats[key] = [];
        chats[key].push({
            sender: senderEmail,
            text,
            time: new Date().toISOString(),
            itemId
        });
        this.saveChats(chats);
    }

    getReservations() {
        try {
            return JSON.parse(localStorage.getItem(this.reservationsKey)) || {};
        } catch {
            return {};
        }
    }

    saveReservations(reservations) {
        localStorage.setItem(this.reservationsKey, JSON.stringify(reservations));
    }

    reserveItem(itemId, buyerEmail, sellerEmail) {
        const reservations = this.getReservations();
        reservations[itemId] = {
            buyerEmail,
            sellerEmail,
            reservedAt: new Date().toISOString()
        };
        this.saveReservations(reservations);
    }

    cancelReservation(itemId) {
        const reservations = this.getReservations();
        delete reservations[itemId];
        this.saveReservations(reservations);
    }

    isReserved(itemId) {
        const reservations = this.getReservations();
        return !!reservations[itemId];
    }

    getReservedItems(buyerEmail) {
        const reservations = this.getReservations();
        return Object.entries(reservations)
            .filter(([_, r]) => r.buyerEmail === buyerEmail)
            .map(([itemId, r]) => ({ itemId: parseInt(itemId), ...r }));
    }
}

const chatService = new ChatService();