export interface INotification {
  action: string;
  text: string;
  href?: string;
  asPath?: string;
  id?: string;
}

export interface INotificationsContext {
  notifications: INotification[];
  onHandleGetUnreadNotifications(): void;
}
