import React from 'react';

import logoTeal from '../img/logo-teal.png';

export default function Nav() {
  return (
    <>
      {/* <!-- Navigation --> */}
      <nav className="dt-ns w-70-l w-80-m w-90 border-box center pv4">
        <a
          className="dtc-ns db w-25-ns w-90 tl-ns tc v-mid link center pb0-ns pb3"
          href="/"
          title="Home"
        >
          <img src={logoTeal} className="dib w-60-l w-100-m w-60" />
        </a>
        <div className="dtc-ns db v-mid tc center w-50-ns w-100">
          <a href="grants" className="link dim white-60 f6 fw6 dib mr3">
            Grants
          </a>
          <a href="team" className="link dim white-60 f6 fw6 dib mr3">
            Team
          </a>
          <a href="resources" className="link dim white-60 f6 fw6 dib mr3">
            Resources
          </a>
          <a
            href="https://forum.panvala.com"
            target="_blank"
            className="link dim white-60 f6 fw6 dib mr3"
          >
            Forum
          </a>
          <a href="donate" className="link dim white-60 f6 dn-ns dib fw6">
            Donate
          </a>
        </div>
        <div className="dtc-ns dn w-25 v-mid tr">
          <a href="donate">
            <button className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4">
              Donate
            </button>
          </a>
        </div>
      </nav>
    </>
  );
}
