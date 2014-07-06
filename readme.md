# UltimateSelect 

A modern styleable replacement for SELECT elements.

## New Features (1.0.x)

* Mobile/touch friendly


## Features

* Supports OPTGROUPS
* Supports standard dropdown controls
* Supports multi-select controls (i.e. multiple="multiple")
* Supports inline controls (i.e. size="5")
* Fully accessible via keyboard
* Shift + click (or shift + enter) to select a range of options in multi-select controls
* Type to search when the control has focus
* Auto-height based on the size attribute (to use, omit the height property in your CSS!)
* Tested in IE8+, Firefox, recent WebKit browsers


## Usage

Download the [latest version](https://github.com/ionutvmi/ultimateSelect/releases)

Link to the JS file:

```html
<script src="jquery.ultimateSelect.js" type="text/javascript"></script>
```

Add the CSS file (or append contents to your own stylesheet):

```html
<link href="jquery.ultimateSelect.css" rel="stylesheet" type="text/css" />
```

To initialize:

```javascript
// default
$('select').ultimateSelect();

// or with custom settings
$('select').ultimateSelect({
    mobile: true,
    menuSpeed: 'fast'
});
```

## Settings

| Key                       | Default       | Values                     |  Description                                                                  |
| --------------------------|:-------------:|---------------------------:|------------------------------------------------------------------------------:|
| mobile                    | `true`        | Boolean                    | If true it will show the widget on mobile devices also                        |
| menuTransition            | `default`     | `default`, `slide`, `fade` | The show/hide transition for dropdown menus                                   |
| menuSpeed                 | `normal`      | `slow`, `normal`, `fast`   | The show/hide transition speed                                                |
| loopOptions               | `false`       | Boolean                    | Flag to allow arrow keys to loop through options                              |
| topPositionCorrelation    | `0`           | Integer                    | Will be plused to top position if droplist will be show at the top            |
| bottomPositionCorrelation | `0`           | Integer                    | Will be substracted from top position if droplist will be shown at the bottom |
| hideOnWindowScroll        | `true`        | Boolean                    | If false then showed droplist will not hide itself on window scroll event     |
| keepInViewport            | `true`        | Boolean                    | If set to false, the droplist will be always open towards the bottom          |


To specify settings after the init, use this syntax:

```javascript
$('select').ultimateSelect('settings', {settingName: value, ... });
```

## Methods

To call a method use this syntax:

```javascript
$('select').ultimateSelect('methodName', [option]);
```

### Available methods


| Key            | Description                                                                                   |
| ---------------|-----------------------------------------------------------------------------------------------|
| create         | Creates the control (default)                                                                 |
| destroy        | Destroys the UltimateSelect control and reverts back to the original form control                  |
| disable        | Disables the control (i.e. disabled="disabled")                                               |
| enable         | Enables the control                                                                           |
| value          | If passed with a value, sets the control to that value; otherwise returns the current value   |
| options        | If passed either a string of HTML or a JSON object, replaces the existing options; otherwise Returns the options container element as a jQuery object |
| control        | Returns the UltimateSelect control element (an anchor tag) for working with directly               |
| refresh        | Updates the UltimateSelect control's options based on the original controls options                |
| instance       | Returns the UltimateSelect instance, where you have more methods available (only in v1.2.0-dev available) as in the `UltimateSelect` class below.    |

## API `UltimateSelect`

You can instantiate the UltimateSelect also through a classic OOP way:

```javascript
var ultimateSelect = new UltimateSelect($('#mySelect'), settings = {});
ultimateSelect.showMenu();

// or 
var $select = $('#mySelect').ultimateSelect();
var ultimateSelect = $select.data('ultimateSelect'); 
ultimateSelect.showMenu();
```

The public methods are:

```javascript
refresh()
destroy()
disable()
enable()

getLabelClass()
getLabelText()
getSelectElement()
getOptions(String type = 'inline'|'dropdown')

hideMenus()
showMenu()

setLabel()
setOptions(Object options)
setValue(String value)


disableSelection(HTMLElement selector)
generateOptions(jQuery self, jQuery options)
handleKeyDown(event)
handleKeyPress(event)
init(options)
keepOptionInView(jQuery li, Boolean center)
refresh()
removeHover(HTMLElement li)
selectOption(HTMLElement li, event)
```

## Events

Events are fired on the original select element. You can bind events like this:

```javascript
$('select').ultimateSelect().change(function () {
    alert($(this).val());
});
```

### Available events

| Key            | Description                                                                                   |
| ---------------|-----------------------------------------------------------------------------------------------|
| focus          | Fired when the control gains focus                                                            |
| blur           | Fired when the control loses focus                                                            |
| change         | Fired when the value of a control changes                                                     |
| beforeopen     | Fired before a dropdown menu opens (cancelable)                                               |
| open           | Fired after a dropdown menu opens (not cancelable)                                            |
| beforeclose    | Fired before a dropdown menu closes (cancelable)                                              |
| close          | Fired after a dropdown menu closes (not cancelable)                                           |


## Maintained
This fork is maintained by [Mihai Ionut Vilcu](http://github.com/ionutvmi)


## Credits
This is a fork after [marcj/jquery-selectBox](https://github.com/marcj/jquery-selectBox)


