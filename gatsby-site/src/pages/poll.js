import React from 'react';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';

const categories = [
  {
    title: 'Ethereum 2.0',
    previous: 34,
    description:
      'These grants fund work that scales the base layer of the Ethereum network by implementing the Ethereum 2.0 roadmap. Past Panvala grant recipients in this category are Prysmatic Labs, Sigma Prime, Nimbus, and Whiteblock. Other teams in our community that do this kind of work are ChainSafe and Harmony.',
  },
  {
    title: 'Layer 2 Scaling',
    previous: 5,
    description:
      'These grants fund work that scale Ethereum without modifying the base layer. Past Panvala grant recipients in this category are Connext, Counterfactual, Plasma Group, and Prototypal. Other teams in our community that do this kind of work are LeapDAO, OmiseGo, and Raiden.',
  },
  {
    title: 'Security',
    previous: 16,
    description:
      'These grants fund work that make it easier to build and run Ethereum applications that perform their intended functions without bugs or security flaws. Past Panvala grant recipients in this category are Level K, ConsenSys Diligence, Runtime Verification, and Dapphub. Other teams in our community that do this kind of work are Zeppelin, Trail of Bits, and Quantstamp.',
  },
  {
    title: 'Developer Tools and Growth',
    previous: 4,
    description:
      'These grants fund work that increase the productivity of Ethereum developers, and make it easier for new developers to get started so we can reach One Million Developers in 2020. Past Panvala grant recipients in this category are ethers.js, Asseth, and Tenderly. Other teams in our community that do this kind of work are Truffle, Embark, and Cryptoeconomics.study.',
  },
  {
    title: 'Dapps and Usability',
    previous: 4,
    description:
      'These grants fund work that produces Ethereum-based applications, games, and user experience improvements that bring more users to Ethereum. Past Panvala grant recipients in this category are BrightID, Gnosis, and Bounties Network. Other teams in our community that do this kind of work are MetaCartel DAO, Axie Infinity, Burner Wallet and Universal Login.',
  },
  {
    title: 'Panvala',
    previous: 37,
    description:
      'These grants fund work that improves Panvala itself and produces recommendations for the network to evaluate. Past Panvala grant recipients in this category are ConsenSys PAN and The Astrotrope.',
  },
];

const Poll = () => {
  return (
    <Layout>
      <SEO title="Poll" />

      <section className="bg-gradient bottom-clip-hero pb5">
        <Nav />
        {/* <!-- Instructions --> */}
        <div className="cf pv5 ph6 tc">
          <div className="fl w-100 w-50-ns pl5 pr2 tl">
            <h1 className="white f1-5 b ma0 mb4 w-80-l w-100">The Panvala Poll</h1>
            <div className="f5 lh-copy mb3">
              <p className="w-60 mb0 white b">
                We're polling PAN holders on their funding priorities in the Ethereum ecosystem.
              </p>
              <p className="white-60 fw4 ma0 w-50-l w-100">
                The results of the poll will shape Panvala's next quarterly budget of 2,000,000 PAN,
                which will be released on January 31.
              </p>
            </div>
            <div className="mv3 b">
              <a href="#poll-form">
                <button className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4">
                  View Poll
                </button>
              </a>
            </div>
          </div>

          <div className="fl w-100 w-50-ns pa2"></div>
        </div>
      </section>

      {/* Fund work that matters */}
      <section className="cf w-100 ph6 pt3 bottom-clip-down bg-white">
        <div className="fl w-100 w-50-ns pa2 pl6"></div>
        <div className="fl w-100 w-50-ns pa2 pr6">
          <h2>Fund work that matters</h2>
          <p>
            PAN tokens have been granted to teams that the whole Ethereum community depends on. The
            more tokens you acquire to vote, the more work those teams can fund with their tokens.
          </p>
          <div className="pv3 b">Connect your wallet</div>
        </div>
      </section>

      {/* Ballot */}
      <section id="poll-form" className="pv6 mb4 bg-gray full-clip-down-lg">
        <div className="w-100 w-60-ns center">
          <div className="tc pv4">
            <h2>Category Ballot</h2>
            <p className="w-40 center tc lh-copy">
              Please distribute 100 percentage points between the following categories:
            </p>
          </div>
          <div className="bg-white shadow lh-copy black">
            <form>
              {categories.map(category => {
                const { description, title, previous } = category;

                return (
                  <div className="cf pa3 bb bw-2 b--black-10">
                    <div className="fl w-80 pa2 pr4">
                      <div className="f4 b">{title}</div>
                      <p>{description}</p>
                    </div>
                    <div className="fl w-20 pa2 f5 tr">
                      <div className="b ttu f6 o-50">previous batch</div>
                      <div className="pb3 b">{previous}%</div>
                      {/* <div className="b ttu f6 o-50">Batch five</div>
                    <div>percent</div> */}
                    </div>
                  </div>
                );
              })}
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Poll;
