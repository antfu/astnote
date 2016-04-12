var FirepadUserList = (function() {
  function FirepadUserList(ref, place, userId, displayName, userColor) {
    if (!(this instanceof FirepadUserList)) {
      return new FirepadUserList(ref, place, userId, displayName, userColor);
    }

    this.ref_ = ref;
    this.userId_ = userId;
    this.place_ = place;
    this.firebaseCallbacks_ = [];

    var self = this;
    this.hasName_ = !!displayName;
    this.displayName_ = displayName || 'Guest';
    this.color_ = userColor || ramdom_hsv();
    this.firebaseOn_(ref.root().child('.info/connected'), 'value', function(s) {
      if (s.val() === true && self.displayName_) {
        var nameref = ref.child(self.userId_).child('name');
        nameref.onDisconnect().remove();
        nameref.set(self.displayName_);
        var colorref = ref.child(self.userId_).child('color');
        colorref.onDisconnect().remove();
        colorref.set(self.color_);
      }
    });

    this.userList_ = this.makeUserList_();
    place.appendChild(this.userList_);
  }

  // This is the primary "constructor" for symmetry with Firepad.
  FirepadUserList.fromDiv = FirepadUserList;

  FirepadUserList.prototype.dispose = function() {
    this.removeFirebaseCallbacks_();
    this.place_.removeChild(this.userList_);
  };

  FirepadUserList.prototype.makeUserList_ = function() {
    return elt('div', [
      this.makeShare_(),
      this.makeUserEntryForSelf_(),
      this.makeUserEntriesForOthers_()
    ], {'class': 'firepad-userlist' });
  };

  FirepadUserList.prototype.makeShare_ = function() {
    return elt('div',
               [elt('i',[],{'class':'icon share alternate'}),elt('span',' Invite')],
               {'class': 'unit firepad-userlist-invite','id': 'share_button','data-clipboard-text':(window.location.origin+window.location.pathname)});
  };

  FirepadUserList.prototype.makeHeading_ = function() {
    var counterSpan = elt('span', '0');
    this.firebaseOn_(this.ref_, 'value', function(usersSnapshot) {
      setTextContent(counterSpan, "" + usersSnapshot.numChildren());
    });

    return elt('div', [
      elt('span', 'ONLINE ('),
      counterSpan,
      elt('span', ')')
    ], { 'class': 'firepad-userlist-heading' });
  };

  FirepadUserList.prototype.makeUserEntryForSelf_ = function() {
    var myUserRef = this.ref_.child(this.userId_);

    var colorDiv = elt('div', null, { 'class': 'firepad-userlist-color-indicator self'});
    this.firebaseOn_(myUserRef.child('color'), 'value', function(colorSnapshot) {
      var color = colorSnapshot.val();
      if (isValidColor(color)) {
        colorDiv.style.backgroundColor = color;
      }
    });

    var nameInput = elt('input', null, { type: 'text', 'class': 'firepad-userlist-name-input','maxlength':'20','placeholder':"Your name"} );
    if (this.hasName_)
      nameInput.value = this.displayName_;
    else
      nameInput.value = '';

    // Update Firebase when name changes.
    var self = this;
    on(nameInput, 'change', function(e) {
      var name = nameInput.value || "Guest";
      myUserRef.child('name').set(name);
      nameInput.blur();
      self.displayName_ = name;
      update_username(name);
      stopEvent(e);
    });

    on(colorDiv, 'click', function(e){
      var new_color = ramdom_hsv();
      myUserRef.child('color').set(new_color);
      update_usercolor(new_color);
      stopEvent(e);
    });

    return elt('div', [ colorDiv, nameInput ], {
      'class': 'firepad-userlist-user ' + 'firepad-user-' + this.userId_
    });
  };

  FirepadUserList.prototype.makeUserEntriesForOthers_ = function() {
    var self = this;
    var userList = elt('span');
    var userId2Element = { };

    function updateChild(userSnapshot, prevChildName) {
      var userId = userSnapshot.key();
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }
      var name = userSnapshot.child('name').val();
      if (typeof name !== 'string') { name = 'Guest'; }
      name = name.substring(0, 20);

      var color = userSnapshot.child('color').val();
      if (!isValidColor(color)) {
        color = "#ffb"
      }

      var colorDiv = elt('div', null, { 'class': 'firepad-userlist-color-indicator' });
      colorDiv.style.backgroundColor = color;

      var nameDiv = elt('div', name || 'Guest', { 'class': 'firepad-userlist-name' });

      var userDiv = elt('div', [ colorDiv, nameDiv ], {
        'class': 'firepad-userlist-user ' + 'firepad-user-' + userId
      });
      userId2Element[userId] = userDiv;

      if (userId === self.userId_) {
        // HACK: We go ahead and insert ourself in the DOM, so we can easily order other users against it.
        // But don't show it.
        userDiv.style.display = 'none';
      }

      var nextElement =  prevChildName ? userId2Element[prevChildName].nextSibling : userList.firstChild;
      userList.insertBefore(userDiv, nextElement);
    }

    this.firebaseOn_(this.ref_, 'child_added', updateChild);
    this.firebaseOn_(this.ref_, 'child_changed', updateChild);
    this.firebaseOn_(this.ref_, 'child_moved', updateChild);
    this.firebaseOn_(this.ref_, 'child_removed', function(removedSnapshot) {
      var userId = removedSnapshot.key();
      var div = userId2Element[userId];
      if (div) {
        userList.removeChild(div);
        delete userId2Element[userId];
      }
    });

    return userList;
  };

  FirepadUserList.prototype.firebaseOn_ = function(ref, eventType, callback, context) {
    this.firebaseCallbacks_.push({ref: ref, eventType: eventType, callback: callback, context: context });
    ref.on(eventType, callback, context);
    return callback;
  };

  FirepadUserList.prototype.firebaseOff_ = function(ref, eventType, callback, context) {
    ref.off(eventType, callback, context);
    for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      if (l.ref === ref && l.eventType === eventType && l.callback === callback && l.context === context) {
        this.firebaseCallbacks_.splice(i, 1);
        break;
      }
    }
  };

  FirepadUserList.prototype.removeFirebaseCallbacks_ = function() {
    for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
      var l = this.firebaseCallbacks_[i];
      l.ref.off(l.eventType, l.callback, l.context);
    }
    this.firebaseCallbacks_ = [];
  };

  /** Assorted helpers */

  function isValidColor(color) {
    return typeof color === 'string' &&
      (color.match(/^#[a-fA-F0-9]{3,6}$/) || color == 'transparent');
  }


  /** DOM helpers */
  function elt(tag, content, attrs) {
    var e = document.createElement(tag);
    if (typeof content === "string") {
      setTextContent(e, content);
    } else if (content) {
      for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]); }
    }
    for(var attr in (attrs || { })) {
      e.setAttribute(attr, attrs[attr]);
    }
    return e;
  }

  function setTextContent(e, str) {
    e.innerHTML = "";
    e.appendChild(document.createTextNode(str));
  }

  function on(emitter, type, f) {
    if (emitter.addEventListener) {
      emitter.addEventListener(type, f, false);
    } else if (emitter.attachEvent) {
      emitter.attachEvent("on" + type, f);
    }
  }

  function off(emitter, type, f) {
    if (emitter.removeEventListener) {
      emitter.removeEventListener(type, f, false);
    } else if (emitter.detachEvent) {
      emitter.detachEvent("on" + type, f);
    }
  }

  function preventDefault(e) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
  }

  function stopPropagation(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }

  function stopEvent(e) {
    preventDefault(e);
    stopPropagation(e);
  }

  return FirepadUserList;
})();
