import * as React from 'react';
import { withRouter, SingletonRouter } from 'next/router';
import Button from './Button';

interface IProps {
  router: SingletonRouter;
}
const BackButton = ({ router }: IProps) => (
  <Button
    large
    type="default"
    onClick={() => {
      router.back();
    }}
  >
    Back
  </Button>
);

export default withRouter(BackButton);
