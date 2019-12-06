import React, { useRef } from 'react';

import home1p1 from '../img/home-1.1.png';
import home1p2 from '../img/home-1.2.png';
import home3p1 from '../img/home-3.1.png';
import donate1 from '../img/donate-1.jpg';
import donateShapes from '../img/donatepage-shapes.svg';

import Layout from '../components/Layout';
import SEO from '../components/seo';
import Sponsorship from '../components/Sponsorship';
import Nav from '../components/Nav';

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

const Sponsor = () => {
  const donateNowRef = useRef(null);

  function onDonateNowClick() {
    donateNowRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  return (
    <Layout>
      <SEO title="Sponsor" />

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
            Sponsor Now
          </button>
        </div>
      </section>

      {/* <!-- Support Teams --> */}
      <section className="center tc">
        <div className="dt mt5 w-70-l w-80-m w-90 center">
          <div className="dn-ns">
            <img alt="" src={home1p2} className="absolute nt5" />
            <img alt="" src={home3p1} className="absolute" />
            <img alt="" src={home1p1} className="absolute nt5" />
            <img alt="" src={donate1} className="full-clip-up-sm relative z-1" />
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
            <img
              alt=""
              src={home1p2}
              className="absolute mt2 ml6-l w-auto-ns w-30-l db-l dn-m db"
            />
            <img alt="" src={donate1} className="full-clip-up-sm relative z-1" />
          </div>
          <img alt="" src={home3p1} className="absolute nl6 nt5-l nt0-m mt5 w-auto-ns w-10" />
          <img alt="" src={home1p1} className="absolute nl6 nt5-l nt0-m mt5 w-auto-ns w-10" />
        </div>
      </section>

      {/* <!-- Our Patrons --> */}
      <img alt="" src={donateShapes} className="absolute z-0 mt6 ml6-l" />
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

      {/* <!-- Donation Inputs --> */}
      <div className="relative">
        <section id="donate-section" className="bg-gray top-clip-up pv6 mt6 workaround-clip">
          <div ref={donateNowRef} className="w-50-l w-70-m w-90 center tc">
            <h2 className="f2-5 ma0 mv3 lh-copy">Become a Panvala Sponsor today</h2>
            <p className="ma0 f6 lh-text mb3">
              Let us know how much you're donating to the Ethereum ecosystem today. When it is time
              for your next donation, we'll send you a reminder email so you can come back and pay
              the next donation.
            </p>
            <Sponsorship />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Sponsor;
