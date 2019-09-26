import * as React from 'react';
import Label from './Label';
import { Field } from './FieldText';
import { ErrorMessage } from './FormError';

const FieldTextarea = ({ label, name, placeholder, required }: any) => {
  return (
    <>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <ErrorMessage name={name} component="span" />
      <Field type="textarea" component="textarea" name={name} placeholder={placeholder} rows={8} />
    </>
  );
};

export default FieldTextarea;
