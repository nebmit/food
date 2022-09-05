
const nonNumberRegex = /\D+/g;
var failedAttempts = 0;

var dateInput = document.getElementById("dateInput");
var dateJqueryInput = $("#dateInput");
var pwdInput = document.getElementById("pwdInput");
var pwdJqueryInput = $("#pwdInput");

dateJqueryInput.bind('cut copy paste', function (e) {
    e.preventDefault();
});

pwdJqueryInput.bind('cut copy paste', function (e) {
    e.preventDefault();
});

jQuery.fn.shake = function(interval,distance,times) {
    var jTarget = $(this);
    jTarget.css('position','relative');
    for(var iter=0;iter<(times+1);iter++){
       jTarget.animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
    }
    jTarget.animate({ left: 0},interval);
};

const validateInput = () => {
    var inputString = dateInput.value;
    inputString = inputString.replaceAll("-","").replaceAll(" ","").replace(nonNumberRegex, "");
    var outputString = inputString;

    if (inputString.length > 4) {
        outputString = inputString.substring(0,2) + " - " + inputString.substring(2,4) + " - " + inputString.substring(4);
    } else if (inputString.length > 2) {
        outputString = inputString.substring(0,2) + " - " + inputString.substring(2);
    } 

    dateInput.value = outputString;

    if (inputString.length === 8) {
        let day = inputString.substring(0,2);
        let month = inputString.substring(2,4);
        let year = inputString.substring(4);
        var date = new Date(`${year}-${month}-${day}`);
        
        if(date instanceof Date && !isNaN(date)) {
            dateInput.style.borderStyle = "none";
            dateJqueryInput.prop("readonly", true);
            loadUser(date);
        } else {
            failedAttempt();
        }
    }
}

const pwdKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        console.log("launching event after pwd");
        document.loginForm.submit();
    }
}

function loadUser(birthdate) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "login/userwithbirthdate?birthdate=" + birthdate.toISOString(), true);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            var user = JSON.parse(this.responseText);
            if (user.error != null) {
                failedAttempt();
            } else {
                if (user.exist) {
                    document.getElementById("dateContainer").style.display = "none";
                    dateInput.value = birthdate.toISOString();
                    if (user.pwd) {
                        pwdJqueryInput.prop("readonly", false);
                        document.getElementById("pwdContainer").style.display = "block";
                        document.onkeydown = pwdKeyDown;
                        pwdInput.focus();
                    } else {
                        document.loginForm.submit();
                    }
                } else {
                    failedAttempt();
                }
            }
        } else if (this.readyState == 3 && this.status != 200) {
            dateJqueryInput.prop("readonly", false);
        }
    };
    xhttp.send();
}

function failedAttempt() {
    dateInput.style.borderColor = "var(--bs-red)";
    dateInput.style.borderStyle = "solid";
    dateInput.value = "";
    dateJqueryInput.prop("readonly", false);
    switch (failedAttempts) {
        case 0:
            dateJqueryInput.shake(100, 10, 3);
            break;
        case 1:
            dateJqueryInput.shake(100, 20, 3);
            break;
        case 2:
            dateJqueryInput.shake(100, 30, 3);
            dateInput.placeholder = "XX - XX - XXXX";
            dateJqueryInput.prop("disabled", true);
            dateInput.style.borderStyle = "none";
            let meep = document.body.style.background;
            document.body.style.background = 'red';
            setTimeout(() => {
                document.body.style.background = meep;
            }, 50);
            break;
        default:
            break;
    }
    failedAttempts++;
}
