function editComment(cringeId, commentId) {
    const commentBody = document.querySelector(`#comment-${commentId} .comment-body`);
    const content = commentBody.querySelector(".content").textContent;
    const editForm = new CommentForm({
        hiddenElement: commentBody.cloneNode(true),
        commentId: commentId,
        cringeId: cringeId,
        content: content,
        isEditForm: true,
        focusOnLoad: true,
    });
    commentBody.parentElement.appendChild(editForm);
    commentBody.remove();
}

function showReplyForm(links, cringeId, parentCommentId, userId, parentUsername) {
    const replyForm = new CommentForm({
        hiddenElement: links.cloneNode(true),
        cringeId: cringeId,
        userId: userId,
        parentCommentId: parentCommentId,
        parentUsername: parentUsername,
        focusOnLoad: true,
    });
    links.parentElement.appendChild(replyForm);
    links.remove();
}
