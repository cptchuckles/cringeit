function buildDOMTokenList(tokens) {
    const tokenList = document.createElement("div").classList;
    for (const token of tokens) {
        tokenList.add(token);
    }
    return tokenList;
}

class CommentForm extends HTMLElement {
    constructor(params = {}) {
        super();

        this.hiddenElement = params.hiddenElement;
        this.isEditForm = params.isEditForm;

        this.userId = params.userId;
        this.cringeId = params.cringeId;
        this.commentId = params.commentId;
        this.parentCommentId = params.parentCommentId;
        this.parentUsername = params.parentUsername;
        this.content = params.content;
        this.focusOnLoad = params.focusOnLoad;
    }

    keyboardControlsHandler(event) {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            event.target.form.submit();
        }
        else if (this.hiddenElement && event.key === "Escape") {
            this.abort();
        }
    }

    abort() {
        this.parentElement.appendChild(this.hiddenElement);
        this.remove();
    };

    connectedCallback() {
        this.userId = this.userId || this.getAttribute("user-id");
        this.cringeId = this.cringeId || this.getAttribute("cringe-id");

        const form = Object.assign(document.createElement("form"), {
            action: `/comments/${this.isEditForm ? "update" : "create"}`,
            method: "POST",
            classList: buildDOMTokenList(["wide", "column"])
        });

        if (this.commentId) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "id",
                    value: this.commentId,
                })
            );
        }

        if (this.userId) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "user_id",
                    value: this.userId
                })
            );
        }

        if (this.cringeId) {
            form.appendChild(
                Object.assign(document.createElement("input"), {
                    type: "hidden",
                    name: "cringe_id",
                    value: this.cringeId
                })
            );
        }

        if (this.parentCommentId) {
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
            placeholder: this.parentUsername
                ? `Reply to ${this.parentUsername}`
                : "Write a Comment"
        });
        textArea.addEventListener("keydown", ev => this.keyboardControlsHandler(ev));
        if (this.content) {
            textArea.value = this.content;
        }
        if (this.isEditForm) {
            textArea.style.marginTop = "1em";
        }
        form.appendChild(textArea);

        const buttonRow = Object.assign(document.createElement("div"), {
            classList: buildDOMTokenList(["short", "row"])
        });

        buttonRow.appendChild(
            Object.assign(document.createElement("button"), {
                classList: this.isEditForm ? null : buildDOMTokenList(["plus"]),
                textContent: this.hiddenElement
                    ? (this.isEditForm
                        ? "Update"
                        : "Reply")
                    : "Comment"
            })
        );

        if (this.hiddenElement) {
            const cancelButton = Object.assign(document.createElement("button"), {
                type: "button",
                classList: buildDOMTokenList(["clear"]),
                textContent: "Cancel",
            });
            cancelButton.addEventListener("click", () => this.abort());
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

customElements.define("comment-form", CommentForm);
