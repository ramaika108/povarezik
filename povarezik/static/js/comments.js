class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      comments: undefined,
      showComments: false,
      showNewComment: false
    };
  }

  getComments(recipeId) {
    fetch("/get_comments", {
      method: 'POST',
      body: recipeId
    }).then(res => res.json()).then(result => {
      this.setState({
        comments: result
      });
      this.setState({
        showComments: true
      });
      return true;
    }, error => {
      this.setState({
        isLoaded: true,
        error
      });
    });
  }

  render() {
    return React.createElement("section", {
      className: "social"
    }, React.createElement("div", {
      className: "container"
    }, this.state.showComments ? null : React.createElement("div", {
      id: "show-comments",
      onClick: () => {
        this.getComments(this.props.id);
      }
    }, "Show comments ", React.createElement("i", {
      className: "fa fa-angle-down"
    })), this.state.showComments ? React.createElement("div", {
      id: "comment-wrapper"
    }, React.createElement("div", {
      className: "add-comment",
      onClick: () => this.setState({
        showNewComment: this.state.showNewComment ? false : true
      })
    }, this.state.showNewComment ? 'Cancel' : React.createElement("span", null, "Comment on the recipe ", React.createElement("i", {
      className: "fa fa-comment"
    }))), this.state.showNewComment ? React.createElement(NewComment, {
      recipeId: this.state.id,
      parentId: 0,
      refreshComments: () => this.getComments(this.state.id),
      hideNewCommnet: () => this.setState({
        showNewComment: false
      })
    }) : null, React.createElement("ul", {
      className: "comments main-ul"
    }, this.state.comments.map(comment => React.createElement("li", {
      key: comment.id
    }, React.createElement(Comment, {
      comment: comment,
      refreshComments: () => this.getComments(this.state.id),
      recipeId: this.state.id
    }))))) : null));
  }

}

;

class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.comment.id,
      recipeId: this.props.comment.recipe_id,
      username: this.props.comment.author_name,
      text: this.props.comment.text,
      img: this.props.comment.img,
      replies: this.props.comment.replies,
      showReplies: false,
      showNewComment: false
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      replies: newProps.comment.replies
    });
  }

  reportComment(id, username) {
    if (confirm(`Are your sure that you want to report ${username}'s comment as abuse?`)) {
      fetch("/report_comment", {
        method: 'POST',
        body: id
      }).then(res => res.json()).then(result => {
        alert(`${username}'s comment was successfully reported as abusive.`);
        this.props.refreshComments();
      }, error => {
        alert('An error happened, please check your internet connection or try later.');
      });
    }
  }

  render() {
    const ReplyList = () => React.createElement("ul", {
      className: "comment-replies"
    }, this.state.replies.map(reply => {
      return React.createElement("li", {
        key: reply.id
      }, React.createElement(Reply, {
        replyData: reply,
        reportComment: () => this.reportComment(reply.id, reply.author_name)
      }));
    }));

    return React.createElement("div", {
      className: "comment"
    }, React.createElement("div", {
      className: "comment-username"
    }, this.state.username), React.createElement("div", {
      className: "comment-body"
    }, this.state.text), React.createElement(CommentImage, {
      recipeId: this.state.recipeId,
      id: this.state.id
    }), React.createElement("div", {
      className: "comment-buttons space-around"
    }, React.createElement("div", {
      className: "comment-buttons-reply",
      onClick: () => this.setState({
        showNewComment: this.state.showNewComment ? false : true
      })
    }, this.state.showNewComment ? 'Cancel' : 'Reply'), React.createElement("div", {
      className: "comment-buttons-reply-toggle",
      onClick: () => this.setState({
        showReplies: this.state.showReplies ? false : true
      })
    }, this.state.replies ? this.state.showReplies ? React.createElement("span", null, "Hide replies ", React.createElement("i", {
      className: "fa fa-angle-up"
    })) : React.createElement("span", null, "Show replies ", React.createElement("i", {
      className: "fa fa-angle-down"
    })) : null), React.createElement("div", {
      className: "comment-buttons-report",
      onClick: () => this.reportComment(this.state.id, this.state.username)
    }, "Report ", React.createElement("i", {
      className: "fa fa-warning"
    }))), this.state.showNewComment ? React.createElement(NewComment, {
      recipeId: this.props.recipeId,
      parentId: this.state.id,
      refreshComments: () => this.props.refreshComments(),
      hideNewCommnet: () => this.setState({
        showNewComment: false
      })
    }) : null, this.state.showReplies && this.state.replies ? React.createElement(ReplyList, null) : null);
  }

}

function Reply(props) {
  return React.createElement("div", {
    className: "comment"
  }, React.createElement("div", {
    className: "comment-username"
  }, props.replyData.author_name), React.createElement("div", {
    className: "comment-body"
  }, props.replyData.text), React.createElement(CommentImage, {
    recipeId: props.replyData.recipe_id,
    id: props.replyData.id
  }), React.createElement("div", {
    className: "comment-buttons"
  }, React.createElement("div", {
    className: "comment-buttons-report",
    onClick: () => props.reportComment()
  }, "Report ", React.createElement("i", {
    className: "fa fa-warning"
  }))));
}

function CommentImage(props) {
  return React.createElement("div", {
    className: "comment-photo"
  }, React.createElement("img", {
    src: '/static/img/recipes/' + props.recipeId + '/comments/' + props.id + '.png',
    alt: "my photo",
    className: "img-responsive",
    onError: e => {
      e.target.style.display = "none";
    }
  }));
}

class NewComment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recipeId: this.props.recipeId,
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
      name: "recipeId",
      id: "recipeId",
      hidden: true,
      value: this.state.recipeId
    }), React.createElement("input", {
      type: "text",
      name: "parentId",
      id: "parentId",
      hidden: true,
      value: this.state.parentId
    }), React.createElement("label", {
      "for": "commentBody"
    }, "Your comment"), React.createElement("textarea", {
      name: "commentBody",
      id: "commentBody",
      placeholder: "Comment text...",
      rows: "5",
      "class": "form-control",
      required: true
    }), React.createElement("div", {
      id: "form-alert"
    }, "Hello world i brought trouble"), React.createElement("div", {
      "class": "name-wrapper"
    }, React.createElement("input", {
      type: "text",
      name: "authorName",
      id: "authorName",
      placeholder: "Your name...",
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
    }, "Post your comment"), this.state.hasImage ? React.createElement("div", {
      "class": "delete-photo"
    }, React.createElement("i", {
      "class": "fa fa-close",
      onClick: () => this.handlePhotoButton()
    }), React.createElement("img", {
      name: "commentPicture",
      src: this.state.file,
      alt: "commentPicture",
      "class": "img-responsive"
    })) : null), this.state.error ? React.createElement("div", null, "An error happened, please check your internet connection or try later.") : null);
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
    var formAlert = document.getElementById('form-alert');
    formAlert.innerHTML = '';
    formAlert.style.display = 'none';
    event.preventDefault();
    const data = new FormData(event.target);
    fetch("/post_comment", {
      method: 'POST',
      body: data
    }).then(res => res.json()).then(result => {
      if (result.error) {
        formAlert.style.display = 'block';
        formAlert.innerHTML = result.message;
      } else {
        this.props.refreshComments();
        this.props.hideNewCommnet();
      }
    }, error => {
      formAlert.style.display = 'block';
      formAlert.innerHTML = 'An error happened, please check your internet connection or try later.';
    });
  }

} // ========================================
// ReactDOM.render(
//   <Comments />,
//   document.getElementById('root')
// );