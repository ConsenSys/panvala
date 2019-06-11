import * as React from 'react';
import { format } from 'date-fns';
import { AxiosResponse } from 'axios';
import keyBy from 'lodash/keyBy';

import { EthereumContext } from './EthereumProvider';
import { IProposal, ISlate, IMainContext } from '../interfaces';
import { getAllProposals, getAllSlates } from '../utils/api';
import { baseToConvertedUnits } from '../utils/format';
import { ballotDates } from '../utils/status';

export const MainContext: React.Context<IMainContext> = React.createContext<any>({});

async function handleGetAllProposals() {
  // TODO: get or sort proposals by category
  let proposals: IProposal[] | AxiosResponse = await getAllProposals();

  // convert tokensRequested: base -> human
  if (Array.isArray(proposals)) {
    proposals = proposals.map((p: any) => {
      p.tokensRequested = baseToConvertedUnits(p.tokensRequested, 18);
      p.category = 'GRANT';
      return p;
    });
    return proposals;
  }

  return [];
}

async function handleGetAllSlates() {
  const slates: ISlate[] | AxiosResponse = await getAllSlates();
  if (Array.isArray(slates)) {
    return slates;
  }

  return [];
}

function reducer(state: any, action: any) {
  console.info(`Main state change (${action.type})`, state, action);
  switch (action.type) {
    case 'all':
      return {
        slates: action.slates,
        proposals: action.proposals,
        slatesByID: action.slatesByID,
        proposalsByID: action.proposalsByID,
        currentBallot: action.currentBallot,
      };
    case 'slates':
      return {
        ...state,
        slates: action.slates,
        slatesByID: action.slatesByID,
      };
    case 'proposals':
      return {
        ...state,
        proposals: action.proposals,
        proposalsByID: action.proposalsByID,
      };
    default:
      throw new Error();
  }
}

export default function MainProvider(props: any) {
  const [state, dispatch] = React.useReducer(reducer, {
    slates: [],
    proposals: [],
    slatesByID: {},
    proposalsByID: {},
    currentBallot: {
      startDate: 0,
      votingOpenDate: 0,
      votingCloseDate: 0,
      finalityDate: 0,
    },
  });
  const {
    contracts: { gatekeeper },
  } = React.useContext(EthereumContext);

  React.useEffect(() => {
    async function setInitialState() {
      const [slates, proposals]: [ISlate[], IProposal[]] = await Promise.all([
        handleGetAllSlates(),
        handleGetAllProposals(),
      ]);

      let proposalData: IProposal[] = [];
      // sort proposals by createdAt
      if (Array.isArray(proposals)) {
        const sortedProposals: IProposal[] = proposals.sort((a: IProposal, b: IProposal) => {
          const timestampA = format(a.createdAt, 'x');
          const timestampB = format(b.createdAt, 'x');
          return parseInt(timestampA) - parseInt(timestampB);
        });
        proposalData = sortedProposals;
      }

      const slatesByID = keyBy(slates, 'id');
      const proposalsByID = keyBy(proposalData, 'id');

      const currentEpochStart = (await gatekeeper.functions.currentEpochStart()).toNumber();
      const currentBallot = ballotDates(currentEpochStart);
      console.log('currentBallot:', currentBallot);

      dispatch({
        type: 'all',
        slates,
        proposals,
        slatesByID,
        proposalsByID,
        currentBallot,
      });
    }
    if (gatekeeper) {
      setInitialState();
    }
  }, [gatekeeper]);

  async function handleRefreshProposals() {
    const proposals: IProposal[] = await handleGetAllProposals();
    const proposalsByID = keyBy(proposals, 'id');
    return dispatch({ type: 'proposals', proposals, proposalsByID });
  }
  async function handleRefreshSlates() {
    const slates: ISlate[] = await handleGetAllSlates();
    const slatesByID = keyBy(slates, 'id');
    return dispatch({ type: 'slates', slates, slatesByID });
  }

  const value: IMainContext = {
    ...state,
    onRefreshProposals: handleRefreshProposals,
    onRefreshSlates: handleRefreshSlates,
  };

  return <MainContext.Provider value={value}>{props.children}</MainContext.Provider>;
}
