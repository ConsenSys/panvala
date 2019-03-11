import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../styles';
import { AppContext } from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SectionLabel from '../../components/SectionLabel';
import Label from '../../components/Label';
import CenteredTitle from '../../components/CenteredTitle';
import Deadline from '../../components/Deadline';
import { tsToDeadline } from '../../utils/datetime';
import config from '../../config';
import { statuses } from '../../utils/status';
// import { Formik, Form } from 'formik';

type Props = {
  account?: string;
  provider?: any;
};

const BallotWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 2em;
  border: 1px solid #f0f5f6;
  color: ${COLORS.text};
`;

const Separator = styled.div`
  border: 1px solid ${COLORS.grey5};
`;

interface Context {
  slates?: any[];
}

const Vote: React.FunctionComponent<Props> = () => {
  const context: Context = React.useContext(AppContext);
  const [choices, setChoice]: any = React.useState({ first: '', second: '' });

  function handleSetChoice(number: string, choice: string) {
    if (
      (number === 'first' && choices.second === choice) ||
      (number === 'second' && choices.first === choice)
    ) {
      setChoice({ [number]: choice });
    } else {
      setChoice({
        ...choices,
        [number]: choice,
      });
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Deadline status={statuses.PENDING_VOTE}>{`${tsToDeadline(
          config.ballotDeadline
        )}`}</Deadline>
      </div>
      <CenteredTitle title="Submit Vote" />
      <BallotWrapper>
        {/* <Formik
          initialValues={{
            firstChoice: '',
            secondChoice: '',
          }}
          onSubmit={async (values, { setSubmitting }) => {
            console.log('proposal-form-values:', values);
            // await props.onSubmit(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form> */}
        <div className="pa4">
          <SectionLabel>{'GRANTS'}</SectionLabel>
          <Label required>{'Select your first and second choice slate'}</Label>
          <div className="flex flex-wrap mt3">
            {context.slates &&
              context.slates.map((slate: any, index: number) => (
                <Card
                  key={slate.title + index}
                  title={slate.title}
                  subtitle={slate.subtitle}
                  description={slate.description}
                  category={slate.category}
                  status={slate.status}
                  choices={choices}
                  onSetChoice={handleSetChoice}
                  id={slate.id}
                />
              ))}
          </div>
        </div>

        <Separator />

        <div className="flex flex-column pv4 ph4 items-end">
          <div className="flex">
            <Button large>{'Back'}</Button>
            <Button type="submit" large>
              {'Confirm and Submit'}
            </Button>
          </div>
          <div className="f7 w5 tr mr3">
            {'This will redirect to a seperate MetaMask window to confirm your transaction.'}
          </div>
        </div>
        {/* </Form>
          )}
        </Formik> */}
      </BallotWrapper>
    </div>
  );
};

export default Vote;
