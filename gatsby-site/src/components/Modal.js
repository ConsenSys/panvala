import React from 'react';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: '50',
    display: 'block',
  },
  body: {
    position: 'fixed',
    top: '10vh',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'center',
    overflow: 'hidden',
    width: '400px',
    padding: '1.8rem',
    background: 'white',
    color: 'grey',
    borderRadius: '10px',
    boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.1)',
    zIndex: '100',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    lineHeight: '1.75rem',
    textAlign: 'center',
  },
  copy: {
    marginTop: '1rem',
    marginLeft: '.8rem',
    marginRight: '.8rem',
    fontSize: '.8rem',
    fontWeight: '400',
    color: '#555',
    lineHeight: '1.75rem',
    textAlign: 'left',
  },
  cancel: {
    marginTop: '1rem',
    width: '120px',
    height: '42px',
    backgroundColor: '#F5F6F9',
    borderRadius: '100px',
    display: 'flex',
    alignItems: 'center',
    color: '#555',
    fontWeight: 'bold',
    fontSize: '.9rem',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};

const ModalOverlay = ({ handleClick }) => <div style={styles.overlay} onClick={handleClick} />;

const ModalBody = ({ children }) => <div style={styles.body}>{children}</div>;

const Modal = ({ isOpen, handleClose, title, copy }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.container}>
      <ModalOverlay handleClick={handleClose} />
      <ModalBody>
        <div style={styles.title}>{title}</div>
        <div style={styles.copy}>{copy}</div>
        <div style={styles.cancel} onClick={handleClose}>
          Close
        </div>
      </ModalBody>
    </div>
  );
};

export default Modal;
