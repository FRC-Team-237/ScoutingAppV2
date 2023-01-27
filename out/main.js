const CloseModal = m => m.classList.remove("is-active");
const CloseAllModals = () => [...document.getElementsByClassName("modal")].forEach(e => CloseModal(e));

const SetupModals = () => {
	const openModal = m => m.classList.add('is-active');

	[...document.getElementsByClassName("js-modal-trigger")].forEach(e => {
		const modal = e.dataset.target;
		const target = document.getElementById(modal);
		e.addEventListener("click", () => openModal(target));
	});

	[...document.querySelectorAll(".modal-background, .modal-close, .modal-card-head .delete")].forEach(e => {
		const target = e.closest(".modal");
		e.addEventListener("click", () => CloseModal(target));
		document.addEventListener("keydown", e => { if(e.key == "Escape") CloseAllModals(); } );
	});
};

const TeamInfoButtons = [];

const UpdateAssociatedButtonText = teamButtons => {
	if(teamButtons.number.validity.valid) {
		teamButtons.associatedSelectButton.innerText = teamButtons.number.value;
		teamButtons.associatedSelectButton.parentElement.classList.remove("is-danger");
		teamButtons.associatedSelectButton.parentElement.disabled = false;
		rowNames.forEach(row => {
			for(let i = 0; i < 9; i++) {
				UpdateButton(row, i);
			}
		});
	} else {
		teamButtons.associatedSelectButton.innerText = "unset";
		teamButtons.associatedSelectButton.parentElement.classList.add("is-danger");
		teamButtons.associatedSelectButton.parentElement.disabled = true;
	}
};

const SetupTeamButtons = () => {
	for(let i = 0; i < 3; i++) {
		const team = {
			number: document.getElementById(`team-${i}-number`),
			associatedSelectButton: document.getElementById(`team-selector-${i}`),
			autonomous: {
				mobility: document.getElementById(`team-${i}-auto-mobility`),
				charge: document.getElementById(`team-${i}-auto-charge`)
			},
			endgame: {
				charge: document.getElementById(`team-${i}-end-charge`)
			},
			notes: document.getElementById(`team-${i}-notes`)
		}
		UpdateAssociatedButtonText(team);
		
		team.number.addEventListener('change', () => UpdateAssociatedButtonText(team));

		TeamInfoButtons.push(team);
	}
};

let selectedTeamIndex = -1;

const SelectTeam = index => {
	if(index < 0 || index >= 3) return;
	
	if(!TeamInfoButtons[index].number.validity.valid) return;
	if(selectedTeamIndex >= 0 && selectedTeamIndex < 3) {
		TeamInfoButtons[selectedTeamIndex].associatedSelectButton.parentElement.classList.remove("is-selected");
	}
	selectedTeamIndex = index;
	TeamInfoButtons[selectedTeamIndex].associatedSelectButton.parentElement.classList.add("is-selected");
};

const scoreValues = {
	high: [],
	mid: [],
	low: []
};

const scoreButtons = {
	high: [],
	mid: [],
	low: []
};
const rowNames = ["low", "mid", "high"];

let allianceWon = false;

const SetupScoreMatrix = () => {
	const winButton = document.getElementById("win-button");
	winButton.addEventListener('click', () => {
		allianceWon = !allianceWon;
		winButton.classList.remove(allianceWon ? "is-danger" : "is-success");
		winButton.classList.add(allianceWon ? "is-success" : "is-danger");
		document.querySelector("label[for='win-button']").innerText = `Alliance ${allianceWon ? "won" : "lost"}`;
	});

	scoreButtons.high = document.querySelectorAll("td[name^='scorehigh']");
	scoreButtons.mid = document.querySelectorAll("td[name^='scoremid']");
	scoreButtons.low = document.querySelectorAll("td[name^='scorelow']");

	rowNames.forEach(row => {
		for(let i = 0; i < 9; i++) {
			const scoreTemplate = {
				teamID: null,
				auto: false,
				value: 0
			};
			scoreValues[row][i] = scoreTemplate;
			
			SetItem(row, i, 0);
			scoreButtons[row][i].addEventListener('click', () => {
				if(selectedTeamIndex != -1 && TeamInfoButtons[selectedTeamIndex].number.validity.valid) {
					window.navigator.vibrate([5, 50, 5]);
					CycleItem(row, i);
				}
			});
			scoreButtons[row][i].addEventListener('contextmenu', e => {
				if(selectedTeamIndex != -1) {
					e.preventDefault();
					if(TeamInfoButtons[selectedTeamIndex].number.validity.valid && scoreValues[row][i].value != 0) {
						window.navigator.vibrate([30, 200, 5]);
						ToggleItemAuto(row, i);
					}
				}
				return false;
			});
		}
	});
};

const ToggleItemAuto = (row, index) => {
	if(!["low", "mid", "high"].includes(row)) return;
	if(!(Number.isInteger(index) && 0 <= index && index <= 8)) return;

	scoreValues[row][index].auto = !scoreValues[row][index].auto;
	UpdateButton(row, index);
};

const SetItem = (row, index, value) => {
	if(!["low", "mid", "high"].includes(row)) return;
	if(!(Number.isInteger(index) && 0 <= index && index <= 8)) return;
	if(!(Number.isInteger(value) && 0 <= value && value <= 2)) value = 0;

	scoreValues[row][index].value = value;
	scoreValues[row][index].value %= 3;
	scoreValues[row][index].teamID = selectedTeamIndex;
	if(scoreValues[row][index].value == 0) {
		scoreValues[row][index].teamID = -1;
		scoreValues[row][index].auto = false;
	}

	UpdateButton(row, index);
};

const CycleItem = (row, index) => {
	SetItem(row, index, (scoreValues[row][index].value + 1) % 3);

	const scoreType = scoreButtons[row][index].dataset.scoretype;
	if(!scoreType.includes("cube") && scoreValues[row][index].value == 1)
		SetItem(row, index, scoreValues[row][index].value + 1);
	if(!scoreType.includes("cone") && scoreValues[row][index].value == 2)
		SetItem(row, index, scoreValues[row][index].value + 1);

	SetItem(row, index, scoreValues[row][index].value % 3);

	UpdateButton(row, index);
};

const UpdateButton = (row, index) => {
	const scoreStrings = ["none", "cube", "cone"];
	scoreButtons[row][index].dataset.score = scoreStrings[scoreValues[row][index].value];
	scoreButtons[row][index].dataset.auto = scoreValues[row][index].auto;
	if(scoreValues[row][index].teamID >= 0) {
		scoreButtons[row][index].firstElementChild.innerText = TeamInfoButtons[scoreValues[row][index].teamID].number.value;
	} else {
		scoreButtons[row][index].firstElementChild.innerText = "";
	}
};

const ResultsToObject = () => {
	result = {
		submitTime: 0,
		matchNumber: 0,
		alliance: "red",
		win: false,
		teamData: []
	};

	result.submitTime = Date.now();
	result.matchNumber = document.getElementById("match-number").value;
	result.alliance = document.getElementById("alliance-color").checked ? "blue" : "red";
	result.win = allianceWon;

	for(let i = 0; i < 3; i++) {
		let team = {
			teamNumber: 0,
			autonomous: { mobility: false, charge: 0 },
			endgame: { charge: 0 },
			notes: "",
			scoreMatrix: { high: [], mid: [], low: [] }
		}

		const teamInfo = TeamInfoButtons[i];
		team.teamNumber = teamInfo.number.value;
		team.notes = teamInfo.notes.value;

		team.autonomous.mobility = teamInfo.autonomous.mobility.selectedIndex == 1;
		team.autonomous.charge = teamInfo.autonomous.charge.selectedIndex;
		team.endgame.charge = teamInfo.endgame.charge.selectedIndex;

		const filterByThisTeam = row => {
			scoreValues[row].map(scoreBox => 
				scoreBox.teamID == i
					? scoreBox.valid * (auto ? -1 : 1)
					: 0);
		};

		rowNames.forEach(row => team.scoreMatrix[row] = filterByThisTeam(row));

		result.teamData[i] = team;
	}
	return result;
};

const ValidateData = () => {
	const problems = [];
	
	const matchNumber = document.getElementById("match-number");
	if(!matchNumber.validity.valid) {
		problems.push({
			field: "Match Number",
			message: matchNumber.validationMessage
		});
	}

	for(let i = 0; i < TeamInfoButtons.length; i++) {
		if(!TeamInfoButtons[i].number.validity.valid) {
			problems.push({
				field: `Team ${i + 1}`,
				message: TeamInfoButtons[i].number.validationMessage
			});
		}
	}

	autoProblems: {
		const dockedTeams = TeamInfoButtons.map((b, i) => { return { button:b, index:i } }).filter(b => b.button.autonomous.charge.selectedIndex == 1);
		const chargedTeams = TeamInfoButtons.map((b, i) => { return { button:b, index:i } }).filter(b => b.button.autonomous.charge.selectedIndex == 2);
	
		if(dockedTeams.length > 0 && chargedTeams.length > 0) {
			const listFormatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
			const dockedTeamNumbers = listFormatter.format(dockedTeams.map(t => t.button.number.value == "" ? (t.index + 1).toString() : t.button.number.value ));
			const chargedTeamNumbers = listFormatter.format(chargedTeams.map(t => t.button.number.value == "" ? (t.index + 1).toString() : t.button.number.value ));
			problems.push({
				field: "Incorrect autonomous dock/charge data",
				message: `Team${dockedTeams.length > 1 ? "s" : ""} ${dockedTeamNumbers} ${dockedTeams.length > 1 ? "are" : "is"} docked, but Team${chargedTeams.length > 1 ? "s" : ""} ${chargedTeamNumbers} ${chargedTeams.length > 1 ? "are" : "is"} charging.`
			});
		}
	}

	endProblems: {
		const dockedTeams = TeamInfoButtons.map((b, i) => { return { button:b, index:i } }).filter(b => b.button.endgame.charge.selectedIndex == 1);
		const chargedTeams = TeamInfoButtons.map((b, i) => { return { button:b, index:i } }).filter(b => b.button.endgame.charge.selectedIndex == 2);
		
		if(dockedTeams.length > 0 && chargedTeams.length > 0) {
			const listFormatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });
			const dockedTeamNumbers = listFormatter.format(dockedTeams.map(t => t.button.number.value == "" ? (t.index + 1).toString() : t.button.number.value ));
			const chargedTeamNumbers = listFormatter.format(chargedTeams.map(t => t.button.number.value == "" ? (t.index + 1).toString() : t.button.number.value ));
			problems.push({
				field: "Incorrect endgame dock/charge data",
				message: `Team${dockedTeams.length > 1 ? "s" : ""} ${dockedTeamNumbers} ${dockedTeams.length > 1 ? "are" : "is"} docked, but Team${chargedTeams.length > 1 ? "s" : ""} ${chargedTeamNumbers} ${chargedTeams.length > 1 ? "are" : "is"} charging.`
			});
		}
	}

	return problems;
};

const TrySubmit = () => {
	const problems = ValidateData();
	const submitErrors = document.getElementById("submit-errors");
	while(submitErrors.hasChildNodes()) submitErrors.removeChild(submitErrors.childNodes[0]);

	problems.forEach(problem => {
		const newProblem = document.createElement("blockquote");
		const problemTitle = document.createElement("h5");
		const problemBody = document.createElement("p");

		newProblem.className = "dark has-text-white is-danger";

		problemTitle.className = "title is-5 has-text-danger";
		problemTitle.innerText = problem.field;

		problemBody.className = "subtitle is-6";
		problemBody.innerText = problem.message;

		newProblem.appendChild(problemTitle);
		newProblem.appendChild(problemBody);

		submitErrors.appendChild(newProblem);
	});
	document.getElementById("submit-confirm-button").disabled = problems.length > 0;
};

const UploadSubmissions = () => {
	const address = prompt("Enter the upload address:");

	const xhr = new XMLHttpRequest();
	xhr.open("POST", `${address}/upload`);
	xhr.setRequestHeader("Accept", "application/json");
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4) {
			alert(xhr.status === 200 ? "Sent successfully" : `STATUS: ${xhr.status}\nRESPONSE: ${xhr.response} ${xhr.responseText}`);
		}
	};

	xhr.send(JSON.stringify(GetSubmissions()));
};

const ConfirmSubmit = () => {
	AddSubmission(ResultsToObject());
	ClearMatchInfo();
	window.scrollTo(0, 0);
};

const DebugRandomSubmission = () => {
	const RandomTeamData = () => {
		const RandomRowData = () => [...Array(9)].map(value => Math.floor(Math.random() * 5) - 2);
		return {
			teamNumber: Math.ceil(Math.random() * 10000),
			autonomous: { mobility: false, charge: 0 },
			endgame: { charge: 0 },
			notes: "",
			scoreMatrix: { high: RandomRowData(), mid: RandomRowData(), low: RandomRowData() }
		}
	}
	const result = {	
		submitTime: 0,
		matchNumber: Math.ceil(Math.random() * 100),
		alliance: Math.random() > 0.5 ? "red" : "blue",
		win: Math.random() > 0.5,
		teamData: [...Array(3)].map(team => RandomTeamData())
	};
	console.log(result);
	return result;
};

const AddSubmission = submission => {
	if(localStorage.getItem("submissions") == null) {
		localStorage.setItem("submissions", "[]");
	}
	const currentSubmissions = GetSubmissions();
	currentSubmissions.push(submission);
	localStorage.setItem("submissions", JSON.stringify(currentSubmissions));
	PopulateSubmissions();
};

const GetSubmissions = () => {
	if(localStorage.getItem("submissions") == null) return [];
	return JSON.parse(localStorage.getItem("submissions"));
};

const GetDeleteIndices = () => {
	const submissionsList = document.getElementById("submissions-list");
	return jQuery.makeArray(submissionsList.getElementsByTagName("label"))
		.filter(label => label.dataset.delete == "true")
		.map(label => {
			const attributeString = label.getAttribute("for");
			return parseInt(attributeString.substring(attributeString.lastIndexOf("-") + 1));
		});
}

const DeleteSelectedSubmissions = () => {
	const newSubmissions = GetSubmissions().filter((s, i) => !GetDeleteIndices().includes(i));
	localStorage.setItem("submissions", JSON.stringify(newSubmissions));
	PopulateSubmissions();
};

const PopulateSubmissions = () => {
	const submissionsList = document.getElementById("submissions-list");
	while(submissionsList.hasChildNodes()) submissionsList.removeChild(submissionsList.childNodes[0]);

	const submissions = GetSubmissions();
	document.getElementById("no-submissions-text").style.display = submissions.length > 0 ? "none" : "block";

	for(let i = 0; i < submissions.length; i++) {
		const newSubmissionLabel = document.createElement("label");
		const newSubmissionDate = document.createElement("div");
		const newSubmissionInput = document.createElement("input");
		const newSubmissionContent = document.createElement("div");

		newSubmissionLabel.setAttribute("for", `submissions-dropdown-${i}`)
		newSubmissionLabel.innerText = `Match` + '\xa0' + `${submissions[i].matchNumber}`
		newSubmissionLabel.dataset.delete = "false";
		newSubmissionLabel.addEventListener("contextmenu", e => {
			e.preventDefault();
			newSubmissionLabel.dataset.delete = newSubmissionLabel.dataset.delete == "true" ? "false" : "true";
			document.getElementById("delete-submissions-button").disabled = GetDeleteIndices().length == 0;
			return false;
		});

		newSubmissionDate.className = "subtitle is-6 pl-3 is-pulled-right is-italic";
		newSubmissionDate.style.color = "#aaa";

		newSubmissionInput.type = "checkbox";
		newSubmissionInput.id = `submissions-dropdown-${i}`;
		newSubmissionInput.addEventListener('change', () => {
			newSubmissionInput.checked
				? newSubmissionLabel.classList.add("is-opened")
				: newSubmissionLabel.classList.remove("is-opened");
		});

		const submissionDate = new Date(submissions[i].submitTime);
		const submissionDOW = submissionDate.toLocaleString('en-us', { weekday: 'long' });
		newSubmissionDate.innerText = `${submissionDOW}, ${submissionDate.getMonth() + 1}/${submissionDate.getDate()}/${submissionDate.getFullYear()} at ${(submissionDate.getHours() + 11) % 12 + 1}:${submissionDate.getMinutes().toString().padStart(2, '0')} ${submissionDate.getHours() >= 12 ? 'PM' : 'AM'}`;

		newSubmissionLabel.appendChild(newSubmissionDate);
		submissionsList.appendChild(newSubmissionLabel);
		submissionsList.appendChild(newSubmissionInput);

		newSubmissionContent.className = "dropdown-content has-text-white";

		const allianceTagWrapper = document.createElement("div");
		const allianceTagColor = document.createElement("span");
		const allianceTagLabel = document.createElement("span");
		allianceTagWrapper.className = "tags has-addons mb-0";
		allianceTagColor.className = `is-rounded pl-2 pr-1 has-text-weight-bold tag ${submissions[i].alliance == "red" ? "is-danger" : "is-link"}`;
		allianceTagColor.innerText = `${submissions[i].alliance.charAt(0).toUpperCase()}${submissions[i].alliance.slice(1)}`;
		allianceTagLabel.className = "is-rounded pr-2 pl-1 has-text-weight-bold tag dark-secondary-bg has-text-white";
		allianceTagLabel.innerText = "Alliance";
		allianceTagWrapper.appendChild(allianceTagColor);
		allianceTagWrapper.appendChild(allianceTagLabel);

		newSubmissionContent.appendChild(allianceTagWrapper);
		
		
		const winLabel = document.createElement("p");
		winLabel.className = "subtitle is-6 has-text-white has-text-weight-bold";
		winLabel.innerText = `${submissions[i].win ? "Victory" : "Defeat"}`;
		
		newSubmissionContent.appendChild(winLabel);

		const teamList = document.createElement("blockquote");
		teamList.className = "dark neutral px-3 py-2"
		for(let j = 0; j < 3; j++) {
			const newTeam = document.createElement("p");
			const newTeamNumber = submissions[i].teamData[j].teamNumber;
			newTeam.innerText = `Team ${newTeamNumber}`;
			teamList.appendChild(newTeam);
		}
		newSubmissionContent.appendChild(teamList);

		submissionsList.appendChild(newSubmissionContent);
	}
	document.getElementById("delete-submissions-button").disabled = GetDeleteIndices().length == 0;
};

const ClearScoreMatrix = () => {
	rowNames.forEach(row => {
		for(let i = 0; i < 9; i++) {
			SetItem(row, i, 0);
		}
	});
};

const ClearMatchInfo = () => {
	document.getElementById("match-form").reset();
	allianceWon = false;
	document.querySelector("label[for='win-button']").innerText = `Alliance ${allianceWon ? "won" : "lost"}`;
	TeamInfoButtons.forEach(button => UpdateAssociatedButtonText(button));
	ClearScoreMatrix();
};

const Init = () => {
	SetupModals();

	document.getElementById("alliance-color").addEventListener('touchend', () => window.navigator.vibrate([5,50,5]));

	SetupScoreMatrix();
	SetupTeamButtons();
	document.getElementById("match-form").addEventListener("change", () => ValidateData());
	PopulateSubmissions();
};

document.addEventListener('DOMContentLoaded', Init);
window.onbeforeunload = () => "";