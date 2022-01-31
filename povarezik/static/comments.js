class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      comments: this.getComments(this.props.id),
      showComments: false,
      showNewComment: false
    };
  }

  getComments(recipeId) {
    let comments = [{
      id: 1,
      author: 'povar',
      text: 'text of comment',
      replies: [{
        id: 2,
        author: 'not me',
        text: 'some other text'
      }, {
        id: 4,
        author: 'povar',
        text: 'what you are saying is false',
        img: 'img/6.png'
      }]
    }, {
      id: 3,
      author: 'guest',
      text: 'I like this site',
      img: 'img/5.jpg',
      replies: [{
        id: 5,
        author: 'hater',
        text: 'I do not'
      }]
    }];
    return comments; // fetch("127.0.0.1:5000//get-comments", {
    // 	method: 'POST',
    // 	id: recipeId,
    // })
    // .then(res => res.json())
    // .then(
    // 	(result) => {
    // 		this.setState({
    // 			isLoaded: true,
    // 			items: result.items
    // 		});
    // 	},
    //       // Note: it's important to handle errors here
    //       // instead of a catch() block so that we don't swallow
    //       // exceptions from actual bugs in components.
    //       (error) => {
    //       	this.setState({
    //       		isLoaded: true,
    //       		error
    //       	});
    //       }
    //       )
  }

  render() {
    return React.createElement("section", {
      className: "social"
    }, React.createElement("div", {
      className: "container"
    }, this.state.showComments ? null : React.createElement("div", {
      id: "show-comments",
      onClick: () => this.setState({
        showComments: this.state.showComments ? false : true
      })
    }, _("Show comments "), React.createElement("i", {
      className: "fa fa-angle-down"
    })), this.state.showComments ? React.createElement("div", {
      id: "comment-wrapper"
    }, React.createElement("div", {
      className: "add-comment",
      onClick: () => this.setState({
        showNewComment: this.state.showNewComment ? false : true
      })
    }, this.state.showNewComment ? _('Cancel') : React.createElement("span", null, _("Comment on the recipe "), React.createElement("i", {
      className: "fa fa-comment"
    }))), this.state.showNewComment ? React.createElement(NewComment, {
      parentId: 0,
      refreshComments: () => this.setState({
        comments: this.getComments(this.state.id)
      })
    }) : null, React.createElement("ul", {
      className: "comments main-ul"
    }, this.state.comments.map(comment => React.createElement("li", null, React.createElement(Comment, {
      comment: comment,
      refreshComments: () => this.setState({
        comments: this.getComments(this.state.id)
      })
    }))))) : null));
  }

}

;

class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.comment.id,
      username: this.props.comment.author,
      text: this.props.comment.text,
      img: this.props.comment.img,
      replies: this.props.comment.replies,
      showReplies: false,
      showNewComment: false
    }; // console.log(this.state.replies)
  }

  render() {
    const ReplyList = () => React.createElement("ul", {
      className: "comment-replies"
    }, this.state.replies.map(reply => {
      return React.createElement("li", null, React.createElement(Reply, {
        replyData: reply
      }));
    }));

    return React.createElement("div", {
      className: "comment"
    }, React.createElement("div", {
      className: "comment-username"
    }, this.state.username), React.createElement("div", {
      className: "comment-body"
    }, this.state.text), this.state.img ? React.createElement(CommentImage, {
      img: this.state.img
    }) : null, React.createElement("div", {
      className: "comment-buttons space-around"
    }, React.createElement("div", {
      className: "comment-buttons-reply",
      onClick: () => this.setState({
        showNewComment: this.state.showNewComment ? false : true
      })
    }, this.state.showNewComment ? _('Cancel') : _('Reply')), React.createElement("div", {
      className: "comment-buttons-reply-toggle",
      onClick: () => this.setState({
        showReplies: this.state.showReplies ? false : true
      })
    }, this.state.showReplies ? React.createElement("span", null, _("Hide replies "), React.createElement("i", {
      className: "fa fa-angle-up"
    })) : React.createElement("span", null, _("Show replies "), React.createElement("i", {
      className: "fa fa-angle-down"
    }))), React.createElement("div", {
      className: "comment-buttons-report"
    }, _("Report "), React.createElement("i", {
      className: "fa fa-warning"
    }))), this.state.showNewComment ? React.createElement(NewComment, {
      parentId: this.state.id,
      refreshComments: () => this.props.refreshComments()
    }) : null, this.state.showReplies ? React.createElement(ReplyList, null) : null);
  }

}

function Reply(props) {
  return React.createElement("div", {
    className: "comment"
  }, React.createElement("div", {
    className: "comment-username"
  }, props.replyData.author), React.createElement("div", {
    className: "comment-body"
  }, props.replyData.text), props.replyData.img ? React.createElement(CommentImage, {
    img: props.replyData.img
  }) : null, React.createElement("div", {
    className: "comment-buttons"
  }, React.createElement("div", {
    className: "comment-buttons-report"
  }, _("Report "), React.createElement("i", {
    className: "fa fa-warning"
  }))));
}

function CommentImage(props) {
  return React.createElement("div", {
    className: "comment-photo"
  }, React.createElement("img", {
    src: "/static/" + props.img,
    alt: "my photo",
    className: "img-responsive"
  }));
}

class NewComment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      parentId: this.props.parentId,
      hasImage: false,
      file: null,
      error: false
    };
    this.postComment = this.postComment.bind(this);
  }

  render() {
    return React.createElement("div", {
      "class": "new-comment"
    }, React.createElement("form", {
      action: "POST",
      id: "comment-form",
      enctype: "multipart/form-data",
      onSubmit: this.postComment
    }, React.createElement("input", {
      type: "text",
      name: "parentId",
      id: "parentId",
      hidden: true,
      value: this.state.parentId
    }), React.createElement("label", {
      "for": "commentBody"
    }, _("Your comment")), React.createElement("textarea", {
      name: "commentBody",
      id: "commentBody",
      placeholder: _("Comment text..."),
      rows: "5",
      "class": "form-control",
      required: true
    }), React.createElement("div", {
      "class": "name-wrapper"
    }, React.createElement("input", {
      type: "text",
      name: "authorName",
      id: "authorName",
      placeholder: _("Your name..."),
      "class": "form-control",
      required: true
    })), React.createElement("label", {
      htmlFor: "photo"
    }, React.createElement("input", {
      type: "file",
      name: "photo",
      id: "photo",
      accept: "image/*",
      "class": "d-none",
      onChange: event => this.handleFileChange(event)
    }), React.createElement("div", {
      "class": "add-photo comment-button",
      onClick: () => this.setState({
        hasImage: true
      })
    }, React.createElement("i", {
      "class": "fa fa-camera"
    }))), React.createElement("button", {
      type: "submit",
      className: "comment-button"
    }, _("Post your comment")), this.state.hasImage ? React.createElement("div", {
      "class": "delete-photo"
    }, React.createElement("i", {
      "class": "fa fa-close",
      onClick: () => this.handlePhotoButton()
    }), React.createElement("img", {
      name: "commentPicture",
      src: this.state.file,
      alt: "commentPicture",
      "class": "img-responsive"
    })) : null), this.state.error ? React.createElement("div", null, "An error happended, please check your internet connection or try later.") : null);
  }

  handlePhotoButton() {
    this.setState({
      hasImage: this.state.hasImage ? false : true,
      file: null
    });
    document.getElementById('photo').value = null;
  }

  handleFileChange(event) {
    this.setState({
      file: URL.createObjectURL(event.target.files[0]),
      hasImage: true
    });
  }

  postComment(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    fetch("/post_comment", {
      method: 'POST',
      body: data
    }).then(res => res.json()).then(result => {
      console.log(result.message)
    })
  }

} // ========================================


ReactDOM.render(React.createElement(Comments, null), document.getElementById('root'));