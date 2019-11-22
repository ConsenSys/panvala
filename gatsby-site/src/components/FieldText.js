import React from 'react';
import { ErrorMessage } from 'formik';

import Input from './Input';
import Label from './Label';


const FieldText = props => {
  return (
    <>
      <Label required={props.required}>{props.label}</Label>

      <div className="red tl pt2">
        <ErrorMessage name={props.name} component="span" />
      </div>

      <Input type={props.type || 'text'} {...props} />
    </>
  );
};

export default FieldText;
