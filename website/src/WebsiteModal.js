'use strict';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  spinner: {
    background: 'none',
    width: '40px',
    height: '40px',
    marginTop: '1rem',
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
  patron: {
    margin: '1.5rem auto 1rem',
    fontSize: '1rem',
    fontWeight: '400',
    color: '#222',
    lineHeight: '1.75rem',
    textAlign: 'center',
  },
  image: {
    marginTop: '1.5rem',
  },
  thankYou: {
    margin: '1rem .6rem',
    fontSize: '.8rem',
    fontWeight: '400',
    color: '#333',
    lineHeight: '1.75rem',
    textAlign: 'center',
  },
  instructions: {
    marginTop: '1rem',
    marginLeft: '.8rem',
    marginRight: '.8rem',
    fontSize: '.65rem',
    color: '#555',
    lineHeight: '1.25rem',
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

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      className="lds-rolling"
      style={styles.spinner}
    >
      <circle
        cx="50"
        cy="50"
        fill="none"
        ng-attr-stroke="{{config.color}}"
        ng-attr-stroke-width="{{config.width}}"
        ng-attr-r="{{config.radius}}"
        ng-attr-stroke-dasharray="{{config.dasharray}}"
        stroke="#67D0CA"
        strokeWidth="10"
        r="35"
        strokeDasharray="164.93361431346415 56.97787143782138"
        transform="rotate(17.3945 50 50)"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          calcMode="linear"
          values="0 50 50;360 50 50"
          keyTimes="0;1"
          dur="1s"
          begin="0s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

const ModalOverlay = ({ handleClick }) => <div style={styles.overlay} onClick={handleClick} />;

const ModalBody = ({ handleClick, children }) => (
  <div style={styles.body} onClick={handleClick}>
    {children}
  </div>
);

const MetaMaskDialog = () => (
  <>
    <div style={styles.instructions}>
      MetaMask will open a new window to confirm. If you don’t see it, please click the extension
      icon in your browser.
    </div>
    <Spinner />
  </>
);

const StepOne = ({ message }) => (
  <>
    <div style={styles.title}>Step 1 of 2</div>
    <div style={styles.title}>Swap ETH for PAN</div>
    <div style={styles.copy}>
      Since all donations are made in PAN tokens we will use Uniswap to purchase PAN tokens with
      your ETH. Once purchased, you can then donate.
      <br />
      {`Under the hood: ${message}`}
    </div>
    <MetaMaskDialog />
  </>
);

const StepTwo = ({ message }) => (
  <>
    <div style={styles.title}>Step 2 of 2</div>
    <div style={styles.title}>Donate PAN</div>
    <div style={styles.copy}>
      You now have PAN tokens! Confirm the MetaMask transaction to finalize your donation.
      <br />
      {`Under the hood: ${message}`}
    </div>
    <MetaMaskDialog />
  </>
);

const Tweet = () => {
  return (
    <a
      class="link twitter-share-button white f7"
      href="https://twitter.com/intent/tweet?text=I%20just%20made%20a%20donation%20to%20Panvala%20to%20support%20the%20Ethereum%20open%20source%20ecosystem.%20Please%20join%20me%20by%20contributing%20at%20panvala.com&hashtags=panvala,ethereum"
      data-size="large"
    >Tweet</a>
  );
};

const StepThree = ({ message, handleClose }) => {
  const tier = message.toLowerCase();
  return (
    <>
      <div style={styles.title}>Thank you for donating!</div>
      <div style={styles.image}>
        <img src={`./img/${tier}.png`} />
      </div>
      <div style={styles.patron}>
        You are now a{tier[0] === 'e' && 'n'} <strong>{message} Patron</strong>
      </div>
      <div style={styles.thankYou}>
        Thank you for donating to Panvala. Each and every Panvala patron plays a key role in moving
        Ethereum forward. You can share your support on Twitter!
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '80%',
        }}
      >
        <div style={styles.cancel} onClick={handleClose}>
          Close
        </div>
        <div style={{ ...styles.cancel, backgroundColor: '#1b95e0' }}>
          <Tweet />
        </div>
      </div>
    </>
  );
};

const WebsiteModal = ({ isOpen, step, message, handleCancel }) => {
  if (!isOpen || step == null) {
    return null;
  }

  // prettier-ignore
  const steps = [
    <div></div>,
    <StepOne message={message} />,
    <StepTwo message={message} />,
    <StepThree handleClose={handleCancel} message={message} />,
  ];

  return (
    <div style={styles.container}>
      <ModalOverlay />
      <ModalBody>{steps[step]}</ModalBody>
    </div>
  );
};
