import React from 'react';
import { Link, graphql } from 'gatsby';

import SEO from '../components/seo';

const IndexPage = ({ data }) => (
  <>
    <SEO title="Home" />
    {data.site.siteMetadata.title}
    <Link to="/team">Go to /team</Link>
  </>
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
`
