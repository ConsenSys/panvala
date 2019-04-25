import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const IconWrapper = styled.div`
  width: 20px;
  height: 20px;
  background: black;
  margin-left: auto;
`;

const PanelWrapper = styled.div`
  width: 344px;

  background: #ffffff;
  border: 2px solid ${COLORS.grey5};
  box-shadow: 0px 5px 5px ${COLORS.grey5};
`;

const PanelHeading = styled.div`
 padding 20px;
 color: ${COLORS.grey2};

 font-family: Roboto;
 font-style: normal;
 font-weight: bold;
`;

const ItemWrapper = styled.div`
  background: white;
  padding: 20px;
  border-top: 1px solid ${COLORS.grey5};
  color: #8e9ea6;
`;

const ItemAction = styled.div`
  color: ${COLORS.grey2};
`;

const SelectedItem = styled.div`
  background: rgba(222, 240, 250, 0.3);
`;

interface Props {
  isOpen: boolean;
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
      {props.items.map(item => (
        <ItemWrapper>
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
  return <IconWrapper />;
};

// TODO: on click, toggle isOpen
const NotificationPanel: React.FunctionComponent<Props> = props => {
  return (
    <Wrapper>
      <NotificationIcon />
      {props.isOpen && (
        <PanelWrapper>
          <PanelHeading>Notifications</PanelHeading>
          <NotificationItems items={props.items} />
        </PanelWrapper>
      )}
    </Wrapper>
  );
};

export default NotificationPanel;
