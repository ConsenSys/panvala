import * as React from 'react';
import { format } from 'date-fns';
import { AxiosResponse } from 'axios';
import keyBy from 'lodash/keyBy';
import isEmpty from 'lodash/isEmpty';

import { EthereumContext } from './EthereumProvider';
import { IProposal, ISlate, IBallotDates } from '../interfaces';
import { getAllProposals, getAllSlates } from '../utils/api';
import { baseToConvertedUnits } from '../utils/format';
import { ballotDates } from '../utils/voting';

export interface IMainContext {
  slates?: ISlate[];
  proposals?: IProposal[];
  proposalsByID?: any;
  slatesByID?: any;
  currentBallot: IBallotDates;
  onRefreshProposals(): void;
  onRefreshSlates(): void;
  onRefreshCurrentBallot(): void;
}

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
  switch (action.type) {
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
    case 'ballot':
      return {
        ...state,
        currentBallot: action.currentBallot,
      };
    default:
      throw new Error();
  }
}

const MainProvider: React.FC = (props: any) => {
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
    contracts: { gatekeeper, tokenCapacitor, parameterStore },
  } = React.useContext(EthereumContext);

  // init slates and proposals from api
  React.useEffect(() => {
    refreshProposals();
    refreshSlates();
  }, []);

  // init current ballot
  React.useEffect(() => {
    if (!isEmpty(gatekeeper)) {
      refreshCurrentBallot();
    }
  }, [gatekeeper]);

  async function refreshCurrentBallot() {
    const epochNumber = await gatekeeper.functions.currentEpochNumber();
    const currentEpochStart = (await gatekeeper.functions.epochStart(epochNumber)).toNumber();
    let currentBallot = ballotDates(currentEpochStart);

    // set slate submission deadlines for grants and governance
    currentBallot.slateSubmissionDeadline.GRANT = (await gatekeeper.functions.slateSubmissionDeadline(
      epochNumber,
      tokenCapacitor.address
    )).toNumber();
    currentBallot.slateSubmissionDeadline.GOVERNANCE = (await gatekeeper.functions.slateSubmissionDeadline(
      epochNumber,
      parameterStore.address
    )).toNumber();
    currentBallot.epochNumber = epochNumber.toNumber();

    console.log('currentBallot:', currentBallot);
    return dispatch({ type: 'ballot', currentBallot });
  }

  async function refreshProposals() {
    const proposals: IProposal[] = await handleGetAllProposals();
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
    const proposalsByID = keyBy(proposalData, 'id');

    console.log('proposals:', proposalData);
    return dispatch({ type: 'proposals', proposals: proposalData, proposalsByID });
  }

  async function refreshSlates() {
    const slates: ISlate[] = await handleGetAllSlates();
    const slatesByID = keyBy(slates, 'id');

    console.log('slates:', slates);
    return dispatch({ type: 'slates', slates, slatesByID });
  }

  const value: IMainContext = {
    ...state,
    onRefreshCurrentBallot: refreshCurrentBallot,
    onRefreshProposals: refreshProposals,
    onRefreshSlates: refreshSlates,
  };

  return <MainContext.Provider value={value}>{props.children}</MainContext.Provider>;
};

export default React.memo(MainProvider);
