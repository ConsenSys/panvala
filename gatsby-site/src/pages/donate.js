import React, { useState, useRef, useEffect } from 'react';

import home1p1 from '../img/home-1.1.png';
import home1p2 from '../img/home-1.2.png';
import home3p1 from '../img/home-3.1.png';
import donate1 from '../img/donate-1.jpg';
import donateShapes from '../img/donatepage-shapes.svg';
import patronTiers from '../img/patron-tiers.png';
import advisorTiers from '../img/advisor-tiers.png';
import arrowSvg from '../img/arrow.svg';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Donation from '../components/Donation';
import Nav from '../components/Nav';
import { fetchEthPrice } from '../utils/donate';

const names = [
  'Simon de la Rouviere',
  'Joseph Chow',
  'Liraz Siri',
  'Darius Przydzial',
  'Jesse Grushack',
  'Ryan Gittleson',
  'Andy Morales',
  'John Packel',
  'Andrew Keys',
  'Momo Araki',
  'Christian Lundkvist',
  'William Warren',
  'Nathan Chen',
  'Charles Crain',
  'Petr Ko',
  'Justin Maier',
  'Christopher Brown',
  'Oscar Presidente',
  'Cristian Espinoza',
  'Chris Smith',
  'Rakhee Singh',
  'Thomas Spofford',
  'Marcus Hearne',
  'Bach Adylbekov',
  'Daniel Bar',
  'Sean Coughlin',
  'Artem Payvin',
  'Carolyn Reckhow',
  'Hal Feewet',
  'David Hoffman',
  'Scott Trowbridge',
  'Guillermo Salazar',
  'Suyi Kim',
  'Christian Lewis',
  'Christopher Igbojekwe',
  'Roman Pavlovskyi',
  'Yutaro Mori',
  'Robert Lee Mudgett',
  'Everton Fraga',
  'Alex Napheys',
  'Yele Bademosi',
  'Teck Chia',
  'Chris Storaker',
  'Camila Russo',
  'Christopher Eley',
  'Sky Minert',
  'Justin Leroux',
  'Daniela Osorio',
  'Vinay Gupta',
  'Barry Gitarts',
  'Batuhan Dasgin',
  'Derrick Duncan',
  'Kristoffer Josefsson',
  'Vivek Singh',
  'Alice Henshaw',
  'Masanori Uno',
  'Megan Cress',
  'Daniel Kochis',
  'Sergej Kunz',
  'Mahmoud Salem',
  'Sneb Koul',
  'Madhur Kumar Sharma',
  'Will Price',
  'Nemil Dalal',
  'Andrew Gold',
  'Daniel Que',
  'Veronica Zheng',
  'Abraham Sanchez',
  'Harold Hyatt',
  'Elisha Koh',
  'Matt Lockyer',
  'Siddharth Verma',
  'Libby Kent',
  'Gonçalo Sá',
  'Jacob Cantele',
  'Keith Tom',
  'Alexander Fischer',
  'Abel Tedros',
  'Juan Blanco',
  'Olumide Akinwande',
  'Virag Mody',
  'Thessy Mehrain',
  'William Gleim',
  'Shawn Harmsen',
  'Sander Lacerda',
  'Dhruvang Patel',
  'Jonathan Pitchfork',
  'Rachid Moulakhnif',
  'Tas Dienes',
  'Kevin Spiers',
  'Bass Bauman',
  'Mason Fischer',
  'Russell Verbeeten',
  'Muhammad Zaheer',
];

const Donate = () => {
  const donateNowRef = useRef(null);
  const [eps, setEthPrices] = useState({});

  function onDonateNowClick() {
    donateNowRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  useEffect(() => {
    function trimPrice(tier, price) {
      return (tier / price).toString().slice(0, 5);
    }

    fetchEthPrice()
      .then(ethPrice => {
        const price = parseInt(ethPrice);
        const prices = {
          stud: trimPrice(5, price),
          gold: trimPrice(15, price),
          plat: trimPrice(50, price),
          diam: trimPrice(150, price),
          ethe: trimPrice(500, price),
          elit: trimPrice(1500, price),
        };
        setEthPrices(prices);
      })
      .catch(error => {
        console.error(`ERROR fetching eth price: ${error.message}`);
        alert('Failed to fetch current ether price. Please reload your browser in a few moments.');
      });
  }, []);

  return (
    <Layout>
      <SEO title="Donate" />

      <section className="bg-gradient bottom-clip-hero pb6">
        <Nav />

        {/* <!-- Hero --> */}
        <div className="w-70-l w-80-m w-90 center tc pv5">
          <h1 className="white f1-5 b ma0 mb4 w-80-l w-100 center">
            Help fund the work that the Ethereum community depends on.
          </h1>
          <p className="white-60 f5 fw4 lh-copy ma0 mb4 w-50-l w-100 center">
            Countless projects and people depend upon the Ethereum blockchain for their success.
            Contributing to Panvala rewards the teams who solve those problems.
          </p>
          <button
            className="f6 link dim bn br-pill pv3 ph4 white bg-teal fw7 pointer"
            id="donate-now-route-button"
            onClick={onDonateNowClick}
          >
            Donate Now
          </button>
        </div>
      </section>

      {/* <!-- Support Teams --> */}
      <section className="center tc">
        <div className="dt mt5 w-70-l w-80-m w-90 center">
          <div className="dn-ns">
            <img src={home1p2} className="absolute nt5" />
            <img src={home3p1} className="absolute" />
            <img src={home1p1} className="absolute nt5" />
            <img src={donate1} className="full-clip-up-sm relative z-1" />
          </div>
          <div className="dtc-ns w-50-ns v-mid tl-ns tc pr4-ns mt0-ns mt4">
            <h2 className="f2-5 ma0 mv3 lh-copy">
              Supporting teams that scale and make Ethereum safer
            </h2>
            <p className="ma0 f6 lh-text mb3">
              The Sigma Prime and Prysmatic Labs teams received a Panvala grant for their work on
              implementing the Ethereum 2.0 specification. Their work is indispensable for making
              Ethereum scale to serve its role as the hub of the decentralized world.
            </p>
            <a href="/grants" className="link dim blue f6 fw7">
              Learn more about past work Panvala has funded
            </a>
          </div>
          <div className="dtc-ns dn w-50 v-mid">
            <img src={home1p2} className="absolute mt2 ml6-l w-auto-ns w-30-l db-l dn-m db" />
            <img src={donate1} className="full-clip-up-sm relative z-1" />
          </div>
          <img src={home3p1} className="absolute nl6 nt5-l nt0-m mt5 w-auto-ns w-10" />
          <img src={home1p1} className="absolute nl6 nt5-l nt0-m mt5 w-auto-ns w-10" />
        </div>
      </section>

      {/* <!-- Our Patrons --> */}
      <img src={donateShapes} className="absolute z-0 mt6 ml6-l" />
      <section className="bg-white w-70-l w-80-m w-90 center tc br4 pa5 shadow mt6 db-ns dn relative z-1">
        <h2 className="f2-5 ma0 tc w-50-l center">Our Founding Patrons support Ethereum</h2>
        <div className="flex flex-wrap center mt4">
          {names.map(name => (
            <p className="ma0 f7 lh-text w-25-l w-50" key={name}>
              {name}
            </p>
          ))}
        </div>
      </section>

      {/* <!-- Donation Metrics --> */}
      <section className="center overflow-x-hidden w-90 mt5">
        <section className="bg-gradient full-clip-up w-100 center pv6-ns pv4">
          <div className="center w-70-l w-80-m w-100 tc nt4-ns">
            <div className="dib-ns mr6-ns pr5-ns pb0-ns pb4 relative top-2 tl-ns">
              <h3 className="f2-5 ma0 mb1 white">20 +</h3>
              <p className="white-60 ma0 f6">Projects Funded</p>
            </div>
            <div className="dib-ns mr6-ns pr5-ns pv0-ns pv4 relative top-1 tl-ns">
              <h3 className="f2-5 ma0 mb1 white">190</h3>
              <p className="white-60 ma0 f6">Donors</p>
            </div>
            <div className="dib-ns pv0-ns pv4 tl-ns">
              <h3 className="f2-5 ma0 mb1 white">6 million</h3>
              <p className="white-60 ma0 f6">In Token Grants</p>
            </div>
          </div>
        </section>
      </section>

      {/* <!-- Patron Tiers --> */}
      <section className="center tc">
        <div className="dt mt6-ns mt5 w-70-l w-80-m w-90 center">
          <div className="dn-ns db">
            <img src={patronTiers} />
          </div>
          <div className="dtc-ns w-50-ns v-mid tl pr4-ns mt0-ns mt3">
            <h2 className="f2-5 ma0 mv3 lh-copy">Patron Tiers</h2>
            <p className="ma0 f6 lh-text mb3">
              Becoming a Panvala Patron helps sustain the work the Ethereum ecosystem depends on.
              When you become a patron, your name will be added to the growing list of patrons on
              Panvala.com. Everyone who does their part to fulfill the Ethereum
              vision should be recognized for it.
            </p>
          </div>
          <div className="dtc-ns dn w-50 v-mid tr">
            <img src={patronTiers} className="w-70-l" />
          </div>
        </div>
        <div className="dt mt6 w-70-l w-80-m w-90 center">
          <div className="dtc-ns w-50-ns v-mid tl-ns">
            <img src={advisorTiers} className="w-70-l" />
          </div>
          <div className="dtc-ns w-50-ns v-mid tl pl4-ns mt0-ns mt3">
            <h2 className="f2-5 ma0 mv3 lh-copy">Advisor Patrons</h2>
            <p className="ma0 f6 lh-text mb3">
              Looking to give a bit more? Advisor Patrons make large contributions and gain more
              respect within the Panvala community. Grant reviewers reach out to Advisor Patrons to
              give them a direct way to make their voice heard.
            </p>
          </div>
        </div>
      </section>

      {/* <!-- Donation Inputs --> */}
      <div className="relative">
        <section id="donate-section" className="bg-gray top-clip-up pv6 mt6 workaround-clip">
          <div ref={donateNowRef} className="w-50-l w-70-m w-90 center tc">
            <h2 className="f2-5 ma0 mv3 lh-copy">Become a Panvala Patron today</h2>
            <p className="ma0 f6 lh-text mb3">
              Choose your patron tier to prepay for this month using ETH. When it's time to renew
              your pledge, we'll send you a reminder email so you can come back and prepay your next
              donation.
            </p>
            <form className="w-80-l w-90-m w-100 center" name="donation-pledge">
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">
                  First Name
                  <b className="red f7"> *</b>
                </label>
              </div>
              <input
                type="text"
                name="first-name"
                id="pledge-first-name"
                required
                placeholder="Enter your first name"
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
              />
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">Last Name</label>
              </div>
              <input
                type="text"
                name="last-name"
                id="pledge-last-name"
                required
                placeholder="Enter your last name"
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
                name="email"
                id="pledge-email"
                required
                placeholder="Enter your email address"
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2"
              />
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">
                  Pledge Tier
                  <b className="red f7"> *</b>
                </label>
              </div>
              <select
                name="pledge-tier-selection"
                required
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2 bg-white black-50"
                id="pledge-tier-select"
              >
                <option disabled="" defaultValue="0" value="0">
                  Select your pledge tier
                </option>
                <option value="5">{`Student — $5/month (${eps.stud} ETH)`}</option>
                <option value="15">{`Gold — $15/month (${eps.gold} ETH)`}</option>
                <option value="50">{`Platinum — $50/month (${eps.plat} ETH)`}</option>
                <option value="150">{`Diamond — $150/month (${eps.diam} ETH)`}</option>
                <option value="500">{`Ether Advisor — $500/month (${eps.ethe} ETH)`}</option>
                <option value="1500">{`Elite Advisor — $1500/month (${eps.elit} ETH)`}</option>
              </select>
              <img src={arrowSvg} className="fr mr2 o-50" style={{ marginTop: '-35px' }} />
              <div className="tl mt4">
                <label className="ma0 f6 mb3 black-40">
                  How many months of your pledge will you prepay today?
                  <b className="red f7"> *</b>
                </label>
              </div>
              <select
                name="pledge-duration-selection"
                required
                className="f6 input-reset b--black-10 pv3 ph2 db center w-100 br3 mt2 bg-white black-50"
                id="pledge-duration-select"
              >
                <option disabled="" defaultValue="0" value="0">
                  Select the amount of months you would like to prepay for
                </option>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </select>
              <img src={arrowSvg} className="fr mr2 o-50" style={{ marginTop: '-35px' }} />

              <Donation />
            </form>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Donate;
