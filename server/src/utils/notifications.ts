import Notification, { type NotificationType } from "../models/Notification";

export const createNotification = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<void> => {
  try {
    await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      // pass undefined when no link is provided to satisfy strict types
      link: params.link ?? undefined,
    });
  } catch {
    // Non-fatal — never block the main flow
  }
};
