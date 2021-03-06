define(['Ti/_/lang', 'Ti/_/Evented', 'NFC/NDEFMessage', 'NFC/NDEFRecord', 'NFC/NDEFRecordText', 'NFC/NDEFRecordURI', 'NFC/NDEFRecordMedia', 'NFC/NFCAdapter'],
    function(lang, Evented, NDEFMessage, NDEFRecord, NDEFRecordText, NDEFRecordURI, NDEFRecordMedia, NFCAdapter) {
        return lang.mixProps(require.mix({}, Evented), {

            constants: {
                NFC_RECORD_TNF_EMPTY: 0,
                NFC_RECORD_TNF_WELL_KNOWN: 1,
                NFC_RECORD_TNF_MIME_MEDIA: 2,
                NFC_RECORD_TNF_URI: 3,
                NFC_RECORD_TNF_EXTERNAL_RTD: 4,
                NFC_RECORD_TNF_UNKNOWN: 5,
                NFC_RECORD_TNF_UNCHANGED: 6,
                NDEF_RECORD_TEXT_ENCODING_UTF8: 'UTF8',
                NDEF_RECORD_TEXT_ENCODING_UTF16: 'UTF16',
                NFC_TAG_TYPE_GENERIC_TARGET: 'GENERIC_TARGET',
                NFC_TAG_TYPE_ISO14443_A: 'ISO14443_A',
                NFC_TAG_TYPE_ISO14443_4A: 'ISO14443_4A',
                NFC_TAG_TYPE_ISO14443_3A: 'ISO14443_3A',
                NFC_TAG_TYPE_MIFARE_MINI: 'MIFARE_MINI',
                NFC_TAG_TYPE_MIFARE_1K: 'MIFARE_1K',
                NFC_TAG_TYPE_MIFARE_4K: 'MIFARE_4K',
                NFC_TAG_TYPE_MIFARE_ULTRA: 'MIFARE_ULTRA',
                NFC_TAG_TYPE_MIFARE_DESFIRE: 'MIFARE_DESFIRE',
                NFC_TAG_TYPE_ISO14443_B: 'ISO14443_B',
                NFC_TAG_TYPE_ISO14443_4B: 'ISO14443_4B',
                NFC_TAG_TYPE_ISO14443_BPRIME: 'ISO14443_BPRIME',
                NFC_TAG_TYPE_FELICA: 'FELICA',
                NFC_TAG_TYPE_JEWEL: 'JEWEL',
                NFC_TAG_TYPE_ISO15693: 'ISO15693',
                NFC_TAG_TYPE_UNKNOWN_TARGET: 'UNKNOWN_TARGET'
            },

            getDefaultAdapter: function() {
                try {
                    return this._wrap(tizen.nfc.getDefaultAdapter());
                } catch(e) {
                    Ti.API.error(e.message);
                }
            },

            _wrap: function(object) {
                if (object.toString() === '[object NFCAdapter]') {
                    return this.createNFCAdapter(object);
                }
            },

            createNFCAdapter: function(args) {
                return new NFCAdapter(args);
            },

            createNDEFMessage: function(args) {
                return new NDEFMessage(args);
            },

            createNDEFRecord: function(args) {
                return new NDEFRecord(args);
            },

            createNDEFRecordText: function(args) {
                return new NDEFRecordText(args);
            },

            createNDEFRecordURI: function(args) {
                return new NDEFRecordURI(args);
            },

            createNDEFRecordMedia: function(args) {
                return new NDEFRecordMedia(args);
            }
        }, true);
    }
);