import React from 'react';
import { ThemeProvider } from 'styled-components';

// Global styles
import '../css/open-sans.css';
import '../css/tachyons.css';
import '../css/util.css';
import '../css/colors.css';
import '../css/clip-path.css';

import Footer from './Footer';
import { theme } from '../utils/theme';

const Layout = ({ children }) => {
  return (
    <>
      <ThemeProvider theme={theme}>
        <div className="overflow-x-hidden">
          <main>{children}</main>
          <Footer />
        </div>
      </ThemeProvider>
    </>
  );
};

export default Layout;
