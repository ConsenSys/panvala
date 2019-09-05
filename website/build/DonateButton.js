'use strict';

function DonateButton(_ref) {
  var {
    handleClick
  } = _ref;
  return React.createElement("div", null, React.createElement("button", {
    onClick: handleClick,
    className: "f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
  }, "Donate!"));
}