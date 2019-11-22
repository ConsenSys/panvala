import React from 'react';
import { ErrorMessage } from 'formik';

export const FormError = props => {
  const classes = `red tl ${props.className}`;
  return (
    <div className={classes}>
      <ErrorMessage name={props.name} />
    </div>
  );
};
