
OculusTube 
====== 
 
An Ember.js application to wrap the YouTube API to watch Oculus Rift movies.
 
Responsive Design 
------ 
This app was programmed with a Mobile-first mentality, meaning that it was made for mobile devices and then progressively enhanced for tablets and desktop.  
 
Features 
------ 
Although this app was developed with responsivity in mind, the only features for mobile devices include watching videos and loading more videos based on the YouTube query parameter `oculus rift`. The tablet (viewport size dependent) and desktop views add the ability to skip to previous/next videos and pause/play the current video from a miniature control bar on right rail. It is also possible to jump to a specific video number by clicking the dotted underlined number on the right hand side of the control bar. If a number greater than the total number of currently loaded videos is entered, nothing happens.

Templating
------ 
As Ember.js is coupled with Handlebars.js, it was used as the templating language. The templates are compiled on the fly on each page render, but this can be circumvented by precompiling them with [grunt-ember-templates](https://github.com/dgeb/grunt-ember-templates)

Video Object Caching
------ 
The YouTube video data is only cached per application view located in the `App.IndexController.videos`. The schema for each video object is defined in an `App.Video` object and only contains the video id, title, and thumbnail. This can easily be extended to include any/all YouTube data if required.

The `App.IndexController.videos` array of objects is extended when more videos are loaded by clicking the `load more` button. `Localstorage` did not seem appropriate for this use-case as there is no good way to cache the YouTube API query for subsequent page loads.

Browser Support 
------ 
This was tested on all major browsers including: Chrome, Firefox, Safari, IE9/10/11, iOS, Android.
 
Sass 
------ 
Sass was used as a CSS precompiler. It is compiled using grunt-contrib-sass. 
 
Grunt 
------ 
This application was built using grunt. The settings are located in the Gruntfile.js. All Javascripts are concatenated and uglified and saved into the /dist folder. Unmodified files are viewable in `/scripts`. 
 
Testing 
------ 
Qunit is included with this project, though not many unit tests were created. To access the unit tests, simply navigate to the base URL of the project and concatenate `/?test`. 
 
Dependencies 
------ 
* Modernizr 
* jQuery 
* Handlebars 
* Ember 
* jScrollpane 
* jQuery.mousewheel 
* mwheelIntent 
* Tooltipster
 
