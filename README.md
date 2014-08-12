
OculusTube 
====== 
 
An Ember.js application to wrap the YouTube API to watch Oculus Rift movies 
 
Responsive Design 
------ 
This app was programmed with a Mobile-first mentality, meaning that it was made for mobile devices and then progressively enhanced for tablets and desktop.  
 
Features 
------ 
Although this app was developed with responsivity in mind, the only features for mobile devices include watching videos and loading more videos based on the YouTube query parameter `oculus rift`. The tablet (viewport size dependent) and desktop views add the ability to skip to previous/next videos and pause/play the current video from a miniature control bar on right rail. It is also possible to jump to a specific video number by clicking the dotted underlined number on the right hand side of the control bar. If a number greater than the total number of currently loaded videos is entered, nothing happens. 
 
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
 
