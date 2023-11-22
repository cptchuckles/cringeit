function buildDOMTokenList(tokens) {
    const tokenList = document.createElement("div").classList;
    for (const token of tokens) {
        tokenList.add(token);
    }
    return tokenList;
}

class CommentForm extends HTMLElement {
    constructor(hiddenElement, params = {}) {
        super();

        this.hiddenElement = hiddenElement;
        this.editForm = params.editForm;

        this.userId = params.userId;
        this.cringeId = params.cringeId;
        this.commentId = params.commentId;
        this.parentCommentId = params.parentCommentId;
        this.parentUsername = params.parentUsername;
        this.content = params.content;
    }

    connectedCallback() {
        const abort = () => {
            this.parentElement.appendChild(this.hiddenElement);
            this.remove();
        };

        const form = Object.assign(document.createElement("form"), {
            action: `/comments/${this.editForm ? "update" : "create"}`,
            method: "POST",
            classList: buildDOMTokenList(["wide", "column"])
        });

        if (this.commentId !== undefined) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "id",
                    value: this.commentId,
                })
            );
        }

        if (this.userId !== undefined) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "user_id",
                    value: this.userId
                })
            );
        }

        if (this.cringeId !== undefined) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "cringe_id",
                    value: this.cringeId
                })
            );
        }

        if (this.parentCommentId !== undefined) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "parent_comment_id",
                    value: this.parentCommentId
                })
            );
        }

        const textArea = Object.assign(document.createElement("textarea"), {
            name: "content",
            rows: 4,
            placeholder: `Reply to ${this.parentUsername}`
        });
        textArea.addEventListener("keydown", ev => {
            if (ev.shiftKey && ev.key === "Enter") {
                ev.preventDefault();
                ev.target.form.submit();
            }
            else if (ev.key === "Escape") {
                abort();
            }
        });
        if (this.content !== undefined ) {
            textArea.value = this.content;
        }
        if (this.editForm) {
            textArea.style.marginTop = "1em";
        }
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
        textArea.selectionStart = textArea.value.length;
    }
}

customElements.define("comment-form", CommentForm);
