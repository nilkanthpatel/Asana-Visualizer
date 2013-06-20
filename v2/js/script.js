window.currentView = "viz";
window.filters = {
	"users" : [],
	"tags" : [],
	"projects" : []
}
window.startDateKey = "START DATE: ";
window.currentScale = 1;
window.currentScaleNames = ["years","weeks","months"];

$.ajax({
	url: "../data/usersData.json",
}).done(function(data) {
	usersImageData = data;
	$.ajax({
		url: "../data/data.json",
	}).done(function(data) {
		window.projectsData = cleanProjectsData(data.projects);
		window.usersData = data.users;
		window.currentProjectsData = clone(window.projectsData);
		initProjectsVisualization(window.currentProjectsData);
		initUsers(window.usersData,usersImageData);
	});
});

function toggleFilters() {
	if ($('#filters').css("z-index") == "10") {
		$('#filters').css("z-index",-1)
		$('#container').animate({ right: "0%" }, 500);
	} else {
		$('#container').animate({ right: "20%" }, 500, function() {
			$('#filters').css("z-index",10)
		});
	}
}

function toggleMoreInformation() {
	if (window.currentView == "gantt") {
		if ($("#bottomNav").css("bottom") == "-200px") {
			$('#bottomNav').animate({ bottom: "0px" }, 300);
		} else {
			$('#bottomNav').animate({ bottom: "-200px" }, 300);
		}
	}
}

window.onload = function() {
	$(".gantt").css("height",$(window).height()-90);
	$("#filtersNav").css("height",$(window).height()-330);
	Mousetrap.bind('shift+down',function() { toggleMoreInformation(); });
	Mousetrap.bind('shift+up',function() { toggleMoreInformation(); });
	Mousetrap.bind('shift+right',function() { toggleFilters(); });
	Mousetrap.bind('shift+left',function() { toggleFilters(); });
}

window.onresize = function() {
	$(".gantt").css("height",$(window).height()-90);
	$("#filtersNav").css("height",$(window).height()-330);
	window.movementRatio = $(".gantt .fn-gantt .fn-content .dataPanel").width()*.9/$("#bottomNav #ganttNav #ganttNavScroll").width();
	window.currentGanttPosition = -parseInt($(".gantt .fn-gantt .fn-content .dataPanel").css("margin-left"))/$(".gantt .fn-gantt .fn-content .dataPanel").width();
	$("#bottomNav #ganttNav #ganttNavScroll #ganttNavScrollBar").css("left",window.currentGanttPosition*$("#bottomNav #ganttNav #ganttNavScroll").width())
	$("#bottomNav #ganttNav #ganttNavScroll #ganttNavScrollBar").draggable({ 
		axis: "x", 
		containment: "parent",
		drag: function( event, ui ) {
			$(".gantt .fn-gantt .fn-content .dataPanel").css("margin-left",-ui.position.left*movementRatio);
		}
	}); 
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
		projectsListHTML=projectsListHTML+"<li id='"+projectsList[i][1]+"'>"+projectsList[i][0]+"</li>";
	}
	$("#filters #projectsList").html(projectsListHTML);
	$("#filters #projectsList li").click(function() {
  		var projectID = $(this).attr("id");
  		var userClass = $(this).attr("class");
  		if (userClass == undefined) {
  			$(this).addClass("active");
  			addFilter("projects",projectID);
  		} else {
  			$(this).removeClass("active");
  			removeFilter("projects",projectID);
  		}
	});

}

function addFilter(field,criteria) {
	window.filters[field].push(criteria);
	window.currentProjectsData = clone(window.projectsData);
	window.currentProjectsData = filterProjectsData(window.currentProjectsData,window.filters);
	reloadView();
}

function removeFilter(field,criteria) {
	window.filters[field].splice(window.filters[field].indexOf(criteria),1);
	window.currentProjectsData = clone(window.projectsData);
	window.currentProjectsData = filterProjectsData(window.currentProjectsData,window.filters);
	reloadView();
}

function initUsers(usersData,usersImageData) {
	var usersHTML = "<h1>Users</h1>";
	window.usersIDs = new Array();
	window.usersNames = new Array();
	for (var i=0; i<usersData.length; i++) {
		var userName = usersData[i]["name"].split(" ")[0];
		window.usersIDs.push(usersData[i]["id"]);
		window.usersNames.push(userName);
		usersHTML = usersHTML+"<li id='"+usersData[i]["id"]+"'>"+userName+"</li>";
	}
	$("#filters #users").html(usersHTML);
	$("#filters #users li").click(function() {
  		var userID = $(this).attr("id");
  		var userClass = $(this).attr("class");
  		if (userClass == undefined) {
  			$(this).addClass("active");
  			addFilter("users",userID);
  		} else {
  			$(this).removeClass("active");
  			removeFilter("users",userID);
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
		scale: window.currentScaleNames[window.currentScale],
		scrollToToday: true,
		maxScale: "months",
		minScale: "days",
		itemsPerPage: 900,
		onItemClick: function(data) {
			var currentTaskHTML = '<h1><a href="https://app.asana.com/0/1464837982897/'+data.id+'" target="_blank">'+data.name+'</a></h1><p>'+unescape(data.notes)+'</p><div id="date"><div class="date" id="assignee"><span class="indicator">assignee</span><span class="formattedDate">'+data.assignee+'</span></div><div class="date" id="from"><span class="indicator">from</span><span class="formattedDate">'+data.startDateFormatted+'</span></div><div class="date" id="to"><span class="indicator">to</span><span class="formattedDate">'+data.endDateFormatted+'</span></div></div><div id="datePicker"></div>';
			$("#ganttInformation").html(currentTaskHTML);
			if ($("#bottomNav").css("bottom") == "-200px") {
				$('#bottomNav').animate({ bottom: "0px" }, 300);
			}
			$("#bottomNav #ganttInformation #date .date").click(function() {
				$("#datePicker").show();
				var currentDate = new Date($(this).html().split("<br>")[1].split("</span>")[0]);
				var currentDateBox = this;
				$('#datePicker').datepicker("destroy");
				$('#datePicker').datepicker( {
        			onSelect: function(date) {
						var newDate = formatDate(date);
						$(currentDateBox).html('<span class="indicator">'+$(currentDateBox).attr("id")+'</span><span class="formattedDate">'+newDate+'</span>');
						updateAsanaDate(data.projectNumber,data.taskNumber,$(currentDateBox).attr("id"),date);
						$(this).datepicker( "destroy" );
						$(this).hide();
        			}
    			});
    			$('#datePicker').datepicker("setDate",currentDate);
			})
		}, onAddClick: function() {
		}, onRender: function() {}
	});
	window.setTimeout( function() { 
		window.movementRatio = $(".gantt .fn-gantt .fn-content .dataPanel").width()*.9/$("#bottomNav #ganttNav #ganttNavScroll").width();
		$( "#bottomNav #ganttNav #ganttNavScroll #ganttNavScrollBar" ).draggable({ 
			axis: "x", 
			containment: "parent",
			drag: function( event, ui ) {
				$(".gantt .fn-gantt .fn-content .dataPanel").css("margin-left",-ui.position.left*movementRatio);
			}
		});
		$(".rightPanel .bar").resizable();
		$(".rightPanel .bar").resizable({
			containment: "parent",
			grid: [24,0],
			minHeight: 18,
			maxHeight: 18,
			handles: "e, w"
		});
	},3000);
}

function updateAsanaDate(projectNumber,taskNumber,period,newDate) {
	var currentNotes = window.projectsData[projectNumber]["tasks"][taskNumber]["notes"]; 
	if (period == "from") {
		if (currentNotes.split(window.startDateKey)[1] != undefined) {
			currentNotes = window.startDateKey+newDate+"\n"+currentNotes.substr(currentNotes.indexOf('\n') + 1);
		} else {
			currentNotes = window.startDateKey+newDate+"\n"+currentNotes;
		}
		window.projectsData[projectNumber]["tasks"][taskNumber]["notes"] = currentNotes;
		window.currentProjectsData[projectNumber]["tasks"][taskNumber]["notes"] = currentNotes;
	} else if (period == "to") {
		window.projectsData[projectNumber]["tasks"][taskNumber]["due_on"] = newDate;
		window.currentProjectsData[projectNumber]["tasks"][taskNumber]["due_on"] = newDate;
	}
	reloadView();
}

function changeView(newView) {
	if (newView == "gantt" && window.currentView == "viz") {
		$("#nav #viz").removeClass("active");
		$("#nav #gantt").addClass("active");
		$("#ganttNav").html("");
		initGanttChart(window.currentProjectsData);
		$("#projects").hide();
		$(".gantt").show();
		window.currentView = "gantt";
	} else if (newView == "viz" && window.currentView == "gantt") {
		$("#nav #gantt").removeClass("active");
		$("#nav #viz").addClass("active");
		$(".gantt").hide();
		$("#ganttNav").html("");
		$("#projects").show();
		window.currentView = "viz";
	}
}

function reloadView() {
	if (window.currentView == "gantt") {
		initGanttChart(window.currentProjectsData);
	} else {
		initProjectsVisualization(window.currentProjectsData);
	}
}

function getProjectsJson(projectsData) {
	var projectsJson = "[";
	for (var i=0; i<projectsData.length; i++) {
		if (projectsData[i].tasks.length > 0) {
			var projStartDate = new Date("2012-10-07T22:47:49.532Z").getTime();
			var projEndDate = new Date("2013-10-07T22:47:49.532Z").getTime();
			projectsJson = projectsJson+'{ "name": "'+projectsData[i].name+'", "desc": "", "values": [ { "to": "/Date('+projEndDate+')/", "from": "/Date('+projStartDate+')/", "desc": "", "label": "", "customClass": "projectBar" }]}, ';
			for (var t=0; t<projectsData[i].tasks.length; t++) { 
				var startDate = new Date(projectsData[i].tasks[t].created_at).getTime();
				var taskName = projectsData[i].tasks[t].name.replace(/"/g,'');
				var taskNotes = escape(projectsData[i].tasks[t].notes);
				if (projectsData[i].tasks[t].assignee == null) {
					var assignee = "None";
				} else {
					var assignee = window.usersNames[window.usersIDs.indexOf(projectsData[i].tasks[t].assignee.id)];
				}
				if (projectsData[i].tasks[t].notes.split(window.startDateKey)[1] != undefined ) {
					startDate = projectsData[i].tasks[t].notes.split(window.startDateKey)[1].split("\n")[0];
					startDate = startDate.replace(/\//g,"-");
					startDate = new Date(startDate).getTime();
				}
				if (projectsData[i].tasks[t].due_on == null) {
					var endDate = new Date("2013-08-07T22:47:49.532Z").getTime();
				} else {
					var endDate = new Date(projectsData[i].tasks[t].due_on).getTime();
				}
				projectsJson = projectsJson+'{ "name": " ", "desc": "'+taskName+'", "values": [ { "to": "/Date('+endDate+')/", "from": "/Date('+startDate+')/", "desc": "'+taskName+'", "label": "'+taskName+'", "customClass": "'+projectsData[i].tasks[t].id+'", "dataObj" : { "name": "'+taskName+'", "assignee": "'+assignee+'", "notes": "'+taskNotes+'", "projectNumber": '+i+', "taskNumber": '+t+', "id": "'+projectsData[i].tasks[t].id+'", "startDateFormatted": "'+formatDate(startDate)+'", "endDateFormatted": "'+formatDate(endDate)+'" } }]}, ';
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
	return weekday[theCurrentDate.getDay()]+"<br>"+month[theCurrentDate.getMonth()]+" "+theCurrentDate.getDate()+", "+theCurrentDate.getFullYear();
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