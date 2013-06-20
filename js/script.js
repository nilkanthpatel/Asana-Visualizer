window.currentView = "viz";
window.filters = {
	"users" : [],
	"tags" : [],
	"projects" : []
}

$.ajax({
	url: "./data/usersData.json",
}).done(function(data) {
	usersImageData = data;
	$.ajax({
		url: "./data/data.json",
	}).done(function(data) {
		window.projectsData = cleanProjectsData(data.projects);
		window.usersData = data.users;
		window.currentProjectsData = clone(window.projectsData);
		initUsers(window.usersData,usersImageData);
		initProjectsVisualization(window.currentProjectsData);
	});
});

window.onload = function() {
	$(".gantt").css("height",$(window).height()-330);
	$("#filtersNav").css("height",$(window).height()-330);
}

window.onresize = function() {
	$(".gantt").css("height",$(window).height()-330);
	$("#filtersNav").css("height",$(window).height()-330);
}

function cleanProjectsData(projectsData) {
	var newProjectsData = projectsData;
	var projectsList = new Array();
	for (var p=0; p<newProjectsData.length; p++) {
		projectsList.push([newProjectsData[p].name,newProjectsData[p].id]);
		for (var t=0; t<newProjectsData[p].tasks.length; t++) {
			var taskName = newProjectsData[p].tasks[t]["name"];
			if (taskName.charAt(taskName.length-1) == ":") {
				newProjectsData[p].tasks.splice(t,1);
				t=t-1;
			}
		}
	}
	initProjectsList(projectsList);
	return newProjectsData;
}

function filterProjectsData(projectsData,filter) {
	var filterProjects = JSON.stringify(filter.projects);
	var filterTags = JSON.stringify(filter.tags);
	var filterUsers = JSON.stringify(filter.users);
	var taskCount = 0;

	var newProjectsData = projectsData;
	if (filter.users.length > 0) {
		for (var p=0; p<newProjectsData.length; p++) {
			for (var t=0; t<newProjectsData[p].tasks.length; t++) {
				if (newProjectsData[p].tasks[t]["assignee"] == null) {
					newProjectsData[p].tasks.splice(t,1);
					t=t-1;
				} else {
					if (filterUsers.indexOf(newProjectsData[p].tasks[t].assignee.id) == -1) {
						newProjectsData[p].tasks.splice(t,1);
						t=t-1;
					} else {
						taskCount++;
					}
				}
			}
		}
	}
	if (filter.projects.length > 0) {
		for (var p=0; p<newProjectsData.length; p++) {
			if (filterProjects.indexOf(newProjectsData[p].id) == -1) {
				newProjectsData.splice(p,1);
				p=p-1;
			}
		}
	}
	return newProjectsData;
}

function initProjectsList(projectsList) {
	var projectsListHTML = "<h1>Projects</h1>";
	for (var i=0; i<projectsList.length; i++) {
		projectsListHTML=projectsListHTML+"<h2 id='"+projectsList[i][1]+"'>"+projectsList[i][0]+"</h2>"
	}
	$("#filtersNav #projectsFilter").html(projectsListHTML);
	$("#filtersNav #projectsFilter h2").click(function() {
  		var projectID = $(this).attr("id");
  		var userClass = $(this).attr("class");
  		if (userClass == "active") {
  			$(this).removeClass("active");
  			removeFilter("projects",projectID);
  		} else {
  			$(this).addClass("active");
  			addFilter("projects",projectID);
  		}
	});

}

function addFilter(field,criteria) {
	window.filters[field].push(criteria);
	window.currentProjectsData = clone(window.projectsData);
	window.currentProjectsData = filterProjectsData(window.currentProjectsData,window.filters);
	reloadView(window.currentView);
}

function removeFilter(field,criteria) {
	window.filters[field].splice(window.filters[field].indexOf(criteria),1);
	window.currentProjectsData = clone(window.projectsData);
	window.currentProjectsData = filterProjectsData(window.currentProjectsData,window.filters);
	reloadView(window.currentView);
}

function initUsers(usersData,usersImageData) {
	var usersHTML = "";
	for (var i=0; i<usersData.length; i++) {
		try { 
			var userName = usersData[i]["name"].split(" ")[0];
			var imgURL = usersImageData[userName]["image"];
			usersHTML = usersHTML+"<li id='"+userName+"' alt='"+usersData[i]["id"]+"'></li>";
		} catch(err) { }
	}
	$("#bottomNav #users").html(usersHTML);
	for (var key in usersImageData) {
		if (usersImageData[key]["image"].length > 1) {
			$("#bottomNav #users #"+key).css("background-image","url('"+usersImageData[key]["image"]+"')");
		} else {
			$("#bottomNav #users #"+key).html("<p>"+key+"</p>");
		}
	}
	$('#bottomNav #users').animate({ opacity: 1 }, 1000);
	$("#bottomNav #users li").click(function() {
  		var userID = $(this).attr("alt");
  		var userClass = $(this).attr("class");
  		if (userClass == "active") {
  			$(this).removeClass("active");
  			removeFilter("users",userID);
  		} else {
  			$(this).addClass("active");
  			addFilter("users",userID);
  		}
	});
}

function initProjectsVisualization(projectsData,filter) {
	var projectsHTML = "";
	projectsBottomNavHTML = "";
	var projectsSizes = new Array();
	var projectsCount = 0;
	for (var i=0; i<projectsData.length; i++) {
		projectID = projectsData[i].name.replace(/ /g,"").split("/")[0].split("-")[0].split("&")[0].split("(")[0].split(",")[0];
		projectsHTML = projectsHTML+'<div class="projectCircle" id="'+projectID+'"></div>';
		projectsBottomNavHTML = projectsBottomNavHTML+'<div class="description" id="'+projectID+'"><h1>'+projectsData[i].name+'</h1><h2>'+projectsData[i].tasks.length+' tasks</h2></div>';
		projectsSizes.push([projectID,projectsData[i].tasks.length]);
		projectsCount = projectsCount+projectsData[i].tasks.length;
	}
	$("#projects").html(projectsHTML);
	$("#bottomNavDescriptions").html(projectsBottomNavHTML);
	for (var i=0; i<projectsSizes.length; i++) {
		var projectPercentage = ((projectsSizes[i][1])/projectsCount)*120;
		$("#projects #"+projectsSizes[i][0]).css({
			'padding-bottom' : projectPercentage+"%",
			width : projectPercentage+"%"
		});
	}
	$("#projects .projectCircle").hover( function () {
		$("#bottomNavDescriptions #"+$(this).attr("id")).addClass("active");
	}, function () {
		$("#bottomNavDescriptions #"+$(this).attr("id")).removeClass("active");
	});
}

function initGanttChart(projectsData) {
	$(".gantt").html("");
	var projectsJson = getProjectsJson(projectsData);
	$("#bottomNavTaskDescriptions").html("");
	$(".gantt").gantt({
		source: projectsJson,
		navigate: "scroll",
		scale: "days",
		scrollToToday: true,
		maxScale: "months",
		minScale: "days",
		itemsPerPage: 900,
		onItemClick: function(data) {
			var currentTaskHTML = "<div class='description'><h1><a href='https://app.asana.com/0/1464837982897/"+data.id+"' target='_blank'>"+data.name+"</a></h1><p>"+unescape(data.notes)+"</p></div><div class='dates'><div class='calendar'><h2>From</h2>"+data.startDateFormatted+"</div><div class='calendar'><h2>To</h2>"+data.endDateFormatted+"</div></div>";
			$("#bottomNavTaskDescriptions").html(currentTaskHTML);
		}, onAddClick: function() {
		}, onRender: function() {}
	});
	$( ".fn-gantt .bar" ).draggable();
}

function convertAsanaDateToEpoch(asanaDate) {
	var theYear = asanaDate.split("-")[0];
	var theMonth = asanaDate.split("-")[1];
	var theDay = asanaDate.split("-")[2].split("T")[0];
	var finalDate = new Date(theYear, theMonth, theDay).getTime();
	return finalDate;
}

function changeView(newView) {
	if (newView == "gantt" && window.currentView == "viz") {
		$("#nav #viz").removeClass("active");
		$("#nav #gantt").addClass("active");
		initGanttChart(window.currentProjectsData);
		$("#projects").hide();
		$(".gantt").show();
		$("#bottomNav #bottomNavTaskDescriptions").show();
		window.currentView = "gantt";
	} else if (newView == "viz" && window.currentView == "gantt") {
		$("#nav #gantt").removeClass("active");
		$("#nav #viz").addClass("active");
		$(".gantt").hide();
		$("#projects").show();
		$("#bottomNav #bottomNavTaskDescriptions").hide();
		window.currentView = "viz";
	}
}

function reloadView(newView) {
	if (newView == "gantt") {
		initGanttChart(window.currentProjectsData);
	} else if (newView == "viz") {
		initProjectsVisualization(window.currentProjectsData);
	}
}

function getProjectsJson(projectsData) {
	var projectsJson = "[";
	for (var i=0; i<projectsData.length; i++) {
		if (projectsData[i].tasks.length > 0) {
			projectsJson = projectsJson+'{ "name": "'+projectsData[i].name+'", "desc": "", "values": [ { "to": "/Date('+convertAsanaDateToEpoch("2013-10-07T22:47:49.532Z")+')/", "from": "/Date('+convertAsanaDateToEpoch("2013-05-07T22:47:49.532Z")+')/", "desc": "", "label": "", "customClass": "projectBar" }]}, ';
			for (var t=0; t<projectsData[i].tasks.length; t++) { 
				var startDate = convertAsanaDateToEpoch(projectsData[i].tasks[t].created_at);
				var taskName = projectsData[i].tasks[t].name.replace(/"/g,'');
				var taskNotes = escape(projectsData[i].tasks[t].notes);
				if (projectsData[i].tasks[t].notes.split("START DATE: ")[1] != undefined ) {
					startDate = projectsData[i].tasks[t].notes.split("START DATE: ")[1].split("\n")[0];
					startDate = new Date(startDate).getTime();
					startDate = "/Date("+startDate+")/";
				}
				if (projectsData[i].tasks[t].due_on == null) {
					var endDate = convertAsanaDateToEpoch("2013-08-07T22:47:49.532Z");
				} else {
					var endDate = convertAsanaDateToEpoch(projectsData[i].tasks[t].due_on);
				}
				projectsJson = projectsJson+'{ "name": " ", "desc": "'+taskName+'", "values": [ { "to": "/Date('+endDate+')/", "from": "/Date('+startDate+')/", "desc": "'+taskName+'", "label": "'+taskName+'", "customClass": "'+projectsData[i].tasks[t].id+'", "dataObj" : { "name": "'+taskName+'", "notes": "'+taskNotes+'", "id": "'+projectsData[i].tasks[t].id+'", "startDateFormatted": "'+formatDate(startDate)+'", "endDateFormatted": "'+formatDate(endDate)+'" } }]}, ';
			}
		}
	}
	projectsJson = projectsJson+']';
	projectsJson = projectsJson.replace(/}, ]/g,"}]");
	projectsJson = $.parseJSON(projectsJson);
	return projectsJson;
}

function formatDate(dateString) {
	var theCurrentDate = new Date(dateString);
	var weekday=new Array(7);
		weekday[0]="Sunday";
		weekday[1]="Monday";
		weekday[2]="Tuesday";
		weekday[3]="Wednesday";
		weekday[4]="Thursday";
		weekday[5]="Friday";
		weekday[6]="Saturday";
	var month=new Array();
		month[0]="January";
		month[1]="February";
		month[2]="March";
		month[3]="April";
		month[4]="May";
		month[5]="June";
		month[6]="July";
		month[7]="August";
		month[8]="September";
		month[9]="October";
		month[10]="November";
		month[11]="December";
	return "<p><span class='day'>"+weekday[theCurrentDate.getDay()]+"</span><span class='month'>"+month[theCurrentDate.getMonth()]+" "+theCurrentDate.getDate()+", "+theCurrentDate.getFullYear()+"</span></p>";
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}