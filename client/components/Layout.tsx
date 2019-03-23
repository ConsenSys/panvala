import * as React from 'react';
import Head from 'next/head';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import { format } from 'date-fns';
import { AxiosResponse } from 'axios';

import Header from './Header';
import { IProposal, ISlate, IAppContext } from '../interfaces';
import { getAllProposals, getAllSlates } from '../utils/api';
import { convertEVMSlateStatus } from '../utils/status';
import { baseToConvertedUnits } from '../utils/format';

export const AppContext: React.Context<IAppContext> = React.createContext<IAppContext>({
  slates: [],
  proposals: [],
  currentBallot: {
    startDate: 0,
    votingOpenDate: 0,
    votingCloseDate: 0,
    finalityDate: 0,
  },
});

const LayoutWrapper = styled.div`
  font-family: 'Roboto';
  min-height: 100vh;
  margin: 2em 10em;
`;

type IProps = {
  title: string;
  children: any;
};

export default class Layout extends React.Component<IProps, IAppContext> {
  readonly state: IAppContext = {
    slates: [],
    proposals: [],
    currentBallot: {
      startDate: 0,
      votingOpenDate: 0,
      votingCloseDate: 0,
      finalityDate: 0,
    },
    onNotify: () => this.handleNotify,
    onRefreshProposals: () => this.handleRefreshProposals,
  };

  constructor(props: IProps) {
    super(props);
    this.handleNotify = this.handleNotify.bind(this);
    this.handleRefreshProposals = this.handleRefreshProposals.bind(this);
  }

  // runs once, onload
  async componentDidMount() {
    // const slatesFromIpfs: any[] = await Promise.all(slateMultihashes.map(mh => ipfsGetData(mh)));
    // const slatesWithMHs = slates.map((s, i) => ({ ...s, hash: slateMultihashes[i] }));
    const slates: ISlate[] | AxiosResponse = await getAllSlates();
    const proposals: IProposal[] | AxiosResponse = await this.handleGetAllProposals();

    let proposalData: IProposal[] = [];
    // sort proposals by createdAt
    if (Array.isArray(proposals)) {
      const sortedProposals = proposals.sort((a: IProposal, b: IProposal) => {
        const timestampA = format(a.createdAt, 'x');
        const timestampB = format(b.createdAt, 'x');
        return parseInt(timestampA) - parseInt(timestampB);
      });
      proposalData = sortedProposals;
    }

    let slateData: ISlate[] = [];
    // convert statuses: number -> string (via enum)
    if (Array.isArray(slates)) {
      slateData = slates.map((s: any) => {
        // convert from number to string
        s.status = convertEVMSlateStatus(s.status);
        return s;
      });
    }

    const oneWeekSeconds = 604800;
    // Epoch 3
    // beginning of week 1 (2/1)
    const epochStartDate = 1549040401; // gateKeeper.functions.currentBatchStart()
    // end of week 11 (4/19)
    const week11EndDate = epochStartDate + oneWeekSeconds * 11; // 1555689601
    // end of week 12 (4/26)
    const week12EndDate = week11EndDate + oneWeekSeconds;
    // end of week 13 (5/3)
    const week13EndDate = week12EndDate + oneWeekSeconds;

    // prettier-ignore
    this.setState({
      slates: slateData,
      proposals: proposalData,
      currentBallot: {
        startDate: epochStartDate,
        votingOpenDate: week11EndDate,
        votingCloseDate: week12EndDate,
        finalityDate: week13EndDate,
      },
    });
  }

  handleNotify(note: string, custom: string) {
    if (custom) {
      (toast as any)[custom](note);
    } else {
      toast(note);
    }
  }

  async handleGetAllProposals() {
    let proposals: IProposal[] | AxiosResponse = await getAllProposals();

    // convert tokensRequested: base -> human
    if (Array.isArray(proposals)) {
      proposals = proposals.map((p: any) => {
        p.tokensRequested = baseToConvertedUnits(p.tokensRequested, 18);
        return p;
      });
    } else {
      throw new Error('invalid proposals type -- AxiosResponse');
    }

    return proposals;
  }

  async handleRefreshProposals() {
    const proposals: IProposal[] = await this.handleGetAllProposals();
    return this.setState({ proposals });
  }

  render() {
    const { children, title }: IProps = this.props;
    console.log('Layout state:', this.state);

    return (
      <LayoutWrapper>
        <Head>
          <title>{title}</title>
        </Head>

        <Header />
        <AppContext.Provider value={this.state}>{children}</AppContext.Provider>
        <ToastContainer
          position="top-right"
          autoClose={8000}
          hideProgressBar={true}
          newestOnTop={false}
          rtl={false}
          draggable={false}
          closeOnClick
          pauseOnHover
        />
      </LayoutWrapper>
    );
  }
}
