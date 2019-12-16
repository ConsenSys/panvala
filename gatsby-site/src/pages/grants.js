import React, { useRef, useState, useContext } from 'react';
import { Formik } from 'formik';
import * as yup from 'yup';

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
import teamPegasys from '../img/grant-teams/pegasys.png';
import teamWhiteblock from '../img/grant-teams/whiteblock.png';
import teamDiligence from '../img/grant-teams/diligence.png';
import teamLoreum from '../img/grant-teams/loreum.png';
import teamGraham from '../img/grant-teams/graham.png';
import teamBlockRocket from '../img/grant-teams/blockrocket.png';
import teamAstrotrope from '../img/grant-teams/astrotrope.png';
import teamAsseth from '../img/grant-teams/asseth.png';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';
import Modal from '../components/Modal';
import { BudgetContext } from '../components/BudgetProvider';
import BudgetBar from '../components/BudgetBar';
import FieldText from '../components/FieldText';

const Grants = () => {
  const { budgets } = useContext(BudgetContext);
  const applyRef = useRef(null);
  const [isOpen, setModalOpen] = useState(false);

  function onApplyClick() {
    applyRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  function handleSubmit(values, actions) {
    // console.log('submit', values);
    setModalOpen(true);

    actions.setSubmitting(false);
    actions.resetForm();
  }

  function handleClose(e) {
    e.preventDefault();
    setModalOpen(false);
  }

  const GrantFormSchema = yup.object({
    fullName: yup
      .string()
      .trim()
      .required('Please enter your name'),
    email: yup
      .string()
      .email()
      .required('Please enter your email'),
  });

  return (
    <Layout>
      <SEO title="Grants" />

      <section className="bg-gradient bottom-clip-hero pb6">
        <Nav />

        {/* <!-- Hero --> */}
        <div className="w-70-l w-80-m w-90 center tc pv5">
          <h1 className="white f1-5 b ma0 mb3 w-50-l w-100 center">Make Ethereum sustainable.</h1>
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

      {!!budgets.epochNumber && (
        <BudgetBar
          budgetText={`Batch ${budgets.epochNumber + 1} grants budget:`}
          panValue={budgets.epochPAN}
          usdValue={budgets.epochUSD}
        />
      )}

      {/* <!-- Batch 5 --> */}
      {/* <div className="mv5 relative">
        <img alt="" src={grantsShapes} className="absolute z-0 nt6-l nt0-m mt4-m db-ns dn" />
        <section className="w-70-l w-80-m w-90 center tc relative z-1 pt5">
          <h2 className="f2-5 ma0 mb3">
            Batch Five
            <br />
            January 31, 2020
          </h2>
          <p className="ma0 f6 lh-text w-50 center mb4">
            We are in the process of receiving grant applications for Batch 5 of Panvala Token Grants. Using the Disputes application, the entire Ethereum community can vote on which projects should receive a PAN token grant.
          </p>
        </section>
      </div> */}

      {/* <!-- Batch 4 --> */}
      <section className="w-70-l w-80-m w-90 center tc mv6">
        <h2 className="f2-5 ma0 mb3">
          Batch Four
          <br />
          November 1, 2019
        </h2>
        <p className="ma0 f6 lh-text w-50 center mb4">
          In Batch 4 of Panvala Token Grants, 9 teams were awarded a total of 1,910,663 PAN for the
          work they do to move Ethereum forward.
        </p>
        {/* <!-- List of Grants --> */}
        <section className="flex flex-wrap">
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="bg-gray h4 w-100 tc v-mid dtc">
                <img src={teamPegasys} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Artemis Phase 0 Grants</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to complete the development of the Phase 0 beacon chain client.
                  </p>
                </div>
                <div>
                  <a href="https://pegasys.tech/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="bg-gray h4 w-100 tc v-mid dtc">
                <img src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Panvala Staking</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to allow Panvala to issue enforceable certifications, and to delegate
                    responsibilities to community members whose stake can be slashed if they don’t
                    meet their commitments.
                  </p>
                </div>
                <div>
                  <a href="https://panvala.com/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamWhiteblock} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">LibP2P Testing 0</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to focus the development team’s effort towards benchmarking LibP2P’s
                    implementation of gossipsub.
                  </p>
                </div>
                <div>
                  <a href="https://whiteblock.io/" target="_blank" className="link dim blue f7 fw7">
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
                  <h4 className="f6 fw7 ma0">Panvala Marketing</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to sponsor local Ethereum meetups and represent Panvala abroad to
                    support the community while spreading the word about Panvala.
                  </p>
                </div>
                <div>
                  <a href="https://panvala.com/" target="_blank" className="link dim blue f7 fw7">
                    View website
                  </a>
                </div>
              </div>
            </div>
          </section>
          <section className="w-33-l w-50-m w-100 pa3">
            <div className="shadow-card br3 tl overflow-hidden">
              <div className="h4 w-100 tc v-mid dtc bg-white">
                <img src={teamDiligence} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Vyper Security Audit</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by completing Vyper audit which is necessary
                    to ensure that contracts behave as expected
                  </p>
                </div>
                <div>
                  <a
                    href="https://diligence.consensys.net/"
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
                <img src={teamGnosis} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Conditional Token Framework Security Audit</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to allow developers to easily combine token transfers with any number
                    of conditions.
                  </p>
                </div>
                <div>
                  <a
                    href="https://gnosis-mercury.readthedocs.io/en/latest/"
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
                <img src={teamLoreum} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">
                    Enterprise State Channel Application Programming Environment (ESCAPE)
                  </h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to work on a platform that simplifies the design of state channels,
                    aids with deployment and management of the infrastructure components, allows the
                    end user administration and device provisioning to facilitate off-chain
                    interactions securely in the state channel context.
                  </p>
                </div>
                <div>
                  <a
                    href="https://github.com/loreum/ESCAPE"
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
                <img src={teamGraham} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Ethereum Plugins for No-Code Development Platforms</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">75,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to develop plugins that will let anyone build Ethereum Apps without
                    needing to know how to code.
                  </p>
                </div>
                <div>
                  <a
                    href="https://medium.com/@McBain/build-a-no-code-ethereum-app-in-under-2-minutes-e1834d131685"
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
                <img src={teamBlockRocket} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">
                    Interest-Funded Transaction Relayer (PleaseRelayMe)
                  </h4>
                  <h5 className="f7 fw7 blue ma0 mt3">75,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    PleaseRelayMe is a free to use transaction relayer that harnesses the Gas
                    Station Network. It creates a non-profit, self funding transaction relayer which
                    can be used by all with a fair usage policy.
                  </p>
                </div>
                <div>
                  <a
                    href="https://www.blockrocket.tech/"
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
                <img src={teamAstrotrope} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Batch Four Recommendations</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">60,663 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by recommending token grant applications.
                  </p>
                </div>
                <div>
                  <a
                    href="https://twitter.com/Astrotrope"
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
                <img alt="" src={teamGitcoin} className="w-75 center" />
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
                  <a
                    href="https://gitcoin.co/"
                    target="_blank"
                    rel="noopener noreferrer"
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
              <div className="bg-gray h4 w-100 tc v-mid dtc">
                <img alt="" src={teamPlasmaGroup} className="w-100 center" />
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
                  <a
                    href="https://plasma.group/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamNimbus} className="w-100 center" />
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
                    rel="noopener noreferrer"
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
                <img alt="" src={teamRuntime} className="w-100 center" />
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
                    rel="noopener noreferrer"
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
                <img alt="" src={teamTenderly} className="w-100 center" />
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
                  <a
                    href="https://tenderly.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamBrightId} className="w-100 center" />
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
                    rel="noopener noreferrer"
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
                <img alt="" src={teamUpala} className="w-100 center" />
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
                    rel="noopener noreferrer"
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
                <img alt="" src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Batch 3 Grant Recommendations</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">43,899 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by recommending token grant applications.
                  </p>
                </div>
                <div>
                  <a
                    href="https://medium.com/@Panvala"
                    target="_blank"
                    rel="noopener noreferrer"
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
                  <img alt="" src={teamSigma} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Lighthouse Ethereum 2.0 Single-Client Testnet</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">400,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by implementing the Ethereum 2.0
                      specification.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://sigmaprime.io/"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamPrysmatic} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Prysm Ethereum 2.0 Single-Client Testnet</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">400,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by implementing the Ethereum 2.0
                      specification.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://prysmaticlabs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamPrototypal} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Counterfactual Metamask Integration</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">350,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by promoting the adoption of generalized
                      state channels.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://l4.ventures/"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamConnext} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Generalized State Channels For Connext</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by generalizing payment channels to handle
                      arbitrary state.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://connext.network/"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamEthers} className="w-100 center" />
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
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamL4} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Counterfactual Developer Experience</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by integrating generalized state channel
                      support directly into wallets.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://www.counterfactual.com/"
                      target="_blank"
                      rel="noopener noreferrer"
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
                  <img alt="" src={teamPanvala} className="w-100 center" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Batch 2 Grant Recommendations</h4>
                    <h5 className="f7 fw7 blue ma0 mt3">84,798 PAN</h5>
                    <p className="ma0 f7 lh-text mt3">
                      A proposal to make Ethereum safer by recommending token grant applications.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://medium.com/@Panvala/seven-grants-awarded-for-ethereum-2-0-and-scaling-teams-in-panvalas-second-batch-626f74f0a3bb"
                      target="_blank"
                      rel="noopener noreferrer"
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
                <img alt="" src={teamGnosis} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Gnosis Safe Recovery</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">375,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by helping users to recover access to their
                    Gnosis Safe even in case access to all their devices was lost.
                  </p>
                </div>
                <div>
                  <a
                    href="https://gnosis.io/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamAragon} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Voting Relay Protocol</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">300,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by building a common implementation of
                    scalable token voting for the community to build ontop of.
                  </p>
                </div>
                <div>
                  <a
                    href="https://aragon.one/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamBounties} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">What Would You Bounty?</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">240,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by creating bounties for work suggested by the
                    community.
                  </p>
                </div>
                <div>
                  <a
                    href="https://bounties.network/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamStatus} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Infrastructure Monitoring</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">200,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by monitoring high value systems and assets on
                    Ethereum.
                  </p>
                </div>
                <div>
                  <a
                    href="https://status.im/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamLevelK} className="w-100 center" />
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
                  <a
                    href="https://www.levelk.io/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamMaker} className="w-100 center" />
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
                  <a
                    href="https://dapphub.com"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamLevelK} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Registry Builder Vote Weighting</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">175,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by improving a reusable library for
                    token-curated registries.
                  </p>
                </div>
                <div>
                  <a
                    href="https://www.levelk.io/"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamMaker} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">KLab Explorer</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">175,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by helping developers explore the formal
                    proofs for their contract systems.
                  </p>
                </div>
                <div>
                  <a
                    href="https://dapphub.com"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamHash} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Hashing It Out Security Series</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">100,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by producing podcast episodes about Ethereum
                    security.
                  </p>
                </div>
                <div>
                  <a
                    href="https://twitter.com/hashingitoutpod?lang=en"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Batch One Grant Recommendations</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">75,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by recommending token grant applications.
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
                <img src={teamPanvala} className="w-100 center" />
              </div>
              <div className="pa4 flex flex-column justify-between h6 bg-white">
                <div>
                  <h4 className="f6 fw7 ma0">Panvala Mark Recommendation</h4>
                  <h5 className="f7 fw7 blue ma0 mt3">75,000 PAN</h5>
                  <p className="ma0 f7 lh-text mt3">
                    A proposal to make Ethereum safer by recommending Panvala Mark applications
                  </p>
                </div>
                <div>
                  <a
                    href="https://medium.com/@Panvala/twelve-grants-awarded-in-batch-one-of-panvala-token-grants-59b8df7422fe"
                    target="_blank"
                    rel="noopener noreferrer"
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
                <img alt="" src={teamAsseth} className="w-100 center" />
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
                    rel="noopener noreferrer"
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
            <Formik
              initialValues={{ fullName: '', email: '' }}
              onSubmit={handleSubmit}
              validationSchema={GrantFormSchema}
            >
              {props => (
                <form
                  className="w-70-l w-90-m w-100 center"
                  name="grant-application"
                  onSubmit={props.handleSubmit}
                >
                  <FieldText
                    type="text"
                    id="grants-full-name"
                    name="fullName"
                    label="Full Name"
                    required
                    placeholder="Enter your full name"
                    value={props.values.fullName}
                    onChange={props.handleChange}
                  />

                  <FieldText
                    type="email"
                    id="grants-email"
                    name="email"
                    label="Email"
                    required
                    placeholder="Enter your email address"
                    value={props.values.email}
                    onChange={props.handleChange}
                  />

                  <input
                    type="submit"
                    id="grants-application-button"
                    name="submit"
                    value="Get in touch"
                    className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4"
                    disabled={props.isSubmitting}
                  />
                </form>
              )}
            </Formik>
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
