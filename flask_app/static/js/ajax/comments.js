async function populateComments() {
	const commentsContainer = document.getElementById("comments");

	const response = await fetch("/api" + document.location.pathname + "/comments");
	const comments = await response.json();

	comments.reverse().forEach(comment => {
		commentsContainer.appendChild(new CringeComment(comment));
	});

	const hash = document.location.hash;
	document.location.hash = '';
	document.location.hash = hash;
}

populateComments();
