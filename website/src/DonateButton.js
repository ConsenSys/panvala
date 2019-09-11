'use strict';

function DonateButton({ handleClick }) {
  return (
    <div>
      <input
        type="submit"
        name="submit"
        onClick={handleClick}
        onSubmit={handleClick}
        className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
        value="Donate"
      />
    </div>
  );
}
