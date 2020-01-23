const path = require('path');

exports.createPages = async ({ graphql, actions: { createPage }, reporter }) => {
  const result = await graphql(
    `
      {
        allFundraisersJson {
          edges {
            node {
              id
              firstName
              lastName
              image {
                publicURL
              }
              story
              team {
                name
                description
              }
              goal
              slug
            }
          }
        }
      }
    `
  );

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  // Create pages for each json fundraiser
  const fundraiserTemplate = path.resolve(__dirname, 'src/templates/Fundraiser.js');
  result.data.allFundraisersJson.edges.forEach(({ node }) => {
    const team = node.team.name.toLowerCase().replace(' ', '-');
    const firstName = node.firstName.toLowerCase();

    createPage({
      path: `/league/${team}/${firstName}`,
      component: fundraiserTemplate,
      context: {
        id: node.id,
        firstName: node.firstName,
        lastName: node.lastName,
        image: node.image,
        story: node.story,
        team: node.team,
        goal: node.goal,
        slug: node.slug,
      },
    });
  });
};
