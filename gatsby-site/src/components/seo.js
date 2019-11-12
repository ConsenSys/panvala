import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { useStaticQuery, graphql } from 'gatsby';

function SEO({ description, lang, meta, title }) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`${site.siteMetadata.title} | %s`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:creator`,
          content: site.siteMetadata.author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
      ].concat(meta)}
    >
      {/* <!-- Google Tag Manager (from Catalyst) --> */}
      <script type="text/javascript">
        {process.env.NODE_ENV === 'production' &&
          `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-N75G5FG')`}
      </script>
      {/* <!-- End Google Tag Manager --> */}

      <script type="text/javascript">
        {process.env.NODE_ENV === 'production' &&
          `(function(o) {
          var b = 'https://zippyfrog.co/anywhere/',
            t = '039b072363604f71afb26a55f1899413c20b8d86bb9749878f06b280fe2c8fa4',
            a = (window.AutopilotAnywhere = {
              _runQueue: [],
              run: function() {
                this._runQueue.push(arguments);
              },
            }),
            c = encodeURIComponent,
            s = 'SCRIPT',
            d = document,
            l = d.getElementsByTagName(s)[0],
            p =
              't=' +
              c(d.title || '') +
              '&u=' +
              c(d.location.href || '') +
              '&r=' +
              c(d.referrer || ''),
            j = 'text/javascript',
            z,
            y;
          if (!window.Autopilot) window.Autopilot = a;
          if (o.app) p = 'devmode=true&' + p;
          z = function(src, asy) {
            var e = d.createElement(s);
            e.src = src;
            e.type = j;
            e.async = asy;
            l.parentNode.insertBefore(e, l);
          };
          y = function() {
            z(b + t + '?' + p, true);
          };
          if (window.attachEvent) {
            window.attachEvent('onload', y);
          } else {
            window.addEventListener('load', y, false);
          }
        })({})`}
      </script>
    </Helmet>
  );
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
};

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
};

export default SEO;
