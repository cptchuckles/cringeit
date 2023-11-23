function MakeElement(elementType, attributes) {
    const element = Object.assign(document.createElement(elementType), attributes);
    for (const styleClass of attributes.classList || []) {
        element.classList.add(styleClass);
    }
    return element;
}

class CommentForm extends HTMLElement {
    constructor(params = {}) {
        super();

        this.isEditForm = "commentId" in params;
        this.commentId = params.commentId;
        this.parentCommentId = params.parentCommentId;
        this.parentUsername = params.parentUsername;

        this.hiddenElement = params.hiddenElement;
        this.cringeId = params.cringeId;
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
    }

    connectedCallback() {
        this.cringeId = this.cringeId || this.getAttribute("cringe-id");

        const form = MakeElement("form", {
            action: `/comments/${this.isEditForm ? "update" : "create"}`,
            method: "POST",
            classList: ["wide", "column"]
        });

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

        const buttonRow = MakeElement("div", { classList: ["short", "row"] });

        buttonRow.appendChild(
            MakeElement("button", {
                classList: this.isEditForm ? [] : ["plus"],
                textContent: this.hiddenElement ?
                    (this.isEditForm ? "Update" : "Reply")
                    : "Comment",
            })
        );

        if (this.hiddenElement) {
            const cancelButton = MakeElement("button", {
                type: "button",
                textContent: "Cancel",
                classList: ["clear"],
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
