import * as React from 'react';
import styled from 'styled-components';
import Toggle from 'react-toggle';
import { Field } from './FieldText';
import { COLORS } from '../styles';
import Label from './Label';

// const CheckboxInput = styled.input`
//   width: 40px;
//   height: 40px;
//   &:checked {
//     border: 8px solid #adb8c0;
//     color: red;
//   }
// `;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleLabel = styled(Label)`
  margin: 1em;
  font-size: 1em;
  color: ${COLORS.grey2};
`;

const Checkbox = (props: any) => {
  return (
    <>
      <Wrapper>
        <Field name={props.name} required>
          {({ field, form }: any) => (
            <Toggle
              name={props.name}
              defaultChecked={props.defaultChecked}
              checked={field.value.includes(props.value)}
              onChange={() => {
                form.setFieldValue(props.name, props.value);
              }}
            />
          )}
        </Field>
        <ToggleLabel htmlFor={props.name}>{props.label}</ToggleLabel>
      </Wrapper>
    </>
  );
};

export default Checkbox;
