import connectToDatabase from '@/lib/db';
import Notification, { NotificationType } from '@/models/Notification';
import User from '@/models/User';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSocketIO = (): any => (global as any)._socketIO;

export interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  actorId?: string;
  title: string;
  body: string;
  link: string;
  entityId?: string;
  entityModel?: string;
}

/**
 * Create a notification, emit it via Socket.io, and optionally send an email.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { recipientId, type, actorId, title, body, link, entityId, entityModel } = params;

  await connectToDatabase();

  // Don't notify yourself
  if (actorId && actorId === recipientId) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    type,
    title,
    body,
    link,
    actor: actorId || undefined,
    entityId: entityId || undefined,
    entityModel: entityModel || undefined,
    isRead: false,
  });

  // Populate actor for the socket payload
  await notification.populate('actor', 'fullName profilePicture');

  const payload = notification.toObject();

  // Emit via Socket.io if server is available
  if (getSocketIO()) {
    getSocketIO().to(`user:${recipientId}`).emit('notification:new', payload);
  }

  // Optionally send email
  try {
    const recipient = await User.findById(recipientId).select(
      'email fullName notificationPreferences'
    );
    if (recipient) {
      const prefs = recipient.notificationPreferences || {};
      let shouldEmail = false;

      if (
        type === NotificationType.MESSAGE &&
        prefs.emailOnMessage !== false
      ) {
        shouldEmail = true;
      } else if (
        (type === NotificationType.CONNECTION_REQUEST ||
          type === NotificationType.CONNECTION_ACCEPTED) &&
        prefs.emailOnConnection !== false
      ) {
        shouldEmail = true;
      } else if (
        type === NotificationType.JOB_POSTED &&
        prefs.emailOnJob !== false
      ) {
        shouldEmail = true;
      } else if (
        type === NotificationType.VERIFICATION_APPROVED ||
        type === NotificationType.VERIFICATION_REJECTED ||
        type === NotificationType.GROUP_ADDED
      ) {
        shouldEmail = true;
      }

      if (shouldEmail && process.env.RESEND_API_KEY) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await resend.emails.send({
          from: 'Alumni Connect <noreply@alumniconnect.com>',
          to: recipient.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4f46e5;">${title}</h2>
              <p style="color: #374151;">${body}</p>
              <a href="${appUrl}${link}" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">
                View
              </a>
              <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                You can manage your notification preferences in your 
                <a href="${appUrl}/dashboard/settings" style="color: #4f46e5;">account settings</a>.
              </p>
            </div>
          `,
        });
      }
    }
  } catch (emailErr) {
    // Email failure is non-fatal
    console.error('Notification email failed:', emailErr);
  }

  return notification;
}
