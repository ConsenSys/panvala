import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../styles';
import Flex from './system/Flex';

export const ModalTitle = styled.div`
  font-size: 1.5em;
  color: ${colors.greys.dark};
  margin: 0.7rem 0;
`;

export const ModalDescription = styled.div`
  font-size: 0.9rem;
  color: ${colors.greys.dark};
  line-height: 1.8rem;
  margin-bottom: 1.5em;
  text-align: left;
`;

const ModalBody = styled.div`
  position: fixed;
  top: 200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  overflow: hidden;
  width: 400px;
  padding: 1.8rem;
  background: white;
  color: ${colors.greys.dark};
  border-radius: 10px;
  box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 50;
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
        <Flex justifyCenter>
          <ModalOverlay onClick={props.handleClick} className="Modal-overlay" />
          <ModalBody {...props}>{props.children}</ModalBody>
        </Flex>
      )}
    </div>
  );
};

export default Modal;
