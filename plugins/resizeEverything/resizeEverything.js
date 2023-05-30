(function(factory, undefined) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof module === 'object' && typeof module.exports === 'object') {
		// CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Global jQuery
		factory(jQuery);
	}
}(function($, undefined) {
    
    if ($.fn.resizableSafe)
        return;

    $.fn.resizableSafe = function fnResizable(options) {

        var defaultOptions = {
            // selector for handle that starts dragging
            handleSelector: null,
            // resize the width
            resizeWidth: true,
            // resize the height
            resizeHeight: false,
            // the side that the width resizing is relative to
            resizeWidthFrom: 'right',
            // the side that the height resizing is relative to
            resizeHeightFrom: 'bottom',
            // hook into start drag operation (event passed)
            onDragStart: null,
            // hook into stop drag operation (event passed)
            onDragEnd: null,
            // hook into each drag operation (event passed)
            onDrag: null,
            // disable touch-action on $handle
            // prevents browser level actions like forward back gestures
            touchActionNone: true,
            // instance id
            instanceId: null,
            eventMinWidth: 4,
            redrawFunc: null,
            resizeStep: 4,
            inactiveZones: null
        }

        if (typeof options == "object")
            defaultOptions = $.extend(defaultOptions, options)

        return this.each(function () {

            var opt = $.extend({}, defaultOptions)
            if (!opt.instanceId) opt.instanceId = "rsz_" + new Date().getTime()

            var resizeStepParam = null
            var stepStart = null
            var step = null

            if (options.resizeStep) resizeStepParam = options.resizeStep
            else resizeStepParam = defaultOptions.resizeStep                      

            // Текущий элемент для ресайза и его данные
            var $el = $(this)
            var $elementInfo

            // Если эвент прошедший, то к нему ресайз не применяем
            let detail = $el.find('.EventDetail')
            let data = JSON.parse($(detail).data('data'))
            let date = new Date(data.end)
            if (date.getTime() < new Date().getTime()) {
                return 
            }

            // Штуки, за которые тянем блок 
            var $handle
            var $handleLeft
            // Shows current handler
            var whichHandle = ''
            // Присобачиваем их к блоку
            $($el).append('<div class="stickR"></div>')
            $($el).append('<div class="stickL"></div>')
            var resizerL = getHandleLeft($el)
            var resizerR = getHandle($el)

            //Стартовые и текущие ширина и координаты
            var original_width = 0
            var original_x = 0
            var original_mouse_x = 0
            var leftRange
            var rightRange

            var minWidth
            var lastWidth
            var labelWidth
            var lastPageX
            var lastDirection

            // Новые даты для ресайзнутых эвентов
            var labelDateStart = null
            var labelDateEnd = null

            //Свойства последнего состояния
            var lastStateWidth
            var lastStateLeft

            // ------------------------------------------------------------------------
            // ------------------------------------------------------------------------
            // ------------------------------------------------------------------------

            function mouseDown (e) {
                whichHandle = e.target.className
                e.preventDefault()
                
                stepStart = ($('.ScheduleDay').width() / 24) * resizeStepParam
                step = stepStart

                original_width = parseFloat($el.width())
                lastWidth = parseFloat($el.width())
                original_x = Number($($el).css('left').replace('px',''))
                original_mouse_x = e.pageX
                lastPageX = e.pageX

                bordersCalculation()

                $(document).on('mousemove.' + opt.instanceId, resize)
                $(document).on('mouseup.' + opt.instanceId, stopResize)
                
                let label = drawResizeLabel(whichHandle)
                document.body.appendChild(label)
                labelWidth = $(label).width() * 1.3 //умножил на 1.3 чтобы лейбл при растяжении за левую грань был вблизи от эвента, но и не перекрывал его. Число просто из головы
                $(label).css('left', e.clientX + 'px').css('top', e.clientY - 80 + 'px')

                rememberLastState()

                if (whichHandle === 'stickL') {
                    $(label).css('left', e.clientX - labelWidth + 'px')
                }

                if (opt.onDragStart) {
                    if (opt.onDragStart(e, $el, opt) === false){
                        return;
                    }
                }
            }
            
            resizerL.on("mousedown." + opt.instanceId, mouseDown)
            resizerR.on("mousedown." + opt.instanceId, mouseDown)

            function resize (e) {
                if (whichHandle.indexOf('stickL') !== -1) {
                    let width = original_width - (e.pageX - original_mouse_x)
                    let currentDirection = lastPageX > e.pageX ? 'l' : 'r'

                    if (lastPageX > e.pageX) {
                        currentDirection = 'l'
                    } 
                    else if (lastPageX < e.pageX) {
                        currentDirection = 'r'
                    }
                    else {
                        currentDirection = lastDirection
                    }


                    let didDirectionChanged = directionChanged(lastDirection, currentDirection)

                    if (didDirectionChanged) {
                        step = stepStart
                        original_width = width
                        original_mouse_x = e.pageX
                        original_x = Number($($el).css('left').replace('px',''))
                    }

                    lastPageX = e.pageX
                    lastDirection = currentDirection

                    if (width >= minWidth && width <= leftRange) {
                        let deltaWidth = original_width - width

                        if (Math.abs(deltaWidth) > step) {
                            let widthInPercent = 100 * width / $('.ScheduleDay').width()

                            let oldPositionLeft = original_x * 100 / $('.ScheduleDay').width()
                            let newPositionLeft 
                            if (original_x === 0) {
                                newPositionLeft = (original_x + (e.pageX - original_mouse_x))
                                newPositionLeft = 100 * newPositionLeft / $('.ScheduleDay').width() 
                            } 
                            else {
                                newPositionLeft = (original_x + (e.pageX - original_mouse_x)) * oldPositionLeft / original_x
                            }

                            $el[0].style.width = widthInPercent + '%'
                            $el[0].style.left = newPositionLeft + '%'

                            changeResizeLabelText('l', currentDirection)
                            $('#resizeTempTimeLabel').css('left', e.clientX - labelWidth + 'px')

                            step += stepStart
                        }
                    }
                }
                else if (whichHandle.indexOf('stickR') !== -1) {
                    let width = original_width + (e.pageX - original_mouse_x)
                    let currentDirection //= width > lastWidth ? 'r' : 'l'

                    if (width > lastWidth) {
                        currentDirection = 'r'
                    } 
                    else if (width < lastWidth) {
                        currentDirection = 'l'
                    }
                    else {
                        currentDirection = lastDirection
                    }

                    let didDirectionChanged = directionChanged(lastDirection, currentDirection)
                    
                    if (didDirectionChanged) {
                        step = stepStart
                        original_width = width
                        original_mouse_x = e.pageX
                        width = original_width + (e.pageX - original_mouse_x)
                    }

                    lastDirection = currentDirection
                    lastWidth = width

                    if (width >= minWidth && width <= rightRange) {
                        let deltaWidth = original_width - width
                        // смысл в том, что как только изменение ширины превышает шаг, то можно расширять
                        if (Math.abs(deltaWidth) > step) {
                            let widthInPercent
                            if (currentDirection === 'r') widthInPercent = 100 * (original_width + step) / $('.ScheduleDay').width()
                            else widthInPercent = 100 * (original_width - step) / $('.ScheduleDay').width()
                            
                            $el[0].style.width = widthInPercent + '%'

                            changeResizeLabelText('r', currentDirection)
                            $('#resizeTempTimeLabel').css('left', e.clientX + 'px')

                            step += stepStart
                        }
                    }
                }

                if (opt.onDrag) {
                    opt.onDrag(e)
                }
            }
            
            function stopResize(e) {
                e.stopPropagation();
                e.preventDefault();
                $(document).off('mousemove.' + opt.instanceId);
                $(document).off('mouseup.' + opt.instanceId);
                window.removeEventListener('mousemove.' + opt.instanceId, resize)
                $('#resizeTempTimeLabel').remove()

                let sDate = dateParse(labelDateStart.toDate().toLocaleString())
                let eDate = dateParse(labelDateEnd.toDate().toLocaleString())

                if (moment(sDate).isBefore(moment()) && whichHandle === 'stickL') {
                    returnToLastState()
                    return
                }

                if (opt.inactiveZones) {
                    let zones = opt.inactiveZones.filter(x => x.locationId === $elementInfo.locationId)                    
                    if (zones.length > 0) {
                        for (let i = 0; i < zones.length; i++) {
                            const zone = zones[i];
                            const hasIntersection = zone.startTime.isBefore(eDate) && zone.startTime.clone().add(zone.duration, 'day').isAfter(sDate)

                            if (hasIntersection) {
                                returnToLastState()
                                return
                            }
                        }
                    }
                }

                let updatedData = {
                    startDate: moment(sDate),
                    endDate: moment(eDate),
                    eventId: $elementInfo.id
                }

                if (options.redrawFunc) {
                    options.redrawFunc($elementInfo.locationId, updatedData)
                }

                if (opt.onDragEnd) {
                    opt.onDragEnd(updatedData)
                }
            }

            function bordersCalculation () {
                let dayWidth = $('.ScheduleDay').width()  //ширина дня в пикс
                minWidth = dayWidth * options.eventMinWidth / 24 //мин ширина эвента в пикс

                // расчет полных дней до эвента
                let elParent = $($el).parent()
                let parentOfParent = $(elParent).parent()
                let daysNumber = $(parentOfParent).children()
                let childNumber = $(elParent).attr('childnumber')
                let fullDaysBeforeEvent = 0
                for (let index = 1; index < childNumber; index++) {
                    fullDaysBeforeEvent++
                }

                // расчет левой и правой границ предела растяжимости
                let commonWidth = dayWidth * daysNumber.length
                let leftBorder = fullDaysBeforeEvent * dayWidth
                leftRange = original_width + leftBorder + original_x
                rightRange = (commonWidth - leftBorder - original_x)
            }

            function directionChanged(previous, now) {
                if (previous === now || previous === null || previous === undefined) return false
                return true
            }

            function dateParse (datestring) {
                let dateParts = datestring.split(/[.,: ]+/);
                let correctDate = new Date(dateParts[2], dateParts[1]-1, dateParts[0], dateParts[3], dateParts[4]);
                return correctDate
            }

            function drawResizeLabel (direction) {
                let eventBlock = $($el).find('.EventDetail')

                $elementInfo = JSON.parse(
                    $(eventBlock).data('data')
                )

                labelDateStart = moment($elementInfo.start)
                labelDateEnd = moment($elementInfo.end)
                let dateStartStr = labelDateStart.toDate().toLocaleString()
                let dateEndStr = labelDateEnd.toDate().toLocaleString()

                let div1 = document.createElement('div')
                div1.id = 'resizeTempTimeLabel'
                div1.style.marginLeft = "7px";
                div1.style.padding = "15px";
                div1.style.backgroundColor = "rgb(44, 44, 44)";
                div1.style.display = "flex";
                div1.style.justifyContent = "center";
                div1.style.alignItems = "center";
                div1.style.position = "absolute";
                div1.style.zIndex = "3000";
                div1.style.opacity = "0.8";
                let div2 = document.createElement('div')
                div2.style.color = "white";
                div2.style.fontWeight = "bold";
                div2.style.fontSize = "14px";
                div2.innerText = direction === 'stickL' ? dateStartStr : dateEndStr
                $(div1).append(div2)
                return div1
            }

            function changeResizeLabelText (handler, arrow) {
                if (handler === 'l') {
                    if (arrow === 'r') labelDateStart = moment(labelDateStart).add(resizeStepParam, 'hour')
                    else if (arrow === 'l') labelDateStart = moment(labelDateStart).add(resizeStepParam * -1, 'hour')

                    $('#resizeTempTimeLabel div').text(labelDateStart.toDate().toLocaleString())
                } 
                else if (handler === 'r') {
                    if (arrow === 'r') labelDateEnd = moment(labelDateEnd).add(resizeStepParam, 'hour')
                    else if (arrow === 'l') labelDateEnd = moment(labelDateEnd).add(resizeStepParam * -1, 'hour')
                    
                    $('#resizeTempTimeLabel div').text(labelDateEnd.toDate().toLocaleString())
                }
            }

            function rememberLastState () {
                lastStateWidth = $($el).width();
                let left = $($el).css('left').slice(0,-2)
                lastStateLeft = 100 * left / $('.ScheduleDay').width();
            }

            function returnToLastState () {
                $($el).width(lastStateWidth)
                $($el).css('left', lastStateLeft + '%')

                if (options.redrawFunc) {
                    options.redrawFunc($elementInfo.locationId, null)
                }
            }

            function getHandle($el) { return $el.find('.stickR') }
            function getHandleLeft($el) { return $el.find('.stickL') }

            if (options === 'destroy') {
                opt = $el.data('resizable');
                if (!opt)
                    return;

                $handle = getHandle($el);
                $handle.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handle.css("touch-action", "");

                $handleLeft = getHandleLeft($el);
                $handleLeft.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handleLeft.css("touch-action", "");

                $handle = document.getElement

                $el.removeClass("resizable");
                return;
            }
          
            $el.data('resizable', opt);

            $handle = getHandle($el);
            $handleLeft = getHandleLeft($el)

            if (opt.touchActionNone) {
                $handle.css("touch-action", "none");
                $handleLeft.css("touch-action", "none")
            }

            $el.addClass("resizable");
        });
    };

    if (!$.fn.resizable)
        $.fn.resizable = $.fn.resizableSafe;
}));