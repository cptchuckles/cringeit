function submitOnEnter(event) {
    if (event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        event.target.form.submit();
    }
}

function editComment(cringeId, commentId) {
    const commentBody = document.querySelector(`#comment-${commentId} .comment-body`);
    const content = commentBody.querySelector(".content").textContent;
    const editForm = new CommentForm(commentBody.cloneNode(true), {
        commentId: commentId,
        cringeId: cringeId,
        content: content,
        editForm: true,
    });
    commentBody.parentElement.appendChild(editForm);
    commentBody.remove();
}

function showReplyForm(links, cringeId, parentCommentId, userId, parentUsername) {
    const replyForm = new CommentForm(links.cloneNode(true), {
        cringeId: cringeId,
        userId: userId,
        parentCommentId: parentCommentId,
        parentUsername: parentUsername,
    });
    links.parentElement.appendChild(replyForm);
    links.remove();
}
