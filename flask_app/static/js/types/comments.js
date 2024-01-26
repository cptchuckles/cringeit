/**
 * Returns an HTMLElement of the specified elementType,
 * with the specified attributes.
 *
 * @param {string} elementType
 * @param {Object} attributes Normal key-value pairs matching DOM attributes
 * @param {string[]?} attributes.classes Classes to apply to the element's classList
 * @param {{string:string}?} attributes.styleRules Inline style rules to apply
 * @param {{string:func}?} attributes.events Event handlers
 * @param {Object[]?} children Nested child elements
 * @returns {HTMLElement}
 */
function Tag(elementType, attributes, children = []) {
    const element = Object.assign(document.createElement(elementType), attributes);
    for (const styleClass of attributes.classes ?? []) {
        element.classList.add(styleClass);
    }
    for (const [rule, value] of Object.entries(attributes.styleRules ?? {})) {
        element.style[rule] = value;
    }
    for (const [ev, cb] of Object.entries(attributes.events ?? {})) {
        element.addEventListener(ev, cb);
    }
    for (let i=0; i<children.length; i++) {
        if (children[i]) {
            element.appendChild(children[i]);
        }
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

        this.cringeId              = cringeId;
        this.commentId             = commentId;
        this.username              = username;
        this.content               = content;
        this.parentCommentId       = parentCommentId;
        this.parentCommentUsername = parentCommentUsername;
        this.hiddenElement         = hiddenElement;
        this.focusOnLoad           = focusOnLoad;

        this.isEditForm = !!this.commentId;
    }

    connectedCallback() {
        this.cringeId ??= this.getAttribute("cringe-id");

        /** @type {HTMLTextAreaElement} */
        const commentTextArea = Tag("textarea", {
            name: "content",
            placeholder: this.parentCommentUsername
                ? `Reply to ${this.parentCommentUsername}`
                : "Write a Comment",
            events: { keydown: ev => this.keydownEventHandler(ev) },
            value: this.content ?? "",
            rows: Math.max(4, this.content?.split("\n").length ?? 0),
            style: this.isEditForm ? "margin-top: 1em" : "",
        });

        this.appendChild(
            Tag("form", {
                method: "POST", classes: ["wide", "column"],
                events: { submit: this.isEditForm ? (ev => this.update(ev)) : (ev => this.post(ev)) }
            }, [
                this.commentId && Tag("input", { type: "hidden", name: "id", value: this.commentId }),
                this.cringeId && Tag("input", { type: "hidden", name: "cringe_id", value: this.cringeId }),
                this.parentCommentId && Tag("input", { type: "hidden", name: "parent_comment_id", value: this.parentCommentId }),

                commentTextArea,

                Tag("div", { classes: ["short", "row"] }, [
                    Tag("button", {
                        classes: this.isEditForm ? [] : ["plus"],
                        textContent: this.hiddenElement ? (this.isEditForm ? "Update" : "Reply") : "Comment",
                    }),

                    this.hiddenElement && Tag("button", {
                        type: "button",
                        textContent: "Cancel",
                        classes: ["clear"],
                        events: { click: () => this.destroy() },
                    }),
                ])
            ])
        );

        if (this.focusOnLoad) {
            commentTextArea.focus();
            commentTextArea.selectionStart = commentTextArea.value.length;
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
        id, username, content, rating, replies,

        cringe_id, cringeId,
        parent_comment_id, parentCommentId,
        parent_comment_username, parentCommentUsername,
        created_at, createdAt,
        user_id, userId,
    } = {}) {
        super();

        this.commentId = id;
        this.username  = username;
        this.content   = content;
        this.rating    = rating;
        this.replies   = replies ?? [];

        this.cringeId              = cringeId ?? cringe_id;
        this.userId                = userId ?? user_id;
        this.parentCommentId       = parentCommentId ?? parent_comment_id;
        this.parentCommentUsername = parentCommentUsername ?? parent_comment_username;
        this.createdAt             = created_at ?? createdAt;
    }

    connectedCallback() {
        this.commentId       ??= this.getAttribute("id");
        this.parentCommentId ??= this.getAttribute("parent-comment-id");
        this.userId          ??= this.getAttribute("user-id");
        this.username        ??= this.getAttribute("username");
        this.rating          ??= this.getAttribute("rating");
        this.content         ??= this.textContent;

        this.parentCommentId = Number(this.parentCommentId);
        this.userId = Number(this.userId);

        this.id = `comment-${this.commentId}`;
        this.textContent = "";

        const canEdit = (authUser.isAdmin || authUser.id === this.userId);

        this.appendChild(
            Tag("div", { classes: ["comment", "row", "card"], }, [
                // ratings
                Tag("div", { classes: ["column"], styleRules: { gap: "0", alignItems: "center" }, }, [
                    Tag("a", { classes: ["vote", "up-arrow"], href: `/comments/${this.commentId}/rate-up` }),
                    Tag("span", { classes: ["comment-rating"], textContent: this.rating }),
                    Tag("a", { classes: ["vote", "down-arrow"], href: `/comments/${this.commentId}/rate-down` }),
                ]),
                // body
                Tag("div", { styleRules: { flex: "1" } }, [
                    // user heading
                    Tag("h6", { classes: ["short"] }, [
                        Tag("a", { href: `/users/${this.userId}`, textContent: this.username }),
                        this.parentCommentId && new Text(" replying to "),
                        this.parentCommentId && Tag("a", { href: `#comment-${this.parentCommentId}`, textContent: this.parentCommentUsername }),
                    ]),
                    // comment body
                    Tag("div", { classes: ["comment-body"] }, [
                        Tag("p", { classes: ["short", "content", "pre-space"], textContent: this.content }),
                        Tag("span", {
                            classes: ["comment-links", "short", "row"],
                            styleRules: { fontSize: ".8em" },
                        }, [
                            Tag("a", { textContent: "Reply", events: { click: () => this.showReplyForm() } }),
                            canEdit && Tag("a", { textContent: "Edit", events: { click: () => this.showEditForm() } }),
                            canEdit && Tag("a", { href: `/comments/${this.commentId}/delete`, textContent: "Delete", }),
                        ]),
                    ]),
                ]),
            ])
        );

        if (this.replies.length > 0) {
            this.appendChild(Tag("div", { classes: ["comment-replies"] }, this.replies.map(r => new CringeComment(r))));
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
            replies = Tag("div", { classes: ["comment-replies"] });
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
