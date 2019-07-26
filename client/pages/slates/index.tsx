import * as React from 'react';
import groupBy from 'lodash/groupBy';

import { MainContext, IMainContext } from '../../components/MainProvider';
import Button from '../../components/Button';
import Deadline from '../../components/Deadline';
import Flex from '../../components/system/Flex';
import RouteTitle from '../../components/RouteTitle';
import RouterLink from '../../components/RouterLink';
import { ISlate } from '../../interfaces';
import { isSlateSubmittable } from '../../utils/status';
import { BN } from '../../utils/format';
import { Separator } from '../../components/Separator';
import SlateCard from '../../components/SlateCard';
import SlateSectionLabel from '../../components/SlateSectionLabel';
import VisibilityFilter from '../../components/VisibilityFilter';

const Slates: React.SFC = () => {
  const { slates, currentBallot }: IMainContext = React.useContext(MainContext);
  const [visibleGrantSlates, setVisibleGrantSlates] = React.useState(slates);
  const [visibleGovernanceSlates, setVisibleGovernanceSlates] = React.useState(slates);
  const [visibilityFilter, setVisibilityFilter] = React.useState({ Current: true, Past: false });
  const [createable, setCreateable] = React.useState(false);

  React.useEffect(() => {
    function isPassed(epochNumber: number) {
      return BN(epochNumber).lt(currentBallot.epochNumber);
    }

    if (slates.length > 0) {
      // NOTE: once we upgrade the contexts, slates will be grouped by epochNumber
      const { GRANT = [], GOVERNANCE = [] } = groupBy(slates, 'category');
      let grantSlates, governanceSlates;

      if (visibilityFilter.Current) {
        grantSlates = GRANT.filter((s: ISlate) => !isPassed(s.epochNumber));
        governanceSlates = GOVERNANCE.filter((s: ISlate) => !isPassed(s.epochNumber));
      } else if (visibilityFilter.Past) {
        grantSlates = GRANT.filter((s: ISlate) => isPassed(s.epochNumber));
        governanceSlates = GOVERNANCE.filter((s: ISlate) => isPassed(s.epochNumber));
      }

      setVisibleGrantSlates(grantSlates);
      setVisibleGovernanceSlates(governanceSlates);
    }
  }, [slates, visibilityFilter, currentBallot.epochNumber]);

  React.useEffect(() => {
    if (
      isSlateSubmittable(currentBallot, 'GRANT') ||
      isSlateSubmittable(currentBallot, 'GOVERNANCE')
    ) {
      setCreateable(true);
    } else {
      setCreateable(false);
    }
  }, [currentBallot.slateSubmissionDeadline]);

  return (
    <>
      <Flex justifyBetween alignCenter wrap="true" mb={2}>
        <Flex alignCenter>
          <RouteTitle mr={3}>{'Slates'}</RouteTitle>
          <RouterLink href="/slates/create" as="/slates/create">
            <Button type="default" disabled={!createable}>
              {'Add Slate'}
            </Button>
          </RouterLink>
        </Flex>
        <Deadline ballot={currentBallot} route="slates" />
      </Flex>

      <VisibilityFilter
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
      />

      {visibleGrantSlates.length > 0 ? (
        <>
          <SlateSectionLabel text="GRANT" />
          {visibleGrantSlates.map((slate: ISlate) => (
            <SlateCard
              key={slate.id}
              slate={slate}
              subtitle={slate.proposals.length + ' Grants Included'}
            />
          ))}
        </>
      ) : null}

      {visibleGrantSlates.length && visibleGovernanceSlates.length ? <Separator mt={4} /> : null}

      {visibleGovernanceSlates.length > 0 ? (
        <>
          <SlateSectionLabel text="GOVERNANCE" />
          {visibleGovernanceSlates.map((slate: ISlate) => (
            <SlateCard
              key={slate.id}
              slate={slate}
              subtitle={`${slate.proposals.length || ''} Governance Changes Included`}
            />
          ))}
        </>
      ) : null}
    </>
  );
};

export default Slates;
