export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
};

export type PushNotificationJobData = {
  userId: string;
  token: string;
  message: PushNotificationMessage;
};
