import React from 'react';

import logoTeal from '../img/logo-teal.png';
import Identicon from './Identicon';
import Box from './system/Box';
import TopBar from './TopBar';

export default function Nav({ account, balance, handleClick }) {
  return (
    <>
      <TopBar />
      {/* <!-- Navigation --> */}
      <nav className="dt-ns w-70-l w-80-m w-90 border-box center pv4">
        <a
          className="dtc-ns db w-25-ns w-90 tl-ns tc v-mid link center pb0-ns pb3"
          href="/"
          title="Home"
        >
          <img alt="" src={logoTeal} className="dib w-60-l w-100-m w-60" />
        </a>
        <div className="dtc-ns db v-mid tc center w-50-ns w-100">
          <a href="/grants" className="link dim white-60 f6 fw6 dib mr3">
            Grants
          </a>
          <a href="/team" className="link dim white-60 f6 fw6 dib mr3">
            Team
          </a>
          <a href="/resources" className="link dim white-60 f6 fw6 dib mr3">
            Resources
          </a>
          <a
            href="https://forum.panvala.com"
            target="_blank"
            rel="noopener noreferrer"
            className="link dim white-60 f6 fw6 dib mr3"
          >
            Forum
          </a>
          <a href="/donate" className="link dim white-60 f6 dn-ns dib fw6">
            Donate
          </a>
        </div>
        <div className="dtc-ns dn w-25 v-mid tr">
          {typeof window !== 'undefined' && window.location.href.includes('poll') ? (
            account ? (
              <Box display="flex" justifyContent="flex-end" py="2">
                <Box display="flex" flexDirection="column" justifyContent="center" mr="3">
                  <a
                    href={`https://etherscan.io/token/0xd56dac73a4d6766464b38ec6d91eb45ce7457c44?a=${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    <Box color="white" fontWeight="bold">
                      {balance} PAN
                    </Box>
                  </a>
                  <a
                    href={`https://etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    <Box color="#dadada">{account.slice(0, 8) + '...'}</Box>
                  </a>
                </Box>
                <Box display="flex" alignItems="center">
                  <a
                    href={`https://etherscan.io/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                  >
                    <Identicon address={account} diameter={28} />
                  </a>
                </Box>
              </Box>
            ) : (
              <button
                className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4"
                onClick={handleClick}
              >
                Connect
              </button>
            )
          ) : (
            typeof window !== 'undefined' &&
            !window.location.href.includes('donate') && (
              <a href="/donate">
                <button className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4">
                  Donate
                </button>
              </a>
            )
          )}
        </div>
      </nav>
    </>
  );
}
