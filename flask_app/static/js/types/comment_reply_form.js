function showReplyForm(cringeId, parentCommentId, userId, parentUsername) {
    const links = document.getElementById(`comment-links-${parentCommentId}`);
    links.parentElement.appendChild(new CommentReplyForm(
        cringeId,
        parentCommentId,
        userId,
        parentUsername,
        links.cloneNode(true)
    ));
    links.remove();
}

function buildDOMTokenList(tokens) {
    const tokenList = document.createElement("div").classList;
    for (const token of tokens) {
        tokenList.add(token);
    }
    return tokenList;
}

class CommentReplyForm extends HTMLElement {
    constructor(cringeId, parentCommentId, userId, parentUsername, cancelLink) {
        super();

        this.userId = userId;
        this.cringeId = cringeId;
        this.parentCommentId = parentCommentId;
        this.parentUsername = parentUsername;
        this.cancelLink = cancelLink;
    }

    connectedCallback() {
        const abort = () => {
            this.parentElement.appendChild(this.cancelLink);
            this.remove();
        };

        const form = Object.assign(document.createElement("form"), {
            action: "/comments/create",
            method: "POST",
            classList: buildDOMTokenList(["wide", "column"])
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

        const textArea = Object.assign(document.createElement("textarea"), {
            name: "content",
            rows: 4,
            placeholder: `Reply to ${this.parentUsername}`
        });
        textArea.addEventListener("keydown", ev => {
            if (ev.shiftKey && ev.key === "Enter") {
                ev.target.form.submit();
            }
            else if (ev.key === "Escape") {
                abort();
            }
        });
        form.appendChild(textArea);

        const buttonRow = Object.assign(document.createElement("div"), {
            classList: buildDOMTokenList(["short", "row"])
        });

        buttonRow.appendChild(
            Object.assign(document.createElement("button"), {
                classList: buildDOMTokenList(["plus"]),
                textContent: "Reply"
            })
        );

        const cancelButton = Object.assign(document.createElement("button"), {
            type: "button",
            classList: buildDOMTokenList(["clear"]),
            textContent: "Cancel",
        });
        cancelButton.addEventListener("click", () => abort());
        buttonRow.appendChild(cancelButton);

        form.appendChild(buttonRow);

        this.appendChild(form);
        textArea.focus();
    }
}
customElements.define("comment-reply-form", CommentReplyForm);
