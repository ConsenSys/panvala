import * as React from 'react';
import styled from 'styled-components';
import { Field } from './FieldText';
import { colors } from '../styles';
import Label from './Label';
import { Radio, withStyles } from '@material-ui/core';

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

const ToggleLabel: any = styled(Label)`
  margin: 0.75rem;
  margin-left: 0;
  font-size: 1em;
  color: ${colors.greys.dark};
`;

const Checkbox = (props: any) => {
  return (
    <>
      <Wrapper>
        <Field name={props.name} required>
          {({ field, form }: any) => (
            <>
              <Radio
                checked={field.value.includes(props.value)}
                onChange={() => form.setFieldValue(props.name, props.value)}
                value={props.value}
                name={props.name}
                aria-label="D"
                classes={{
                  root: props.classes.root,
                  checked: props.classes.checked,
                }}
              />
              <ToggleLabel
                onClick={() => form.setFieldValue(props.name, props.value)}
                htmlFor={props.name}
              >
                {props.label}
              </ToggleLabel>
            </>
          )}
        </Field>
      </Wrapper>
    </>
  );
};

const styles = () => {
  return {
    checked: {},
    root: {
      padding: '0.5rem',
      color: colors.grey.border,
      '&$checked': {
        color: colors.blue,
      },
    },
  };
};
export default withStyles(styles)(Checkbox);
