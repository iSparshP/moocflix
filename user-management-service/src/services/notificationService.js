const axios = require('axios');

class NotificationService {
    constructor() {
        this.baseURL = process.env.NOTIFICATION_SERVICE_URL;
    }

    async sendWelcomeEmail(email) {
        return axios.post(`${this.baseURL}/notifications/welcome`, { email });
    }

    async sendProfileUpdateAlert(email) {
        return axios.post(`${this.baseURL}/notifications/profile-update`, {
            email,
        });
    }
}

module.exports = new NotificationService();
