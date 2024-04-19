# Grav Studio Editor Plugin

**If you encounter any issues, please don't hesitate
to [report
them](https://github.com/leotiger/grav-plugin-studioeditor/issues).**

![Screenshot](Screenshot.png)

The **Studio Editor Plugin** for [Grav](http://github.com/getgrav/grav) provides an advanced markdown editor with 
Live preview and support for extended markdown features like alignment, notices, etc. 
StudioEditor makes Markdown more accessible and transparent closing the gap to WYSIWYG editors as the writer
disposes of a preview which shows how his or her markdown translates and visualizes from text into and as html. 
The plugin allows to activate some nice extra features, e.g. if you use webp plugin the plugin will automatically
replace calls to jpg and png files to the corresponding webp version if they exist without using redirection, 
another great feature is the possibility to drag'n'drop images from the upload area right into the editor instance
like within the standard editor.

> :pushpin: Studio Editor is completely unobtrusive which means that you can return to use the build-in editor options at any time.

Please be advised that some of the features, like MathJax haven't been retested for this public release. 
This may apply to other features as well. What's definitely working out of the box is what you expect to work: 
editing standard and enhanced markdown. Or why not editing the summary if it uses the default separator (===) directly within the editor without activating expert mode?

## Installation

Installing the Studioeditor plugin can be done in one of three ways:
- GPM (Grav Package Manager)
- manual method
- admin method

### GPM Installation (Preferred)

To install the plugin via the [GPM](http://learn.getgrav.org/advanced/grav-gpm), through your system's terminal (also called the command line),
navigate to the root of your Grav-installation, and enter:

    bin/gpm install studioeditor

This will install the Studioeditor plugin into your `/user/plugins`-directory within Grav. Its files can be found under `/your/site/grav/user/plugins/studioeditor`.

### Manual Installation

To install the plugin manually, download the zip-version of this repository and unzip it under `/your/site/grav/user/plugins`.
Then rename the folder to `studioeditor`. You can find these files on [GitHub](https://github.com/leotiger/grav-plugin-studioeditor) or via [GetGrav.org](http://getgrav.org/downloads/plugins#admin).

You should now have all the plugin files under

    /your/site/grav/user/plugins/studioeditor

> NOTE: This plugin is a modular component for Grav which may require other plugins to operate,
> please see its [blueprints.yaml-file on GitHub](https://github.com/leotiger/grav-plugin-studioeditor/blob/master/blueprints.yaml).

### Admin Plugin

If you use the Admin Plugin, you can install the plugin directly by browsing the `Plugins`-menu and clicking on the `Add` button.

## Requirements

Make sure that you have installed and enabled the following for studioeditor support:

- enable GD and configure PHP to enable support for image processing

## Configuration

As Studioeditor requires the Admin plugin you should use Admin to maintain the configuration for Studioeditor.

### Credits

> Carlos Mújica, an artist from Colombia for his artwork and my gratitude for offering me some of his works. As a gift in return I offered him a website and thought: let's do it with GRAV. Without him Studioeditor wouldn't have been released to the wild... Probably I wouldn't have thought of GRAV if I'd been aware of the trouble of updating old shit...

> [GRAV](https://getgrav.org)
> This plugin wouldn't exist without the great work behind, GRAV

> [StackEdit](https://github.com/benweet/stackedit)
> This plugin wouldn't exist also without StackEdit, the current version (v5.x) of StackEdit uses Markdown-it, but the version used within StudioEditor is based on v4.x versions. Future versions of StudioEdit will use Markdown-it as well.

### Important

Despite having been reviewed and found error free, this plugin was developed many years ago and uses javascript packages that haven't been updated for a long time. As this plugin is used in the back-end, inside of Admin, without any exposure on the front-end, the risk of possible security problems related, if they exist, is minimal to none as access to the admin is restricted to authorized users. If the plugin gains some popularity, we'll address this problem by updating and substituting javascript packages.

### Collaboration

I'm looking out for collaborators even owners for this plugin. Feel free to ask if you feel comfortable with the ToDos'...

### ToDo

- [x] Clean code base getting rid of tons of files not used
- [x] Update underlying code base as many of the libs are quite old 
- [x] Enhance support of configuration options for the editor instance directly from Admin
- [x] Implement additional markdown features
- [x] Implement state of the art markdown parser like Markdown-it

