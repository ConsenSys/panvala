import React from 'react';

import logoWhite from '../img/logo-white.png';
import logoTwitter from '../img/twitter.png';
import logoTelegram from '../img/telegram.png';
import logoGithub from '../img/github.png';

export default () => (
  <>
    <section className="bg-gradient">
      <nav className="dt w-70-l w-80-m w-90 border-box pv4 center dt h-100">
        <div className="dtc-ns db flex-ns flex-column-ns justify-between-ns h-100-ns w-100-l w-100-m">
          <div className="w-100">
            <a className="dtc-ns db v-mid link w-100-ns w-60 pb0-ns pb2" href="/" title="Home">
              <img src={logoWhite} className="dib w-60" />
            </a>
            <div className="dt mv3">
              <a href="https://twitter.com/panvalahq" target="_blank" className="link dim dtc pr4">
                <img src={logoTwitter} className="w2" />
              </a>
              <a href="https://t.me/panvala" target="_blank" className="link dim dtc pr4">
                <img src={logoTelegram} className="w2" />
              </a>
              <a
                href="https://github.com/ConsenSys/panvala"
                target="_blank"
                className="link dim dtc"
              >
                <img src={logoGithub} className="w2" />
              </a>
            </div>
          </div>
          <a href="http://app.panvala.com/slates" target="_blank" className="link dim white f6 fw7">
            Try the Panvala App today
          </a>
        </div>
        <div className="dtc-ns db w-70-l w-70-m w-100 v-top tr-ns tl">
          <div className="dib v-top mr5-l mr3-m mr4 pr2 tl mt0-ns mt4">
            <h3 className="f3-l f5 ma0 white mb3">Product</h3>
            <a href="/" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Home
            </a>
            <a href="grants" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Grants
            </a>
            <a href="donate" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Donate
            </a>
            <a
              href="http://app.panvala.com/slates"
              target="_blank"
              className="link dim white-60 f5-l f6 db mb3-ns mb2"
            >
              Live App
            </a>
          </div>
          <div className="dib v-top mr5-l mr3-m mr4 pr2 tl mt0-ns mt4">
            <h3 className="f3-l f5 ma0 white mb3">Team</h3>
            <a href="team#team-about" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              About Us
            </a>
            <a href="team#team-contribute" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Contribute
            </a>
            <a href="team#team-contact" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Contact
            </a>
          </div>
          <div className="dib v-top tl mr0-ns mr4 mt0-ns mt4">
            <h3 className="f3-l f5 ma0 white mb3">Resources</h3>
            <a
              href="resources#resources-whitepaper"
              className="link dim white-60 f5-l f6 db mb3-ns mb2"
            >
              Whitepaper
            </a>
            <a href="resources#resources-blog" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              Blog
            </a>
            <a
              href="https://forum.panvala.com"
              target="_blank"
              className="link dim white-60 f5-l f6 db mb3-ns mb2"
            >
              Forum
            </a>
            <a href="resources#resources-faq" className="link dim white-60 f5-l f6 db mb3-ns mb2">
              FAQ
            </a>
          </div>
        </div>
      </nav>
      <hr className="hr-white" />
      <p className="ma0 f7 lh-text tc white-60 pb3">2019 © PANVALA | Privacy Policy</p>
    </section>
  </>
);
