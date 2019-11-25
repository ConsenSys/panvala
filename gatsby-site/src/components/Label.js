import React from 'react';
import Required from './Required';

const Label = props => {
  if (props.required) {
    return (
      <div className="tl mt4">
        <label className="ma0 f6 mb3 black-40" {...props}>
          {props.children}
          <Required />
        </label>
      </div>
    );
  }

  return (
    <div className="tl mt4">
      <label className="ma0 f6 mb3 black-40" {...props} />
    </div>
  );
};

export default Label;
