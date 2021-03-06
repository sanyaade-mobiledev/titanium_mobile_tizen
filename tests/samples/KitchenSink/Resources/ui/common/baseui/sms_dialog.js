function sms_dialog() {
	var win = Ti.UI.createWindow();

	// initialize to all modes
	win.orientationModes = [
		Titanium.UI.PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT,
		Titanium.UI.LANDSCAPE_RIGHT
	];

	win.addEventListener('open', function () {
		var SMSDialog = Titanium.UI.createSMSDialog();
		if (!SMSDialog.isSupported()) {
			Ti.UI.createAlertDialog({
				title: 'Error',
				message: 'SMS not available'
			}).show();
			return;
		}

		SMSDialog.setToRecipients(['100500']);
		SMSDialog.setMessageBody('Appcelerator Titanium Rocks SMS!');

		SMSDialog.addEventListener('complete', function (e) {
			if (e.result == SMSDialog.SENT) {
				Ti.API.info('SMS was sent');
			} else if (e.result == SMSDialog.CANCELLED) {
				Ti.API.info('SMS was cancelled');
			}
		})

		SMSDialog.open();
	});
	return win;
};

module.exports = sms_dialog;