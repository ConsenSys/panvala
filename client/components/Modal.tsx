import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../styles';

export const ModalTitle = styled.div`
  font-size: 1.5em;
  color: ${COLORS.grey2};
  margin: 1em 0;
`;

export const ModalDescription = styled.div`
  font-size: 1em;
  color: ${COLORS.grey3};
  line-height: 1.5em;
  margin-bottom: 1em;
  text-align: center;
`;

const ModalBody = styled.div`
  position: fixed;
  top: 50px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  overflow: hidden;
  width: 400px;
  padding: 2.4em;
  background: white;
  color: ${COLORS.grey2};
  border-radius: 10px;
  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 50;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 15;
  display: block;
`;

interface Props {
  isOpen: boolean;
  handleClose?(): void;
  handleClick?(): any;
}

const Modal: React.FunctionComponent<Props> = props => {
  return (
    <div>
      {props.isOpen && (
        <div className="flex justify-center">
          <ModalOverlay onClick={props.handleClick} className="Modal-overlay" />
          <ModalBody {...props}>{props.children}</ModalBody>
        </div>
      )}
    </div>
  );
};

export default Modal;
