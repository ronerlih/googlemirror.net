var img = document.querySelector("img");
var canvas = document.querySelector("canvas");
var video = document.querySelector("video");
var uiFrame = document.getElementById("uiFrame");
var imgContainer =$("#img-container");
var themeToggle = $("#theme-toggle");
var frame = $(".main-frame");
var mobileFrame = $("#mobile-frame");
var outerFrame = $(".outer-frame");
var errorImageUrl = "https://image.shutterstock.com/z/stock-photo-confused-man-scratching-head-94941589.jpg";

var opacityValue = 0;
var intervalReset = null;
var videoElementWidth;

var xhrHandle;
var formDataImage;
var blob;
var ajaxState;
var ajaxError;
var globalData;
var framePadding = 0;
var fullScreenState = false;

var errorCallbackVideo = errorCallbackVideo;
var successCallbackVideo = successCallbackVideo;
var firstFadeInFlag = true;
var firstGetUserMediaErrorFlag = true;

var captchaMessege =
   "ok... soo, google got our robot, <br> and they don׳t like us snooping around,<br> somewhere in the forest there's a captcha box that nobody reads.<br> we're trying out another trick <br> please wait for the next image,<br> or come back another time<br> if it persists.<br> thanks.";
var noServiceMessege = "hmm.. no service<br> Please check the internet service<br>";
var slowServiceMessege = "hmm.. slow service<br> Please check your internet connection and we'll check our side, hallo?? haallooO?";
var generalErrorMessege = "scratching our heads, something went wrong,<br>Please reFRESH<br>";

//get the camera stream (start the app)
setupCameraStream();
//successful video - after welcome messege - play stream
function successCallbackVideo(stream) {
   setTimeout(function () {
      $("#allowCamera").hide();

      // show outer border
      if (video.mozSrcObject !== undefined) {
         video.mozSrcObject = stream;
      } else if (video.srcObject !== undefined) {
         video.srcObject = stream;
      } else {
         video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      }
      video.play();

      setTimeout(function () {
         // set outer frame
         outerFrame
            .css({
               height: "calc(100vh - 140px)",
            })
            .addClass("show-border");

         console.log({ video });
         outerFrame.css({
            width: video.offsetWidth - framePadding - 4 + "px",
         });

         // block for next content
         uiFrame.style.height = video.offsetWidth + "px";
         uiFrame.style.display = "block";

         // frame dimentions
         frame
            .css({
               height: video.offsetHeight + "px",
               width: video.offsetWidth - (framePadding * 2 + 4) + "px",
            })
            .addClass("show-main-frame");
         frame.css("position", "relative");

         if (innerWidth < 768) {
            mobileFrame.show();
         }
         startGoogleMirrorTimers();
      }, 200);
      //start the interval -- choo choooooww
   }, 1000);
}
//picks up: user denied camera or not compatable
function errorCallbackVideo(e) {
   if (firstGetUserMediaErrorFlag == true) {
      setTimeout(function () {
         setupCameraStream();
      }, 1000);
      firstGetUserMediaErrorFlag = false;
   } else {
      setTimeout(function () {
         $("#allowCamera").hide();
         console.log("getUserMedia Reeeejected!", e);
         $("#appleUsersPage").show();
         $("#infoDiv, #studioCredit").show();
         var docHeight = $(document).height(window.innerHeight);
         docHeight = docHeight - 25;
         $("#studioCredit").css("top", docHeight);
      }, 3000);
   }
}
function processAjax(state, data) {
   switch (state) {
      case "success":
         console.log("processing  request in success state: " + state, ", result image is: " + data);
         var result = data.toString().trim();
         if (result != "[object Object]" && result != "captcha") {
            $("#img").attr("src", data);
            $("#systemMessege").hide();
            $("#googleUrlDisplay").html(data);
            $("#canvas").show().fadeTo(2000,0)
            setTimeout(function () {
               imageFrontEndTransition();

            }, 500);
         } else {
            console.log(
               "Darn it! google caught our boti-bot" +
                  "\n" +
                  "server will replace the google local domain it points to, its user-agent" +
                  "\n" +
                  "and a few other tricks, wink wink."
            );
            $("#systemMessege").show().children("p").html(captchaMessege);
            $("#img").attr("src", errorImageUrl);
            $("#googleUrlDisplay").html(errorImageUrl);
            setTimeout(function () {
               imageFrontEndTransition();
            }, 1500);
         }
         break;
      case "error":
         ajaxError();
         //no internet service error
         $("#systemMessege").show().children("p").html(noServiceMessege);
         break;
      case "timeout":
         ajaxError();
         $("#systemMessege").show().children("p").html(slowServiceMessege);
         break;
      default:
         ajaxError();
         $("#systemMessege").show().children("p").html(generalErrorMessege);
         break;
   }
   function ajaxError() {
      xhrHandle.abort();
      $("#img").attr("src", errorImageUrl);
      $("#googleUrlDisplay").html(errorImageUrl);
      setTimeout(function () {
         imageFrontEndTransition();
      }, 1500);
      console.log("ajax error: " + state);
   }
   return false;
}
function imageFrontEndTransition() {
   //broken links (ads, ad-block, diguising as images and other nasties)
   try {
      $("#img, #googleUrlDisplay, #googleLogo").show();
   } catch (err) {
      console.log("errror drawing image: " + err);
      $("#img").attr("src", "");
   }
   intervalReset = setInterval(fadeCameraOut, 15);
   $("#loadingSpinner").hide();
}

function startGoogleMirrorTimers() {
   if (firstFadeInFlag == true) {
      intervalReset = setInterval(fadeCameraIn, 10);
      //catch all devices video initiation timing
      setTimeout(function () {
         setElemetsSizes();
      }, 1);
      firstFadeInFlag = false;
   } else {
      intervalReset = setInterval(fadeCameraIn, 15);
   }
   
   console.log("googleMirror timers restarted.. get ready.. ");
}
function fadeCameraIn() {
   if (opacityValue >= 1) {
      clearInterval(intervalReset);
      $("#loadingSpinner").show();
      saveFrame();
      $("#canvas").show().fadeTo(500,0.85);

      returnAjax();
   } else { 
      opacityValue = opacityValue + 0.001;
      video.style.opacity = opacityValue;
   }
}
function fadeCameraOut() {
   if (opacityValue <= 0) {
      clearInterval(intervalReset);
      startGoogleMirrorTimers();
   } else {
      opacityValue = opacityValue - 0.001;
      video.style.opacity = opacityValue;
   }
}
function saveFrame() {
   //scale down to send to server
   var videoWidth = $("video").width() * 0.25;
   var videoHeight = $("video").height() * 0.25;
   $(canvas).attr({
      width: videoWidth ,
      height: videoHeight ,
   });
   var context = canvas.getContext("2d");
   context.drawImage(video, 0, 0, canvas.width, canvas.height);

   var dataURL = canvas.toDataURL(1);
   blob = dataURItoBlob(dataURL);
   var imageFile = blobToFile(blob, "img.png");

   //scale back up and draw
   videoWidth = videoWidth * 4;
   videoHeight = videoHeight * 4;
   $(canvas).attr({
      width: videoWidth ,
      height: videoHeight ,
   });
   context.drawImage(video, 0, 0, canvas.width, canvas.height);

   formDataImage = new FormData();
   formDataImage.append("img", imageFile, "img.png");
   // $('#loadingSpinner').show();
}
function returnAjax() {
   xhrHandle = $.ajax({
      type: "POST",
      url: "/upload",
      data: formDataImage,
      processData: false,
      contentType: false,
      beforeSend: function () {
         $("#systemMessege").hide();
      },
      success: function () {
         ajaxState = "success";
         ajaxError = "success";
      },
      error: function (status, err) {
         ajaxState = "error";
         console.log("ajax error state, status is: " + status + ", error is: " + err);
         ajaxError = err;
         data = errorImageUrl;
         processAjax(ajaxError, data);
      },
   }).done(function (data, ajaxState, ajaxError) {
      console.log("ajax call is complete");
      //release request - internet disconnet fail safe
      xhrHandle.abort();
      processAjax(ajaxState, data);
   });
   return false;
}

function dataURItoBlob(dataURI) {
   // convert base64/URLEncoded data component to raw binary data held in a string
   var byteString;
   if (dataURI.split(",")[0].indexOf("base64") >= 0) byteString = atob(dataURI.split(",")[1]);
   else byteString = unescape(dataURI.split(",")[1]);
   // separate out the mime component
   var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
   // write the bytes of the string to a typed array
   var ia = new Uint8Array(byteString.length);
   for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
   }
   return new Blob([ia], { type: mimeString });
}
function blobToFile(theBlob, fileName) {
   theBlob.lastModifiedDate = new Date();
   theBlob.name = fileName;
   return theBlob;
}
function setElemetsSizes() {
   themeToggle.show();
   themeToggle.on('click', toggleFullScreen)

   var videoEl = $("video");
   videoElementWidth = videoEl.width();
   // videoEl.width(videoElementWidth)
   var videoElementHeight = videoEl.height();
   $("#img").width(videoElementWidth);
   $("#img").height(videoElementHeight);
   imgContainer.width(videoElementWidth);
   // $("#infoDiv").width(videoElementWidth)
   // $("#infoDiv").css("margin-top", videoElementHeight + 80);
   //                $('#loadingSpinner').css('top', ( videoElementHeight + 100 ) * 0.5 );
   $("#infoDiv, #studioCredit").show();
   var docHeight = $("#infoDiv").height() + $("#infoDiv").offset();
   $("#studioCredit").css("top", docHeight);
}
function toggleFullScreen() {
   this.style.background = "black"
   this.style.border = "2px solid darkgray";
   this.style.left = "1px";

   this.textContent = "🍄"
   if (fullScreenState) {
      location.reload();
   } else {
      outerFrame.css({
         height: "100vh",
         width: "100vw",
         marginTop: 0,
         background: "black" 
      });
      fullScreenState = true;
   }
  

   setElemetsSizes()
}
function setupCameraStream() {
   navigator.getUserMedia =
      navigator.mediaDevices.getUserMedia ||
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
   window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

   if (navigator.getUserMedia) {
      navigator.mediaDevices
         .getUserMedia({
            audio: false,
            video: {
               facingMode: "user",
            },
         })
         .then(successCallbackVideo)
         .catch(errorCallbackVideo);
   } else {
      console.log("Native device media streaming (getUserMedia) not supported in this browser.");
      errorCallbackVideo();
   }
}