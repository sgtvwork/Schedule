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
            resizeStep: 4
        };

        if (typeof options == "object")
            defaultOptions = $.extend(defaultOptions, options);

        return this.each(function () {

            var opt = $.extend({}, defaultOptions);
            if (!opt.instanceId)
                opt.instanceId = "rsz_" + new Date().getTime();            

            var resizeStepParam = null
            var stepStart = null
            var step = null
            if (options.resizeStep) {
                resizeStepParam = options.resizeStep
            }
            else{
                resizeStepParam = defaultOptions.resizeStep
            }
           

            // Current element to resize
            var $el = $(this);

            let detail = $el.find('.EventDetail')
            let data = JSON.parse($(detail).data('data'))
            let date = new Date(data.end)
            if (date.getTime() < new Date().getTime()) {
                return 
            }

            // Get both of left and right handles
            var $handle;
            var $handleLeft;
            // Shows current handler
            var whichHandle = ''
            // Appending handlers to resizable events
            $($el).append('<div class="stickR"></div>')
            $($el).append('<div class="stickL"></div>')

            var original_width = 0
            var original_width2 = 0 //pizdec!
            var original_x = 0
            var original_mouse_x = 0

            var resizerL = getHandleLeft(null, $el)
            var resizerR = getHandle(null, $el)

            var labelWidth        
            
            var lastpagex
            var lastarrow

            var labelDateStart = null
            var labelDateStartMillisec = null
            var labelDateEnd = null
            var labelDateEndMillisec = null
            var $elementInfo  

            function mouseDown (e) {
                whichHandle = e.target.className
                e.preventDefault()
                
                stepStart = $('.ScheduleDay').width() / 24 * resizeStepParam; 
                step = stepStart
                original_width = parseFloat($el.width());
                original_width2 = parseFloat($el.width());
                original_x = Number($($el).css('left').replace('px',''))
                original_mouse_x = e.pageX; 
                lastpagex = e.pageX
                $(document).on('mousemove.' + opt.instanceId, resize);
                $(document).on('mouseup.' + opt.instanceId, stopResize); 
                
                let label = drawResizeLabel(whichHandle)
                document.body.appendChild(label)
                //умножил на 1.3 чтобы лейбл при растяжении за левую грань был вблизи от эвента, но и не перекрывал его. Число просто из головы
                labelWidth = $(label).width() * 1.3 
                $(label).css('left', e.clientX + 'px').css('top', e.clientY - 20 + 'px')
                if (whichHandle === 'stickL') {
                    $(label).css('left', e.clientX - labelWidth + 'px')
                }

                if (opt.onDragStart) {
                    if (opt.onDragStart(e, $el, opt) === false){
                        return;
                    }                        
                }
            }
            
            resizerL.on("mousedown." + opt.instanceId, mouseDown);
            resizerR.on("mousedown." + opt.instanceId, mouseDown);

            function resize (e) {
                let dayWidth = $('.ScheduleDay').width()
                let minWidth = dayWidth * options.eventMinWidth / 24

                let elParent = $($el).parent()
                let parentOfParent = $(elParent).parent()
                let daysNumber = $(parentOfParent).children()
                let childNumber = $(elParent).attr('childnumber')                
                
                let fullDaysBeforeEvent = 0
                for (let index = 1; index < childNumber; index++) {
                    fullDaysBeforeEvent++
                }

                let commonwidth = dayWidth * daysNumber.length             
                let leftBorder = fullDaysBeforeEvent * dayWidth                
                let leftRange = original_width + leftBorder + original_x 
                let rightRange = (commonwidth - leftBorder - original_x)                  

                if (whichHandle.indexOf('stickL') !== -1) {
                    let width = original_width - (e.pageX - original_mouse_x)
                    let arrow = lastpagex > e.pageX ? 'l' : 'r'
                    let bulka = directionChanged(lastarrow, arrow)
                    lastpagex = e.pageX
                    lastarrow = arrow
                    if (bulka) {
                        // labelDateEndMillisec = labelDateEndMillisec * width / original_width
                        // labelDateEnd = new Date(labelDateEndMillisec)
                        step = stepStart
                        original_width = width
                        original_x = Number($($el).css('left').replace('px',''))
                        original_mouse_x = e.pageX
                      
                        // width = original_width - (e.pageX - original_mouse_x); 
                    }

                    if (width >= minWidth && width <= leftRange) {  
                        
                        let prc = 100 * width / $('.ScheduleDay').width()
                        let leftPrc = original_x * 100 / $('.ScheduleDay').width()                        
                        let newLeftPrc = 0
                        if (original_x === 0) {
                            newLeftPrc = (original_x + (e.pageX - original_mouse_x))
                            newLeftPrc = 100 * newLeftPrc / $('.ScheduleDay').width() 
                        } 
                        else {
                            newLeftPrc = (original_x + (e.pageX - original_mouse_x)) * leftPrc / original_x
                        }

                        let delta = (original_width - width)
                        let direction = delta > 0 ? 'r' : 'l'
                        if (Math.abs(delta) > step) {
                            step += stepStart
                            $el[0].style.width = prc + '%'                   
                            $el[0].style.left = newLeftPrc + '%'   
                            changeResizeLabelText('l', direction, delta, width)
                            // setTimelabel2()
                            $('#resizeTempTimeLabel').css('left', e.clientX - labelWidth + 'px')
                        }                                     
                    }
                }
                else if (whichHandle.indexOf('stickR') !== -1) {
                    let width = original_width + (e.pageX - original_mouse_x);  
                    let arrow = lastpagex > e.pageX ? 'l' : 'r'
                    let bulka = directionChanged(lastarrow, arrow)
                    lastpagex = e.pageX
                    lastarrow = arrow

                    if (bulka) {
                        labelDateEndMillisec = labelDateEndMillisec * width / original_width
                        labelDateEnd = new Date(labelDateEndMillisec)
                        step = stepStart
                        original_width = width
                        original_mouse_x = e.pageX
                        width = original_width + (e.pageX - original_mouse_x); 
                    }    

                    if (width >= minWidth && width <= rightRange) {
                        let delta = (original_width - width) //изменение длины

                        if (Math.abs(delta) > step) {
                            step += stepStart                                         
                            let prc = 100 * width / $('.ScheduleDay').width()                            

                            $el[0].style.width = prc + '%'  
                            changeResizeLabelText('r', arrow, delta, width)
                            // setTimelabel2()
                            $('#resizeTempTimeLabel').css('left', e.clientX + 'px')
                        }                     
                    }                    
                } 

                function directionChanged(previous, now){
                    // console.log(previous, now)
                    if (previous === now || previous === null || previous === undefined) {
                        return false
                    }
                    return true
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

                let eventData = JSON.parse( $($el).find('.EventDetail').data('data') )
                let sDate = dateParse(labelDateStart.toLocaleString())
                let eDate = dateParse(labelDateEnd.toLocaleString())                 

                let updatedData = {
                    startDate: moment(sDate),
                    endDate: moment(eDate),
                    eventId: eventData.id
                }

                if (options.redrawFunc) {                    
                    options.redrawFunc(eventData.locationId, updatedData)
                }

                if (opt.onDragEnd) {
                    opt.onDragEnd(updatedData)
                }
            }

            // function setTimelabel(direction, datestring, minutesInPixel, widthDifference) {
            //     //console.log(direction, datestring, minutesInPixel, widthDifference)
            //     let coefficient = minutesInPixel * widthDifference
            //     let split1 = datestring.split(' - ')
            //     let split2 = split1[1].split(' ') //[1] hh mm
            //     let split3 = split2[0].split('.') //dd mm yy

            //     let split2L = split1[0].split(' ') //[1] hh mm
            //     let split3L = split2L[0].split('.') //dd mm yy

            //     let dateStart = new Date(`${split3L[1]} ${split3L[0]} ${split3L[2]} ${split2L[1]}:00`)
            //     let dateEnd = new Date(`${split3[1]} ${split3[0]} ${split3[2]} ${split2[1]}:00`)
            //     //console.log(dateStart)

            //     let resultString = ''

            //     if (direction.indexOf('stickL') !== -1) {
            //         //изменяется и ширина и Х
            //         //меняем время начала события
            //         let newDateStart = new Date(dateStart.setMinutes(dateStart.getMinutes() - coefficient))
            //         resultString += newDateStart.toLocaleString().slice(0,-3)
            //         resultString += ' - ' + split1[1]
            //         //console.log(resultString)
            //         return resultString
            //     } 
            //     else if (direction.indexOf('stickR') !== -1) {
            //         //изменяется только ширина
            //         //меняем время конца события
            //         resultString += split1[0] + ' - '
            //         let newDateEnd = new Date(dateEnd.setMinutes(dateEnd.getMinutes() + coefficient))
            //         resultString += newDateEnd.toLocaleString().slice(0,-3)
            //         //console.log(resultString)
            //         return resultString
            //     }
            // }

            function dateParse (datestring) {
                let dateParts = datestring.split(/[.,: ]+/);
                let correctDate = new Date(dateParts[2], dateParts[1]-1, dateParts[0], dateParts[3], dateParts[4]);
                return correctDate
            }                     

            function setTimelabel2 () {
                let period = `${labelDateStart.toLocaleString()} - ${labelDateEnd.toLocaleString()}`
                period = period.replace(',', '').replace(':00:00', ':00')
                let paragraphs = $($el).find('p')
                $(paragraphs[1]).text(period)
                let event = $($el).find('EventDetail')
                let titleText = `[${$elementInfo.id}] ${$elementInfo.name} ${period}`
                $(event).attr('data-bs-original-title', titleText)
            }

            function drawResizeLabel (direction) {
                let eventBlock = $($el).find('.EventDetail')

                $elementInfo = JSON.parse(
                    $(eventBlock).data('data')
                )
                // $elementInfo = JSON.parse(
                //     $($el).find('EventDetail').data('data')
                // )

                labelDateStart = moment($elementInfo.start).toDate()
                labelDateStartMillisec = labelDateStart.getTime()
                labelDateEnd = moment($elementInfo.end).toDate()
                labelDateEndMillisec = labelDateEnd.getTime()
                let dateStartStr = labelDateStart.toLocaleString()
                let dateEndStr = labelDateEnd.toLocaleString()

                let div1 = document.createElement('div')
                div1.id = 'resizeTempTimeLabel'
                // div1.style.height = "20px";
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

            function changeResizeLabelText (handler, direction, delta, width) {
                let dateDiff = new Date($elementInfo.end).getTime() - new Date($elementInfo.start).getTime()
                let dateNew = width * dateDiff / original_width2


                // let dayWidth = $('.ScheduleDay').width()
                // let minutes = 60 * 24 * delta / dayWidth
                // let milliseconds = minutes * 60000


                //ВОЗМОЖНО НАДО ПЕРЕДАТЬ СЮДА ПОСТОЯННУЮ ИЗНАЧАЛЬНУЮ ИЗМЕНЯЕМУЮ ДАТУ, А ТО ИЗМЕНЯЕТСЯ ПО ЭКСПОНЕНТЕ
                // let data =  $($el).find('.EventDetail').data('data')
                // let startDate = JSON.parse(data).start
                // let endDate = JSON.parse(data).end
                // console.log(startDate, endDate)
                // console.log(Date.parse(startDate), Date.parse())

                // if (direction === 'l') {
                //     milliseconds *= -1
                // }
                // console.log(direction, milliseconds)
                
                if (handler === 'l') {                    
                    // let newDateStart = new Date(labelDateStart.setMinutes(labelDateStart.getMinutes() + minutes))                    
                    // let newDateStart = new Date(labelDateStartMillisec + milliseconds)
                    let newDateStart = new Date(new Date($elementInfo.end).getTime() - dateNew)
                    labelDateStart = newDateStart
                    $('#resizeTempTimeLabel div').text(newDateStart.toLocaleString())
                } 
                else if (handler === 'r') {
                    // let newDateEnd = new Date(labelDateEndMillisec - milliseconds)   
                    // let newDateEnd = new Date(dateNew)
                    let newDateEnd = new Date(new Date($elementInfo.start).getTime() + dateNew)
                    labelDateEnd = newDateEnd
                    $('#resizeTempTimeLabel div').text(newDateEnd.toLocaleString())    
                }
            }

            function getHandle(selector, $el) {
                return $el.find('.stickR')
            } 

            function getHandleLeft(selector, $el) {
                return $el.find('.stickL')
            } 

            if (options === 'destroy') {            
                opt = $el.data('resizable');
                if (!opt)
                    return;

                $handle = getHandle(opt.handleSelector, $el);
                $handle.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handle.css("touch-action", "");

                $handleLeft = getHandleLeft(opt.handleSelector, $el);
                $handleLeft.off("mousedown." + opt.instanceId + " touchstart." + opt.instanceId);
                if (opt.touchActionNone)
                    $handleLeft.css("touch-action", "");

                $handle = document.getElement


                $el.removeClass("resizable");
                return;
            }
          
            $el.data('resizable', opt);

            $handle     = getHandle(opt.handleSelector, $el);
            $handleLeft = getHandleLeft(opt.handleSelector, $el)

            if (opt.touchActionNone){              
                $handle.css("touch-action", "none");
                $handleLeft.css("touch-action", "none")
            }

            $el.addClass("resizable");
        });
    };

    if (!$.fn.resizable)
        $.fn.resizable = $.fn.resizableSafe;
}));
