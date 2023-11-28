function MakeElement(elementType, attributes) {
    const element = Object.assign(document.createElement(elementType), attributes);
    for (const styleClass of attributes.classes || []) {
        element.classList.add(styleClass);
    }
    for (const [rule, value] of Object.entries(attributes.styleRules || {})) {
        element.style[rule] = value;
    }
    return element;
}

class CommentForm extends HTMLElement {
    constructor(params = {}) {
        super();

        this.commentId = params.commentId;

        this.isEditForm = "commentId" in params;
        this.parentCommentId = params.parentCommentId;
        this.parentUsername = params.parentUsername;

        this.hiddenElement = params.hiddenElement;
        this.cringeId = params.cringeId;
        this.content = params.content;
        this.focusOnLoad = params.focusOnLoad;

        this.data = null;
    }

    keyboardControlsHandler(event) {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            event.target.form.dispatchEvent(new Event("submit"));
        }
        else if (this.hiddenElement && event.key === "Escape") {
            this.destroy();
        }
    }

    destroy() {
        this.parentElement.appendChild(this.hiddenElement);
        this.remove();
    }

    async post(ev) {
        ev.preventDefault();
        const form = ev.target;
        const formData = new FormData(form);
        const response = await fetch("/api/comments/create", { method: "POST", body: formData });
        const [status, json] = [response.status, await response.json()];
        if (status === 201) {
            const comment = await fetch(`/api/comments/${json.id}`).then(resp => resp.json())
            if (this.parentCommentId) {
                const parent = document.getElementById(`comment-${this.parentCommentId}`).parentElement;
                const reply = parent.addReply(comment);
                reply.focus();
                this.destroy();
            }
            else {
                const commentSection = document.getElementById("comments");
                const newComment = new CringeComment(comment);
                commentSection.insertBefore(newComment, commentSection.firstChild);
                newComment.focus();
                form.reset();
            }
            return true;
        }
        else {
            const errorMessage = "Could not post comment:\n" + json.errors.join("\n");
            alert(errorMessage);
            console.log(errorMessage);
            return false;
        }
    }

    connectedCallback() {
        this.cringeId = this.cringeId || this.getAttribute("cringe-id");

        const form = MakeElement("form", {
            method: "POST",
            classes: ["wide", "column"]
        });
        form.addEventListener("submit", ev => this.post(ev))

        if (this.commentId) {
            form.appendChild(
                MakeElement("input", {
                    type: "hidden",
                    name: "id",
                    value: this.commentId,
                })
            );
        }

        if (this.cringeId) {
            form.appendChild(
                MakeElement("input", {
                    type: "hidden",
                    name: "cringe_id",
                    value: this.cringeId
                })
            );
        }

        if (this.parentCommentId) {
            form.appendChild(
                MakeElement("input", {
                    type: "hidden",
                    name: "parent_comment_id",
                    value: this.parentCommentId
                })
            );
        }

        const textArea = MakeElement("textarea", {
            name: "content",
            rows: 4,
            placeholder: this.parentUsername
                ? `Reply to ${this.parentUsername}`
                : "Write a Comment"
        });
        textArea.addEventListener("keydown", ev => this.keyboardControlsHandler(ev));
        if (this.content) {
            textArea.value = this.content;
            textArea.rows = Math.max(4, this.content.split("\n").length);
        }
        if (this.isEditForm) {
            textArea.style.marginTop = "1em";
        }
        form.appendChild(textArea);

        const buttonRow = MakeElement("div", { classes: ["short", "row"] });

        buttonRow.appendChild(
            MakeElement("button", {
                classes: this.isEditForm ? [] : ["plus"],
                textContent: this.hiddenElement ?
                    (this.isEditForm ? "Update" : "Reply")
                    : "Comment",
            })
        );

        if (this.hiddenElement) {
            const cancelButton = MakeElement("button", {
                type: "button",
                textContent: "Cancel",
                classes: ["clear"],
            });
            cancelButton.addEventListener("click", () => this.destroy());
            buttonRow.appendChild(cancelButton);
        }

        form.appendChild(buttonRow);

        this.appendChild(form);
        if (this.focusOnLoad) {
            textArea.focus();
            textArea.selectionStart = textArea.value.length;
        }
    }
}

class CringeComment extends HTMLElement {
    static edit(cringeId, commentId) {
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

    static showReplyForm(link, cringeId, parentCommentId, parentUsername) {
        const linkSpan = link;
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

    static async populateCringeComments() {
        const commentsContainer = document.getElementById("comments");

        const response = await fetch("/api" + document.location.pathname + "/comments");
        const comments = await response.json();

        for (let i=comments.length; i-- > 0;) {
            commentsContainer.appendChild(new CringeComment(comments[i]));
        }

        const hash = document.location.hash;
        document.location.hash = '';
        document.location.hash = hash;
    }

    constructor(data) {
        super();

        this.commentId = data.id;
        this.cringeId = data.cringeId || data.cringe_id;
        this.userId = data.userId || data.user_id;
        this.username = data.username;
        this.content = data.content;
        this.rating = data.rating;
        this.parentCommentId = data.parentCommentId || data.parent_comment_id;
        this.parentCommentUsername = data.parentCommentUsername || data.parent_comment_username;

        this.replies = data.replies || [];
    }

    connectedCallback() {
        this.commentId = this.getAttribute("id") || this.commentId;
        this.parentCommentId = this.getAttribute("parent-comment-id") || this.parentCommentId;
        this.userId = this.getAttribute("user-id") || this.userId;
        this.username = this.getAttribute("username") || this.username;

        this.commentId = Number(this.commentId);
        this.parentCommentId = Number(this.parentCommentId);
        this.userId = Number(this.userId);

        const root = MakeElement("div", {
            id: `comment-${this.commentId}`,
            classes: ["comment", "row", "card"],
        });

        const vote = MakeElement("div", {
            classes: ["column"],
            styleRules: { gap: "0", alignItems: "center" },
        });
        vote.appendChild(MakeElement("a", {
            classes: ["vote", "up-arrow"],
            href: `/comments/${this.commentId}/rate-up`,
        }));
        vote.appendChild(MakeElement("span", {
            classes: ["comment-rating"],
            textContent: this.rating,
        }));
        vote.appendChild(MakeElement("a", {
            classes: ["vote", "down-arrow"],
            href: `/comments/${this.commentId}/rate-down`,
        }));

        root.appendChild(vote);

        const body = MakeElement("div", { styleRules: { flex: "1" } });
        const userHeading = MakeElement("h6", { classes: ["short"] });
        userHeading.appendChild(MakeElement("a", {
            href: `/users/${this.userId}`,
            textContent: this.username,
        }));
        if (this.parentCommentId) {
            userHeading.appendChild(new Text(" replying to "));
            userHeading.appendChild(MakeElement("a", {
                href: `#comment-${this.parentCommentId}`,
                textContent: this.parentCommentUsername,
            }));
        }
        body.appendChild(userHeading);

        const commentBody = MakeElement("div", { classes: ["comment-body"] });

        commentBody.appendChild(MakeElement("p", {
            classes: ["short", "content", "pre-space"],
            textContent: this.content,
        }));

        const linkSpan = MakeElement("span", {
            classes: ["short", "row"],
            styleRules: { fontSize: ".8em" },
        });
        const replyLink = document.createElement("a");
        replyLink.textContent = "Reply";
        replyLink.addEventListener("click", () => {
            CringeComment.showReplyForm(linkSpan, this.cringeId, this.commentId, this.username);
        });
        linkSpan.appendChild(replyLink);

        if (authUser.id === this.userId) {
            const editLink = document.createElement("a");
            editLink.textContent = "Edit";
            editLink.addEventListener("click", () => CringeComment.edit(this.cringeId, this.commentId));
            linkSpan.appendChild(editLink);

            linkSpan.appendChild(MakeElement("a", {
                href: `/comments/${this.commentId}/delete`,
                textContent: "Delete",
            }));
        }

        commentBody.appendChild(linkSpan);
        body.appendChild(commentBody);
        root.appendChild(body);
        this.appendChild(root);

        if (this.replies.length > 0) {
            const replies = MakeElement("div", { classes: ["comment-replies"] });
            for (const reply of this.replies) {
                replies.appendChild(new CringeComment(reply));
            }
            this.appendChild(replies);
        }
    }

    addReply(reply) {
        let replies = this.querySelector(".comment-replies");
        if (replies === null) {
            replies = MakeElement("div", { classes: ["comment-replies"] });
            this.appendChild(replies);
        }
        const replyInstance = new CringeComment(reply);
        replies.appendChild(replyInstance);
        return replyInstance;
    }

    focus() {
        document.location.hash = '';
        document.location.hash = `#comment-${this.commentId}`;
    }
}

customElements.define("comment-form", CommentForm);
customElements.define("cringe-comment", CringeComment);
