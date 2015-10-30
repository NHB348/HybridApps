//Regexes
var emailRgx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var dataRgx = /^[0-9a-zA-Z!@#$%^&*.,_=]{2,15}$/;

var APP_NAME = 'DSVDriver';
var SERVER_ROOT = '';
var DSV = {};
DSV.constants = {};

if (typeof Rho !== "undefined") {
	SERVER_ROOT = "http://192.168.0.101:10080/DSVMobile/"; // create a wifi connection for WM
	DSV.constants.version = "1.0.0";
	DSV.constants.framework = "RhoElemets 5.1.1";
} else {
	if (typeof WL !== "undefined") {
		SERVER_ROOT = WL.StaticAppProps.PREVIEW_ROOT_URL;
		DSV.constants.version = WL.StaticAppProps.APP_VERSION;
		DSV.constants.framework = "IBM MobileFirst Platform " + WL.StaticAppProps.WORKLIGHT_PLATFORM_VERSION;
	} else {
		SERVER_ROOT = "http://192.168.0.101:10080/DSVMobile/";
		DSV.constants.version = "1.0.0";
		DSV.constants.framework = "RhoMobile 5.2.2";
	}
}

DSV.constants.isMocked = true;

DSV.constants.stopTypes = ["todo", "canceled", "done"];

// Collections in Local DB
DSV.constants.DSVDrivers = "Drivers";
DSV.constants.DSVStops = "Stops";
DSV.constants.DSVNewStops = "NewStops";
DSV.constants.DSVSettings = "Settings";
DSV.constants.DSVDeviations = "Deviations";
DSV.constants.DSVLanguages = "Languages";
DSV.constants.DSVReceivers = "Receivers";

DSV.constants.timeout = 20 * 1000;
DSV.constants.lastConnectionTime = null;
DSV.constants.toastTimeout = 2000;
DSV.constants.statusBarInterval = 30 * 1000;
DSV.constants.heartBeatInterval = 45 * 1000;
DSV.constants.syncTransportInterval = 42 * 1000;

DSV.constants.stopsListPageSize = 4;
DSV.constants.fullListPageSize = 8;
DSV.constants.group1Height = 640; // pixels
DSV.constants.group2Height = 800; // pixels
DSV.constants.documentHeight = 640; // pixels
DSV.constants.documentWidth = 480; //pixels
DSV.constants.headerHeight = 48; // dp
DSV.constants.statusBarHeight = typeof Rho !== "undefined" ? 28 : 0; // dp
DSV.constants.groupItemCountPerPage = 7;
DSV.constants.vehicleCountPerPage = 3;
DSV.constants.maxDeviatedItems = 4;

DSV.constants.rho = typeof Rho !== "undefined" ? 1 : 0;

DSV.searchFields = {};
DSV.searchFields[DSV.constants.DSVDrivers] = { username: "string" };
DSV.searchFields[DSV.constants.DSVStops] = { id: "string" };
DSV.searchFields[DSV.constants.DSVNewStops] = { id: "string" };
DSV.searchFields[DSV.constants.DSVSettings] = { id: "string" };
DSV.searchFields[DSV.constants.DSVDeviations] = { id: "integer" };
DSV.searchFields[DSV.constants.DSVLanguages] = { id: "integer" };
DSV.searchFields[DSV.constants.DSVReceivers] = { name: "string", city: "string"};

DSV.status = {};

DSV.settings = [
        { "key": "10000", "value": "English (en-GB)" },
	    { "key": "10100", "value": true },
	    { "key": "10200", "value": "Signature" },
	    { "key": "10300", "value": 5 },
	    { "key": "10400", "value": true },
	    { "key": "10500", "value": true },
	    { "key": "10600", "value": "Load Sequence (asc.)"}
	];

DSV.deviations = {};

// fill with real data from login
DSV.driver = {
	username: 'eusebiu',
	token: 'asdfgt',
	expirationDate: 0,
	vehicle: '123',
	isTransport: true,
	transportRoute: 'aaaaaa-1234',
	routeDate: '',
	existsTransportRoute: true	
};

DSV.constants.__localStop = null;