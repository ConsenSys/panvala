import * as React from 'react';
import styled from 'styled-components';
import { withRouter, SingletonRouter } from 'next/router';
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
import { ISlate, IAppContext } from '../../interfaces';

type IProps = {
  account?: string;
  provider?: any;
  router: SingletonRouter;
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

const Vote: React.FunctionComponent<IProps> = ({ router }) => {
  const { slates }: IAppContext = React.useContext(AppContext);
  const [choices, setChoice]: any = React.useState({ first: '', second: '' });

  function handleSetChoice(rank: string, slateID: string) {
    if (
      (rank === 'first' && choices.second === slateID) ||
      (rank === 'second' && choices.first === slateID)
    ) {
      // user chose a different rank for a slate
      setChoice({ [rank]: slateID });
    } else {
      // user chose a unique rank for a slate
      setChoice({
        ...choices,
        [rank]: slateID,
      });
    }
  }

  function handleViewSlateDetails(slate: ISlate) {
    router.push(`/DetailedView?id=${slate.id}`, `/slates/${slate.id}`);
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
        <div className="pa4">
          <SectionLabel>{'GRANTS'}</SectionLabel>
          <Label required>{'Select your first and second choice slate'}</Label>
          <div className="flex flex-wrap mt3">
            {slates &&
              slates.length &&
              slates.map((slate: ISlate) => (
                <Card
                  key={slate.id}
                  title={slate.title}
                  subtitle={slate.proposals.length + ' Grants Included'}
                  description={slate.description}
                  category={slate.category}
                  status={slate.status}
                  choices={choices}
                  onSetChoice={handleSetChoice}
                  slateID={slate.id}
                  onHandleViewSlateDetails={() => handleViewSlateDetails(slate)}
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
      </BallotWrapper>
    </div>
  );
};

export default withRouter(Vote);
