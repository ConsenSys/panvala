import React from 'react';

// Global styles
import '../css/open-sans.css';
import '../css/tachyons.css';
import '../css/util.css';
import '../css/colors.css';
import '../css/clip-path.css';

import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <>
      {/* <Header siteTitle={data.site.siteMetadata.title} /> */}
      <div className="overflow-x-hidden">
        <main>{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
