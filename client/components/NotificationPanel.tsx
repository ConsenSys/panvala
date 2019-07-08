import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';
import Image from './Image';
import RouterLink from './RouterLink';
import { INotification } from '../interfaces';

const Wrapper = styled.div`
  font-family: 'Roboto';
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  z-index: 25;
`;

const IconWrapper = styled.div`
  width: 20px;
  height: 20px;
  margin-left: auto;
  cursor: pointer;
`;

const PanelWrapper = styled.div`
  width: 344px;
  position: absolute;
  background-color: #ffffff;
  border: 2px solid ${COLORS.grey5};
  box-shadow: 0px 5px 5px ${COLORS.grey5};
  margin-top: 1rem;
  top: 70px;
`;

const PanelHeading = styled.div`
  padding: 1.4rem;
  color: ${COLORS.grey2};

  font-family: Roboto;
  font-style: normal;
  font-weight: bold;
`;

const ItemWrapper: any = styled.div`
  background-color: white;
  padding: 1.4rem;
  border-top: 1px solid ${COLORS.grey5};
  color: #8e9ea6;
  font-size: 0.85rem;
`;

const ItemAction = styled.div`
  color: ${COLORS.grey2};
`;

const ItemText = styled.div`
  margin-top: 0.5rem;
`;

interface IPanelProps {
  handleClose?(): void;
  handleClick?(): any;
  notifications: INotification[];
}

// list of notifications and the currently selected one
interface INotificationProps {
  selectedItem?: number;
  key: number;
  item: {
    href?: string;
    asPath?: string;
    text: string;
    action: string;
  }
}

const NotificationItem: React.FunctionComponent<INotificationProps> = ({ item }) => {
  // TODO: if the item is selected, change its background
  return (
    <ItemWrapper>
      {item.href ? (
        <>
          <RouterLink href={item.href} as={item.asPath}>
            <ItemAction>{item.action}</ItemAction>
          </RouterLink>
          {item.text && <ItemText>{item.text}</ItemText>}
        </>
      ) : (
        <>
          <ItemAction>{item.action}</ItemAction>
          {item.text && <ItemText>{item.text}</ItemText>}
        </>
      )}
    </ItemWrapper>
  );
};

const NotificationIcon: React.FunctionComponent<any> = props => {
  return (
    <IconWrapper onClick={props.onHandleClick}>
      <Image
        src={props.unread ? '/static/notification-red.svg' : '/static/notification.svg'}
        alt="notifications"
      />
    </IconWrapper>
  );
};

const NotificationPanel: React.FunctionComponent<IPanelProps> = props => {
  const [isOpen, setOpen] = React.useState(false);

  function handleTogglePanelOpen() {
    setOpen(!isOpen);
  }

  return (
    <Wrapper>
      <NotificationIcon
        onHandleClick={handleTogglePanelOpen}
        unread={props.notifications.length > 0 ? true : false}
      />
      {isOpen && (
        <PanelWrapper onClick={handleTogglePanelOpen}>
          <PanelHeading>Notifications</PanelHeading>
          {props.notifications.length > 0 ? (
            props.notifications.map((notification, index) => (
              <NotificationItem key={index} item={notification} />
            ))
          ) : (
            <ItemWrapper>Nothing here!</ItemWrapper>
          )}
        </PanelWrapper>
      )}
    </Wrapper>
  );
};

export default NotificationPanel;
