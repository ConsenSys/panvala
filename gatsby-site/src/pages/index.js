import React from 'react';
import { graphql } from 'gatsby';

import home1 from '../img/home-1.jpg';
import home1p1 from '../img/home-1.1.png';
import home1p2 from '../img/home-1.2.png';
import home2 from '../img/home-2.jpg';
import home2p1 from '../img/home-2.1.png';
import home2p2 from '../img/home-2.2.png';
import home3 from '../img/home-3.jpg';
import home3p1 from '../img/home-3.1.png';
import home3p2 from '../img/home-3.2.png';
import home4 from '../img/home-4.jpg';
import home4p1 from '../img/home-4.1.png';
import home4p2 from '../img/home-4.2.png';

import sustFund1 from '../img/sustainable-funding-1.png';
import sustFund2 from '../img/sustainable-funding-2.png';
import donateShapes from '../img/donate-shapes.svg';

import extLevelK from '../img/external/level-k.png';
import extPlasmaGroup from '../img/external/plasma-group.png';
import extPrysmatic from '../img/external/prysmatic-labs.png';
import extConnext from '../img/external/connext.png';
import extConsensys from '../img/external/consensys.png';
import teamGnosis from '../img/external/team-gnosis.png';
import teamStatus from '../img/external/team-status.png';
import teamLevelK from '../img/external/team-levelk.png';
import teamSigma from '../img/external/team-sigma.png';
import teamTenderly from '../img/external/team-tenderly.png';
import simon from '../img/simon.png';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';

const IndexPage = ({ data }) => (
  <Layout>
    <SEO title="Home" />

    <section
      className="bg-gradient bottom-clip-hero-main relative z-0"
      style={{ height: '1000px' }}
    >
      <Nav />
      {/* <!-- Hero --> */}
      <div className="w-70-l w-80-m w-90 dt center pv5-ns pv4">
        <div className="dtc-l db v-mid w-50-l w-80-m w-90 pr4-ns">
          <h1 className="white f1-ns f2 b ma0 mb3">Ethereum can only be sustained by you.</h1>
          <p className="white-60 f4-ns f5 fw4 lh-copy ma0 mb4">
            Panvala is a<b className="white fw6"> decentralized foundation </b>
            that helps fund the work that the whole Ethereum community depends on.
          </p>
          <div className="">
            <div className="dib v-top mr3-ns mr2 mv2">
              <a href="#home-comparison">
                <button className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4">
                  Learn More
                </button>
              </a>
            </div>
            <div className="dib v-top mv2">
              <a href="https://forum.panvala.com" target="_blank">
                <button className="f6 link dim ba b--white br-pill white bg-transparent fw7 pointer pv3 ph4">
                  Visit the Forum
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="dtc-l dn w-50 v-mid mt0-ns mt4">
          <img src={home1p2} className="absolute db-ns dn o-30 w-30 nl4 mt5" />
          <img src={home1} className="full-clip-up-sm relative z-1" />
        </div>
        <img src={home1p1} className="absolute db-l dn z-2 nl6 mt4" />
      </div>
    </section>

    {/* <!-- Comparison Section --> */}
    <section
      id="home-comparison"
      className="bg-white w-70-l w-80-m w-90 center br4 shadow relative z-1 top-0-ns top-12 pa5-ns pa4"
      style={{ marginTop: '-550px' }}
    >
      <h2 className="f2-5 ma0 tc">Sustainable Funding</h2>
      <div className="dt mt5-ns mt4">
        <div className="dtc-ns db tc w-50-ns w-100 v-top pr4-ns pr0">
          <img src={sustFund1} className="center w-75-ns" />
          <h3 className="f4 ma0 mt5-ns mt3 mb2">The old way</h3>
          <p className="ma0 f6 lh-text">
            Raise money with an ICO, then spend it until one day, it all runs out. Oops!
          </p>
        </div>
        <div className="dtc-ns db tc w-50-ns w-100 v-top pl4-ns pl0 mt0-ns mt4">
          <img src={sustFund2} className="center w-75-ns" />
          <h3 className="f4 ma0 mt5-ns mt3 mb2">The new way</h3>
          <p className="ma0 f6 lh-text">
            Fund work with grants of pan, the token of Panvala. Since donations are made in pan as
            well, we all have an incentive to recruit more donors!
          </p>
        </div>
      </div>
    </section>

    {/* <!-- Donation CTA --> */}
    <div className="mv6-ns mv5 pv6-ns pv4 relative" style={{ top: '100px' }}>
      <img src={donateShapes} className="absolute z-0 nt5-l nt0-m mt4-m db-ns dn" />
      <section className="w-70-l w-80-m w-90 center tc relative z-1">
        <h2 className="f2-5 ma0 mb3 mt0-ns mt6 pt6-ns pt5">Donate to support Ethereum</h2>
        <p className="ma0 f6 lh-text w-50-ns w-100 center mb4">
          Join the network of individuals and businesses who do their part to support the Ethereum
          ecosystem.
        </p>
        <a href="donate">
          <button className="f6 link dim bn br-pill pv3 ph4 white bg-blue fw7 pointer">
            Donate
          </button>
        </a>
      </section>
    </div>

    {/* <!-- Our Launch Partners--> */}
    <section className="w-70-l w-80-m w-90 center tc mv6-ns mb5 mt6">
      <h2 className="f2-5 ma0 mb3-ns mb0">Our launch partners</h2>
      <div className="flex flex-wrap items-center justify-center tc center w-100">
        <img src={teamGnosis} className="w-20-l w-30 dib v-mid grayscale o-40 animate pa4" />
        <img src={teamStatus} className="w-20-l w-30 dib v-mid grayscale o-20 animate pa4" />
        <img src={teamLevelK} className="w-20-l w-30 dib v-mid grayscale o-50 animate pa4" />
        <img src={teamSigma} className="w-20-l w-30 dib v-mid grayscale o-20 animate pa4" />
        <img src={teamTenderly} className="w-20-l w-30 dib v-mid grayscale o-20 animate pa4" />
      </div>
    </section>

    {/* <!-- Why Contribute --> */}
    <section className="center tc">
      <h2 className="f2-5 ma0 w-70-l w-80-m w-90 center">Why contribute to Panvala</h2>
      <div className="dt mt6-ns mt5 w-70-l w-80-m w-90 center">
        <div className="dn-ns">
          <img src={home2p2} className="absolute z-2 ml5 mt5 pt4 w-75" />
          <img src={home2p1} className="absolute nt4" />
          <img src={home2} className="full-clip-up-sm relative z-1" />
        </div>
        <div className="dtc-ns db w-50-ns w-100 v-mid tl pr4-ns pr0 mt0-ns mt4">
          <h2 className="f2-5 ma0 mv3 lh-copy">The Ethereum community succeeds together</h2>
          <p className="ma0 f6 lh-text mb3">
            Countless projects and people depend upon the Ethereum blockchain for their success.
            Contributing to Panvala rewards the teams who solve problems like security and
            scalability.
          </p>
          <a href="grants" className="link dim blue f6 fw7">
            Learn about past issued grants
          </a>
        </div>
        <div className="dtc-ns dn w-50 v-mid">
          <img src={home2p2} className="absolute w-25-l w-40 z-2 nl4 mt6-l mt5 pt5-l pt5" />
          <img src={home2} className="full-clip-up-sm relative z-1" />
        </div>
        <img src={home2p1} className="absolute nl6 nt5-l nt0-m mt5 w-auto-ns w-10 db-ns dn" />
      </div>
      <div className="bg-gray pv6 full-clip-up mv6-ns mv4">
        <div className="dt w-70-l w-80-m w-90 center">
          <img src={home3p1} className="absolute w-auto-ns w-10-ns db nl5-ns mt6-ns" />
          <div className="dtc-ns w-50-ns v-mid">
            <img
              src={home3p2}
              className="absolute w-20-ns w-75 z-2 mt6-ns mt3 pt4-ns ml5-ns ml5 pl5-ns"
            />
            <img src={home3} className="full-clip-up-sm relative z-1" />
          </div>
          <div className="dtc-ns w-50-ns v-mid tl pl4-ns pl0 mt0-ns mt4">
            <h2 className="f2-5 ma0 mv3 lh-copy">Support the most important work</h2>
            <p className="ma0 f6 lh-text mb3">
              Panvala’s token holders vote on what work should be funded. They work hard to build
              donors’ confidence that their donations will benefit from crowd-sourced, incentivized
              wisdom.
            </p>
            <a
              href="https://medium.com/@Panvala/niran-babalola-making-progress-the-status-quo-1d92af12b352"
              target="_blank"
              className="link dim blue f6 fw7"
            >
              Learn about slate governance
            </a>
          </div>
        </div>
      </div>
      <div className="dt mt6-ns mt4 w-70-l w-80-m w-90 center">
        <div className="dn-ns">
          <img src={home4p2} className="absolute w-75 z-2 mt5 ml5" />
          <img src={home4p1} className="absolute ml2 nt4 w-75 left-0" />
          <img src={home4} className="full-clip-up-sm relative z-1" />
        </div>
        <div className="dtc-ns db w-50-ns w-100 v-mid tl pr4-ns pr0 mt0-ns mt4">
          <h2 className="f2-5 ma0 mv3 lh-copy">Respect among blockchain innovators</h2>
          <p className="ma0 f6 lh-text mb3">
            Panvala donors receive recognition everywhere the Panvala community gathers. In our
            community, it’s not the loudest voices that are respected—it’s the people and companies
            that contribute to Panvala.
          </p>
          <a href="donate" className="link dim blue f6 fw7">
            Learn about how to donate
          </a>
        </div>
        <img src={home4p1} className="absolute ml4 mt3 w-auto-l w-40 db-ns dn" />
        <div className="dtc-ns dn w-50 v-mid">
          <img src={home4p2} className="absolute w-20 z-2 mt6 pt5 nl4" />
          <img src={home4} className="full-clip-up-sm relative z-1" />
        </div>
      </div>
    </section>

    {/* <!-- Quote Section --> */}
    <section className="full-clip-down-blue pv6 mv6-ns mv5">
      <div className="dt w-70-l w-80-m w-90 center">
        <div className="dtc-ns db w-50-ns w-100 v-mid tl pr4-ns pr0">
          <h2 className="f2-5 ma0 mv3 lh-copy white">
            Our supporters care about the future of Ethereum
          </h2>
          <p className="ma0 f4 white-60 lh-text mb3">
            “I'm donating to Panvala because new socially driven organisations could be the key to
            avoiding a tragedy of the commons for maintaining public networks like Ethereum.”
          </p>
        </div>
        <div className="dtc-ns db w-50-ns w-100 v-btm tr-ns tl pb0-ns pb5 pt0-ns pt3">
          <img src={simon} className="relative br-top shadow bottom-clip-down w-90-ns w-100" />
          <h3 className="f4 ma0 mt5-ns mt0 mb2 white">Simon de la Rouviere</h3>
          <p className="ma0 f6 lh-text white-60">Token Engineering Pioneer</p>
        </div>
      </div>
    </section>

    <div className="relative">
      {/* <!-- Newsletter CTA --> */}
      <form className="w-70-l w-80-m w-90 center tc mv5 pv5" name="email-subscribe">
        <h2 className="f2-5 ma0 mb4">Don’t miss out on all the upcoming news</h2>
        <input
          type="email"
          name="email"
          id="email-subscribe-input"
          placeholder="Enter your email address"
          className="f5 dib input-reset border-input bb b--black-20 pa2 mr3 w-50 v-mid dib"
        />
        <input
          type="submit"
          name="submit"
          value="Sign Up"
          className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 dib v-mid"
          id="email-subscribe-button"
        />
      </form>

      {/* <!-- Modal --> */}
      <article
        className="vh-100 dn w-100 bg-black-80 absolute--fill absolute z-999"
        id="email-subscribe-modal"
      >
        <section className="w-30-l w-50-m w-90 pa5-l pa4 bg-white br3 center mt6-l mt5-m mt4 tc">
          <h2 className="f2-5 ma0 mb3 lh-copy">Form Submitted</h2>
          <p className="ma0 f6 lh-text mb4">Thank you. We'll be in touch!</p>
          <a href="">
            <button
              className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 pointer"
              id="email-subscribe-modal-close"
            >
              Continue
            </button>
          </a>
        </section>
      </article>
    </div>

    {/* <!-- Apply For Grant --> */}
    <section className="ml5-ns ml0 overflow-x-hidden w-80-ns w-100 z-1 relative">
      <section className="bg-gradient full-clip-up pv5-l pv6-m pv4">
        <div className="dt w-70-l w-80-m w-90 nl5 center pt5-ns pt6 pb0-ns pb6">
          <div className="dtc-l db mr5-l mr0 pt4-l v-top w-50-l">
            <h2 className="f2-5 ma0 mb4 white">
              Apply for
              <br />a grant
            </h2>
            <div className="mt5">
              <div className="dib mr5">
                <h3 className="f3 ma0 mb1 white">20 +</h3>
                <p className="white-60 ma0 f6">Projects Funded</p>
              </div>
              <div className="dib">
                <h3 className="f3 ma0 mb1 white">190</h3>
                <p className="white-60 ma0 f6">Donors</p>
              </div>
              <div className="mt5">
                <h3 className="f3 ma0 mb1 white">6 million</h3>
                <p className="white-60 ma0 f6">In Token Grants</p>
              </div>
            </div>
          </div>
          <div className="dtc-l db-m dn v-top absolute-l nt5-l w-40-l mt5-m">
            <div className="dt pv3">
              <img src={extLevelK} className="o-30 dib w-33 v-mid pr5" />
              <img src={extPlasmaGroup} className="o-30 dib w-33 v-mid" />
            </div>
            <div className="dt pv3">
              <img src={extPrysmatic} className="o-30 dib w-33 v-mid pr5" />
              <img src={extConnext} className="o-30 dib w-33 v-mid" />
            </div>
          </div>
        </div>
      </section>
    </section>

    {/* <!-- ConsenSys  --> */}
    <div className="dt w-80-ns w-100 center-ns mb5">
      <section className="w-40-ns w-90 dtc-ns relative center">
        <section className="bg-transparent ph5-ns ph0 pv6-ns pt5 pb3">
          <img src={extConsensys} className="w-60" />
          <p className="ma0 f6 lh-text mb3 mt4">
            ConsenSys is the home of the Panvala Launch Team. ConsenSys is a global blockchain
            technology company building the infrastructure, applications, and practices that enable
            a decentralized world.
          </p>
          <a href="https://consensys.net/" target="_blank" className="link dim blue f6 fw7">
            Learn about ConsenSys
          </a>
        </section>
      </section>

      {/* <!-- Donation CTA  --> */}
      <section className=" w-40-ns w-100 dtc-ns">
        <section className="bg-gray full-clip-up-sm ph5-ns ph5 pv6-ns pv5">
          <h2 className="f2-5 ma0 mb4 lh-copy">
            Become a donor today and support the projects that need the support
          </h2>
          <a href="donate">
            <button className="f6 link dim bn br-pill pv3 ph4 white bg-blue fw7 pointer">
              Donate
            </button>
          </a>
        </section>
      </section>
    </div>
  </Layout>
);

export default IndexPage;

export const query = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
