'use strict';

const el = React.createElement;

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    return (
      <div>
        <button onClick={() => this.setState({ liked: true })}>FDSAFDSAFDSASD</button>
      </div>
    );
  }
}

const domContainer = document.querySelector('#root_container');
ReactDOM.render(el(LikeButton), domContainer);

// document.querySelectorAll('#root_container').forEach(domContainer => {
//   console.log('domContainer:', domContainer);
//   // Read the comment ID from a data-* attribute.
//   // const commentID = parseInt(domContainer.dataset.commentid, 10);
//   // ReactDOM.render(
//   //   e(LikeButton, { commentID: commentID }),
//   //   domContainer
//   // );
// });
