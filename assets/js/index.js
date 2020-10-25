/* ------------------------------------ Toolkit ------------------------------------ */
function isEmpty(str){
  if(typeof str !== "string") return true;
  if(str.replace(/(^s*)|(s*$)/g, "").length == 0) return true;
  return false; 
}
/**
 * 寻找父元素
 */
function parentByClass(ele, className){
  var parent = ele.parentNode;
  if(parent.classList.contains(className)) return parent;
  if(parent.nodeName === "body") return null;
  return parentByClass(parent, className);
}
/**
 * 解析地址栏Url，获取参数
 * @param {String} variable - QueryString
 */
function getQueryVariable(variable) {
  var url = window.location.href;
  var x = url.indexOf("?") + 1;
  url = url.substring(x);
  if (!url) return false;
  var arr = url.split("&");
  for (let i = 0; i < arr.length; i++) {
    let cur = arr[i].split("=");
    if (cur[0] === variable) return cur[1];
  }
  return false;
}
/**
 * 全屏指定元素
 * @param {Element} ele 
 */
function fullScreen(ele) {
  const func =
    ele.requestFullscreen ||
    ele.mozRequestFullScreen ||
    ele.webkitRequestFullscreen ||
    ele.msRequestFullscreen;
  func.call(ele);
}
/**
 * generate request headers and return
 */
function getHeaders(){
  return {
    "mid": "testABC",
    "timestamp": Date.now(),
    "uid": +getYouUid(),
    "sign": 1111,
    "Content-Type": "application/json"
  }
}
/**
 * 
 * @param {String} msg - Error Message
 * @param {Interger} status - Default 0: toast-error, 1: toast-warning
 */
function UserError(msg, status){
  this.msg = msg;
  this.status = status || 0;
}
UserError.prototype.toString = function(){
  return "UserError : " + this.msg;
}
window.addEventListener("error", function(e){
  console.log("Listener Error. ",e.error);
  if(e.error instanceof UserError){
    var title = null, type = null;
    switch(e.error.status){
      case 0: title = "Error"; type = "error"; break;
      case 1: title = "Warning"; type = "warning" ; break;
    }
    if(title && type) toast(title, e.error.msg, type, 3000);
  }
  return true;
});

/* ------------------------------------ MD5 ------------------------------------ */
function md5Sign(firebaseUid, requestTime){
  var key = "fjsihaueoewh3453453rgrsdkJ(fjeKHA3eJhnj,fjo43";
  var str = firebaseUid+requestTime+key;
  // var str = "333333331223";
  return hex_md5(str).toUpperCase();
}
/* ------------------------------------ Login ------------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyCzlz-GhAwy47nRq-o2402JwulHTXbpOhY",
  authDomain: "livetube-xyz.firebaseapp.com",
  databaseURL: "https://livetube-xyz.firebaseio.com",
  projectId: "livetube-xyz",
  storageBucket: "livetube-xyz.appspot.com",
  messagingSenderId: "499030623907",
  appId: "1:499030623907:web:830069d4fbc441f9b56116",
  measurementId: "G-JSNJPVVZPB"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("Initialize Firebase.");

var ui = new firebaseui.auth.AuthUI(firebase.auth());
var uiConfig = {
  callbacks: {
    // 手动登录成功
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      config.user = authResult.user;
      /**
       * @param {object} authResult - 登录成功信息，包含用户信息
       */
      console.log("Login Success!");
      localStorage.setItem("uid", authResult.user.uid);
      localStorage.setItem("user", JSON.stringify(authResult.user));
      (async () => {
        var tokenLoader = document.getElementById("tokenLoader");
        tokenLoader.style.display = "block";
        tokenLoader.querySelector("span").innerText = "Login Success!";
        setTimeout(() => {
          hideLogin();
        }, 2000);
        login();
      })();
      return false; //false：取消自动跳转。
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById("loader").style.display = "none";
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: "popup", //redirect or popup
  signInSuccessUrl: "/admin.html?login=success",
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: "term_of_service.html",
  // Privacy policy url.
  privacyPolicyUrl: "privacy_policy.html"
};
/**
 * 
 */
function initView(user){
  // document.getElementById("gift_modal").style.display = "flex";
  console.log("InitView => ", user);
  var onlyLoginShow = document.querySelectorAll(".only-login-show");
  var onlyNologinShow = document.querySelectorAll(".only-nologin-show");
  console.log("Only login show => ", onlyLoginShow.length);
  for(var i=0; i<onlyLoginShow.length; i++) onlyLoginShow[i].style.display = user ? "inline-block" : "none";
  console.log("Only nologin show => ", onlyNologinShow.length);
  for(var j=0; j<onlyNologinShow.length; j++) onlyNologinShow[j].style.display = user ? "none" : "inline-block";
}
/**
 * 检测是否登录
 */
firebase.auth().onAuthStateChanged(function (user) {
  initView(user);
  if (user) {
    config.user = user;
    hideLogin();
    connectSocket(); //与服务器简历连接
  } else {
    // showLogin();
  }
});
/**
 * 启动FirebaseUI，初始化登录控件
 */
function uiStart(){
  ui.start("#firebaseui-auth-container", uiConfig);
}
/**
 * 用户点击登录按钮时
 */
function login(){
  var url = `https://${config.domain}/vFun2/user/login`;
  var nowTime = Date.now();
  var dataObj = {
    deviceType: 4,
    requestTime: nowTime,
    loginId: config.user.uid,
    nickName: config.user.displayName,
    sign: md5Sign(config.user.uid, nowTime),
    appId: 43,
    thirdType: 6,
    avater: config.user.photoURL
  }
  axios.post(url, dataObj).then(res => {
    console.log("Login => ", res.data);
    var data = res.data;
    if(data.msg === "success"){
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      toast("Login Success.",null, "success");
    }else throw data.msg;
  }).catch(error => {
    console.error(error);
  });
}
function showLogin(){
  localStorage.setItem("lastSLT", Date.now());
  document.getElementById("login_modal").style.display = "flex";
}
function hideLogin(){
  localStorage.setItem("lastSLT", 0);
  document.getElementById("login_modal").style.display = "none";
}
/**
 * 登出
 */
function logout(){
  console.log("Firebase : Logout!");
  firebase.auth().signOut().then(function() {
    if(!window.socket) window.socket.close();
    localStorage.removeItem("uid");
    localStorage.removeItem("token");
    console.log("Firebase : Logout Success!");
    window.location.href = "index.html";
  }).catch(function(error) {
    console.log("Firebase : Logout Error");
  });
}
/* ------------------------------------ Config and Listener ------------------------------------ */
const views = {
  waitStranger: document.getElementById("wait_stranger"),
  startOrNext: document.getElementById("start-or-next"),
  cancelNext: document.getElementById("cancel-next"),
  conversationList: document.getElementById("conversation-list"),
  gift: document.getElementById("gift"),
  youInput: document.getElementById("you-input"),
  send: document.getElementById("send-msg")
}
var config = {
  isTest: true,
  userRole: "audience",
  videoScale: 0.6, //视频宽高比例
  heartbeat: 0, 
  domain: "t.livego.live",
  strangerUid: null,
  giftList: {
    lollipop: 10,
    rose: 50,
    flowers: 300,
    rocket: 1000
  }
}
/** debounce & throttle */
function debounce(fn, seconds){
  var timeout = null;
  return function(){
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn.apply(this, arguments);
    }, seconds * 1000);
  }
}
function throttle(fn, seconds, tipsFun){
  var canRun = true;
  return function(){
    if(!canRun) {
      if(tipsFun &&  typeof tipsFun === "function") tipsFun(seconds);
      return;
    }
    canRun = false;
    fn.apply(this, arguments);
    setTimeout(() => {
      canRun = true;
    }, seconds * 1000);
  }
}
function scrollListener(){
  console.log(new Date().toLocaleString()," => Throttle ScrollListener : ", arguments);
}
window.addEventListener("scroll", throttle(scrollListener, 2));
/**
 * when window resize to excute func.
 * @param {Function} func 
 */
function addResizeListener(func){
  window.addEventListener("resize", debounce(func, 0.5));
}
function changeYouAndStrangerSize(){
  var you = document.getElementById("you-container");
  var stranger = document.getElementById("stranger-container");
  var width = you.offsetWidth;
  console.log("changeYouAndStrangerSize => You-width => ",width);
  you.style.height = `${width * config.videoScale}px`;
  stranger.style.height = `${width * config.videoScale}px`;
}
function changeChatAndContainer(){
  var youAndStranger = document.querySelector("#you-and-stranger");
  var chatContainer = document.querySelector("#chat-container");
  console.log("Change Chat Container => ", `${youAndStranger.clientHeight}px`);
  chatContainer.style.height = `${youAndStranger.clientHeight}px`;
}
changeYouAndStrangerSize();
changeChatAndContainer();
addResizeListener(changeYouAndStrangerSize);
addResizeListener(changeChatAndContainer);

function onSendMsgListener(){
  var youInput = document.getElementById("you-input");
  var sendMsgBtn = document.getElementById("send-msg");

  youInput.addEventListener("keyup", function(e){
    console.log("KeyCode => ", e.code);
    if(e.code === "Enter") {
      var str = youInput.value;
      if(isEmpty(str)) return;
      sendMsg(str.trim());
      youInput.value = "";
    }
  });
  sendMsgBtn.addEventListener("click", function(){
    console.log("Click SendMsg button.");
    var str = youInput.value;
    if(isEmpty(str)) return;
    sendMsg(str.trim());
    youInput.value = "";
  });
}
onSendMsgListener();
/* ------------------------------------ Call ------------------------------------ */
/**
 * 1.用户发起视频通话 
 */
function callStranger(){
  var url = `https://${config.domain}/api3/video/call`;
  var dataObj = {
    roomId: option.channel,
    agoId: option.appID,
    remoteUid: getStrangerUid(),
    remoteId: option.uid,
    remoteToken: option.token
  }
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    if(res.data.msg === "success"){
      var result = res.data;
      initAgoraOption(result.data);
      initAgora(true);
    }else throw `Status : ${res.data.status}`;
  }).catch(error => {
    console.error("Call Stranger Error.", error);
  });
}
/**
 * 2.平台服务器转发用户发起的视频通话给主播
 * @param {*} obj 
 */
function videoCallYou(obj){
  config.callYouTime = Date.now();
  console.log("Receive Video Call.",obj);
  config.chatNo = obj.chatNo;
  initAgoraOption(obj);
  config.strangerUid = obj.remoteUid;
  // initAgora();
  config.userRole = "host";
  console.log("2.平台服务器转发用户发起的视频通话给主播");
  toast("2.平台服务器转发用户发起的视频通话给主播");
}
/**
 * 3.主播接起视频通话
 */
function answerCall(){
  var url = `https://${config.domain}/api3/video/answer`;
  var dataObj = {
    roomId: option.channel,
    remoteUid: +getStrangerUid(),
    status: 1
  }
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    console.error("3.主播接起视频通话 ", res.data);
    toast("3.主播接起视频通话",null, "success");
  }).catch(error => {
    console.error("3.主播接起视频通话 - 错误", error);
    toast("3.主播接起视频通话 - 错误",null, "error");
  });
}
/**
 * 4.平台服务器转发主播接起视频通话给用户
 */
function strangerAnswerCall(obj){
  console.log("4.平台服务器转发主播接起视频通话给用户", obj);
  config.chatNo = obj.chatNo;
  toast("4.平台服务器转发主播接起视频通话给用户");
  // initAgora();
  publishLocalStream();
}
/**
 * 5.接起视频通话后挂断电话
 */
function youHangup(){
  var url = `https://${config.domain}/api3/video/close`;
  var dataObj = {
    roomId: option.channel,
    remoteUid: +getStrangerUid()
  }
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    console.log("5.接起视频通话后挂断电话", res.data);
    toast("5.接起视频通话后挂断电话");
  }).catch(error => {
    console.log("5.接起视频通话后挂断电话 - 错误", res.data);
    toast("5.接起视频通话后挂断电话 - 错误");
  });
  leaveChannel();
  config.chatNo = null;
}
/**
 * 6.平台服务端转发挂断电话给对方
 */
function strangerHangupYou(obj){
  console.log("6.平台服务端转发挂断电话给对方", obj);
  toast("6.平台服务端转发挂断电话给对方"+obj.chatNo);
  if(obj.chatNo = config.chatNo) {
    leaveChannel();
    toast("ChatNo一致，挂断电话。");
  }
}
/** 7.平台服务端会每隔10s检查商户的余额是否满足当前通话，若是不满足，会主动发 CC 命令给用户端和主播端 */
/**
 * 对面挂断电话或者断线
 */
function strangerHangup(){
  toast("Stranger already leave.", null, null, 5000);
  document.querySelector("#stranger-container > div:last-child").remove();
}
function debugCall(){
  console.log(`YouUid: ${getYouUid()} - strangerUid: ${getStrangerUid()}`);
  console.log("You Role: ", config.userRole);
  console.log("Option: ", option);
}
/* ------------------------------------ Chat ------------------------------------ */
function receiveMsg(msg, isGift){
  var msgNode = document.createElement("p");
  msgNode.setAttribute("class", isGift ? "gift-msg" : "stranger-msg");
  msgNode.innerText = msg;
  document.getElementById("conversation-list").appendChild(msgNode);
}
function sendMsg(msg){
  if(!window.socket) throw new UserError("No Connected Server.", 1);
  if(!config.strangerUid) throw new UserError("No Match Stranger.", 1);
  var msgNode = document.createElement("p");
  var randomId = Math.random().toString().substr(2);
  msgNode.setAttribute("class", `you-msg sending-msg id-${randomId}`);
  msgNode.innerText = msg;
  document.getElementById("conversation-list").appendChild(msgNode);
  var url = `https://${config.domain}/api3/message/send`;
  var dataObj = {
    relateUid: +getStrangerUid(),
    content: msg
  }
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    console.log("Success + Send message + ", res.data);
    if(res.data.msg === "success") {
      setTimeout(() => {
        document.querySelector(`.id-${randomId}`).classList.remove("sending-msg");
      }, 500);
    }
    else document.querySelector(`.id-${randomId}`).classList.add("send-failed");
  }).catch(error => {
    console.error(error);
    document.querySelector(`.id-${randomId}`).classList.add("send-failed");
  });
}
function initConnect(wss){
  if(config.isTest) return;
  var onlyConnectUser = document.querySelectorAll(".only-connect-use");
  console.log("Only Connect use - length : ", onlyConnectUser.length);
  for(var i=0; i<onlyConnectUser.length; i++) onlyConnectUser[i].setAttribute("disabled",`${!Boolean(wss)}`);
}
function commitReceiveMsg(){

}
/**
 * Only Login Excute.
 */
function connectSocket(){
  if(!config.user) throw "No Login";
  console.log("ConnectSocket");
  var serverState = document.getElementById("server-state");

  // Create WebSocket connection.
  window.socket = new WebSocket(`wss://${config.domain}/ws?mid=testABC&timestamp=${Date.now()}&uid=${getYouUid()}&sign=1111`);

  // Connection opened
  socket.addEventListener('open', function (event) {
    initConnect(window.socket);
    serverState.innerText = "Already Connected."
    startHeartBeat();
    console.log("Already connected server \n", event);
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
      var obj = JSON.parse(event.data);
      if(obj.key !== "HB") console.log("Message from server : ", event.data);
      switch(obj.key){
        case "MC": {
          var isGift = obj.temp === "3";
          receiveMsg(obj.value, isGift);
        } break;
        case "SC": videoCallYou(obj); break;
        case "HB": config.heartbeat++; if(config.headers % 10 === 1) console.log("Heartbeat : ", config.heartbeat); break;
        case "AC": strangerAnswerCall(obj); break;
        case "CC": strangerHangupYou(obj); console.warn(obj); break;
        default: console.log(obj); break;
      }
  });

  socket.addEventListener('close', function(event){
    window.socket = null;
    initConnect(window.socket);
    serverState.innerText = "Disconnect Server.";
    console.log("Disconnect server \n", event);
  });
}
/**
 * keep socket alive
 */
function startHeartBeat(){
  setTimeout(() => {
    if(window.socket){
      window.socket.send('{"version":5,"key":"HB","value":1}');
      startHeartBeat();
    }else console.log("Socket Disconnect, Stop Heartbeat");
  }, 10 * 1000);
}
/**
 * 
 */
function getStrangerUid(){
  if(config.isTest){
    return config.strangerUid;
  }
}
function getYouUid(){
  try{
    if(config.user.uid === "FdWwVWVhiwMItpbLdRZ0HkyyixG2") return "24680";
    else return "13579";
  }catch(error){
    return null;
  }
}
/**
 * Only Login Excute.
 */
function getRandomStranger(){
  if(config.chatNo){
    toast("正在通话中，主动挂断电话");
    youHangup();
  }
  var url = `https://${config.domain}/api/together`;
  axios.post(url, {}, { headers: getHeaders()}).then(res => {
    console.log("Success + get random stranger + ", res.data);
    var result = res.data;
    if(result.msg === "success") {
      config.strangerUid = result.data.userInfo.uid;
      initAgoraOption(result.data);
      // initAgora(true);
      if(getYouUid() < getStrangerUid()){
        console.log("用户发起视频通话");
        toast("1 - 用户发起视频通话");
        callStranger();
        config.userRole = "audience";
      }else{
        config.userRole = "host";
      }
      toast("You Role: "+ config.userRole);
    }
    else throw "Failed : GetRandomStranger";
  }).catch(error => {
    console.error(error);
    toast("getRandomStrangerError: "+error);
  });
}
function addChatListener(){
  views.startOrNext.addEventListener("change", function(){
    var isNext = this.checked;
    if(!config.user){
      this.checked = false;
      showLogin();
      return;
    }
    var nowTime = Date.now(), callYouTime = config.callYouTime || 0, lastMatchTime = config.lastMatchTime || 0;
    // if(!isNext && (nowTime - lastMatchTime) < 10 * 1000 ){
    //   toast("请勿重复点击，10s内只能匹配一次。");
    //   views.startOrNext.checked = false;
    //   return;
    // }
    // config.lastMatchTime = Date.now();
    toast(`NowTime: ${nowTime} - CallYouTime: ${callYouTime} - 时间差：${nowTime - callYouTime}`);
    if((nowTime - callYouTime) < 20 * 1000){
      // config.noFirstCall = true;
      toast("已收到对方请求，现在接通。",null,null,10000);
      initAgora();
      config.callYouTime = 0;
      config.noFirstMatch = true;
      views.waitStranger.style.display = "block";
      views.startOrNext.checked = false;
      document.querySelector(".start-or-cancel").classList.add("have-stranger");
      config.noFirstMatch = true;
      return;
    }else if(callYouTime > 1){
      toast("长时间未接听对方通话邀请，服务器自动挂断", null, "warn", 5 * 1000);
    }else {
      toast("未收到对方请求，准备主动发起请求。");
    }
    // toast(""+isNext,null,"tips");
    if(!isNext || !config.noFirstMatch){
      toast("Already Login. Start match random stranger.");
      getRandomStranger();
      config.noFirstMatch = true;
      views.waitStranger.style.display = "block";
      views.startOrNext.checked = false;
      document.querySelector(".start-or-cancel").classList.add("have-stranger");
    }else {
      toast("Really Next?","Clcik <Really?> Button to Match Next Stranger.", "warn", 6000);
    }
  });
  views.cancelNext.addEventListener("click", function(){
    views.startOrNext.checked = false;
  })
}
addChatListener();
/* ------------------------------------ Agora ------------------------------------ */
var rtc = {
  client: null,
  joined: false,
  published: false,
  localStream: null,
  remoteStreams: [],
  params: {}
};
// Options for joining a channel
var option = {
  appID: null,
  channel: null,
  uid: null,
  token: null
}

function initAgoraOption(obj){
  option.appID = obj.agoId;
  option.channel = obj.roomId;
  option.uid = obj.id || obj.remoteId;
  option.token = obj.token;
}
// Create a client
rtc.client = AgoraRTC.createClient({mode: "rtc", codec: "h264"});
function initAgora(noRelease){
  console.log("initAgora : ", option.uid);
  //1 - Initialize the client
  rtc.client.init(option.appID, function () {
    console.log("1 - init success");
    // Join a channel
    rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, function (uid) {
      console.log("2 - join channel: " + option.channel + " success, uid: " + uid);
      rtc.params.uid = uid;
      releaseLocalStream(noRelease);
    }, function(err) {
      console.error("2 - client join failed", err)
    });
    }, (err) => {
    console.error("1 - ", err);
  });
  addStreamListener();
}
/**
 * 
 */
function releaseLocalStream(noRelease){
  console.log("Release Local Stream.");
  //3 - Create a local stream
  rtc.localStream = AgoraRTC.createStream({
    streamID: rtc.params.uid,
    audio: true,
    video: false,
    screen: true,
  });
  //3 - Initialize the local stream
  rtc.localStream.setScreenProfile("480p_2");
  rtc.localStream.init(function () {
    console.log("3 - init local stream success");
    //3.1 - play stream with html element id "local_stream"
    console.log("3.1 - play local stream");
    rtc.localStream.play("you-container",  {fit: "contain"});
    //3.2 - Publish the local stream
    if(noRelease) return;
    publishLocalStream();
  }, function (err) {
    console.error("3 - init local stream failed ", err);
    if(err.msg === "NotAllowedError"){
      toast(err.info, err.msg, "error", 5000);
    }else toast("Video Chat Error");
  });
}
function publishLocalStream(){
  rtc.client.publish(rtc.localStream, function (err) {
    console.log("3.2 - publish failed");
    console.error(err);
  });
  toast("Publish localstream : "+config.userRole, null,null, 10 * 1000);
  if(config.userRole === "host") {
    toast("AnswerCall => Publish localstream : "+getYouUid(), null,null, 10 * 1000);
    answerCall();
  }
}
/**
 * 
 */
// var alreadyAddStreamListener = false;
function addStreamListener(){
  // if(alreadyAddStreamListener) return;
  rtc.client.on("stream-added", function (evt) {  
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    if (id !== rtc.params.uid) {
      rtc.client.subscribe(remoteStream, function (err) {
        console.log("stream subscribe failed", err);
      });
    }
    console.log('stream-added remote-uid: ', id);
  });
  
  rtc.client.on("stream-subscribed", function (evt) {
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    // Add a view for the remote stream.
    // addView(id);
    // Play the remote stream.
    // remoteStream.play("remote_video_" + id,  {fit: "contain"});
    console.info("------ Stream subscribed. ------ ");
    remoteStream.play("stranger-container", {fit: "contain"});
    console.log('stream-subscribed remote-uid: ', id);
  });

  rtc.client.on("stream-removed", function (evt) {
    toast("Really Remove Remote Stream. ", null, "warn", 10 * 1000);
    var remoteStream = evt.stream;
    var id = remoteStream.getId();
    var strangerVideo = document.querySelector("#stranger-container > div:last-child");
    if(strangerVideo.id.match("player")) {
      remoteStream.stop(strangerVideo.id);
      toast("Remove StrangerStream : ", strangerVideo.id, "warn", 10 * 1000);
      strangerVideo.remove();
    }
    console.log('stream-removed remote-uid: ', id);
  });
  // alreadyAddStreamListener = true;
  rtc.client.on("stream-unpublished", function(evt) {
    toast("local stream unpublished", null, null, 3 * 1000);
  });
}
/**
 * 
 */
function leaveChannel(){
  config.strangerUid = null;
  config.chatNo = null;
  if(!rtc.client) return;
  rtc.client.unpublish(rtc.localStream, function(err){
    toast("取消发布本地流失败", JSON.stringify(err), "warn", 5 * 1000);
  });
  rtc.client.leave(function () {
    // Stop playing the local stream
    if(!rtc.localStream) return;
    rtc.localStream.stop();
    // Close the local stream
    rtc.localStream.close();
    // Stop playing the remote streams and remove the views
    var youVideo = document.querySelector("#you-container > div:last-child");
    if(youVideo.id.match("player")) youVideo.remove();
    console.log("client leaves channel success");
  }, function (err) {
    console.log("channel leave failed");
    console.error(err);
  });
}

/* ------------------------------------ Gift ------------------------------------ */
(() => {
  views.gift.onclick = function(){
    var giftModal = document.getElementById("gift_modal");
    giftModal.style.display = "flex";
  }
  var gifts = document.querySelectorAll(".gift-item");
  for(var i=0; i<gifts.length; i++){
    var curGift = gifts[i];
    curGift.addEventListener("click", function(){
      sendGift(this.getAttribute("alt"));
    })
  }
})();
function showModal(id){
  var modal = document.querySelector(`#${id}`);
  if(!modal) throw `No Modal -> #${id}`;
  modal.style.display = "flex";
}
function hideModal(e){
  var parent = parentByClass(e, "modal");
  parent.style.display = "none";
}
function sendGift(giftName){
  if(isEmpty(giftName)) {
    toast("Gift name is : "+giftName,null,"",3000);
    return;
  }else if(!config.user) {
    toast("No Login, Click <Login> button to login.");
    return;
  }else if(!config.strangerUid) {
    toast("No match stranger, Click <Start> button to match.");
    return;
  }
  var url = `https://${config.domain}/api/user/reward`;
  var dataObj = {
    remoteUid: getStrangerUid(),
    key: "web",
    value: config.giftList[giftName.toLowerCase()] + "",
    Type: giftName
  }
  console.log("Send Gift : ", dataObj);
  axios.post(url, dataObj, { headers: getHeaders() }).then(res => {
    if(res.data.msg === "success"){
      toast("Success!","thank your gift.", "", 2000);
    }else throw res.data.msg;
  }).catch(error => {
    toast("Failed. ",error, "error", 2000);
    showRechargeList();
  });
}
/* ------------------------------------ Recharge ------------------------------------ */
function showRechargeList(){
  if(!config.loadRechargeList) initRechargeList();
  showModal("recharge_modal");
}
var rechargeArr = null;
function initRechargeList(){
  var url = `https://${config.domain}/api/product/list`;
  axios.post(url, { query: { appCode: "vfun"}}, { headers: getHeaders() }).then(res => {
    if(res.data.msg === "success"){
      console.log(res.data);
      rechargeArr = res.data.data;
      renderRechargeList(res.data.data);
    }else throw res.data.msg;
  }).catch(error => {
    console.error(error);
  })
}
function renderRechargeList(arr){
  var iconList = ["/assets/img/diamond-1.png", "/assets/img/diamond-2.png", "/assets/img/diamond-3.png",
  "/assets/img/diamond-4.png", "/assets/img/diamond-5.png", "/assets/img/diamond-6.png"];
  var rechargeList = document.getElementById("recharge_list");
  rechargeList.innerHTML = "";
  for(var i=0; i<4; i++){
    var cur = arr[i];
    var curNode = document.createElement("div");
    curNode.setAttribute("alt", cur.productIosId);
    curNode.setAttribute("class", `recharge-item${i===2 ? " hot" : ""}`);
    curNode.innerHTML = `<div class="recharge-diamond"><div class="diamond-container"><img class="cus-icon" src="${iconList[i%6]}"/></div><span class="diamond-number">${cur.diamond}</span></div><span class="recharge-money">${cur.money}</span>`;
    rechargeList.appendChild(curNode);
    curNode.addEventListener("click", function(){
      showPaymentList(this.getAttribute("alt"));
    });
  }
}
function showPaymentList(productIosId){
  showModal("payment_modal");
  config.productIosId = productIosId;
}
function choosePayment(payment){
  var productIosId = config.productIosId;
  if(payment === "stripe") rechargeDiamond(productIosId, "stripe");
  else toast(payment, "No Use.", "", 3000);
}
function rechargeDiamond(productIosId, payment){
  console.log("productIosId : ", productIosId);
  if(!productIosId) {
    toast("No ProductIosId");
    return;
  }
  if(payment === "stripe") rechargeByStripe(productIosId);
}
function queryDiamond(call){
  var url = `https://${config.domain}/api/user/info`;
  axios.post(url, { code: getYouUid() }, { headers: getHeaders()}).then(res => {
    var diamond = res.data.data.diamond;
    call({success: true, diamond: diamond});
  }).catch(error => {
    call({success: false, error: error});
  });
}
function rechargeSuccess(result){
  console.log("Recharge Success.", result);
  var modals = document.querySelectorAll(".modal:not(#recharge_modal)");
  console.log("modals.length : ", modals.lengthg);
  for(var i=0; i<modals.length; i++) modals[i].style.display = "none";
  setTimeout(function(){
    queryDiamond(obj => {
      if(obj.success) toast("Success Recharge.", `You balance is : ${obj.diamond} diamond`, "success", 3000);
      else toast("Query balance error!", obj.error, "error", 3000);
    });
  }, 500);
}
function rechargeFailed(obj){
  console.error("Recharge Failed.", obj);
}
/* ------------------------------------ Stripe ------------------------------------ */
const stripe = Stripe("pk_test_kKiIIn5jbIixQ96SV4NpPZyf00hulVQYuC");
// 生产环境 - pk_live_Zt23ptBqWWJ8as6k2MBUF3xn00XviuaLpZ
function rechargeByStripe(productIosId){
  showModal("stripe_modal");
  var url = `https://${config.domain}/api/stripe/payment/init`;
  var dataObj = {
    productId: productIosId+"",
    type: 10
  };
  axios.post(url, dataObj, { headers: getHeaders()}).then(res => {
    var data = res.data;
    if(data.msg !== "success"){
      throw data.msg;
    }
    console.log("Recharge By Stripe : ",data);
    var elements = stripe.elements();
    var style = {
      base: {
        color: "#32325d",
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d"
        }
      },
      invalid: {
        fontFamily: 'Arial, sans-serif',
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    };
    var card = elements.create("card", { style: style });
    // Stripe injects an iframe into the DOM
    card.mount("#card-element");
    card.on("change", function (event) {
      // Disable the Pay button if there are no card details in the Element
      document.querySelector("button").disabled = event.empty;
      document.querySelector("#card-error").textContent = event.error ? event.error.message : "";
    });
    var form = document.getElementById("payment-form");
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      // Complete payment when the submit button is clicked
      payWithCard(stripe, card, data.data);
    });
  }).catch(error => {
    console.error(error);
    toast("Error!", error, "error", 5000);
  });
}

// Calls stripe.confirmCardPayment
// If the card requires authentication Stripe shows a pop-up modal to
// prompt the user to enter authentication details without leaving your page.
var payWithCard = function(stripe_, card, clientSecret) {
  loading(true);
  stripe_
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card
      }
    })
    .then(function(result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
        rechargeFailed( {payment: "stripe", error: result.error} );
      } else {
        // The payment succeeded!
        orderComplete(result.paymentIntent.id);
        rechargeSuccess({ payment: "stripe"} );
      }
    });
};
/* ------- UI helpers ------- */
// Shows a success message when the payment is complete
var orderComplete = function(paymentIntentId) {
  loading(false);
  document
    .querySelector(".result-message a")
    .setAttribute(
      "href",
      "https://dashboard.stripe.com/test/payments/" + paymentIntentId
    );
  document.querySelector(".result-message").classList.remove("hidden");
  document.querySelector("#submit").disabled = true;
};
// Show the customer the error from Stripe if their card fails to charge
var showError = function(errorMsgText) {
  loading(false);
  var errorMsg = document.querySelector("#card-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function() {
    errorMsg.textContent = "";
  }, 4000);
};
// Show a spinner on payment submission
var loading = function(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};

/* ------------------------------------ Toast ------------------------------------ */
function delayRemoveToast(itemNode, duration){
  setTimeout(function(){
    itemNode.classList.add("remove-toast-item");
    setTimeout(function(){
      itemNode.remove();
    }, 500);
  }, duration);
}
/**
 * 懒函数
 */
function getToastList(){
  var list = document.getElementById("toast_list");
  getToastList = function(){
    return list;
  }
  return getToastList();
}
function toast(title, msg , type, duration) {
  console.log("%c"+title, "font-size: 20px; background: #4285f4; color: #FFF;");
  if(!title) throw new UserError("Toast must set Title");
  if(!duration) duration = 2000;
  var item = document.createElement("div");
  item.setAttribute("class", "toast-item");
  if(typeof type === "string") item.setAttribute("alt", type);

  var titleNode = document.createElement("h2");
  titleNode.setAttribute("class", "toast-title");
  titleNode.innerText = title;
  item.appendChild(titleNode);

  if(msg && msg.length > 0){
    var msgNode = document.createElement("p");
    msgNode.setAttribute("class", "toast-msg");
    msgNode.innerText = msg;
    item.appendChild(msgNode);
  }
  getToastList().appendChild(item);
  delayRemoveToast(item, duration);
}