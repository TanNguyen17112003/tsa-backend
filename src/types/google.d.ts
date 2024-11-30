type FCMKey = {
  client_email: string;
  private_key: string;
};

type PushNotificationMessage = {
  message: string;
  title: string;
  body?: any;
};
