# Grav Studio Editor Plugin

The **Studio Editor Plugin** for [Grav](http://github.com/getgrav/grav) provides an advanced markdown editor with Live preview and WYSIWYG controls and support for extended markdown features. The plugin allows to activate some nice extra features, e.g. if you use webp plugin the plugin will automatically replace calls to jpg and png files to the corresponding webp version if it exists without using redirection.

The plugin at it's current state, v1.1.1 has issues with the Flex Objects plugin. To access the Flex Objects plugin configuration you have to disable the Studio Editor plugin and reactivate it after touching the Flex Objects configuration.

Please be advised that some of the features, like MathJax haven't been retested for this public release. This may apply to other features as well. What's definitely working out of the box is what you expect to work: editing standard and enhanced markdown.

### Installation

You will have to download the plugin from GitHub while it's not available in the GRAV universe and extract it to your plugin folder.

### Issues

Currently the Studio Editor won't initialize correctly if the page was saved with a primary tab other than Content active during saving. You will need to reload with the content tab active or use the Fullscreen toggle button, which indicates that the issue may have an easy solution. If there's some feedback, I will most probably solve this minor glitch.
