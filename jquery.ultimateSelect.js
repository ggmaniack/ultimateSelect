/*
 * jQuery ultimateSelect - A cosmetic, styleable replacement for SELECT elements
 *
 * Licensed under the MIT license: http://opensource.org/licenses/MIT
 *
 * v1.3.0
 *
 * https://github.com/ionutvmi/ ultimateSelect
 */
;(function ($) {

    /**
     * UltimateSelect class.
     *
     * @param {HTMLElement|jQuery} select If it's a jQuery object, we use the first element.
     * @param {Object}             options
     * @constructor
     */
    var UltimateSelect = this.UltimateSelect = function (select, options) {
        if (select instanceof jQuery) {
            if (select.length > 0) {
                select = select[0];
            } else {
                return;
            }
        }

        this.typeTimer     = null;
        this.typeSearch    = '';
        this.isMac         = navigator.platform.match(/mac/i);
        options            = 'object' === typeof options ? options :  {};
        this.selectElement = select;

        // Disable for iOS devices (their native controls are more suitable for a touch device)
        if (!options.mobile && navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) {
            return false;
        }

        // Element must be a select control
        if ('select' !== select.tagName.toLowerCase()) {
            return false;
        }

        this.init(options);
    };

    /**
     * @type {String}
     */
    UltimateSelect.prototype.version = '1.2.0';

    /**
     * @param {Object} options
     *
     * @returns {Boolean}
     */
    UltimateSelect.prototype.init = function (options) {
        var select = $(this.selectElement);
        if (select.data('ultimateSelect-control')) {
            return false;
        }

        var control    = $('<a class="ultimateSelect" />')
            , inline   = select.attr('multiple') || parseInt(select.attr('size')) > 1
            , settings = options || {}
            , tabIndex = parseInt(select.prop('tabindex')) || 0
            , self     = this;

        control
            .width(select.outerWidth())
            .addClass(select.attr('class'))
            .attr('title', select.attr('title') || '')
            .attr('tabindex', tabIndex)
            .css('display', 'inline-block')
            .bind('focus.ultimateSelect', function () {
                if (this !== document.activeElement && document.body !== document.activeElement) {
                    $(document.activeElement).blur();
                }
                if (control.hasClass('ultimateSelect-active')) {
                    return;
                }
                control.addClass('ultimateSelect-active');
                select.trigger('focus');
            })
            .bind('blur.ultimateSelect', function () {
                if (!control.hasClass('ultimateSelect-active')) {
                    return;
                }
                control.removeClass('ultimateSelect-active');
                select.trigger('blur');
            });

        if (!$(window).data('ultimateSelect-bindings')) {
            $(window)
                .data('ultimateSelect-bindings', true)
                .bind('scroll.ultimateSelect', (settings.hideOnWindowScroll) ? this.hideMenus : $.noop)
                .bind('resize.ultimateSelect', this.hideMenus);
        }

        if (select.attr('disabled')) {
            control.addClass('ultimateSelect-disabled');
        }

        // Focus on control when label is clicked
        select.bind('click.ultimateSelect', function (event) {
            control.focus();
            event.preventDefault();
        });

        // Generate control
        if (inline) {
            // Inline controls
            options = this.getOptions('inline');

            control
                .append(options)
                .data('ultimateSelect-options', options).addClass('ultimateSelect-inline ultimateSelect-menuShowing')
                .bind('keydown.ultimateSelect', function (event) {
                    self.handleKeyDown(event);
                })
                .bind('keypress.ultimateSelect',function (event) {
                    self.handleKeyPress(event);
                })
                .bind('mousedown.ultimateSelect',function (event) {
                    if (1 !== event.which) {
                        return;
                    }
                    if ($(event.target).is('A.ultimateSelect-inline')) {
                        event.preventDefault();
                    }
                    if (!control.hasClass('ultimateSelect-focus')) {
                        control.focus();
                    }
                })
                .insertAfter(select);

            // Auto-height based on size attribute
            if (!select[0].style.height) {
                var size = select.attr('size') ? parseInt(select.attr('size')) : 5;
                // Draw a dummy control off-screen, measure, and remove it
                var tmp = control
                    .clone()
                    .removeAttr('id')
                    .css({
                        position: 'absolute',
                        top: '-9999em'
                    })
                    .show()
                    .appendTo('body');
                tmp.find('.ultimateSelect-options').html('<li><a>\u00A0</a></li>');
                var optionHeight = parseInt(tmp.find('.ultimateSelect-options A:first').html('&nbsp;').outerHeight());
                tmp.remove();
                control.height(optionHeight * size);
            }
            this.disableSelection(control);
        } else {
            // Dropdown controls
            var label = $('<span class="ultimateSelect-label" />'),
                arrow = $('<span class="ultimateSelect-arrow" />');

            // Update label
            label.attr('class', this.getLabelClass()).text(this.getLabelText());
            options = this.getOptions('dropdown');
            options.appendTo('BODY');

            control
                .data('ultimateSelect-options', options)
                .addClass('ultimateSelect-dropdown')
                .append(label)
                .append(arrow)
                .bind('mousedown.ultimateSelect', function (event) {
                    if (1 === event.which) {
                        if (control.hasClass('ultimateSelect-menuShowing')) {
                            self.hideMenus();
                        } else {
                            event.stopPropagation();
                            // Webkit fix to prevent premature selection of options
                            options
                                .data('ultimateSelect-down-at-x', event.screenX)
                                .data('ultimateSelect-down-at-y', event.screenY);
                            self.showMenu();
                        }
                    }
                })
                .bind('keydown.ultimateSelect', function (event) {
                    self.handleKeyDown(event);
                })
                .bind('keypress.ultimateSelect', function (event) {
                    self.handleKeyPress(event);
                })
                .bind('open.ultimateSelect',function (event, triggerData) {
                    if (triggerData && triggerData._ultimateSelect === true) {
                        return;
                    }
                    self.showMenu();
                })
                .bind('close.ultimateSelect', function (event, triggerData) {
                    if (triggerData && triggerData._ultimateSelect === true) {
                        return;
                    }
                    self.hideMenus();
                })
                .insertAfter(select);

            // Set label width
            var labelWidth =
                    control.width()
                  - arrow.outerWidth()
                  - (parseInt(label.css('paddingLeft')) || 0)
                  - (parseInt(label.css('paddingRight')) || 0);

            label.width(labelWidth);
            this.disableSelection(control);
        }
        // Store data for later use and show the control
        select
            .addClass('ultimateSelect')
            .data('ultimateSelect-control', control)
            .data('ultimateSelect-settings', settings)
            .hide();
    };

    /**
     * @param {String} type 'inline'|'dropdown'
     * @returns {jQuery}
     */
    UltimateSelect.prototype.getOptions = function (type) {
        var options;
        var select = $(this.selectElement);
        var self   = this;
        // Private function to handle recursion in the getOptions function.
        var _getOptions = function (select, options) {
            // Loop through the set in order of element children.
            select.children('OPTION, OPTGROUP').each(function () {
                // If the element is an option, add it to the list.
                if ($(this).is('OPTION')) {
                    // Check for a value in the option found.
                    if ($(this).length > 0) {
                        // Create an option form the found element.
                        self.generateOptions($(this), options);
                    } else {
                        // No option information found, so add an empty.
                        options.append('<li>\u00A0</li>');
                    }
                } else {
                    // If the element is an option group, add the group and call this function on it.
                    var optgroup = $('<li class="ultimateSelect-optgroup" />');
                    optgroup.text($(this).attr('label'));
                    options.append(optgroup);
                    options = _getOptions($(this), options);
                }
            });
            // Return the built strin
            return options;
        };

        switch (type) {
            case 'inline':
                options = $('<ul class="ultimateSelect-options" />');
                options = _getOptions(select, options);
                options
                    .find('A')
                    .bind('mouseover.ultimateSelect', function (event) {
                        self.addHover($(this).parent());
                    })
                    .bind('mouseout.ultimateSelect',function (event) {
                        self.removeHover($(this).parent());
                    })
                    .bind('mousedown.ultimateSelect',function (event) {
                        if (1 !== event.which) {
                            return
                        }
                        event.preventDefault(); // Prevent options from being "dragged"
                        if (!select.ultimateSelect('control').hasClass('ultimateSelect-active')) {
                            select.ultimateSelect('control').focus();
                        }
                    })
                    .bind('mouseup.ultimateSelect', function (event) {
                        if (1 !== event.which) {
                            return;
                        }
                        self.hideMenus();
                        self.selectOption($(this).parent(), event);
                    });

                this.disableSelection(options);
                return options;
            case 'dropdown':
                options = $('<ul class="ultimateSelect-dropdown-menu ultimateSelect-options" />');
                options = _getOptions(select, options);

                options
                    .data('ultimateSelect-select', select)
                    .css('display', 'none')
                    .appendTo('BODY')
                    .find('A')
                    .bind('mousedown.ultimateSelect', function (event) {
                        if (event.which === 1) {
                            event.preventDefault(); // Prevent options from being "dragged"
                            if (event.screenX === options.data('ultimateSelect-down-at-x') &&
                                event.screenY === options.data('ultimateSelect-down-at-y')) {
                                options.removeData('ultimateSelect-down-at-x').removeData('ultimateSelect-down-at-y');
                                if (/android/i.test(navigator.userAgent.toLowerCase()) &&
                                    /chrome/i.test(navigator.userAgent.toLowerCase())) {
                                    self.selectOption($(this).parent());
                                }
                                self.hideMenus();
                            }
                        }
                    })
                    .bind('mouseup.ultimateSelect', function (event) {
                        if (1 !== event.which) {
                            return;
                        }
                        if (event.screenX === options.data('ultimateSelect-down-at-x') &&
                            event.screenY === options.data('ultimateSelect-down-at-y')) {
                            return;
                        } else {
                            options.removeData('ultimateSelect-down-at-x').removeData('ultimateSelect-down-at-y');
                        }
                        self.selectOption($(this).parent());
                        self.hideMenus();
                    })
                    .bind('mouseover.ultimateSelect', function (event) {
                        self.addHover($(this).parent());
                    })
                    .bind('mouseout.ultimateSelect', function (event) {
                        self.removeHover($(this).parent());
                    });

                // Inherit classes for dropdown menu
                var classes = select.attr('class') || '';
                if ('' !== classes) {
                    classes = classes.split(' ');
                    for (var i = 0; i < classes.length; i++) {
                        options.addClass(classes[i] + '-ultimateSelect-dropdown-menu');
                    }

                }
                this.disableSelection(options);
                return options;
        }
    };

    /**
     * Returns the current class of the selected option.
     *
     * @returns {String}
     */
    UltimateSelect.prototype.getLabelClass = function () {
        var selected = $(this.selectElement).find('OPTION:selected');
        return ('ultimateSelect-label ' + (selected.attr('class') || '')).replace(/\s+$/, '');
    };

    /**
     * Returns the current label of the selected option.
     *
     * @returns {String}
     */
    UltimateSelect.prototype.getLabelText = function () {
        var selected = $(this.selectElement).find('OPTION:selected');
        return selected.text() || '\u00A0';
    };

    /**
     * Sets the label.
     * This method uses the getLabelClass() and getLabelText() methods.
     */
    UltimateSelect.prototype.setLabel = function () {
        var select = $(this.selectElement);
        var control = select.data('ultimateSelect-control');
        if (!control) {
            return;
        }

        control
            .find('.ultimateSelect-label')
            .attr('class', this.getLabelClass())
            .text(this.getLabelText());
    };

    /**
     * Destroys the UltimateSelect instance and shows the origin select element.
     *
     */
    UltimateSelect.prototype.destroy = function () {
        var select = $(this.selectElement);
        var control = select.data('ultimateSelect-control');
        if (!control) {
            return;
        }

        var options = control.data('ultimateSelect-options');
        options.remove();
        control.remove();
        select
            .removeClass('ultimateSelect')
            .removeData('ultimateSelect-control')
            .data('ultimateSelect-control', null)
            .removeData('ultimateSelect-settings')
            .data('ultimateSelect-settings', null)
            .show();
    };

    /**
     * Refreshes the option elements.
     */
    UltimateSelect.prototype.refresh = function () {
        var select = $(this.selectElement)
            , control = select.data('ultimateSelect-control')
            , type = control.hasClass('ultimateSelect-dropdown') ? 'dropdown' : 'inline'
            , options;

        // Remove old options
        control.data('ultimateSelect-options').remove();

        // Generate new options
        options  = this.getOptions(type);
        control.data('ultimateSelect-options', options);

        switch (type) {
            case 'inline':
                control.append(options);
                break;
            case 'dropdown':
                // Update label
                this.setLabel();
                $("BODY").append(options);
                break;
        }

        // Restore opened dropdown state (original menu was trashed)
        if ('dropdown' === type && control.hasClass('ultimateSelect-menuShowing')) {
            this.showMenu();
        }
    };

    /**
     * Shows the dropdown menu.
     */
    UltimateSelect.prototype.showMenu = function () {
        var self = this
            , select   = $(this.selectElement)
            , control  = select.data('ultimateSelect-control')
            , settings = select.data('ultimateSelect-settings')
            , options  = control.data('ultimateSelect-options');

        if (control.hasClass('ultimateSelect-disabled')) {
            return false;
        }

        this.hideMenus();

        // Get top and bottom width of ultimateSelect
        var borderBottomWidth = parseInt(control.css('borderBottomWidth')) || 0;
        var borderTopWidth = parseInt(control.css('borderTopWidth')) || 0;

        // Get proper variables for keeping options in viewport
        var pos = control.offset()
            , topPositionCorrelation = (settings.topPositionCorrelation) ? settings.topPositionCorrelation : 0
            , bottomPositionCorrelation = (settings.bottomPositionCorrelation) ? settings.bottomPositionCorrelation : 0
            , optionsHeight = options.outerHeight()
            , controlHeight = control.outerHeight()
            , maxHeight = parseInt(options.css('max-height'))
            , scrollPos = $(window).scrollTop()
            , heightToTop = pos.top - scrollPos
            , heightToBottom = $(window).height() - ( heightToTop + controlHeight )
            , posTop = (heightToTop > heightToBottom) && (settings.keepInViewport == null ? true : settings.keepInViewport)
            , top = posTop
                  ? pos.top - optionsHeight + borderTopWidth + topPositionCorrelation
                  : pos.top + controlHeight - borderBottomWidth - bottomPositionCorrelation;


        // If the height to top and height to bottom are less than the max-height
        if(heightToTop < maxHeight&& heightToBottom < maxHeight){

            // Set max-height and top
            if(posTop){
                var maxHeightDiff = maxHeight - ( heightToTop - 5 );
                options.css({'max-height': maxHeight - maxHeightDiff + 'px'});
                top = top + maxHeightDiff;
            }else{
                var maxHeightDiff = maxHeight - ( heightToBottom - 5 );
                options.css({'max-height': maxHeight - maxHeightDiff + 'px'});
            }

        }

        // Save if position is top to options data
        options.data('posTop',posTop);


        // Menu position
        options
            .width(control.innerWidth())
            .css({
                top: top,
                left: control.offset().left
            })
            // Add Top and Bottom class based on position
            .addClass('ultimateSelect-options ultimateSelect-options-'+(posTop?'top':'bottom'));


        if (select.triggerHandler('beforeopen')) {
            return false;
        }

        var dispatchOpenEvent = function () {
            select.triggerHandler('open', {
                _ultimateSelect: true
            });
        };

        // Show menu
        switch (settings.menuTransition) {
            case 'fade':
                options.fadeIn(settings.menuSpeed, dispatchOpenEvent);
                break;
            case 'slide':
                options.slideDown(settings.menuSpeed, dispatchOpenEvent);
                break;
            default:
                options.show(settings.menuSpeed, dispatchOpenEvent);
                break;
        }

        if (!settings.menuSpeed) {
            dispatchOpenEvent();
        }

        // Center on selected option
        var li = options.find('.ultimateSelect-selected:first');
        this.keepOptionInView(li, true);
        this.addHover(li);
        control.addClass('ultimateSelect-menuShowing ultimateSelect-menuShowing-'+(posTop?'top':'bottom'));

        $(document).bind('mousedown.ultimateSelect', function (event) {
            if (1 === event.which) {
                if ($(event.target).parents().andSelf().hasClass('ultimateSelect-options')) {
                    return;
                }
                self.hideMenus();
            }
        });
    };

    /**
     * Hides the menu of all instances.
     */
    UltimateSelect.prototype.hideMenus = function () {
        if ($(".ultimateSelect-dropdown-menu:visible").length === 0) {
            return;
        }

        $(document).unbind('mousedown.ultimateSelect');
        $(".ultimateSelect-dropdown-menu").each(function () {
            var options = $(this)
                , select = options.data('ultimateSelect-select')
                , control = select.data('ultimateSelect-control')
                , settings = select.data('ultimateSelect-settings')
                , posTop = options.data('posTop');

            if (select.triggerHandler('beforeclose')) {
                return false;
            }

            var dispatchCloseEvent = function () {
                select.triggerHandler('close', {
                    _ultimateSelect: true
                });
            };
            if (settings) {
                switch (settings.menuTransition) {
                    case 'fade':
                        options.fadeOut(settings.menuSpeed, dispatchCloseEvent);
                        break;
                    case 'slide':
                        options.slideUp(settings.menuSpeed, dispatchCloseEvent);
                        break;
                    default:
                        options.hide(settings.menuSpeed, dispatchCloseEvent);
                        break;
                }
                if (!settings.menuSpeed) {
                    dispatchCloseEvent();
                }
                control.removeClass('ultimateSelect-menuShowing ultimateSelect-menuShowing-'+(posTop?'top':'bottom'));
            } else {
                $(this).hide();
                $(this).triggerHandler('close', {
                    _ultimateSelect: true
                });
                $(this).removeClass('ultimateSelect-menuShowing ultimateSelect-menuShowing-'+(posTop?'top':'bottom'));
            }

            options.css('max-height','');
            //Remove Top or Bottom class based on position
            options.removeClass('ultimateSelect-options-'+(posTop?'top':'bottom'));
            options.data('posTop' , false);
        });
    };

    /**
     * Selects an option.
     *
     * @param {HTMLElement} li
     * @param {DOMEvent}    event
     * @returns {Boolean}
     */
    UltimateSelect.prototype.selectOption = function (li, event) {
        var select = $(this.selectElement);
        li         = $(li);

        var control    = select.data('ultimateSelect-control')
            , settings = select.data('ultimateSelect-settings');

        if (control.hasClass('ultimateSelect-disabled')) {
            return false;
        }

        if (0 === li.length || li.hasClass('ultimateSelect-disabled')) {
            return false;
        }

        if (select.attr('multiple')) {
            // If event.shiftKey is true, this will select all options between li and the last li selected
            if (event.shiftKey && control.data('ultimateSelect-last-selected')) {
                li.toggleClass('ultimateSelect-selected');
                var affectedOptions;
                if (li.index() > control.data('ultimateSelect-last-selected').index()) {
                    affectedOptions = li
                        .siblings()
                        .slice(control.data('ultimateSelect-last-selected').index(), li.index());
                } else {
                    affectedOptions = li
                        .siblings()
                        .slice(li.index(), control.data('ultimateSelect-last-selected').index());
                }
                affectedOptions = affectedOptions.not('.ultimateSelect-optgroup, .ultimateSelect-disabled');
                if (li.hasClass('ultimateSelect-selected')) {
                    affectedOptions.addClass('ultimateSelect-selected');
                } else {
                    affectedOptions.removeClass('ultimateSelect-selected');
                }
            } else if ((this.isMac && event.metaKey) || (!this.isMac && event.ctrlKey)) {
                li.toggleClass('ultimateSelect-selected');
            } else {
                li.siblings().removeClass('ultimateSelect-selected');
                li.addClass('ultimateSelect-selected');
            }
        } else {
            li.siblings().removeClass('ultimateSelect-selected');
            li.addClass('ultimateSelect-selected');
        }

        if (control.hasClass('ultimateSelect-dropdown')) {
            control.find('.ultimateSelect-label').text(li.text());
        }

        // Update original control's value
        var i = 0, selection = [];
        if (select.attr('multiple')) {
            control.find('.ultimateSelect-selected A').each(function () {
                selection[i++] = $(this).attr('rel');
            });
        } else {
            selection = li.find('A').attr('rel');
        }

        // Remember most recently selected item
        control.data('ultimateSelect-last-selected', li);

        // Change callback
        if (select.val() !== selection) {
            select.val(selection);
            this.setLabel();
            select.trigger('change');
        }

        return true;
    };

    /**
     * Adds the hover class.
     *
     * @param {HTMLElement} li
     */
    UltimateSelect.prototype.addHover = function (li) {
        li = $(li);
        var select = $(this.selectElement)
            , control   = select.data('ultimateSelect-control')
            , options = control.data('ultimateSelect-options');

        options.find('.ultimateSelect-hover').removeClass('ultimateSelect-hover');
        li.addClass('ultimateSelect-hover');
    };

    /**
     * Returns the original HTML select element.
     *
     * @returns {HTMLElement}
     */
    UltimateSelect.prototype.getSelectElement = function () {
        return this.selectElement;
    };

    /**
     * Remove the hover class.
     *
     * @param {HTMLElement} li
     */
    UltimateSelect.prototype.removeHover = function (li) {
        li = $(li);
        var select = $(this.selectElement)
            , control = select.data('ultimateSelect-control')
            , options = control.data('ultimateSelect-options');

        options.find('.ultimateSelect-hover').removeClass('ultimateSelect-hover');
    };

    /**
     * Checks if the widget is in the view.
     *
     * @param {jQuery}      li
     * @param {Boolean}     center
     */
    UltimateSelect.prototype.keepOptionInView = function (li, center) {
        if (!li || li.length === 0) {
            return;
        }

        var select = $(this.selectElement)
            , control     = select.data('ultimateSelect-control')
            , options   = control.data('ultimateSelect-options')
            , scrollBox = control.hasClass('ultimateSelect-dropdown') ? options : options.parent()
            , top       = parseInt(li.offset().top -scrollBox.position().top)
            , bottom    = parseInt(top + li.outerHeight());

        if (center) {
            scrollBox.scrollTop(li.offset().top - scrollBox.offset().top + scrollBox.scrollTop() -
                (scrollBox.height() / 2));
        } else {
            if (top < 0) {
                scrollBox.scrollTop(li.offset().top - scrollBox.offset().top + scrollBox.scrollTop());
            }
            if (bottom > scrollBox.height()) {
                scrollBox.scrollTop((li.offset().top + li.outerHeight()) - scrollBox.offset().top +
                    scrollBox.scrollTop() - scrollBox.height());
            }
        }
    };

    /**
     * Handles the keyDown event.
     * Handles open/close and arrow key functionality
     *
     * @param {DOMEvent}    event
     */
    UltimateSelect.prototype.handleKeyDown = function (event) {
        var select = $(this.selectElement)
            , control        = select.data('ultimateSelect-control')
            , options      = control.data('ultimateSelect-options')
            , settings     = select.data('ultimateSelect-settings')
            , totalOptions = 0, i = 0;

        if (control.hasClass('ultimateSelect-disabled')) {
            return;
        }

        switch (event.keyCode) {
            case 8:
                // backspace
                event.preventDefault();
                this.typeSearch = '';
                break;
            case 9:
            // tab
            case 27:
                // esc
                this.hideMenus();
                this.removeHover();
                break;
            case 13:
                // enter
                if (control.hasClass('ultimateSelect-menuShowing')) {
                    this.selectOption(options.find('LI.ultimateSelect-hover:first'), event);
                    if (control.hasClass('ultimateSelect-dropdown')) {
                        this.hideMenus();
                    }
                } else {
                    this.showMenu();
                }
                break;
            case 38:
            // up
            case 37:
                // left
                event.preventDefault();
                if (control.hasClass('ultimateSelect-menuShowing')) {
                    var prev = options.find('.ultimateSelect-hover').prev('LI');
                    totalOptions = options.find('LI:not(.ultimateSelect-optgroup)').length;
                    i = 0;
                    while (prev.length === 0 || prev.hasClass('ultimateSelect-disabled') ||
                        prev.hasClass('ultimateSelect-optgroup')) {
                        prev = prev.prev('LI');
                        if (prev.length === 0) {
                            if (settings.loopOptions) {
                                prev = options.find('LI:last');
                            } else {
                                prev = options.find('LI:first');
                            }
                        }
                        if (++i >= totalOptions) {
                            break;
                        }
                    }
                    this.addHover(prev);
                    this.selectOption(prev, event);
                    this.keepOptionInView(prev);
                } else {
                    this.showMenu();
                }
                break;
            case 40:
            // down
            case 39:
                // right
                event.preventDefault();
                if (control.hasClass('ultimateSelect-menuShowing')) {
                    var next = options.find('.ultimateSelect-hover').next('LI');
                    totalOptions = options.find('LI:not(.ultimateSelect-optgroup)').length;
                    i = 0;
                    while (0 === next.length || next.hasClass('ultimateSelect-disabled') ||
                        next.hasClass('ultimateSelect-optgroup')) {
                        next = next.next('LI');
                        if (next.length === 0) {
                            if (settings.loopOptions) {
                                next = options.find('LI:first');
                            } else {
                                next = options.find('LI:last');
                            }
                        }
                        if (++i >= totalOptions) {
                            break;
                        }
                    }
                    this.addHover(next);
                    this.selectOption(next, event);
                    this.keepOptionInView(next);
                } else {
                    this.showMenu();
                }
                break;
        }
    };

    /**
     * Handles the keyPress event.
     * Handles type-to-find functionality
     *
     * @param {DOMEvent}    event
     */
    UltimateSelect.prototype.handleKeyPress = function (event) {
        var select = $(this.selectElement)
            , control = select.data('ultimateSelect-control')
            , options = control.data('ultimateSelect-options')
            , self    = this;

        if (control.hasClass('ultimateSelect-disabled')) {
            return;
        }

        switch (event.keyCode) {
            case 9:
            // tab
            case 27:
            // esc
            case 13:
            // enter
            case 38:
            // up
            case 37:
            // left
            case 40:
            // down
            case 39:
                // right
                // Don't interfere with the keydown event!
                break;
            default:
                // Type to find
                if (!control.hasClass('ultimateSelect-menuShowing')) {
                    this.showMenu();
                }
                event.preventDefault();
                clearTimeout(this.typeTimer);
                this.typeSearch += String.fromCharCode(event.charCode || event.keyCode);
                options.find('A').each(function () {
                    if ($(this).text().substr(0, self.typeSearch.length).toLowerCase() === self.typeSearch.toLowerCase()) {
                        self.addHover($(this).parent());
                        self.selectOption($(this).parent(), event);
                        self.keepOptionInView($(this).parent());
                        return false;
                    }
                });
                // Clear after a brief pause
                this.typeTimer = setTimeout(function () {
                    self.typeSearch = '';
                }, 1000);
                break;
        }
    };

    /**
     * Enables the ultimateSelect.
     */
    UltimateSelect.prototype.enable = function () {
        var select = $(this.selectElement);
        select.prop('disabled', false);
        var control = select.data('ultimateSelect-control');
        if (!control) {
            return;
        }
        control.removeClass('ultimateSelect-disabled');
    };

    /**
     * Disables the ultimateSelect.
     */
    UltimateSelect.prototype.disable = function () {
        var select = $(this.selectElement);
        select.prop('disabled', true);
        var control = select.data('ultimateSelect-control');
        if (!control) {
            return;
        }
        control.addClass('ultimateSelect-disabled');
    };

    /**
     * Sets the current value.
     *
     * @param {String}      value
     */
    UltimateSelect.prototype.setValue = function (value) {
        var select = $(this.selectElement);
        select.val(value);
        value = select.val(); // IE9's select would be null if it was set with a non-exist options value

        if (null === value) { // So check it here and set it with the first option's value if possible
            value = select.children().first().val();
            select.val(value);
        }

        var control = select.data('ultimateSelect-control');
        if (!control) {
            return;
        }

        var settings = select.data('ultimateSelect-settings')
            , options = control.data('ultimateSelect-options');

        // Update label
        this.setLabel();

        // Update control values
        options.find('.ultimateSelect-selected').removeClass('ultimateSelect-selected');
        options.find('A').each(function () {
            if (typeof(value) === 'object') {
                for (var i = 0; i < value.length; i++) {
                    if ($(this).attr('rel') == value[i]) {
                        $(this).parent().addClass('ultimateSelect-selected');
                    }
                }
            } else {
                if ($(this).attr('rel') == value) {
                    $(this).parent().addClass('ultimateSelect-selected');
                }
            }
        });

        if (settings.change) {
            settings.change.call(select);
        }
    };

    /**
     * Sets the option elements.
     *
     * @param {String|Object} options
     */
    UltimateSelect.prototype.setOptions = function (options) {
        var select = $(this.selectElement)
            , control = select.data('ultimateSelect-control');

        switch (typeof(options)) {
            case 'string':
                select.html(options);
                break;
            case 'object':
                select.html('');
                for (var i in options) {
                    if (options[i] === null) {
                        continue;
                    }
                    if (typeof(options[i]) === 'object') {
                        var optgroup = $('<optgroup label="' + i + '" />');
                        for (var j in options[i]) {
                            optgroup.append('<option value="' + j + '">' + options[i][j] + '</option>');
                        }
                        select.append(optgroup);
                    } else {
                        var option = $('<option value="' + i + '">' + options[i] + '</option>');
                        select.append(option);
                    }
                }
                break;
        }

        if (control) {
            // Refresh the control
            this.refresh();
        }
    };

    /**
     * Disables the selection.
     *
     * @param {*} selector
     */
    UltimateSelect.prototype.disableSelection = function (selector) {
        $(selector).css('MozUserSelect', 'none').bind('selectstart', function (event) {
            event.preventDefault();
        });
    };

    /**
     * Generates the options.
     *
     * @param {jQuery} self
     * @param {jQuery} options
     */
    UltimateSelect.prototype.generateOptions = function (self, options) {
        var li = $('<li />'), a = $('<a />');
        li.addClass(self.attr('class'));
        li.data(self.data());
        a.attr('rel', self.val()).text(self.text());
        li.append(a);
        if (self.attr('disabled')) {
            li.addClass('ultimateSelect-disabled');
        }
        if (self.attr('selected')) {
            li.addClass('ultimateSelect-selected');
        }
        options.append(li);
    };

    /**
     * Extends the jQuery.fn object.
     */
    $.extend($.fn, {
        ultimateSelect: function (method, options) {
            var ultimateSelect;

            switch (method) {
                case 'control':
                    return $(this).data('ultimateSelect-control');
                case 'settings':
                    if (!options) {
                        return $(this).data('ultimateSelect-settings');
                    }
                    $(this).each(function () {
                        $(this).data('ultimateSelect-settings', $.extend(true, $(this).data('ultimateSelect-settings'), options));
                    });
                    break;
                case 'options':
                    // Getter
                    if (undefined === options) {
                        return $(this).data('ultimateSelect-control').data('ultimateSelect-options');
                    }
                    // Setter
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.setOptions(options);
                        }
                    });
                    break;
                case 'value':
                    // Empty string is a valid value
                    if (undefined === options) {
                        return $(this).val();
                    }
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.setValue(options);
                        }
                    });
                    break;
                case 'refresh':
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.refresh();
                        }
                    });
                    break;
                case 'enable':
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.enable(this);
                        }
                    });
                    break;
                case 'disable':
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.disable();
                        }
                    });
                    break;
                case 'destroy':
                    $(this).each(function () {
                        if (ultimateSelect = $(this).data('ultimateSelect')) {
                            ultimateSelect.destroy();
                            $(this).data('ultimateSelect', null);
                        }
                    });
                    break;
                case 'instance':
                    return $(this).data('ultimateSelect');
                default:
                    $(this).each(function (idx, select) {
                        if (!$(select).data('ultimateSelect')) {
                            $(select).data('ultimateSelect', new UltimateSelect(select, method));
                        }
                    });
                    break;
            }
            return $(this);
        }
    });
})(jQuery);
