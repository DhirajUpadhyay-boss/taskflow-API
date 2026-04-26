'use strict';
const Agenda = require('agenda');
const webhookService = require('./webhook.service');

class AgendaService {
  constructor() {
    this.agenda = null;
  }

  async init() {
    this.agenda = new Agenda({
      db: { address: process.env.MONGO_URI, collection: 'agendaJobs' },
      processEvery: '1 minute',
    });

    this.defineJobs();

    await this.agenda.start();
    console.log('Agenda scheduler started');
  }

  defineJobs() {
    this.agenda.define('task-reminder', async (job) => {
      const { taskId, userId, title, dueDate } = job.attrs.data;
      console.log(`[REMINDER] Task "${title}" (ID: ${taskId}) for user ${userId} is due at ${dueDate}`);

      // Simulated notification: log and send to webhook
      const notificationPayload = {
        type: 'REMINDER',
        taskId,
        userId,
        title,
        dueDate,
        message: `Your task "${title}" is due in about 1 hour!`,
      };

      // Send to a dummy webhook if configured
      if (process.env.REMINDER_WEBHOOK_URL) {
        try {
          await webhookService.sendWebhook(process.env.REMINDER_WEBHOOK_URL, notificationPayload);
        } catch (err) {
          console.error('Failed to send reminder webhook:', err.message);
        }
      }
    });
  }

  async scheduleReminder(task) {
    if (!task.dueDate || task.status === 'completed') {
      await this.cancelReminder(task._id);
      return;
    }

    const reminderDate = new Date(task.dueDate);
    reminderDate.setHours(reminderDate.getHours() - 1); // 1 hour before

    // If the reminder date is already in the past, don't schedule
    if (reminderDate < new Date()) {
      console.log(`Reminder for task ${task._id} would be in the past, skipping.`);
      await this.cancelReminder(task._id);
      return;
    }

    // Upsert the job: one task, one reminder
    await this.agenda.now('task-reminder', {
      taskId: task._id,
      userId: task.userId,
      title: task.title,
      dueDate: task.dueDate,
    });
    
    // Actually, agenda's 'now' runs it immediately. We want 'schedule'.
    // We should use a unique job name or property to identify the job for this task.
    await this.agenda.cancel({ 'data.taskId': task._id });
    await this.agenda.schedule(reminderDate, 'task-reminder', {
      taskId: task._id,
      userId: task.userId,
      title: task.title,
      dueDate: task.dueDate,
    });

    console.log(`Scheduled reminder for task ${task._id} at ${reminderDate}`);
  }

  async cancelReminder(taskId) {
    await this.agenda.cancel({ 'data.taskId': taskId });
    console.log(`Cancelled reminder for task ${taskId}`);
  }
}

module.exports = new AgendaService();
