function editComment(cringeId, commentId) {
    const commentBody = document.querySelector(`#comment-${commentId} .comment-body`);
    const content = commentBody.querySelector(".content").textContent;
    const editForm = new CommentForm({
        hiddenElement: commentBody,
        cringeId: cringeId,
        commentId: commentId,
        content: content,
        focusOnLoad: true,
    });
    commentBody.parentElement.appendChild(editForm);
    commentBody.remove();
}

function showReplyForm(link, cringeId, parentCommentId, parentUsername) {
    const linkSpan = link.parentElement;
    const replyForm = new CommentForm({
        hiddenElement: linkSpan,
        cringeId: cringeId,
        parentCommentId: parentCommentId,
        parentUsername: parentUsername,
        focusOnLoad: true,
    });
    linkSpan.parentElement.appendChild(replyForm);
    linkSpan.remove();
}
