import React from 'react';

function DonateButton({ handleClick, text }) {
  return (
    <div>
      <input
        type="submit"
        name="submit"
        onClick={handleClick}
        className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
        value={text ? text : 'Donate'}
      />
    </div>
  );
}

export default DonateButton;
