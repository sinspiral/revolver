(function() {
  'use strict';
  var Revolver, addNamespaces;

  Revolver = function(options) {
    var slide, slidesToAdd, _i, _len;
    this.currentSlide = 0;
    this.nextSlide = 0;
    this.numSlides = 0;
    this.lastSlide = 0;
    this.iteration = 0;
    this.intervalId = null;
    this.disabled = false;
    this.options = {};
    this.setOptions(Revolver.defaults, options);
    if (this.options.container) {
      this.container = this.options.container;
    } else if (this.options.containerSelector) {
      this.container = Revolver.$(this.options.containerSelector, document)[0];
    } else {
      this.container = document;
    }
    this.slides = [];
    slidesToAdd = this.options.slides || Revolver.$(this.options.slidesSelector, this.container);
    for (_i = 0, _len = slidesToAdd.length; _i < _len; _i++) {
      slide = slidesToAdd[_i];
      this.addSlide(slide);
    }
    this.previousSlide = this.lastSlide;
    this.status = {
      paused: false,
      playing: false,
      stopped: true
    };
    this.isAnimating = false;
    if (this.numSlides <= 1) {
      this.disabled = true;
    }
    this.on('transitionComplete', function() {
      return this.isAnimating = false;
    });
    this.on('play', this.options.onPlay);
    this.on('stop', this.options.onStop);
    this.on('pause', this.options.onPause);
    this.on('restart', this.options.onRestart);
    this.on('transitionStart', this.options.transition.onStart);
    this.on('transitionComplete', this.options.transition.onComplete);
    this.on('addSlide', this.options.onAddSlide);
    this.on('removeSlide', this.options.onRemoveSlide);
    _.bind(this.options.onReady, this)();
    if (this.options.autoPlay) {
      this.play({}, true);
    }
    return this;
  };

  Revolver.defaults = {
    debug: false,
    autoPlay: true,
    loop: true,
    iterations: 1,
    container: null,
    containerSelector: null,
    slides: null,
    slidesSelector: null,
    onReady: function() {},
    onPlay: function() {},
    onStop: function() {},
    onPause: function() {},
    onRestart: function() {},
    onAddSlide: function() {},
    onRemoveSlide: function() {},
    rotationSpeed: 4000,
    transition: {
      onStart: function() {},
      onComplete: function() {},
      name: 'default'
    }
  };

  Revolver.VERSION = '2.1.1';

  Revolver.prototype.addSlide = function(slide, index) {
    var currentPlusOne;
    if (!!~this.slides.indexOf(slide)) {
      return this;
    }
    if (index !== void 0) {
      this.slides.splice(index, 0, slide);
      if (index <= this.currentSlide) {
        this.currentSlide++;
      }
    } else {
      this.slides.push(slide);
    }
    this.trigger('addSlide');
    this.numSlides = this.slides.length;
    this.lastSlide = (this.numSlides === 0 ? 0 : this.numSlides - 1);
    currentPlusOne = this.currentSlide + 1;
    this.nextSlide = (currentPlusOne > this.lastSlide ? 0 : currentPlusOne);
    this.previousSlide = (this.currentSlide === 0 ? this.lastSlide : this.currentSlide - 1);
    if (this.disabled) {
      this.disabled = !this.disabled;
    }
    return this;
  };

  Revolver.prototype.removeSlide = function(index) {
    var currentPlusOne;
    if (index < 0 || index >= this.numSlides) {
      return void 0;
    }
    this.slides.splice(index, 1);
    this.trigger('removeSlide');
    this.numSlides = this.slides.length;
    this.lastSlide = (this.numSlides === 0 ? 0 : this.numSlides - 1);
    this.currentSlide = (this.currentSlide === 0 ? 0 : this.currentSlide - 1);
    currentPlusOne = this.currentSlide + 1;
    this.nextSlide = (currentPlusOne > this.lastSlide ? 0 : currentPlusOne);
    this.previousSlide = (this.currentSlide === 0 ? this.lastSlide : this.currentSlide - 1);
    if (this.numslides < 2) {
      this.disabled = true;
    }
    return this;
  };

  Revolver.prototype.moveSlide = function(srcIndex, destIndex) {
    var currentPlusOne;
    if (destIndex >= this.slides.length) {
      destIndex = 0;
    }
    if (destIndex < 0) {
      destIndex = this.slides.length - 1;
    }
    this.slides.splice(destIndex, 0, (this.slides.splice(srcIndex, 1))[0]);
    this.numSlides = this.slides.length;
    this.lastSlide = (this.numSlides === 0 ? 0 : this.numSlides - 1);
    if (this.currentSlide === srcIndex) {
      this.currentSlide = destIndex;
      currentPlusOne = this.currentSlide + 1;
      this.nextSlide = (currentPlusOne > this.lastSlide ? 0 : currentPlusOne);
      this.previousSlide = (this.currentSlide === 0 ? this.lastSlide : this.currentSlide - 1);
    }
    return this;
  };

  Revolver.prototype.setOptions = function() {
    var args;
    args = Array.prototype.slice.call(arguments, 0);
    args.unshift(this.options);
    _.merge.apply(null, args);
    return this;
  };

  Revolver.prototype.changeStatus = function(newStatus) {
    _.each(this.status, (function(val, key) {
      this.status[key] = key === newStatus;
      return true;
    }), this);
    return this;
  };

  Revolver.prototype.transition = function(options) {
    var done, transition;
    if (this.slides.length <= 1) {
      return this.stop();
    }
    if (this.status.playing && !this.options.loop && this.options.iterations === this.iteration) {
      this.stop();
      if (this.options.endslide != null) {
        if (this.options.endslide > this.lastSlide) {
          this.goTo(this.lastSlide);
        } else {
          this.goTo(this.options.endslide);
        }
      }
      return this;
    }
    if (this.disabled === false && this.isAnimating === false) {
      options = _.merge({}, this.options.transition, options);
      this.isAnimating = true;
      transition = _.bind(Revolver.transitions[options.name], this);
      done = _.bind(this.trigger, this, 'transitionComplete');
      transition(options, done);
      this.currentSlide = this.nextSlide;
      this.previousSlide = (this.currentSlide === 0 ? this.lastSlide : this.currentSlide - 1);
      this.nextSlide = (this.currentSlide === this.lastSlide ? 0 : this.currentSlide + 1);
      if (this.currentSlide === this.lastSlide) {
        this.iteration++;
      }
      this.trigger('transitionStart');
    }
    return this;
  };

  Revolver.prototype.play = function(options, firstTime) {
    if (this.status.stopped && !this.options.loop) {
      this.iteration = 0;
    }
    if (this.disabled === false && !this.status.playing) {
      this.changeStatus('playing');
      this.trigger('play');
      if (!firstTime) {
        this.transition(options);
      }
      this.intervalId = setInterval(_.bind(this.transition, this), parseFloat(this.options.rotationSpeed));
    }
    return this;
  };

  Revolver.prototype._clearInterval = function() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this;
  };

  Revolver.prototype.pause = function() {
    if (this.disabled === false && !this.status.paused) {
      this.changeStatus('paused');
      this.trigger('pause');
      this._clearInterval();
    }
    return this;
  };

  Revolver.prototype.stop = function() {
    if (this.disabled === false && !this.status.stopped) {
      this.changeStatus('stopped');
      this.trigger('stop');
      this._clearInterval();
      this.reset();
    }
    return this;
  };

  Revolver.prototype.reset = function() {
    if (this.currentSlide !== 0) {
      this.nextSlide = 0;
    }
    return this;
  };

  Revolver.prototype.restart = function(options) {
    if (this.disabled === true) {
      return this;
    }
    this.trigger('restart');
    this.stop().play(options);
    return this;
  };

  Revolver.prototype.goTo = function(i, options) {
    i = parseInt(i);
    if (this.disabled === true || this.slides[i] === this.slides[this.currentSlide]) {
      return this;
    }
    this.nextSlide = i;
    if (!this.status.playing) {
      return this.transition(options);
    } else {
      return this.pause().play(options);
    }
  };

  Revolver.prototype.quickGoTo = function(i, options) {
    i = parseInt(i);
    if (this.disabled === true || this.slides[i] === this.slides[this.currentSlide]) {
      return this;
    }
    if (this.status.playing) {
      this.stop;
    }
    return this.transition({
      name: 'simple'
    });
  };

  Revolver.prototype.first = function(options) {
    return this.goTo(0, options);
  };

  Revolver.prototype.previous = function(options) {
    return this.goTo(this.previousSlide, options);
  };

  Revolver.prototype.next = function(options) {
    return this.goTo(this.nextSlide, options);
  };

  Revolver.prototype.last = function(options) {
    return this.goTo(this.lastSlide, options);
  };

  addNamespaces = function(eventString) {
    var eventStringDelimiter, events, namespace;
    namespace = 'revolver';
    eventStringDelimiter = ' ';
    events = eventString.split(eventStringDelimiter);
    _.each(events, function(eventName, i) {
      return events[i] = namespace.concat('.', events[i]);
    });
    return events.join(eventStringDelimiter);
  };

  Revolver.prototype.on = function(eventString, callback) {
    callback = _.bind(callback, this);
    eventString = addNamespaces(eventString);
    bean.on(this, eventString, callback);
    return this;
  };

  Revolver.prototype.one = function(eventString, callback) {
    callback = _.bind(callback, this);
    eventString = addNamespaces(eventString);
    bean.one(this, eventString, callback);
    return this;
  };

  Revolver.prototype.off = function(eventString, callback) {
    callback = _.bind(callback, this);
    eventString = addNamespaces(eventString);
    bean.off(this, eventString, callback);
    return this;
  };

  Revolver.prototype.trigger = function(eventString) {
    eventString = addNamespaces(eventString);
    bean.fire(this, eventString);
    return this;
  };

  Revolver.$ = function(selector, root) {
    if (root === void 0) {
      root = document;
    }
    return root.querySelectorAll(selector);
  };

  Revolver.setSelectorEngine = function(e) {
    bean.setSelectorEngine(e);
    Revolver.$ = e;
    return this;
  };

  Revolver.transitions = {};

  Revolver.transitions['simple'] = function(options) {
    this.slides[this.currentSlide].setAttribute('style', 'display: none');
    this.slides[this.nextSlide].setAttribute('style', 'display: block');
    this.trigger('transitionComplete');
    return this;
  };

  Revolver.registerTransition = function(name, fn) {
    Revolver.transitions[name] = fn;
    return this;
  };

  Revolver.deregisterTransition = function(name) {
    delete Revolver.transitions[name];
    return this;
  };

  window.Revolver = Revolver;

  if (typeof window.define === "function" && window.define.amd) {
    window.define("revolver", [], function() {
      return window.Revolver;
    });
  }

}).call(this);
