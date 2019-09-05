'use strict';

var styles = {
  container: {
    display: 'flex',
    justifyContent: 'center'
  },
  spinner: {
    background: 'none',
    width: '40px',
    height: '40px',
    marginTop: '1rem'
  },
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: '50',
    display: 'block'
  },
  body: {
    position: 'fixed',
    top: '200px',
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
    zIndex: '100'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#333',
    lineHeight: '1.75rem',
    textAlign: 'center'
  },
  copy: {
    marginTop: '1rem',
    marginLeft: '.8rem',
    marginRight: '.8rem',
    fontSize: '.8rem',
    fontWeight: '400',
    color: '#555',
    lineHeight: '1.75rem',
    textAlign: 'left'
  },
  instructions: {
    marginTop: '1rem',
    marginLeft: '.8rem',
    marginRight: '.8rem',
    fontSize: '.65rem',
    color: '#555',
    lineHeight: '1.25rem',
    textAlign: 'left'
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
    justifyContent: 'center'
  }
};

function Spinner() {
  return React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "xMidYMid",
    className: "lds-rolling",
    style: styles.spinner
  }, React.createElement("circle", {
    cx: "50",
    cy: "50",
    fill: "none",
    "ng-attr-stroke": "{{config.color}}",
    "ng-attr-stroke-width": "{{config.width}}",
    "ng-attr-r": "{{config.radius}}",
    "ng-attr-stroke-dasharray": "{{config.dasharray}}",
    stroke: "#67D0CA",
    strokeWidth: "10",
    r: "35",
    strokeDasharray: "164.93361431346415 56.97787143782138",
    transform: "rotate(17.3945 50 50)"
  }, React.createElement("animateTransform", {
    attributeName: "transform",
    type: "rotate",
    calcMode: "linear",
    values: "0 50 50;360 50 50",
    keyTimes: "0;1",
    dur: "1s",
    begin: "0s",
    repeatCount: "indefinite"
  })));
}

var ModalOverlay = (_ref) => {
  var {
    handleClick
  } = _ref;
  return React.createElement("div", {
    style: styles.overlay,
    onClick: handleClick
  });
};

var ModalBody = (_ref2) => {
  var {
    handleClick,
    children
  } = _ref2;
  return React.createElement("div", {
    style: styles.body,
    onClick: handleClick
  }, children);
};

var MetaMaskDialog = (_ref3) => {
  var {
    handleCancel
  } = _ref3;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: styles.instructions
  }, "MetaMask will open a new window to confirm. If you don\u2019t see it, please click the extension icon in your browser."), React.createElement(Spinner, null), React.createElement("div", {
    style: styles.cancel,
    onClick: handleCancel
  }, "Cancel"));
};

var StepOne = (_ref4) => {
  var {
    message,
    handleCancel
  } = _ref4;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: styles.title
  }, "Step 1 of 2"), React.createElement("div", {
    style: styles.title
  }, "Swap ETH for PAN"), React.createElement("div", {
    style: styles.copy
  }, "Since all donations are made in PAN tokens we will use Uniswap to purchase PAN tokens with your ETH. Once purchased, you can then donate.", React.createElement("br", null), "Under the hood: ".concat(message)), React.createElement(MetaMaskDialog, {
    handleCancel: handleCancel
  }));
};

var StepTwo = (_ref5) => {
  var {
    message,
    handleCancel
  } = _ref5;
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: styles.title
  }, "Step 2 of 2"), React.createElement("div", {
    style: styles.title
  }, "Donate PAN"), React.createElement("div", {
    style: styles.copy
  }, "You now have PAN tokens! Confirm the MetaMask transaction to finalize your donation.", React.createElement("br", null), "Under the hood: ".concat(message)), React.createElement(MetaMaskDialog, {
    handleCancel: handleCancel
  }));
};

var WebsiteModal = (_ref6) => {
  var {
    isOpen,
    step,
    message,
    handleCancel
  } = _ref6;

  if (!isOpen || step == null) {
    return null;
  } // prettier-ignore


  var steps = [React.createElement("div", null), React.createElement(StepOne, {
    handleCancel: handleCancel,
    message: message
  }), React.createElement(StepTwo, {
    handleCancel: handleCancel,
    message: message
  })];
  return React.createElement("div", {
    style: styles.container
  }, React.createElement(ModalOverlay, null), React.createElement(ModalBody, null, steps[step]));
};