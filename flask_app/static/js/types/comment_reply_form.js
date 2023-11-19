function showReplyForm(anchor, userId, cringeId, parentCommentId, parentUsername) {
    anchor.parentElement.appendChild(new CommentReplyForm(
        userId,
        cringeId,
        parentCommentId,
        parentUsername,
        anchor.cloneNode(true)
    ));
    anchor.remove();
}

function NewDOMTokenList(tokens) {
    const tokenList = document.createElement("div").classList;
    for (const token of tokens) {
        tokenList.add(token);
    }
    return tokenList;
}

class CommentReplyForm extends HTMLElement {
    constructor(userId, cringeId, parentCommentId, parentUsername, cancelLink) {
        super();

        this.userId = userId;
        this.cringeId = cringeId;
        this.parentCommentId = parentCommentId;
        this.parentUsername = parentUsername;
        this.cancelLink = cancelLink;
    }

    connectedCallback() {
        const form = Object.assign(document.createElement("form"), {
            action: "/comments/create",
            method: "POST",
            classList: NewDOMTokenList(["wide", "column"])
        });

        form.appendChild(
            Object.assign(document.createElement("input"), {
                type: "hidden",
                name: "user_id",
                value: this.userId
            })
        );

        form.appendChild(
            Object.assign(document.createElement("input"), {
                type: "hidden",
                name: "cringe_id",
                value: this.cringeId
            })
        );

        form.appendChild(
            Object.assign(document.createElement("input"), {
                type: "hidden",
                name: "parent_comment_id",
                value: this.parentCommentId
            })
        );

        form.appendChild(
            Object.assign(document.createElement("textarea"), {
                name: "content",
                rows: 4,
                placeholder: `Reply to ${this.parentUsername}`
            })
        );

        const buttonRow = Object.assign(document.createElement("div"), {
            classList: NewDOMTokenList(["short", "row"])
        });

        buttonRow.appendChild(
            Object.assign(document.createElement("button"), {
                classList: NewDOMTokenList(["plus"]),
                textContent: "Reply"
            })
        );

        const cancelButton = Object.assign(document.createElement("button"), {
            type: "button",
            classList: NewDOMTokenList(["clear"]),
            textContent: "Cancel",
        });
        cancelButton.addEventListener("click", () => {
            this.parentElement.appendChild(this.cancelLink);
            this.remove();
        });
        buttonRow.appendChild(cancelButton);

        form.appendChild(buttonRow);

        this.appendChild(form);
    }
}
customElements.define("comment-reply-form", CommentReplyForm);
