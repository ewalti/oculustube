/**
 * Create the app
 */
App = Ember.Application.create({
   // LOG_TRANSITIONS: true,
   // LOG_TRANSITIONS_INTERNAL: true,
   // LOG_ACTIVE_GENERATION: true,
   // LOG_VIEW_LOOKUPS: true,
   // LOG_RESOLVER: true
});

/**
 * Set up the base route (ie: '/');
 */
App.ApplicationRoute = Ember.Route.extend({
  /**
   * Add the YouTube iFrame API to the document body before
   * the application model has rendered
   */
  beforeModel: function(transition) {

    var tag, first;

    tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);

  },
  /**
   * Deferr the loading of the model until the YouTube API has
   * called `onYouTubeIframeAPIReady`
   */
  model: function() {
    return youtubePromise;
  },
  /**
   * Standard controller setup
   */
  setupController: function(controller, model) {
    controller.set('model', model);
  }
});

/**
 * Set up the controller for the application route
 */
App.IndexController = Ember.ArrayController.extend({
  query: 'oculus rift',
  largeMediaQuery: '(min-width: 900px)',
  videos: null,
  playerLoaded: false,
  player: null,
  currentPage: 1,
  isPageLoading: false,
  currentVideo: null,
  currentOffset: null,
  maximumVideoResults: 10,
  isEditing: false,
  /**
   * Handels cases for editing the position
   * @param  {string} key
   * @param  {string} value value of the input
   * @return {string} the validated position
   */
  editPosition: function(key, value) {
    value = parseInt(value);
    if(isNaN(value)) {
      return this.get('currentOffset') + 1;
    } else if(value <= this.get('currentPage') * this.get('maximumVideoResults')) {
      return value;
    } else if(value > this.get('currentPage') * this.get('maximumVideoResults')) {
      return this.get('currentOffset') + 1;
    }
  }.property('currentOffset'),

  /**
   * Get the current playlist position
   * @return {string} the playlist position
   */
  position: function() {

    var currentOffset;

    currentOffset = this.get('currentOffset');

    return currentOffset >= 0 && currentOffset !== null ? (currentOffset+1) : 1;

  }.property('currentOffset', 'videos.length'),

  /**
   * Displays the maximum videos loaded
   * @return {string} A computed property of the current video array length
   */
  positionTotal: function() {
    return this.get('videos.length');
  }.property('videos.length'),

  actions: {
    activateVideo: function(offset) {
      $('.video-list li.active').removeClass('active');
      $('.video-list li').eq(offset).addClass('active');
    },

    /**
     * Loads the YouTube player
     */
    loadPlayer: function() {
      var self, player, offset, videos, id;

      self = this;
      offset = 0;
      videos = this.get('videos');
      id = videos[0].id;

      player = new YT.Player('player', {
        height: '423.5',
        width: '753',
        videoId: id,
        events: {
          'onReady': function() {
            self.set('currentVideo', id);
            self.set('currentOffset', offset);

            self.send('activateVideo', offset);

            $(window).resize(function(){
              self.send('scrollToVideo', self.get('currentOffset'));
            });

          },
          'onStateChange': self.playerStageChange.bind(self)
        }
      });

      this.set('player', player);

    },

    /**
     * Accept changes to the video position edit input
     */
    acceptChanges: function() {

      var currentOffset, editPosition;

      currentOffset = this.get('currentOffset');
      editPosition = this.get('editPosition')-1;

      this.set('isEditing', false);
      if(currentOffset !== editPosition) {
        this.send('loadVideoByOffset', this.get('editPosition')-1);
        this.send('scrollToVideo', this.get('editPosition')-1);
      }
      return;

    },

    /**
     * Enable editing of the position
     */
    editPosition: function() {
      this.set('isEditing', true);
    },

    /**
     * Set the state of the player based on the sidebar miniplayer clicks
     * @return {[type]} [description]
     */
    togglePlayer: function() {

      var player, state;

      player = this.get('player');
      state = player.getPlayerState();

      if(state === 1) player.pauseVideo(); // pause if playing
      if(state === 2 || state === 5) player.playVideo(); // play if vide cued or paused

    },

    /**
     * Play the video following the currently playing video.
     * If the currently playing video is the last of the list,
     * it will load more videos.
     */
    playNextVideo: function() {

      var currentVideo, currentOffset, videos, currentPage, maxResults;

      currentVideo = this.get('currentVideo');
      currentOffset = this.get('currentOffset');
      videos = this.get('videos');
      currentPage = this.get('currentPage');
      maxResults = this.get('maximumVideoResults');

      if(currentVideo === null) {
        this.send('loadVideoByOffset', 0);
      } else if((currentOffset+1)%(currentPage*maxResults) === 0) {
        this.send('loadMore');
      } else if(currentVideo) {
        var offset = currentOffset+1;
        this.send('loadVideoByOffset', offset);
        this.send('scrollToVideo', offset);
      }

      return;

    },

    /**
     * Play the video preceding the currently playing video
     */
    playPreviousVideo: function() {

      var currentVideo, currentOffset;

      currentVideo = this.get('currentVideo');
      currentOffset = this.get('currentOffset');

      if(currentVideo === null) {
        this.send('loadVideoByOffset', 0); // Load the first video from the player if there is no previous video.
      } else if(currentVideo) {
        var offset = currentOffset-1;
        this.send('loadVideoByOffset', offset);
        this.send('scrollToVideo', offset);
      }

      return;

    },

    scrollToVideo: function(offset) {
      var ele = $('.video-list li.thumbnail').eq(offset),
          data = $('.video-list').data('jsp');
      if(data) {
        data.scrollToElement(ele, true, false);
      }
    },

    /**
     * Search based on a query paramter to load videos
     */
    search: function() {

      var self = this;

      var query = this.get('query');

      this.set('content', []);

      var feed = $.ajax({
        url: 'http://gdata.youtube.com/feeds/api/videos',
        data: {v: 2, 'max-results': this.get('maximumVideoResults'), q: query, alt: 'jsonc'},
        dataType: 'jsonp',
      });

      // For IE9
      feed.success(function(data){
        self.set('videos', self.dataToVideos(data.data.items));
        self.send('loadPlayer');
      });

      feed.complete(function(){
        setTimeout(function(){
          self.send('refreshList');
        }, 350);
      });

    },

    /**
     * Load a video in to the player based on video offset
     * @param  {integer} offset the numerical offset of the video to be loaded
     */
    loadVideoByOffset: function(offset) {

      var player, videos, id;

      offset = isNaN(parseInt(offset)) ? '' : parseInt(offset);

      player = this.get('player');
      videos = this.get('videos');
      id = videos[offset].id;

      player.loadVideoById(id, 5, "large");

      this.set('currentVideo', id);
      this.set('currentOffset', offset);

      this.send('activateVideo', offset);

    },

    /**
     * Refresh the scrollbar if it exists, if not, create it
     */
    refreshList: function() {

      var data;

      data = $('.video-list').data('jsp');

      if(data) {
        $('.video-list').data('jsp').reinitialise();
      } else if(Modernizr.mq(this.get('largeMediaQuery'))) {
        $('.video-list').jScrollPane();
      }
    },

    /**
     * Load more videos on button click
     */
    loadMore: function() {

      if(!this.get('isPageLoading')) {

        var self, query, currentPage, maxResults, index, c;

        this.set('isPageLoading', true);

        self = this;
        query = this.get('query');
        currentPage = this.get('currentPage');
        maxResults = this.get('maximumVideoResults');
        index = currentPage*maxResults+1;

        var feed = $.ajax({
          url: 'http://gdata.youtube.com/feeds/api/videos',
          data: {v: 2, 'max-results': this.get('maximumVideoResults'), 'start-index': index, q: query, alt: 'jsonc'},
          dataType: 'jsonp',
        });

        feed.success(function(data){

          var results, videos, i;

          results = self.dataToVideos(data.data.items);
          videos = self.get('videos');

          for(i = 0; i < results.length; i++) {
            videos.pushObject(results[i]);
          }
          self.set('videos', videos);
          self.set('currentPage', currentPage+1);
          self.set('isPageLoading', false);

        });

        feed.complete(function(){
          setTimeout(function(){
            self.send('refreshList');
          }, 350);
        });

      }
      return;

    }

  },

  /**
   * Convert YouTube API jsonp data to an array
   * @param  {array} entries An array of video data
   */
  dataToVideos: function(entries) {

    var results, i, e;

    results = [];

    for(i = 0; i < entries.length; i++) {
      e = entries[i];
      results.push(App.Video.create({
        id: e.id,
        title: e.title,
        thumbnail: 'http://i.ytimg.com/vi/' + e.id + '/mqdefault.jpg'
      }));
    }

    return results;

  },

  /**
   * YouTube player state handling
   * @param  {integer} event Offset for a corresponding event
   */
  playerStageChange: function(event) {

    // playing
    if(event.data === 1) {
      $('.controls li.play').removeClass('typcn-media-play').addClass('typcn-media-pause').attr('title', 'Pause video');
    }

    // paused
    if(event.data === 2) {
      $('.controls li.play').removeClass('typcn-media-pause').addClass('typcn-media-play').attr('title', 'Play video');
    }

    // done
    if(event.data === 0) {

      var videos, currentVideo, currentOffset;

      videos = this.get('videos');
      currentVideo = this.get('currentVideo');

      // @TODO: add some sort of checking here(?)
      this.incrementProperty('currentOffset');

      nextOffset = this.get('currentOffset');
      this.send('loadVideoByOffset', nextOffset);

    }

  }

});

/**
 * View for the app to handle DOM events
 */
App.IndexView = Ember.View.extend({
  didInsertElement: function() {

    var self, controller, player;

    self = this;
    controller = this.get('controller');
    controller.set('player', player);

    // App resizing based on window.resize event
    $(window).bind('resize', function(){

      var windowWidth, data;

      windowWidth = $(window).width();
      data = $('.video-list').data('jsp');

      if(!Modernizr.mq(self.get('controller.largeMediaQuery'))) {

        if(data) {
          data.destroy();
        }

        $('.video-list').css('height', 'auto');

      } else {

        var controlHeight, videoPlayerHeight;

        controlHeight = $('.controls').outerHeight();
        videoPlayerHeight = $('.player-container').outerHeight();
        $('.video-list').css('height', videoPlayerHeight-controlHeight);
        self.get('controller').send('refreshList');
      }


    });

    $(window).trigger('resize');

    // execute search, replace this if we don't want search
    controller.send('search');

    $('.app-wrapper').addClass('active');
  }
});

/**
 * The object to be used for all Videos parsed from the YouTube API
 */
App.Video = Ember.Object.extend({
  id: null,
  title: null,
  thumbnail: null,
});

/**
 * View to handle each thumbnail in the video list. This is done
 * so we can handle click events and bind changes to the DOM.
 */
App.VideoThumbnailView = Ember.View.extend({
  tagName: 'li',
  classNames: ['thumbnail'],
  click: function(event) {

    var offset;

    offset = this.get('offset');

    // Add/remove active classes
    $('.video-list li.active').removeClass('active');
    this.$().addClass('active');

    this.get('controller').send('loadVideoByOffset', offset);

    if(!Modernizr.mq(this.get('controller.largeMediaQuery'))) {
      $(window).scrollTop(0);
    }

  }
});

/**
 * Add tooltips to the controls
 */
App.ControlsView = Ember.View.extend({
  tagName: 'ul',
  classNames: ['controls'],
  /**
   * Bind tooltips to all the control buttons once they are inserted
   * to the DOM
   */
  didInsertElement: function() {

    $('.prev').tooltipster({ content: 'Play previous video' });
    $('.next').tooltipster({ content: 'Play next video' });
    $('.position').tooltipster({ content: 'Edit position' });
    $('.play').tooltipster({
      content: 'Play video',
      /**
       * Rebind the content of the tooltip dependant on whether the
       * player is paused or not
       * @TODO: move this to the actual player switch(?)
       */
      functionBefore: function(origin, continueTooltip) {

        if($(this).hasClass('typcn-media-play')) {
          origin.tooltipster('content', 'Play video');
        } else {
          origin.tooltipster('content', 'Pause video');
        }
        continueTooltip();
      }

    });
  }
});

/**
 * A view for the load-more button so we can handle
 * touch gestures on mobile.
 */
App.LoadMoreView = Ember.View.extend({
  tagName: 'li',
  classNames: ['load-more'],
  click: function() {
    this.get('controller').send('loadMore');
  },
  /**
   * Add a touch event to the load more button
   * to fix the click event not being fired on mobile
   * devices
   */
  touchEnd: function() {
    this.get('controller').send('loadMore');
  }
});

/**
 * View for editing the position of the playlist
 */
App.EditPositionView = Ember.TextField.extend({
  /**
   * Focus the input when edit mode is enabled
   */
  didInsertElement: function() {
    this.$().focus();
  },
  /**
   * Capture key presses and accept the changes if it is `enter`
   * @param  {objet} event key press event
   */
  keyPress: function(event) {
    if(event.charCode === 13) {
      this.$().blur();
      this.get('controller').send('acceptChanges');
    }
  }
});

/**
 * Helper to handle the edit view
 */
Ember.Handlebars.helper('edit-position', App.EditPositionView);

/**
 * Resolve the App's model deferred when the YouTube player is ready
 */
function onYouTubeIframeAPIReady() {
  youtubePromise.resolve(); // ensure the page doesn't load until YTJSAPI has loaded
}

/**
 * Set up an Ember Deferred to delay model loading until API is ready.
 * @type {[type]}
 */
var youtubePromise = Ember.Deferred.create();
