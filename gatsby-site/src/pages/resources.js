import React from 'react';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';

import resourcesBlog1 from '../img/resources-blog-1.png';
import resourcesBlog2 from '../img/resources-blog-2.jpg';
import resourcesBlog3 from '../img/resources-blog-3.png';
import resources1 from '../img/resources-1.jpg';
import home1p1 from '../img/home-1.1.png';
import home4p1 from '../img/home-4.1.png';

const Resources = () => {
  return (
    <Layout>
      <SEO title="Resources" />

      <section className="bg-gradient bottom-clip-hero pb5">
        <Nav />
        {/* <!-- Hero --> */}
        <div className="w-70-l w-80-m w-90 center tc pv5">
          <h1 className="white f1-5 b ma0 mb4 w-80-l w-100 center">Resources</h1>
          <p className="white-60 f5 fw4 lh-copy ma0 mb5 w-50-l w-100 center">
            Have a lingering question or want to learn a bit more about Panvala? You’re in the right
            place.
          </p>
        </div>
      </section>

      {/* <!-- Whitepaper --> */}
      <section id="resources-whitepaper" className="center tc mv6-ns mv4">
        <div className="dt w-70-l w-80-m w-90 center">
          <div className="dtc-ns w-50-ns v-mid">
            <img src={home4p1} className="absolute w-30-ns w-75 nt5-ns nt3 nl4-ns nl5" />
            <img src={resources1} className="full-clip-up-sm relative z-1" />
            <img src={home1p1} className="absolute w-auto-ns w-10-ns db nr5-ns nt6 z-2" />
          </div>
          <div className="dtc-ns w-50-ns v-mid tl pl4-ns mt0-ns mt4">
            <h2 className="f2-5 ma0 mv3 lh-copy">Want to learn more about our vision?</h2>
            <p className="ma0 f6 lh-text mb3">
              Panvala runs on a new economic model — it's a donor-driven platform that runs on its
              own currency. That way, anyone in our community can have a stake in making more
              donations flow through the platform, not just the staff of a nonprofit organization.
              <br />
              <br />
              You don't need to understand the technical details of Panvala to be an effective
              patron, but we encourage you to read our whitepaper if you'd like to understand the
              system better.
            </p>
            <a href="../img/docs/Panvala Whitepaper (September 16).pdf" target="_blank" download>
              <button className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 mt4 pointer">
                Read the whitepaper
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* <!-- Blog --> */}
      <section id="resources-blog" className="center tc full-clip-down-gray pv6 mv6-ns mv4">
        <div className="dt w-70-l w-80-m w-90 center relative pv6 pv">
          <div className="dtc-ns w-40-ns v-top tl pr4-ns">
            <h2 className="f2-5 ma0 mb3 nt5 lh-copy">Read about our progress and thoughts</h2>
            <p className="ma0 f6 lh-text mb3">
              At Panvala we are committed to creating a platform that aids in the sustainability of
              funding for Ethereum projects. Here are some articles we wrote to better understand
              our progress and vision.
            </p>
            <a href="https://medium.com/@panvala" target="_blank" className="link dim blue f6 fw7">
              Visit our blog
            </a>
          </div>
          <div className="dtc-ns w-80-ns v-top absolute-ns nt6-ns mt0-ns mt5">
            <section className="dtc-ns pa3-ns pv3 w-33-ns w-100">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={resourcesBlog1} className="w-100 center h4" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Blockchain + Lean Startup: the Critical Formula</h4>
                    <p className="ma0 f7 lh-text mt3">
                      Lean Startup methods can radically reduce the number of failed blockchain
                      projects, while enabling teams to create value more quickly for their users.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://medium.com/@Panvala/blockchain-lean-startup-the-critical-formula-292dd1b8a90d"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      Read now
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="dtc-ns pa3-ns pv3 w-33-ns w-100">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={resourcesBlog2} className="w-100 center h4" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">RadicalxChange and Rent-Conscious Organizing</h4>
                    <p className="ma0 f7 lh-text mt3">
                      We can harness the economics behind the COST to achieve similar outcomes from
                      the bottom up.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://medium.com/@Panvala/radicalxchange-and-rent-conscious-organizing-3da3837e34c1"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      Read now
                    </a>
                  </div>
                </div>
              </div>
            </section>
            <section className="dtc-ns pa3-ns pv3 w-33-ns w-100">
              <div className="shadow-card br3 tl overflow-hidden">
                <div className="h4 w-100 tc v-mid dtc bg-white">
                  <img src={resourcesBlog3} className="w-100 center h4" />
                </div>
                <div className="pa4 flex flex-column justify-between h6 bg-white">
                  <div>
                    <h4 className="f6 fw7 ma0">Niran Babalola: Making Progress The Status Quo</h4>
                    <p className="ma0 f7 lh-text mt3">
                      Panvala’s founder gave a talk on Slate Governance for Effective Token Votes at
                      ETHDenver. Here’s some key takeaways.
                    </p>
                  </div>
                  <div>
                    <a
                      href="https://medium.com/@Panvala/niran-babalola-making-progress-the-status-quo-1d92af12b352"
                      target="_blank"
                      className="link dim blue f7 fw7"
                    >
                      Read now
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* <!-- FAQ's --> */}
      <section id="resources-faq" className="center tc">
        <div className="mv5 w-70-l w-80-m w-90 center">
          <h2 className="f2-5 ma0 mv3 lh-copy">Frequently Asked Questions</h2>
          <div className="dt mt4 tl">
            <div className="dtc-ns w-50-ns v-top pr3-ns">
              <ul className="ma0 f6 lh-text mb3">
                <li className="mb2 f5">What is Panvala and what problem does it solve?</li>
                <p className="ma0 f7 lh-text">
                  Panvala is a donor-driven platform that helps fund the work that the whole
                  Ethereum community depends on. Countless projects and people depend upon the
                  Ethereum blockchain for their success. Problems like security and scalability span
                  the entire ecosystem, but until Panvala there weren’t reliable business models to
                  solve these problems that will affect millions (and even billions) of people’s
                  lives.
                  <br />
                  <br />
                  Contributing donations to Panvala rewards the teams who solve those problems by
                  making grants available in a smart contract that we call the “token capacitor.”
                  The funds in that smart contract are issued to grant recipients each quarter based
                  on the votes of token holders. Structuring things in this way maximizes the value
                  of donations by leveraging crowd-sourced, incentivized wisdom.
                </p>
                <li className="mb2 f5 mt3">Why do people donate to Panvala?</li>
                <p className="ma0 f7 lh-text">
                  Our donors are a diverse group of individuals and businesses contributing funds
                  for a variety of purposes. Some of them donate because they believe that all of
                  Ethereum will either fail or succeed together, and they believe that their own
                  success in using Ethereum depends upon this development.
                  <br />
                  <br />
                  Other donors are attracted to the powerful status that comes with being a Panvala
                  donor, including the marketing and recruiting opportunities that it affords our
                  business sponsors. We offer in-app advertising solutions for sponsoring
                  businesses, and we organize our community to support these businesses with their
                  active loyalty.
                  <br />
                  <br />
                  Lastly, our donors choose Panvala as the best place to contribute their funds over
                  other avenues because they know that the broad crowd-sourced wisdom of the Panvala
                  community will ensure that their funds are going to the most important work.
                  Panvala brings a new layer of accountability and transparency to grants that just
                  isn’t possible in centralized institutions.
                  <br />
                  <br />
                  If you are interested in contributing, please go to
                  <a href="donate" className="blue dim link">
                    {' panvala.com/donate '}
                  </a>
                  or get in touch with us directly at
                  <a href="mailto:info@panvala.com" className="blue dim link">
                    {' info@panvala.com.'}
                  </a>
                </p>
                <li className="mb2 f5 mt3">
                  How does the Panvala platform work? What is slate governance?
                </li>
                <p className="ma0 f7 lh-text">
                  Slate governance is the basic structure of the Panvala platform. A slate is a list
                  of proposals that have been curated by an individual or a team on the platform.
                  The slate’s recommender curates this list, explains their reasoning and thinking
                  behind the recommendations, and organizes the broader Panvala community to support
                  the slate that they have recommended. A ballot occurs each quarter if there are
                  multiple competing slates available. Panvala’s token holders vote using their
                  tokens to decide which slate will be accepted. One slate is adopted per category,
                  per quarter. There are currently two different categories of slates planned for
                  our short-term roadmap:
                </p>
                <ul className="f7 lh-text">
                  <li>
                    Grant proposal slates used to determine which teams should receive funding in a
                    quarter
                  </li>
                  <li>Governance slates used to modify the parameters of how Panvala functions</li>
                </ul>
                <p className="ma0 f7 lh-text">
                  We believe the system will also grow over time and that new slate categories may
                  be added to the system.
                </p>
                <li className="mb2 f5 mt3">What is the PAN token used for?</li>
                <p className="ma0 f7 lh-text">
                  Slate recommenders do so for a number of reasons. Typically, a slate recommender
                  may propose a grant for their own work in evaluating proposals on the platform.
                  The slate recommender is incentivized not to make this amount too high, else they
                  risk their slate failing due to this unreasonable request.
                  <br />
                  <br />
                  Other incentives for slate recommenders also exist. Slate recommenders play a
                  critical role in crafting the future direction of Ethereum. They garner respect
                  and status for the important work that they do, and their work has a fulfilling
                  and lasting impact on the whole Ethereum ecosystem.
                </p>
                <li className="mb2 f5 mt3">
                  What happens to the tokens staked on slates that did not pass?
                </li>
                <p className="ma0 f7 lh-text">
                  Those tokens are automatically donated to the token capacitor and become available
                  to teams in the form of future grants.
                </p>
                <li className="mb2 f5 mt3">
                  Does voting with tokens mean that those tokens are spent or lost after the vote?
                </li>
                <p className="ma0 f7 lh-text">
                  No. All tokens used for voting can be withdrawn to the token holder’s wallet after
                  the ballot concludes. Users will receive a notification in the app’s notification
                  panel when their tokens are available to be withdrawn.
                </p>
                <li className="mb2 f5 mt3">What work has Panvala previously funded?</li>
                <p className="ma0 f7 lh-text">
                  So far, there have been two rounds of token grants resulting in 19 grants being
                  awarded. You can view the work and the specific recipients of the first and second
                  grant applications in our blog.
                </p>
              </ul>
            </div>
            <div className="dtc-ns w-50-ns v-top pl3-ns">
              <ul className="ma0 f6 lh-text mb3">
                <li className="mb2 f5">
                  Why does Panvala have its own PAN token? Why not just use ETH?
                </li>
                <p className="ma0 f7 lh-text">
                  Using property rights to organize cooperation makes it easy for people to do work
                  and get rewarded for it without needing anyone’s approval to do so. As a result,
                  people capable of improving property can identify themselves without needing to be
                  recognized by a central planner. We’re familiar with how these plays out with land
                  or intellectual property, and these same dynamics can be harnessed to organize the
                  provision of public goods.
                  <br />
                  <br />
                  A normal foundation hires donor development staff to increase the flow of
                  donations into the organization. Instead of having a handful of donor development
                  employees who get rewarded for increasing donations, Panvala can have thousands or
                  even millions of token holders who can be rewarded for increasing donations. The
                  more donations there are, the more demand there is for the tokens they hold, so
                  token holders have an incentive to tap their social networks to recruit more
                  donors to fund the work we all care about.
                  <br />
                  <br />
                  Since we can’t change the rules of ETH to work in this way (nor would we want to),
                  Panvala uses its own token.
                </p>
                <li className="mb2 f5 mt3">
                  What is the purpose of staking on the Panvala platform?
                </li>
                <p className="ma0 f7 lh-text">
                  Tokens are staked in order for a slate to appear on the platform’s ballot. This
                  prevents spam and poorly conceived recommendations that are unlikely to pass from
                  being added to the ballot, while raising the overall quality of proposals on the
                  platform.
                </p>
                <li className="mb2 f5 mt3">
                  What is possible in your current alpha? What functionality will be available at
                  launch?
                </li>
                <p className="ma0 f7 lh-text">
                  The current alpha build allows our testers to create grant proposals, add these
                  proposals to slates of recommendations, and participate in ranked choice voting
                  using test tokens to which grant proposals should be funded. Users also receive
                  in-app notifications based on their MetaMask wallet. Test tokens can also be
                  staked to add a slate to the ballot. Tokens can also be withdrawn successfully
                  after voting.
                  <br />
                  <br />
                  Among many other features, our mainnet launch will include a user journey for
                  purchasing and donating PAN tokens, it will include more advanced logic around
                  voting periods, improvements to the process of submitting a proposal and building
                  a slate, and give full control over the system to token holders by allowing the
                  creation of governance proposal slates, with full governance parameters.
                  <br />
                  <br />
                  We encourage people to follow and contribute to our
                  <a
                    href="https://github.com/ConsenSys/panvala"
                    target="_blank"
                    className="blue dim link"
                  >
                    {' GitHub repository '}
                  </a>
                  , as Panvala is completely open source.
                </p>
                <li className="mb2 f5 mt3">
                  Does slate governance also apply to the governance of the Panvala platform? What
                  kinds of parameters do token holders have the ability to influence?
                </li>
                <p className="ma0 f7 lh-text">
                  Yes it does. The parameters that operate the Panvala platform can be modified by
                  token holders. Here are three examples of parameters that might be adjusted by
                  token holders:
                </p>
                <ol className="f7 lh-text">
                  <li>
                    The number of tokens required to add a slate to the ballot might be increased if
                    token holders feel that there are too many low quality slates on the ballot.{' '}
                  </li>
                  <li>
                    Token holders might vote to extend the time periods associated with the system
                    if they feel that not enough time is being given to do diligence on grant
                    proposals appearing on the platform.
                  </li>
                  <li>
                    Token holders might vote to extend the time periods associated with the system
                    if they feel that not enough time is being given to do diligence on grant
                    proposals appearing on the platform.
                  </li>
                  The address of the gatekeeper contract could be modified if token holders want to
                  significantly change the way that the system functions
                </ol>
                <p className="ma0 f7 lh-text">
                  A full list of governance parameters will be available soon.
                </p>

                <li className="mb2 f5 mt3">Where can I see the Panvala app itself?</li>
                <p className="ma0 f7 lh-text">
                  The
                  <a
                    href="https://disputes.panvala.com/slates"
                    target="_blank"
                    className="blue dim link"
                  >
                    {' Panvala App '}
                  </a>
                  is currently available. Additionally, the app itself is
                  <a
                    href="https://github.com/ConsenSys/panvala"
                    target="_blank"
                    className="blue dim link"
                  >
                    {' open-sourced '}
                  </a>
                  on GitHub.
                </p>
                <li className="mb2 f5 mt3">Are donations to Panvala tax deductible?</li>
                <p className="ma0 f7 lh-text">
                  Not at this time, but we are interested in partnering with existing a 501(c)3 that
                  would be interested in making donations to Panvala a part of their charitable
                  work. If you are part of such a non-profit organization and would like to help
                  facilitate these donations, please get in touch with us at
                  <a href="mailto:info@panvala.com" className="blue dim link">
                    {' info@panvala.com '}
                  </a>
                  . If you need 501(c)3 status to make a donation, please let us know so that we can
                  explore the options with you.
                </p>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Resources;
