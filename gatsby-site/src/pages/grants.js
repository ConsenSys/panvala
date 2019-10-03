import React, { useRef, useState } from 'react';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';
import Modal from '../components/Modal';

import teamGitcoin from '../img/grant-teams/gitcoin.png';
import teamPlasmaGroup from '../img/grant-teams/plasma-group.png';
import teamNimbus from '../img/grant-teams/nimbus.png';
import teamRuntime from '../img/grant-teams/runtime.png';
import teamTenderly from '../img/grant-teams/tenderly.png';
import teamBrightId from '../img/grant-teams/brightid.png';
import teamUpala from '../img/grant-teams/upala.png';
import teamPanvala from '../img/grant-teams/panvala.png';
import teamSigma from '../img/grant-teams/sigma.png';
import teamPrysmatic from '../img/grant-teams/prysmatic-labs.png';
import teamPrototypal from '../img/grant-teams/prototypal.png';
import teamConnext from '../img/grant-teams/connext.png';
import teamEthers from '../img/grant-teams/ethersjs.png';
import teamL4 from '../img/grant-teams/l4.png';
import teamGnosis from '../img/grant-teams/gnosis.png';
import teamAragon from '../img/grant-teams/aragon.png';
import teamBounties from '../img/grant-teams/bounties.png';
import teamStatus from '../img/grant-teams/status.png';
import teamLevelK from '../img/grant-teams/levelk.png';
import teamMaker from '../img/grant-teams/maker.png';
import teamHash from '../img/grant-teams/hash.png';
import teamAsseth from '../img/grant-teams/asseth.png';
import grantsShapes from '../img/grants-shapes.svg';

const Grants = () => {
  const applyRef = useRef(null);
  const [isOpen, setModalOpen] = useState(false);

  function onApplyClick() {
    applyRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setModalOpen(true);
  }

  function handleClose(e) {
    e.preventDefault();
    setModalOpen(false);
    const fn = document.getElementById('grants-full-name');
    const em = document.getElementById('grants-email');
    fn.value = '';
    em.value = '';
  }

  return (
    <Layout>
      <SEO title="Grants" />

      <section className="bg-gradient bottom-clip-hero pb6">
        <Nav />

        {/* <!-- Hero --> */}
        <div className="w-70-l w-80-m w-90 center tc pv5">
          <h1 className="white f1-5 b ma0 mb3 w-50-l w-100 center">
            We are funding Ethereum’s future.
          </h1>
          <p className="white-60 f5 fw4 lh-copy ma0 mb4 w-50-l w-100 center">
            Every 3 months, Panvala Token Grants are awarded to teams doing the work the Ethereum
            ecosystem depends on.
          </p>
          <button
            className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 pointer"
            onClick={onApplyClick}
          >
            Apply for a grant
          </button>
          {/* </a> */}
        </div>
      </section>

      {/* <!-- Batch 4 --> */}
      <div className="mv5 relative">
        <img src={grantsShapes} className="absolute z-0 nt6-l nt0-m mt4-m db-ns dn" />
        <section className="w-70-l w-80-m w-90 center tc relative z-1 pt5">
          <h2 className="f2-5 ma0 mb3">
            Batch Four
            <br />
            November 1, 2019
          </h2>
          <p className="ma0 f6 lh-text w-50 center mb4">
            We are in the process of receiving grant applications for Batch 4 of Panvala Token
            Grants. Using our beta, the entire Ethereum community can vote on which projects should
            receive a PAN token grant. The list of grant proposals is available to the public.
          </p>
          <a href="https://disputes.panvala.com/slates" target="_blank">
            <button className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 pointer">
              Explore the App
            </button>
          </a>
        </section>
      </div>

      {/* <!-- Batch 3 --> */}
      <section className="w-70-l w-80-m w-90 center tc mv6">
        <h2 className="f2-5 ma0 mb3">
          Batch Three
          <br />
          August 2, 2019
        </h2>
        <p className="ma0 f6 lh-text w-50 center mb4">
          In Batch 3 of Panvala Token Grants, 8 teams were awarded a total of 1,943,899 PAN for the
          work they do to move Ethereum forward.
        </p>
        {/* <!-- List of Grants --> */}
        <section className="flex flex-wrap">
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="bg-gray h4 w-100 tc v-mid dtc">
                <img src={teamGitcoin} className="w-75 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">CLR Matching for Gitcoin Grants</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">500,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to sustain Ethereum by matching donations made on Gitcoin.
                  </p>
                </div>
                <div>
                  <a href="https://gitcoin.co/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="bg-gray h4 w-100 tc v-mid dtc">
                <img src={teamPlasmaGroup} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Predicate Contract Framework</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum scale by providing a framework for pluggable Plasma
                    applications.
                  </p>
                </div>
                <div>
                  <a href="https://plasma.group/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamNimbus} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Nimbus Ethereum 2.0 Phase 0</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by implementing the initial phase of the
                    Ethereum 2.0 specification
                  </p>
                </div>
                <div>
                  <a
                    href="https://our.status.im/tag/nimbus/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamRuntime} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">KWASM Semantics</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by enabling formal verification of Web
                    Assembly smart contracts.
                  </p>
                </div>
                <div>
                  <a
                    href="https://runtimeverification.com/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamTenderly} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Hosted Execution Tracing</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to sustain Ethereum by automating the infrastructure developers need
                    to inspect contract execution.
                  </p>
                </div>
                <div>
                  <a href="https://tenderly.dev/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamBrightId} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">BrightID Identity Network</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to sustain Ethereum by building a decentralized identity network for
                    dapp developers to integrate.
                  </p>
                </div>
                <div>
                  <a
                    href="https://www.brightid.org/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamUpala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Upala Digital Identity</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to sustain Ethereum by simplifying blockchain interaction and
                    onboarding with human-centric identities.
                  </p>
                </div>
                <div>
                  <a
                    href="https://github.com/porobov/upala-docs/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Batch 3 Grant Recommendations</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">43,899 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    Sigma Prime is launching a single-client testnet that allows the public to run a
                    set of validators on a Beacon Chain test network of Lighthouse clients.
                  </p>
                </div>
                <div>
                  <a
                    href="https://medium.com/@Panvala"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
        </section>
      </section>

      {/* <!-- Batch 2 --> */}
      <section className="w-100 bg-gray full-clip-down-lg pv6">
        <section className="w-70-l w-80-m w-90 center tc pv4">
          <h2 className="f2-5 ma0 mb3">
            Batch Two
            <br />
            May 2, 2019
          </h2>
          <p className="ma0 f6 lh-text w-50 center mb4">
            In Batch 2 of Panvala Token Grants, 7 teams were awarded a total of 2,034,798 PAN for
            the work they do to move Ethereum forward.
          </p>
          {/* <!-- List of Grants --> */}
          <section className="flex flex-wrap">
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamSigma} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Lighthouse Ethereum 2.0 Single-Client Testnet</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">400,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by implementing the Ethereum
                      2.0specification.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://sigmaprime.io/"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamPrysmatic} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Prysm Ethereum 2.0 Single-Client Testnet</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">400,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by implementing the Ethereum
                      2.0specification.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://prysmaticlabs.com/"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamPrototypal} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Counterfactual Metamask Integration</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by promoting the adoption ofgeneralized
                      state channels.
                    </p>
                  </div>
                  <div>
                    <a href="https://l4.ventures/" target="_blank" className="link dim blue f7 fw7">
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamConnext} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Generalized State Channels For Connext</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by generalizing payment channels tohandle
                      arbitrary state.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://connext.network/"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamEthers} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Ethers.js v5</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by making life easier for dapp developers.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://docs.ethers.io/ethers.js/html/"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamL4} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Counterfactual Developer Experience</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by integrating generalized statechannel
                      support directly into wallets.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://www.counterfactual.com/"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-33-l w-50-m w-100 pa3">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={teamPanvala} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Batch 2 Grant Recommendations</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">84,798 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by recommending token grantapplications.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://medium.com/@Panvala/seven-grants-awarded-for-ethereum-2-0-and-scaling-teams-in-panvalas-second-batch-626f74f0a3bb"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      View website
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </section>
      </section>

      {/* <!-- Batch 1 --> */}
      <section className="w-70-l w-80-m w-90 center tc mv6">
        <h2 className="f2-5 ma0 mb3">
          Batch One
          <br />
          February 1, 2019
        </h2>
        <p className="ma0 f6 lh-text w-50 center mb4">
          In Batch 1 of Panvala Token Grants, 9 teams were awarded a total of 2,119,836 PAN for the
          work they do to move Ethereum forward.
        </p>
        {/* <!-- List of Grants --> */}
        <section className="flex flex-wrap">
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamGnosis} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Gnosis Safe Recovery</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">375,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by helping users to recover access totheir
                    Gnosis Safe even in case access to all their devices was lost.
                  </p>
                </div>
                <div>
                  <a href="https://gnosis.io/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamAragon} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Voting Relay Protocol</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by building a commonimplementation of scalable
                    token voting for the community to build ontop of.
                  </p>
                </div>
                <div>
                  <a href="https://aragon.one/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamBounties} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">What Would You Bounty?</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">240,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by creating bounties for worksuggested by the
                    community.
                  </p>
                </div>
                <div>
                  <a
                    href="https://bounties.network/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamStatus} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Infrastructure Monitoring</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by monitoring high value systemsand assets on
                    Ethereum.
                  </p>
                </div>
                <div>
                  <a href="https://status.im/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamLevelK} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Tidbit Dynamic Oracles</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by improving a reusable library for oracles.
                  </p>
                </div>
                <div>
                  <a href="https://www.levelk.io/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamMaker} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">K Semantics For Web Assembly</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by enabling developers to formally verify
                    smart contracts that run on Web Assembly.
                  </p>
                </div>
                <div>
                  <a href="https://dapphub.com" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamLevelK} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Registry Builder Vote Weighting</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">175,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by improving a reusable library
                    fortoken-curated registries.
                  </p>
                </div>
                <div>
                  <a href="https://www.levelk.io/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamMaker} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">KLab Explorer</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">175,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by helping developers explore theformal proofs
                    for their contract systems.
                  </p>
                </div>
                <div>
                  <a href="https://dapphub.com" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamHash} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Hashing It Out Security Series</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by producing podcast episodes aboutEthereum
                    security.
                  </p>
                </div>
                <div>
                  <a
                    href="https://twitter.com/hashingitoutpod?lang=en"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Batch 2 Grant Recommendations</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by recommending token grantapplications.
                  </p>
                </div>
                <div>
                  <a
                    href="https://medium.com/@Panvala/twelve-grants-awarded-in-batch-one-of-panvala-token-grants-59b8df7422fe"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamAsseth} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">EthCC CTF Promotion</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">50,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by promotion a “capture the flag”security
                    contest at EthCC.
                  </p>
                </div>
                <div>
                  <a
                    href="https://www.asseth.fr/en/home/"
                    target="_blank"
                    className="link dim blue f7 fw7"
                  >
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
        </section>
      </section>

      <div className="relative">
        {/* <!-- Apply for a grant --> */}
        <section id="grants-apply" className="bg-gray top-clip-up pv6 nt6" ref={applyRef}>
          <div className="w-50-l w-70-m w-90 center tc">
            <h2 className="f2-5 ma0 mb3 mt5 lh-copy">Panvala Token Grants</h2>
            <p className="ma0 f6 lh-text mb3">
              We'd love to help you prepare a proposal for a Panvala token grant. Send us your email
              and we'll be in contact soon.
            </p>
            <form
              className="w-70-l w-90-m w-100 center"
              name="grant-application"
              onSubmit={handleSubmit}
            >
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">
                  Full Name
                  <b className="red f7"> *</b>
                </label>
              </div>
              <input
                type="text"
                id="grants-full-name"
                name="full-name"
                required
                placeholder="Enter your full name"
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
              />
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">
                  Email
                  <b className="red f7"> *</b>
                </label>
              </div>
              <input
                type="email"
                id="grants-email"
                name="email"
                required
                placeholder="Enter your email address"
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
              />
              <input
                type="submit"
                id="grants-application-button"
                name="submit"
                value="Get in touch"
                className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
              />
            </form>
          </div>
        </section>

        <Modal
          isOpen={isOpen}
          handleClose={handleClose}
          title="Form Submitted"
          copy="Thank you. We'll be in touch!"
        />
      </div>
    </Layout>
  );
};

export default Grants;
