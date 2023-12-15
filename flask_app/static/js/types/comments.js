/**
 * Returns an HTMLElement of the specified elementType,
 * with the specified attributes.
 *
 * @param {string} elementType
 * @param {Object} attributes Normal key-value pairs matching DOM attributes
 * @param {string[]?} attributes.classes Classes to apply to the element's classList
 * @param {{string:string}?} attributes.styleRules Inline style rules to apply
 * @returns {HTMLElement}
 */
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
    constructor({
        cringeId,
        commentId,
        username,
        content,
        parentCommentId,
        parentCommentUsername,
        hiddenElement,
        focusOnLoad,
    } = {}) {
        super();

        this.commentId = commentId;
        this.username = username;

        this.parentCommentId = parentCommentId;
        this.parentCommentUsername = parentCommentUsername;

        this.hiddenElement = hiddenElement;
        this.cringeId = cringeId;
        this.content = content;
        this.focusOnLoad = focusOnLoad;
        this.isEditForm = !!this.commentId;
    }

    connectedCallback() {
        this.cringeId = this.cringeId || this.getAttribute("cringe-id");

        /** @type {HTMLFormElement} */
        const form =  MakeElement("form", {
            method: "POST",
            classes: ["wide", "column"]
        });
        form.addEventListener("submit", ev => this.isEditForm ? this.update(ev) : this.post(ev))

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
            placeholder: this.parentCommentUsername
                ? `Reply to ${this.parentCommentUsername}`
                : "Write a Comment"
        });
        textArea.addEventListener("keydown", ev => this.keydownEventHandler(ev));
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

    /**
     * KeyboardEvent handler for submitting and cancelling the form.
     *
     * @param {KeyboardEvent} event
     */
    keydownEventHandler(event) {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            event.target.form.dispatchEvent(new Event("submit"));
        }
        else if (this.hiddenElement && event.key === "Escape") {
            this.destroy();
        }
    }

    /**
     * Delete the form and restore the element that it had hidden.
     */
    destroy() {
        if (!this.hiddenElement) {
            return;
        }
        this.parentElement.appendChild(this.hiddenElement);
        this.remove();
    }

    /**
     * POST a new comment to /api/comments/create
     *
     * @param {SubmitEvent} ev
     */
    async post(ev) {
        ev.preventDefault();
        const form = /** @type {HTMLFormElement} */ (ev.target);
        const formData = new FormData(form);
        const response = await fetch("/api/comments/create", { method: "POST", body: formData });
        const json = await response.json();
        if (response.status === 201) {
            const newData = json.data;
            newData.rating = 0;
            newData.username = authUser.username;
            if (this.parentCommentId) {
                /** @type {CringeComment} */
                const parent = document.getElementById(`comment-${this.parentCommentId}`);
                newData.parentCommentId = parent.commentId;
                newData.parentCommentUsername = parent.username;
                const reply = new CringeComment(newData);
                parent.addReply(reply);
                reply.focus();
                this.destroy();
            }
            else {
                const commentTree = /** @type {CringeCommentTree} */ (document.commentTree);
                const newComment = new CringeComment(newData);
                commentTree.insertBefore(newComment, commentTree.firstChild);
                newComment.focus();
                form.reset();
            }
            return true;
        }
        else {
            const errorMessage = ["Could not post comment:", ...json.errors].join("\n\t- ");
            console.error(errorMessage);
            return false;
        }
    }

    /**
     * POST the updated comment to /api/comments/{commentId}/update 
     *
     * @param {SubmitEvent} ev
     */
    async update(ev) {
        ev.preventDefault();
        const form = /** @type {HTMLFormElement} */ (ev.target);
        const formData = new FormData(form);
        const response = await fetch("/api/comments/update", { method: "POST", body: formData });
        const json = await response.json();
        if (response.status === 200) {
            const comment = this.closest("cringe-comment");
            comment.content = json.data.content;
            this.hiddenElement.querySelector(".content").textContent = json.data.content;
            this.destroy();
        }
        else {
            const errorMessage = ["Could not update comment for some reason:", ...json.errors].join("\n\t- ");
            console.error(errorMessage);
            form.getElementsByTagName("textarea")[0].style.backgroundColor = "yellow";
        }
    }
}

class CringeComment extends HTMLElement {
    constructor({
        id,
        cringe_id,
        user_id,
        username,
        content,
        rating,
        replies,
        parent_comment_id,
        parent_comment_username,
        created_at,

        cringeId,
        userId,
        parentCommentId,
        parentCommentUsername,
        createdAt,
    } = {}) {
        super();

        this.commentId = id;
        this.cringeId = cringeId || cringe_id;
        this.userId = userId || user_id;
        this.username = username;
        this.content = content;
        this.rating = rating;
        this.parentCommentId = parentCommentId || parent_comment_id;
        this.parentCommentUsername = parentCommentUsername || parent_comment_username;
        this.replies = replies || [];
        this.createdAt = created_at || createdAt;
    }

    connectedCallback() {
        this.commentId = this.getAttribute("id") || this.commentId;
        this.parentCommentId = this.getAttribute("parent-comment-id") || this.parentCommentId;
        this.userId = this.getAttribute("user-id") || this.userId;
        this.username = this.getAttribute("username") || this.username;
        this.rating = this.getAttribute("rating") || this.rating;

        this.parentCommentId = Number(this.parentCommentId);
        this.userId = Number(this.userId);

        this.id = `comment-${this.commentId}`;
        this.content = this.content || this.textContent;
        this.textContent = "";

        const root = MakeElement("div", {
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
            classes: ["comment-links", "short", "row"],
            styleRules: { fontSize: ".8em" },
        });
        const replyLink = document.createElement("a");
        replyLink.textContent = "Reply";
        replyLink.addEventListener("click", () => this.showReplyForm());
        linkSpan.appendChild(replyLink);

        if (authUser.id === this.userId) {
            const editLink = document.createElement("a");
            editLink.textContent = "Edit";
            editLink.addEventListener("click", () => this.showEditForm());
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

    /**
     * Render a CommentForm to edit this CringeComment's content
     */
    showEditForm() {
        const commentBody = this.querySelector(`.comment-body`);
        const editForm = new CommentForm({
            hiddenElement: commentBody,
            commentId: this.commentId,
            cringeId: this.cringeId,
            content: this.content,
            focusOnLoad: true,
        });
        commentBody.parentElement.appendChild(editForm);
        commentBody.remove();
    }

    /**
     * Render a CommentForm to reply to this CringeComment
     */
    showReplyForm() {
        const linkSpan = this.getElementsByClassName("comment-links")[0];
        const replyForm = new CommentForm({
            cringeId: this.cringeId,
            parentCommentId: this.commentId,
            parentCommentUsername: this.username,
            hiddenElement: linkSpan,
            focusOnLoad: true,
        });
        linkSpan.parentElement.appendChild(replyForm);
        linkSpan.remove();
    }

    /**
     * Adds a reply under this CringeComment.
     *
     * @param {CringeComment} reply The CringeComment to append to this.replies
     */
    addReply(reply) {
        let replies = this.querySelector(".comment-replies");
        if (replies === null) {
            replies = MakeElement("div", { classes: ["comment-replies"] });
            this.appendChild(replies);
        }
        replies.appendChild(reply);
    }

    /**
     * Target the document's location hash on this CringeComment's id.
     */
    focus() {
        document.location.hash = '';
        document.location.hash = `#comment-${this.commentId}`;
    }
}

class CringeCommentTree extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        this.classList.add("column");
        this.style.gap = "0";

        document.commentTree = this;

        const response = await fetch("/api" + document.location.pathname + "/comments");
        const comments = await response.json();

        // CringeComments arrive in forward chronological order.
        // Display them from newest to oldest.
        for (let i=comments.length; i-- > 0;) {
            this.appendChild(new CringeComment(comments[i]));
        }

        const hash = document.location.hash;
        document.location.hash = '';
        document.location.hash = hash;
    }
}

customElements.define("comment-form", CommentForm);
customElements.define("cringe-comment", CringeComment);
customElements.define("cringe-comment-tree", CringeCommentTree);
