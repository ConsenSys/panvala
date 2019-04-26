import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';
import Image from './Image';
// import noti from '../static/notification.svg';
// import notiRed from '../static/notification-red.svg';

const Wrapper = styled.div`
  font-family: 'Roboto';
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
`;

const IconWrapper = styled.div`
  width: 25px;
  height: 25px;
  margin-left: auto;
  cursor: pointer;
`;

const PanelWrapper = styled.div`
  width: 344px;
  position: absolute;
  background: #ffffff;
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
  /* background: ${({ index }) => (index % 2 === 0 ? 'rgba(222, 240, 250, 0.3)' : 'white')}; */
  background-color: white;
  padding: 1.4rem;
  border-top: 1px solid ${COLORS.grey5};
  color: #8e9ea6;
  font-size: 0.85rem;
`;

const ItemAction = styled.div`
  color: ${COLORS.grey2};
`;

const SelectedItem = styled.div`
  background: rgba(222, 240, 250, 0.3);
`;

interface Props {
  handleClose?(): void;
  handleClick?(): any;
  items: Item[];
}

interface Item {
  action: string;
  text: string;
  link?: string;
}

// list of items and the currently selected one
interface ItemProps {
  items: Item[];
  selectedItem?: number;
}

const NotificationItems: React.FunctionComponent<ItemProps> = props => {
  if (props.items.length === 0) {
    return <ItemWrapper>Nothing here!</ItemWrapper>;
  }

  // TODO: if the item is selected, change its background
  // TODO: if the item has a link, then make a RouterLink
  return (
    <div>
      {props.items.map((item, index) => (
        <ItemWrapper key={index} index={index}>
          {item.link ? (
            <a href={item.link}>
              <ItemAction>{item.action}</ItemAction>
              {item.text && <div>{item.text}</div>}
            </a>
          ) : (
            <>
              <ItemAction>{item.action}</ItemAction>
              {item.text && <div>{item.text}</div>}
            </>
          )}
        </ItemWrapper>
      ))}
    </div>
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

const NotificationPanel: React.FunctionComponent<Props> = props => {
  const [isOpen, setOpen] = React.useState(false);

  function handleClick() {
    setOpen(!isOpen);
  }

  return (
    <Wrapper>
      <NotificationIcon
        onHandleClick={handleClick}
        unread={props.items.length > 0 ? true : false}
      />
      {isOpen && (
        <PanelWrapper>
          <PanelHeading>Notifications</PanelHeading>
          <NotificationItems items={props.items} />
        </PanelWrapper>
      )}
    </Wrapper>
  );
};

export default NotificationPanel;
