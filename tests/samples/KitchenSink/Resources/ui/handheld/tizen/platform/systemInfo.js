function tizenSystemInfo(title) {
	var messageWin = require('ui/handheld/tizen/tizenToast'),
	    alertWin = require('ui/handheld/tizen/tizenAlert'),
		gBatteryListener;


	function getSystemProperty(property, onSuccess, onError) {
		try {
			Ti.Tizen.SystemInfo.getPropertyValue(property, onSuccess, onError);
		} catch (e) {
			onError(e)
		}
	}

	function batteryMonitoringClicked(e) {
		if  (e && e.rowData) {
			if (batteryMonitoring.isOn)	{
				try {
					Ti.Tizen.SystemInfo.removePropertyValueChangeListener(gBatteryListener);
					e.rowData.title = batteryMonitoring.offCaption;
					messageWin.showToast(batteryMonitoring.offCaption, 1500);
					batteryMonitoring.isOn = false;
				} catch(e) {
					messageWin.showToast('Exception on battery monitoring turning off! \n' + e.message, 2500);
				}
			}else{
				try {
					gBatteryListener = Ti.Tizen.SystemInfo.addPropertyValueChangeListener(Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_BATTERY,
						function(power) { messageWin.showToast('Battery level: ' + power.level, 1500); },
						function(e) { messageWin.showToast('Battery monitoring error! \n' + e.message, 2500); });

					e.rowData.title = batteryMonitoring.onCaption;
					messageWin.showToast(batteryMonitoring.onCaption, 1500);
					batteryMonitoring.isOn = true;
				} catch(e) {
					messageWin.showToast('Exception on battery monitoring turning on! \n' + e.message,2500);
				}
			}
		}
	}

	function showDetailsDialog(propertyName, propertyDetailsHtml) {
		alertWin.showAlert(propertyName + ' details', propertyDetailsHtml, 'Go back to list');
	}

	var win = Ti.UI.createWindow({ backgroundColor: '#fff' }),
		batteryMonitoring = { isOn: false, onCaption: 'Battery monitoring is on', offCaption: 'Battery monitoring is off' },
		data = [
			{ title: 'Storage information', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_STORAGE, propertyCallback: onStorageSuccess },
			{ title: 'Power state', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_BATTERY, propertyCallback: onPowerSuccess },
			{ title: batteryMonitoring.offCaption, clickCallback: batteryMonitoringClicked },
			{ title: 'Cpu load', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CPU, propertyCallback: onCpuInfoSuccess },
			{ title: 'Display information', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_DISPLAY, propertyCallback: onDisplaySuccess },
			{ title: 'Device information', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_BUILD, propertyCallback: onDeviceSuccess },
			{ title: 'Current network type', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_NETWORK, propertyCallback: onNetworkSuccess },
			{ title: 'Wifi network state', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_WIFI_NETWORK, propertyCallback: onWifiSuccess },
			{ title: 'Cellular network state', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_CELLULAR_NETWORK, propertyCallback: onCellSuccess },
			{ title: 'SIM information', propertyName: Ti.Tizen.SystemInfo.SYSTEM_INFO_PROPERTY_ID_SIM, propertyCallback: onSimSuccess }
		],
		i = 0,
		dataLength = data.length,
		tableview = Titanium.UI.createTableView();

	// create table view
	for (; i < dataLength; i++ ) {
		data[i].color = '#000';
		data[i].font = { fontWeight: 'bold' };
	};
	tableview.data = data;

	// create table view event listener
	tableview.addEventListener('click', function(e) {
		if (e && e.rowData) {
			var pName = e.rowData.propertyName;
			if (pName) {
				getSystemProperty(pName, e.rowData.propertyCallback, function(er) {
					showDetailsDialog(pName, '<b>API error:</b><br/>' + er.message);
				})
			} else {
				e.rowData.clickCallback && e.rowData.clickCallback(e);
			}
		}
	});

	win.add(tableview);
	return win;

	function onPowerSuccess(power) {
		showDetailsDialog('Power', formatSubLines([
			'Current level: ' + power.level,
			'Charging: ' + (power.isCharging ? 'Yes' : 'No')
		]));
	}

	function onCpuInfoSuccess(cpu) {
		showDetailsDialog('Cpu', 'Load: ' + cpu.load);
	}

	function onStorageSuccess(storages) {
		var storagesInfo = '',
			i = 0,
			units = storages.units,		
			storagesCount = units.length;

		for (; i < storagesCount; i++) {
			storagesInfo += formatHeader('Storage #' + (i + 1))+
				formatSubLines([
					'Type: ' + units[i].type,
					'Capacity: ' + Math.floor(units[i].capacity / 1000000) + ' MB',
					'Available capacity: ' + Math.floor(units[i].availableCapacity / 1000000) + ' MB',
					'Removable: ' + (units[i].isRemoveable ? 'Yes' : 'No')
				]);
		}

		showDetailsDialog('Storage', storagesInfo);
	}

	function onDisplaySuccess(display) {
		var displayInfo = formatHeader('Resolution') +
			formatSubLines([ 'Width: ' + display.resolutionWidth, 'Height: ' + display.resolutionHeight ]) +
			formatHeader('Dots per inch (DPI)') +
			formatSubLines([ 'Horizontal: ' + display.dotsPerInchWidth, 'Vertical: ' + display.dotsPerInchHeight ]) +
			formatHeader('Physical size') +
			formatSubLines([ 'Width: ' + display.physicalWidth, 'Height: ' + display.physicalHeight ]) +
			formatHeader('Brightness') +
			formatSubLines([ 'Current brightness: ' + display.brightness ]);

		showDetailsDialog('Display', displayInfo);
	}

	function onDeviceSuccess(device) {
		showDetailsDialog('Device', formatSubLines([
			'Model:&nbsp;' + device.model
		]));
	}

	function onNetworkSuccess(network) {
		var networkTypes = [ 'NONE', '2G', '2.5G','3G', '4G', 'WIFI', 'ETHERNET', 'UNKNOWN' ];
		showDetailsDialog('Network', formatSubLines([ 'Current data network type: ' + network.networkType]));
	}

	function onWifiSuccess(wifi) {
		showDetailsDialog('Wifi network', formatSubLines([
			'Status: ' + wifi.status,
			'SSID: ' + wifi.ssid,
			'IP address: ' + wifi.ipAddress,
			'Signal strength: ' + wifi.signalStrength]));
	}

	function onCellSuccess(cell) {
		showDetailsDialog('Cellular network', formatSubLines([
			'Status: ' + cell.status,
			'Access Point Name (APN): ' + cell.apn,
			'IP address: ' + cell.ipAddress,
			'Mobile Country Code (MCC): ' + cell.mcc,
			'Mobile Network Code (MNC): ' + cell.mnc,
			'Cell ID: ' + cell.cellid,
			'Location Area Code (LAC): ' + cell.lac,
			'Roaming: ' + (cell.isRoaming ? 'Yes' : 'No')
		]));
	}

	function onSimSuccess(sim) {
		showDetailsDialog('SIM', formatSubLines([
			'Operator Name String (ONS): ' + sim.operatorName,
			'SIM card subscriber number: ' + sim.msisdn,
			'Integrated Circuit Card ID: ' + sim.iccid,
			'Mobile Country Code (MCC): ' + sim.mcc,
			'Mobile Network Code (MNC): ' + sim.mnc,
			'Mobile Subscription Identification Number (MSIN): ' + sim.msin,
			'Service Provider Name (SPN): ' + sim.spn
		]));
	}

	function formatHeader(headerName) {
		return  '<b>' + headerName + '</b> <br />';
	}

	function formatSubLines(lineArray) {
		var result = '<div style="text-align: left; width: 100%">',
			i = 0,
			len = lineArray.length;

		for (; i < len; i++) {
			result +=  lineArray[i] + '<br/>'
		}
		return  result + '</div>';
	}
};

module.exports = tizenSystemInfo;