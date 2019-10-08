import React from 'react';

import SEO from '../components/seo';

const NotFoundPage = props => {
  const urlRoute = props.path;
  if (urlRoute.includes('.html')) {
    const ind = urlRoute.indexOf('.html');
    const shortened = urlRoute.slice(0, ind);
    window.location = shortened;
    return null;
  }
  return (
    <>
      <SEO title="404: Not found" />
      <h1>NOT FOUND</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </>
  );
};

export default NotFoundPage;
