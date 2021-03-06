define(['Ti/_/declare'], function(declare) {

	return declare('Ti.Contacts.Group', null, {

		constructor: function(args) {
			this._addressbook = izen.contact.getDefaultAddressBook();
			if (!args.id) {
				this._group = new tizen.ContactGroup(args.name);
				this._addressbook.addGroup(this._group);
				this.constants.__values__.recordId = this._group.id;
			} else {
				this.constants.__values__.recordId = args.id;
			}
		},

		add: function(person) {
			var contact;

			// Create person if it is new contact
			if (!person.id) {
				person = Ti.Contacts.createPerson(person);
			}

			contact = this._addressbook.get(person.id);
			// Adding contact to group
			contact.groupIds.push(this.recordId);
			this._addressbook.update(contact);
		},

		remove: function(person) {
			var contact = this._addressbook.get(person.id),
				groupIds = contact.groupIds;
			groupIds.splice(groupIds.indexOf(this.recordId), 1);
			contact.groupIds = groupIds;
			this._addressbook.update(contact);
		},

		constants: {
			recordId: ''
		},

		properties: {
			name: ''
		}
	});
});