'use strict';
const axios = require('axios');

class WebhookService {
  constructor() {
    this.maxRetries = 3;
    this.initialDelay = 1000; // 1 second
  }

  /**
   * Send a webhook with exponential backoff retry logic.
   * @param {string} url - Webhook URL
   * @param {object} payload - Data to send
   */
  async sendWebhook(url, payload) {
    if (!url) {
      console.warn('Webhook URL not configured, skipping.');
      return;
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        console.log(`Sending webhook to ${url}, attempt ${attempt + 1}...`);
        const response = await axios.post(url, payload, { timeout: 5000 });
        console.log(`Webhook sent successfully. Status: ${response.status}`);
        return response.data;
      } catch (error) {
        attempt++;
        if (attempt > this.maxRetries) {
          console.error(`Failed to send webhook after ${this.maxRetries} retries: ${error.message}`);
          throw error;
        }
        const delay = this.initialDelay * Math.pow(2, attempt - 1);
        console.warn(`Webhook failed (attempt ${attempt}): ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = new WebhookService();
